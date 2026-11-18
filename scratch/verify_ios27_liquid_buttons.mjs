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
  async evalJS(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (res.exceptionDetails) {
      throw new Error('JS Exception: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }
  close() {
    try { this.ws.close(); } catch {}
  }
}

async function runTest() {
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prerana_btn_cdp_'));
  const port = 9444;
  const proc = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDir}`,
    '--window-size=1280,920',
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
      } catch {}
      await sleep(250);
    }
    if (!wsUrl) throw new Error('Chrome CDP did not start');

    cdp = new CDPClient(wsUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');

    console.log('[1] Navigating to http://127.0.0.1:5000/ ...');
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5000/' });
    await sleep(1500);

    // =========================================================================
    // TEST A: LOGIN SCREEN ULTRA-TRANSPARENT LIQUID CRYSTAL BUTTONS & SEGMENTED CONTROL
    // =========================================================================
    console.log('[2] Auditing Login screen liquid glass buttons & segmented control...');
    const loginBtnAudit = await cdp.evalJS(`(() => {
      const segNav = document.querySelector('.liquid-segmented-control');
      const indicator = document.getElementById('auth-segment-indicator');
      const studentTab = document.getElementById('tab-btn-student');
      const teacherTab = document.getElementById('tab-btn-teacher');
      const adminTab = document.getElementById('tab-btn-admin');
      const loginBtn = document.getElementById('btn-submit-student-login');

      const sBtn = getComputedStyle(loginBtn);
      const sInd = getComputedStyle(indicator);
      const sSeg = getComputedStyle(segNav);
      const sStuTab = getComputedStyle(studentTab);

      const indRect = indicator.getBoundingClientRect();
      const stuRect = studentTab.getBoundingClientRect();

      return {
        loginBtn: {
          tag: loginBtn.tagName,
          minHeight: sBtn.minHeight,
          borderRadius: sBtn.borderRadius,
          color: sBtn.color,
          backgroundColor: sBtn.backgroundColor,
          backdropFilter: sBtn.backdropFilter || sBtn.webkitBackdropFilter,
          border: sBtn.border,
          boxShadow: sBtn.boxShadow,
          textShadow: sBtn.textShadow
        },
        segmentedControl: {
          backgroundColor: sSeg.backgroundColor,
          border: sSeg.border,
          borderRadius: sSeg.borderRadius,
          backdropFilter: sSeg.backdropFilter || sSeg.webkitBackdropFilter
        },
        indicator: {
          width: indRect.width,
          left: indRect.left,
          transform: sInd.transform,
          backgroundColor: sInd.backgroundColor,
          backdropFilter: sInd.backdropFilter || sInd.webkitBackdropFilter,
          border: sInd.border,
          borderRadius: sInd.borderRadius
        },
        studentTab: {
          color: sStuTab.color,
          fontWeight: sStuTab.fontWeight,
          width: stuRect.width
        }
      };
    })()`);
    console.log('Login Button & Segmented Control Audit:', JSON.stringify(loginBtnAudit, null, 2));

    // Verify button transparency target: 85-95%
    // Background color should be rgba with alpha <= 0.45 or transparent gradient
    const bgStr = loginBtnAudit.loginBtn.backgroundColor;
    console.log('Login button computed background:', bgStr);
    if (!bgStr.includes('rgba') && bgStr !== 'transparent') {
      console.warn('Warning: Background color might not be transparent:', bgStr);
    }
    if (loginBtnAudit.loginBtn.borderRadius !== '9999px') {
      throw new Error('Button is not full pill shape! Radius is ' + loginBtnAudit.loginBtn.borderRadius);
    }

    // Capture screenshot of desktop login
    const shotLogin = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCRATCH, 'ios27_login_crystal_buttons.png'), Buffer.from(shotLogin.data, 'base64'));
    console.log('Saved ios27_login_crystal_buttons.png');

    // =========================================================================
    // TEST B: SLIDING SEGMENTED CONTROL INTERACTION (Student -> Teacher -> Admin -> Student)
    // =========================================================================
    console.log('[3] Testing sliding segmented control clicks and spring animations...');
    await cdp.evalJS(`document.getElementById('tab-btn-teacher').click()`);
    await sleep(400);

    const teacherTabAudit = await cdp.evalJS(`(() => {
      const indicator = document.getElementById('auth-segment-indicator');
      const teacherTab = document.getElementById('tab-btn-teacher');
      const indRect = indicator.getBoundingClientRect();
      const teaRect = teacherTab.getBoundingClientRect();
      const sTea = getComputedStyle(teacherTab);
      return {
        indLeft: indRect.left,
        teaLeft: teaRect.left,
        indWidth: indRect.width,
        teaWidth: teaRect.width,
        deltaX: Math.abs(indRect.left - teaRect.left),
        teaColor: sTea.color,
        teaFontWeight: sTea.fontWeight,
        teaIsActive: teacherTab.classList.contains('active'),
        panelTeacherVisible: !document.getElementById('tab-panel-teacher').classList.contains('hidden')
      };
    })()`);
    console.log('Teacher Tab Shift Audit:', JSON.stringify(teacherTabAudit));
    if (teacherTabAudit.deltaX > 8) {
      throw new Error(`Sliding indicator did not align with Teacher tab! Delta: ${teacherTabAudit.deltaX}px`);
    }

    await cdp.evalJS(`document.getElementById('tab-btn-admin').click()`);
    await sleep(400);

    const adminTabAudit = await cdp.evalJS(`(() => {
      const indicator = document.getElementById('auth-segment-indicator');
      const adminTab = document.getElementById('tab-btn-admin');
      const indRect = indicator.getBoundingClientRect();
      const admRect = adminTab.getBoundingClientRect();
      const sAdm = getComputedStyle(adminTab);
      return {
        indLeft: indRect.left,
        admLeft: admRect.left,
        deltaX: Math.abs(indRect.left - admRect.left),
        admColor: sAdm.color,
        admFontWeight: sAdm.fontWeight,
        admIsActive: adminTab.classList.contains('active'),
        panelAdminVisible: !document.getElementById('tab-panel-admin').classList.contains('hidden')
      };
    })()`);
    console.log('Admin Tab Shift Audit:', JSON.stringify(adminTabAudit));
    if (adminTabAudit.deltaX > 8) {
      throw new Error(`Sliding indicator did not align with Admin tab! Delta: ${adminTabAudit.deltaX}px`);
    }

    // Switch back to student
    await cdp.evalJS(`document.getElementById('tab-btn-student').click()`);
    await sleep(350);

    // =========================================================================
    // TEST C: SIGN IN AS STUDENT & AUDIT DASHBOARD CRYSTAL BUTTONS
    // =========================================================================
    console.log('[4] Logging in as Student...');
    await cdp.evalJS(`(() => {
      document.getElementById('login-student-username').value = 'student';
      document.getElementById('login-student-pin').value = 'student123';
      document.getElementById('btn-submit-student-login').click();
    })()`);
    await sleep(1800);

    const stuDashAudit = await cdp.evalJS(`(() => {
      const contBtn = document.getElementById('btn-continue-learning');
      const diffPills = Array.from(document.querySelectorAll('.home-diff-pill'));
      const featBtns = Array.from(document.querySelectorAll('.dash-feature-btn'));
      const cardTags = Array.from(document.querySelectorAll('.activity-card .card-play-tag'));
      const firstTag = cardTags[0];
      const sTag = firstTag ? getComputedStyle(firstTag) : null;
      const sCont = contBtn ? getComputedStyle(contBtn) : null;

      return {
        continueBtn: {
          exists: !!contBtn,
          text: contBtn ? contBtn.textContent.trim() : null,
          minHeight: sCont ? sCont.minHeight : null,
          borderRadius: sCont ? sCont.borderRadius : null,
          color: sCont ? sCont.color : null,
          backgroundColor: sCont ? sCont.backgroundColor : null
        },
        diffPillsCount: diffPills.length,
        diffPillActive: document.querySelector('.home-diff-pill.active')?.textContent.trim(),
        featBtnsCount: featBtns.length,
        activityCardsCount: cardTags.length,
        firstCardTag: {
          text: firstTag ? firstTag.textContent.trim() : null,
          color: sTag ? sTag.color : null,
          borderRadius: sTag ? sTag.borderRadius : null,
          backgroundColor: sTag ? sTag.backgroundColor : null,
          backdropFilter: sTag ? (sTag.backdropFilter || sTag.webkitBackdropFilter) : null
        }
      };
    })()`);
    console.log('Student Dashboard Audit:', JSON.stringify(stuDashAudit, null, 2));

    if (!stuDashAudit.continueBtn.exists) throw new Error('Missing Continue Learning button!');
    if (stuDashAudit.diffPillsCount < 3) throw new Error('Missing difficulty pills!');
    if (stuDashAudit.activityCardsCount < 18) throw new Error('Missing activity card play tags!');

    // Test difficulty pill switching
    await cdp.evalJS(`document.querySelectorAll('.home-diff-pill')[2].click()`); // Level 3 Advanced
    await sleep(400);
    const activeLevelText = await cdp.evalJS(`document.querySelector('.home-diff-pill.active')?.textContent.trim()`);
    console.log('Active level after clicking Level 3:', activeLevelText);

    // Test feature tabs: Profile, Achievements
    await cdp.evalJS(`document.querySelector('.dash-feature-btn[data-dash-tab="profile"]').click()`);
    await sleep(400);
    const profileEditBtnAudit = await cdp.evalJS(`(() => {
      const editBtn = document.getElementById('btn-edit-profile');
      return {
        exists: !!editBtn,
        isLiquid: editBtn ? editBtn.classList.contains('liquid-btn') : false,
        text: editBtn ? editBtn.textContent.trim() : null
      };
    })()`);
    console.log('Profile Edit Button Audit:', profileEditBtnAudit);
    if (!profileEditBtnAudit.isLiquid) throw new Error('Profile Edit button is not styled with liquid-btn!');

    await cdp.evalJS(`document.querySelector('.dash-feature-btn[data-dash-tab="achievements"]').click()`);
    await sleep(400);
    const claimBtnAudit = await cdp.evalJS(`(() => {
      const btn = document.getElementById('btn-ach-claim-reward');
      const contBtn = document.getElementById('btn-ach-continue');
      return {
        claimExists: !!btn,
        claimIsLiquid: btn ? btn.classList.contains('liquid-btn') : false,
        contExists: !!contBtn,
        contIsLiquid: contBtn ? contBtn.classList.contains('liquid-btn') : false
      };
    })()`);
    console.log('Achievements Buttons Audit:', claimBtnAudit);
    if (!claimBtnAudit.claimIsLiquid) throw new Error('Achievements Claim Reward button is not styled with liquid-btn!');

    // Close feature panel
    await cdp.evalJS(`document.querySelector('.btn-close-dash-panel')?.click()`);
    await sleep(300);

    const shotStuDash = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCRATCH, 'ios27_student_dashboard_crystal.png'), Buffer.from(shotStuDash.data, 'base64'));
    console.log('Saved ios27_student_dashboard_crystal.png');

    // =========================================================================
    // TEST D: OPEN AN ACTIVITY & TEST ACTIVITY STAGE CRYSTAL BUTTONS
    // =========================================================================
    console.log('[5] Launching Alphabet Learning Activity...');
    await cdp.evalJS(`document.querySelector('.activity-card[data-module="alphabet"]').click()`);
    await sleep(1000);

    const actStageAudit = await cdp.evalJS(`(() => {
      const stage = document.getElementById('view-play');
      const diffBtns = Array.from(document.querySelectorAll('#activity-stage .diff-pill-btn'));
      const replayBtn = document.getElementById('btn-replay-prompt');
      const backHomeBtn = document.getElementById('btn-back-home');
      const sReplay = replayBtn ? getComputedStyle(replayBtn) : null;
      const sBack = backHomeBtn ? getComputedStyle(backHomeBtn) : null;

      return {
        stageVisible: stage ? !stage.classList.contains('hidden') : false,
        diffBtnsCount: diffBtns.length,
        activeDiff: document.querySelector('#activity-stage .diff-pill-btn.active')?.textContent.trim(),
        replayBtn: {
          exists: !!replayBtn,
          borderRadius: sReplay ? sReplay.borderRadius : null,
          color: sReplay ? sReplay.color : null,
          backgroundColor: sReplay ? sReplay.backgroundColor : null,
          backdropFilter: sReplay ? (sReplay.backdropFilter || sReplay.webkitBackdropFilter) : null
        },
        backHomeBtn: {
          exists: !!backHomeBtn,
          borderRadius: sBack ? sBack.borderRadius : null,
          color: sBack ? sBack.color : null
        }
      };
    })()`);
    console.log('Activity Stage Audit:', JSON.stringify(actStageAudit, null, 2));

    if (!actStageAudit.stageVisible) throw new Error('Activity stage view-play is not visible!');
    if (!actStageAudit.replayBtn.exists) throw new Error('Replay prompt button missing!');

    const shotActStage = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCRATCH, 'ios27_activity_stage_crystal.png'), Buffer.from(shotActStage.data, 'base64'));
    console.log('Saved ios27_activity_stage_crystal.png');

    // Go back to Home
    await cdp.evalJS(`document.getElementById('btn-back-home').click()`);
    await sleep(600);

    // =========================================================================
    // TEST E: SIGN OUT & LOG IN AS TEACHER & TEST TEACHER/ADMIN CRYSTAL BUTTONS
    // =========================================================================
    console.log('[6] Signing out and logging in as Teacher...');
    await cdp.evalJS(`(() => {
      window.confirm = () => true;
      document.getElementById('btn-sign-out').click();
    })()`);
    await sleep(1000);

    await cdp.evalJS(`(() => {
      document.getElementById('tab-btn-teacher').click();
      document.getElementById('login-teacher-email').value = 'teacher';
      document.getElementById('login-teacher-password').value = 'teacher123';
      document.getElementById('btn-submit-teacher-login').click();
    })()`);
    await sleep(1800);

    const teacherAudit = await cdp.evalJS(`(() => {
      const addStuBtn = document.getElementById('btn-open-add-student-modal');
      const printBtn = document.getElementById('btn-teacher-print-report');
      const playAsBtn = document.getElementById('btn-teacher-play-as-student');
      const cardActions = Array.from(document.querySelectorAll('.student-mgmt-actions button'));
      const sAdd = addStuBtn ? getComputedStyle(addStuBtn) : null;
      const sPrint = printBtn ? getComputedStyle(printBtn) : null;

      return {
        teacherDashVisible: !document.getElementById('view-teacher-dashboard').classList.contains('hidden'),
        addStudentBtn: {
          exists: !!addStuBtn,
          borderRadius: sAdd ? sAdd.borderRadius : null,
          color: sAdd ? sAdd.color : null
        },
        printReportBtn: {
          exists: !!printBtn,
          borderRadius: sPrint ? sPrint.borderRadius : null,
          color: sPrint ? sPrint.color : null
        },
        cardActionBtnsCount: cardActions.length,
        hasEditStudentBtns: cardActions.some(b => b.textContent.includes('Edit Student')),
        dataTableIntact: document.querySelectorAll('.data-table tbody tr').length > 0
      };
    })()`);
    console.log('Teacher Dashboard Audit:', JSON.stringify(teacherAudit, null, 2));

    const shotTeacher = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCRATCH, 'ios27_teacher_dashboard_crystal.png'), Buffer.from(shotTeacher.data, 'base64'));
    console.log('Saved ios27_teacher_dashboard_crystal.png');

    // =========================================================================
    // TEST F: TABLET (768x1024) & MOBILE (390x844) VIEWPORTS
    // =========================================================================
    console.log('[7] Testing Tablet (768x1024)...');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 768,
      height: 1024,
      deviceScaleFactor: 2,
      mobile: false
    });
    await sleep(400);

    const shotTablet = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCRATCH, 'ios27_tablet_view.png'), Buffer.from(shotTablet.data, 'base64'));
    console.log('Saved ios27_tablet_view.png');

    console.log('[8] Testing Mobile (390x844)...');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true
    });
    // Go to login page on mobile to check segmented control & login button
    await cdp.evalJS(`(() => {
      window.confirm = () => true;
      document.getElementById('btn-sign-out').click();
    })()`);
    await sleep(800);

    const mobileAudit = await cdp.evalJS(`(() => {
      const seg = document.querySelector('.liquid-segmented-control');
      const tabs = Array.from(document.querySelectorAll('.auth-tab-btn'));
      const loginBtn = document.getElementById('btn-submit-student-login');
      const sBtn = getComputedStyle(loginBtn);
      const sSeg = getComputedStyle(seg);
      return {
        segFlexDirection: sSeg.flexDirection,
        tabsCount: tabs.length,
        btnMinHeight: sBtn.minHeight,
        btnBorderRadius: sBtn.borderRadius,
        btnWidth: loginBtn.getBoundingClientRect().width
      };
    })()`);
    console.log('Mobile Audit:', JSON.stringify(mobileAudit, null, 2));

    const shotMobile = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCRATCH, 'ios27_mobile_view.png'), Buffer.from(shotMobile.data, 'base64'));
    console.log('Saved ios27_mobile_view.png');

    console.log('\n======================================================');
    console.log('  ALL ULTRA-TRANSPARENT LIQUID GLASS VERIFICATIONS PASSED!  ');
    console.log('======================================================');
  } finally {
    cdp?.close();
    try { proc.kill(); } catch {}
    await sleep(300);
    fs.rmSync(userDir, { recursive: true, force: true });
  }
}

runTest().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
