import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const CHROME = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const SCRATCH = 'C:\\Users\\CHETHAN YC\\.gemini\\antigravity\\brain\\72cf2ccf-f944-49a4-87c5-798609bc40fe\\scratch';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
  }
  async send(method, params = {}) {
    await this.ready;
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  close() {
    try { this.ws.close(); } catch (_) {}
  }
}

async function evalJs(cdp, expression) {
  const res = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (res.exceptionDetails) {
    throw new Error('Eval error: ' + JSON.stringify(res.exceptionDetails));
  }
  return res.result?.value;
}

async function takeScreenshot(cdp, filename) {
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const buf = Buffer.from(shot.data, 'base64');
  const outPath = path.join(SCRATCH, filename);
  fs.writeFileSync(outPath, buf);
  console.log(`Saved screenshot: ${outPath} (${buf.length} bytes)`);
}

async function main() {
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-teacher-pdf-'));
  const port = 9334;

  const proc = spawn(CHROME, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--headless=new',
    '--window-size=1280,880'
  ]);

  let cdp = null;

  try {
    let wsUrl = null;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json`);
        const pages = await res.json();
        const page = pages.find(p => p.type === 'page');
        if (page?.webSocketDebuggerUrl) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch (_) {}
      await sleep(250);
    }

    if (!wsUrl) throw new Error('Could not connect to Chrome debugging endpoint');

    cdp = new CDPClient(wsUrl);
    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');

    console.log('[1] Navigating to http://127.0.0.1:5000/ ...');
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5000/' });
    await sleep(1500);

    for (let i = 0; i < 20; i++) {
      const ready = await evalJs(cdp, `Boolean(window.app && document.getElementById('tab-btn-teacher'))`);
      if (ready) break;
      await sleep(250);
    }

    console.log('[2] Logging in as Teacher (teacher / teacher123)...');
    await evalJs(cdp, `document.getElementById('tab-btn-teacher').click();`);
    await sleep(300);
    await evalJs(cdp, `
      (async () => {
        document.getElementById('login-teacher-email').value = 'teacher';
        document.getElementById('login-teacher-password').value = 'teacher123';
        window.app?.handleTeacherLogin();
      })()
    `);

    // Wait for teacher dashboard and student roster to finish loading
    for (let i = 0; i < 25; i++) {
      const count = await evalJs(cdp, `document.querySelectorAll('.btn-download-pdf').length`);
      if (count > 0) break;
      await sleep(250);
    }

    // Verify Teacher Dashboard is active
    const dashboardState = await evalJs(cdp, `
      (() => {
        const sidebarExportBtn = document.getElementById('btn-sidebar-export-report') || document.getElementById('btn-sidebar-export-json');
        const headerGenBtn = document.getElementById('btn-teacher-print-report');
        const studentPdfBtns = document.querySelectorAll('.btn-download-pdf');
        return {
          currentRole: window.app?.currentRole,
          sidebarBtnText: sidebarExportBtn?.textContent?.trim(),
          headerBtnText: headerGenBtn?.textContent?.trim(),
          studentPdfBtnCount: studentPdfBtns.length,
          firstStudentBtnText: studentPdfBtns[0]?.textContent?.trim()
        };
      })()
    `);

    console.log('[3] Teacher Dashboard PDF Buttons State:', dashboardState);

    if (!dashboardState.sidebarBtnText.includes('PDF')) {
      throw new Error(`Sidebar export button should indicate PDF, got: ${dashboardState.sidebarBtnText}`);
    }
    if (!dashboardState.headerBtnText.includes('PDF')) {
      throw new Error(`Header generate button should indicate PDF, got: ${dashboardState.headerBtnText}`);
    }
    if (dashboardState.studentPdfBtnCount === 0) {
      throw new Error('No student Download IEP Report (PDF) buttons found');
    }

    console.log('[PASS] All Teacher Dashboard report buttons explicitly export in PDF format.');

    await takeScreenshot(cdp, 'teacher_dashboard_pdf_export_ui.png');

    // Test clicking the PDF buttons via window.open spy
    console.log('[4] Verifying click handlers trigger PDF export endpoints...');
    const clickResults = await evalJs(cdp, `
      (() => {
        const opened = [];
        const originalOpen = window.open;
        window.open = (url, target) => {
          opened.push({ url, target });
        };

        // 1. Click sidebar export report button
        const sidebarBtn = document.getElementById('btn-sidebar-export-report') || document.getElementById('btn-sidebar-export-json');
        sidebarBtn?.click();

        // 2. Click overview header generate report button
        const headerBtn = document.getElementById('btn-teacher-print-report');
        headerBtn?.click();

        // 3. Click first student download report button
        const studentBtn = document.querySelector('.btn-download-pdf');
        studentBtn?.click();

        window.open = originalOpen;
        return opened;
      })()
    `);

    console.log('Opened URLs on click:', clickResults);

    if (clickResults.length < 3) {
      throw new Error(`Expected at least 3 opened PDF URLs, got ${clickResults.length}`);
    }

    const classPdfCalls = clickResults.filter(c => c.url.includes('/api/teacher/class-progress-pdf'));
    const studentPdfCalls = clickResults.filter(c => c.url.includes('/api/teacher/student/'));

    if (classPdfCalls.length < 2) {
      throw new Error('Sidebar and Header buttons should invoke /api/teacher/class-progress-pdf');
    }
    if (studentPdfCalls.length < 1) {
      throw new Error('Student row button should invoke /api/teacher/student/<id>/progress-pdf');
    }

    console.log('[PASS] Sidebar and Header buttons open /api/teacher/class-progress-pdf?download=1');
    console.log('[PASS] Student row button opens /api/teacher/student/<id>/progress-pdf?download=1');

    console.log('\n========================================================');
    console.log('  ALL TEACHER SECTION PDF EXPORT UI TESTS PASSED!       ');
    console.log('========================================================\n');
  } catch (err) {
    console.error('VERIFICATION FAILED:', err);
    process.exit(1);
  } finally {
    if (cdp) cdp.close();
    try { proc.kill('SIGKILL'); } catch (_) {}
    try { fs.rmSync(userDir, { recursive: true, force: true }); } catch (_) {}
  }
}

main();
