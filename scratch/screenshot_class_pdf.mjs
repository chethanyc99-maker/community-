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

async function main() {
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prerana_class_pdf_shot_'));
  const port = 9338;
  const proc = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDir}`,
    '--window-size=1080,1400',
    'about:blank'
  ], { stdio: 'ignore' });

  let cdp;
  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      try {
        const list = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json());
        const page = list.find(t => t.type === 'page');
        if (page && page.webSocketDebuggerUrl) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch (_) {}
      await sleep(250);
    }

    cdp = new CDPClient(wsUrl);
    await cdp.send('Page.enable');

    // Login as teacher
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5000/' });
    await sleep(1000);
    await cdp.send('Runtime.evaluate', {
      expression: `
        fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: 'teacher', password: 'teacher123', role: 'teacher' })
        })
      `,
      awaitPromise: true
    });
    await sleep(600);

    // Navigate to class progress PDF
    const pdfUrl = 'http://127.0.0.1:5000/api/teacher/class-progress-pdf';
    console.log('Navigating to Class PDF URL:', pdfUrl);
    await cdp.send('Page.navigate', { url: pdfUrl });
    await sleep(2500);

    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(shot.data, 'base64');
    const outPath = path.join(SCRATCH, 'rendered_class_iep_progress_pdf.png');
    fs.writeFileSync(outPath, buf);
    console.log('Saved screenshot:', outPath, buf.length, 'bytes');

    // Also navigate to HTML fallback version to view full formatted pages
    const htmlUrl = 'http://127.0.0.1:5000/api/teacher/student/1/progress-pdf';
    await cdp.send('Page.navigate', { url: htmlUrl });
    await sleep(2000);
    const shotStu = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const bufStu = Buffer.from(shotStu.data, 'base64');
    const outPathStu = path.join(SCRATCH, 'rendered_student_progress_pdf.png');
    fs.writeFileSync(outPathStu, bufStu);
    console.log('Saved student screenshot:', outPathStu, bufStu.length, 'bytes');

  } finally {
    if (cdp) cdp.close();
    try { proc.kill('SIGKILL'); } catch (_) {}
    try { fs.rmSync(userDir, { recursive: true, force: true }); } catch (_) {}
  }
}

main();
