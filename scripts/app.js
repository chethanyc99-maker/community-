/**
 * Application Master Controller - Prerana Assistive Learning Platform
 * Features:
 * - Gated Access powered by Flask Session + MySQL Authentication (with offline fallback)
 * - Role-Based Student, Teacher, and Admin Login Portals inside Existing UI
 * - Account Registration for new Students and Teachers persisted to MySQL
 * - Remember Me, Show/Hide Password, Forgot Password Modal, & Sign Out
 * - Educator Preview Mode & Return Navigation
 * - Clean Accessible UI & Smooth Interactive Feedback
 * - Multi-Network PWA Offline Engine & IEP Reporting
 */
class AppController {
  constructor() {
    this.currentModuleKey = 'shapes';
    this.currentRole = null; // 'student' | 'teacher' | 'admin' | null
    this.authenticatedUser = null;
    this.previewStudentProfile = null;
    this.stageElement = null;

    this.viewAuth = null;
    this.viewHome = null;
    this.viewPlay = null;
    this.viewTeacher = null;

    this.selectedRegAvatar = '🌟';
    this.selectedStudentId = null;
    this.selectedPictureMascot = '🌟';
    this.selectedPictureColor = 'blue';
    this.isEducatorPreview = false;
    this.lastLoginTab = 'student';

    this.celebrationCallbackNext = null;
    this.celebrationCallbackRepeat = null;
    this.deferredPrompt = null;

    this.moduleLabels = {
      alphabet: '🔤 Alphabet Learning',
      numbers: '🔢 Numbers & Counting',
      animals: '🦁 Animals & Birds',
      fruits: '🍎 Fruits & Vegetables',
      bodyparts: '🧍 Body Parts',
      safety: '🚦 Safety & Awareness',
      hygiene: '🧼 Personal Hygiene',
      memory: '🧠 Memory & Matching',
      social: '🤝 Social Skills',
      communication: '🗣️ Communication Skills',
      music: '🎶 Music & Rhymes',
      timecalendar: '⏰ Time & Calendar',
      shapes: '🎨 Shapes & Colors',
      daily: '🪥 Daily Habits',
      emotions: '😊 Feelings & Faces',
      counting: '🧺 Quick Count Fun',
      sounds: '🔔 Listen & Match',
      calming: '🫧 Pop Bubbles',
      playground: '🧪 Tactile Playground',
      custom_teacher: "🎨 Teacher's Lessons"
    };
    this.activeDashTab = 'activities';
    this.activeCategory = 'all';
    this.serverTeacherLogs = [];
    this.isLoginMode = true;
  }

  init() {
    this.stageElement = document.getElementById('activity-stage');
    this.viewAuth = document.getElementById('view-auth');
    this.viewHome = document.getElementById('view-home');
    this.viewPlay = document.getElementById('view-play');
    this.viewTeacher = document.getElementById('view-teacher-dashboard');

    this.bindAuthPortal();
    this.bindHomeCards();
    this.bindDashboardFeatures();
    this.bindNavigation();
    this.bindNavDrawer();
    this.bindAccessibilityControls();
    this.bindAvatarSwitcher();
    this.bindCelebrationModal();
    this.bindTeacherDashboard();
    this.bindNetworkSharingModal();
    this.initPWA();
    this.initNetworkStatus();
    this.initHeaderScrollEffect();
    this.initThemeMode();

    window.addEventListener('prerana:dashboard-updated', (e) => {
      this.syncStudentDashboardUI(e.detail);
    });

    // Check active session via Flask API first, falling back gracefully offline
    this.checkInitialSession();
  }

  initHeaderScrollEffect() {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        this.syncHeaderScrollState();
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true });
    this.syncHeaderScrollState();
  }

  syncHeaderScrollState() {
    const header = document.getElementById('app-top-header');
    if (!header) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    header.classList.toggle('is-scrolled', scrollTop > 10 && !header.classList.contains('hidden'));
  }

  initThemeMode() {
    let isDark = false;
    try {
      const saved = localStorage.getItem('prerana_theme');
      if (saved) {
        isDark = (saved === 'dark');
      } else {
        const storedSettings = window.iepStorage?.getSettings?.() || {};
        isDark = Boolean(storedSettings.highContrast || storedSettings.darkMode);
      }
    } catch (_) {}
    this.setThemeMode(isDark, false, false);
  }

  setThemeMode(isDark, notify = false, persist = true) {
    const shouldBeDark = Boolean(isDark);
    document.body.classList.toggle('theme-dark', shouldBeDark);
    document.body.classList.toggle('theme-high-contrast', shouldBeDark);

    const btn = document.getElementById('btn-toggle-contrast');
    if (btn) {
      btn.classList.toggle('active', shouldBeDark);
      btn.setAttribute('aria-pressed', shouldBeDark.toString());
      btn.title = shouldBeDark ? "Switch to Light Mode" : "Switch to Dark Mode";
      const icon = btn.querySelector('.ctrl-icon') || document.getElementById('theme-toggle-icon');
      const text = btn.querySelector('.ctrl-text') || document.getElementById('theme-toggle-text');
      if (icon) icon.textContent = shouldBeDark ? "☀️" : "🌙";
      if (text) text.textContent = shouldBeDark ? "Light" : "Dark";
    }

    const chk = document.getElementById('chk-a11y-contrast');
    if (chk) {
      chk.checked = shouldBeDark;
    }

    try {
      localStorage.setItem('prerana_theme', shouldBeDark ? 'dark' : 'light');
    } catch (_) {}

    if (persist) {
      window.iepStorage?.saveSettingsRemote({ highContrast: shouldBeDark, darkMode: shouldBeDark });
    }

    if (notify) {
      window.soundFx?.playPop();
      window.speechAssistant?.speak(shouldBeDark ? "Dark theme on" : "Light theme on");
    }
  }

  async checkInitialSession() {
    if (window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('/api/check-session', { credentials: 'same-origin' });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            const synced = window.iepStorage.syncUserFromBackend(data.user);
            this.authenticatedUser = synced;
            this.setRole(data.user.role, synced.id, synced);
            return;
          } else {
            window.iepStorage.logout();
            this.showAuthView('student');
            return;
          }
        }
      } catch (err) {
        console.log('Backend session check unavailable, checking offline session:', err);
      }
    }

    // Offline / file:// fallback
    const activeSession = window.iepStorage.getActiveSession();
    if (activeSession && (activeSession.role === 'teacher' || activeSession.role === 'admin')) {
      this.authenticatedUser = activeSession;
      this.setRole(activeSession.role, null, activeSession);
    } else if (activeSession && activeSession.role === 'student') {
      this.authenticatedUser = activeSession;
      this.setRole('student', activeSession.id, activeSession);
    } else {
      this.showAuthView('student');
    }
  }

  /* =========================================================================
     Authentication Gate & Views Management
     ========================================================================= */

  showAuthView(tab = 'student') {
    this.currentRole = null;
    this.isEducatorPreview = false;
    this.previewStudentProfile = null;
    this.lastLoginTab = (tab === 'teacher' || tab === 'admin') ? tab : 'student';

    // Remove/hide top header bar completely on login/register pages
    document.body.classList.add('auth-locked');
    document.body.classList.remove('role-student', 'role-teacher', 'role-admin', 'portal-staff');
    document.getElementById('app-top-header')?.classList.add('hidden');
    document.getElementById('btn-nav-hamburger')?.classList.add('hidden');
    if (typeof this.closeNavDrawer === 'function') {
      this.closeNavDrawer();
    }

    // Strictly hide all main content sections
    this.viewHome?.classList.add('hidden');
    this.viewPlay?.classList.add('hidden');
    this.viewTeacher?.classList.add('hidden');
    this.viewAuth?.classList.remove('hidden');

    // Header updates: Hide student and teacher status
    document.getElementById('header-student-status')?.classList.add('hidden');
    document.getElementById('header-teacher-status')?.classList.add('hidden');
    document.getElementById('btn-sign-out')?.classList.add('hidden');
    document.getElementById('educator-preview-banner')?.classList.add('hidden');

    const roleBadge = document.getElementById('current-role-badge');
    if (roleBadge) roleBadge.textContent = 'Sign In';

    if (tab === 'register') {
      this.setAuthMode(false);
    } else {
      this.setAuthMode(true, tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.syncHeaderScrollState();
  }

  setAuthMode(isLoginMode, activeTab = null) {
    this.isLoginMode = Boolean(isLoginMode);
    const loginContainer = document.getElementById('auth-login-container');
    const registerContainer = document.getElementById('auth-register-container');

    this.clearAuthAlert();

    if (!this.isLoginMode) {
      // Register Mode: show register container ONLY, hide login container completely
      loginContainer?.classList.add('hidden');
      registerContainer?.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Login Mode: show login container ONLY, hide register container completely
      registerContainer?.classList.add('hidden');
      loginContainer?.classList.remove('hidden');
      const targetTab = activeTab || this.lastLoginTab || 'student';
      this.switchAuthTab(targetTab);
    }
  }

  switchAuthTab(tabName) {
    const loginContainer = document.getElementById('auth-login-container');
    const registerContainer = document.getElementById('auth-register-container');

    this.clearAuthAlert();

    // Mode B: Create Account section ONLY (hides all login portals & tabs)
    if (tabName === 'register') {
      this.setAuthMode(false);
      return;
    }

    // Mode A: Login Portal (Student / Teacher / Admin)
    this.isLoginMode = true;
    registerContainer?.classList.add('hidden');
    loginContainer?.classList.remove('hidden');

    if (tabName === 'student' || tabName === 'teacher' || tabName === 'admin') {
      this.lastLoginTab = tabName;
    }

    const tabBtns = {
      student: document.getElementById('tab-btn-student'),
      teacher: document.getElementById('tab-btn-teacher'),
      admin: document.getElementById('tab-btn-admin')
    };

    const panels = {
      student: document.getElementById('tab-panel-student'),
      teacher: document.getElementById('tab-panel-teacher'),
      admin: document.getElementById('tab-panel-admin')
    };

    // Toggle active classes on portal tabs
    Object.keys(tabBtns).forEach(key => {
      if (tabBtns[key]) {
        const isActive = key === tabName;
        tabBtns[key].classList.toggle('active', isActive);
        tabBtns[key].setAttribute('aria-selected', isActive.toString());
        tabBtns[key].setAttribute('tabindex', isActive ? '0' : '-1');
      }
    });

    // Toggle active/hidden on portal panels (only active section shown)
    Object.keys(panels).forEach(key => {
      if (panels[key]) {
        if (key === tabName) {
          panels[key].classList.remove('hidden');
          panels[key].classList.add('active');
        } else {
          panels[key].classList.add('hidden');
          panels[key].classList.remove('active');
        }
      }
    });
  }

  showAuthAlert(message, type = 'error') {
    const alertBox = document.getElementById('auth-alert-box');
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `auth-alert ${type}`;
    alertBox.classList.remove('hidden');
    if (type === 'error') {
      window.soundFx?.playBuzz();
    }
  }

  clearAuthAlert() {
    const alertBox = document.getElementById('auth-alert-box');
    if (alertBox) {
      alertBox.textContent = '';
      alertBox.classList.add('hidden');
    }
  }

  /* =========================================================================
     Bind Authentication Portal Events
     ========================================================================= */
  bindAuthPortal() {
    // Role portal switching (Student / Teacher / Admin) + Arrow-key navigation
    const portalOrder = ['student', 'teacher', 'admin'];
    portalOrder.forEach((roleKey, idx) => {
      const btn = document.getElementById(`tab-btn-${roleKey}`);
      btn?.addEventListener('click', () => this.switchAuthTab(roleKey));
      btn?.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          const nextRole = portalOrder[(idx + dir + portalOrder.length) % portalOrder.length];
          this.switchAuthTab(nextRole);
          document.getElementById(`tab-btn-${nextRole}`)?.focus();
        }
      });
    });

    // Show / Hide Password toggles
    document.querySelectorAll('.btn-show-hide-pwd').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.textContent = isPassword ? '🙈' : '👁️';
        btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        window.soundFx?.playPop();
      });
    });

    // Forgot Password links & modal
    const modalForgot = document.getElementById('modal-forgot-password');
    document.querySelectorAll('.forgot-password-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        modalForgot?.classList.remove('hidden');
        window.soundFx?.playPop();
      });
    });
    document.getElementById('btn-close-forgot-modal')?.addEventListener('click', () => {
      modalForgot?.classList.add('hidden');
    });
    document.getElementById('btn-ok-forgot-modal')?.addEventListener('click', () => {
      modalForgot?.classList.add('hidden');
    });

    // Create New Account navigation (hides login portal completely)
    document.getElementById('link-goto-register-student')?.addEventListener('click', () => {
      this.setAuthMode(false);
      this.toggleRegRole('student');
    });

    document.getElementById('link-goto-register-teacher')?.addEventListener('click', () => {
      this.setAuthMode(false);
      this.toggleRegRole('teacher');
    });

    // Back to Sign In from Create Account section
    document.getElementById('link-goto-login')?.addEventListener('click', () => {
      this.setAuthMode(true, this.lastLoginTab || 'student');
    });

    // Student Login Submit
    document.getElementById('form-student-login')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleStudentLogin();
    });

    // Teacher Login Submit
    document.getElementById('form-teacher-login')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleTeacherLogin();
    });

    // Admin Login Submit
    document.getElementById('form-admin-login')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAdminLogin();
    });

    // Auto-suggest username when typing student full name on Create Account screen
    const regNameInput = document.getElementById('reg-student-name');
    const regUserInput = document.getElementById('reg-student-username');
    let manualUsernameEdited = false;
    regUserInput?.addEventListener('input', () => {
      manualUsernameEdited = regUserInput.value.trim().length > 0;
    });
    regNameInput?.addEventListener('input', () => {
      if (!manualUsernameEdited && regUserInput) {
        const clean = regNameInput.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        regUserInput.value = clean;
      }
    });

    // Registration Role Selector Toggle
    const btnRegStu = document.getElementById('btn-reg-select-student');
    const btnRegTea = document.getElementById('btn-reg-select-teacher');

    btnRegStu?.addEventListener('click', () => this.toggleRegRole('student'));
    btnRegTea?.addEventListener('click', () => this.toggleRegRole('teacher'));

    // Registration Mascot Avatar Selector
    document.querySelectorAll('#reg-avatar-palette .reg-avatar-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('#reg-avatar-palette .reg-avatar-opt').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        this.selectedRegAvatar = opt.getAttribute('data-avatar') || '🌟';
        window.soundFx?.playPop();
      });
    });

    // Student Registration Submit
    document.getElementById('form-register-student')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleStudentRegister();
    });

    // Teacher Registration Submit
    document.getElementById('form-register-teacher')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleTeacherRegister();
    });

    // Dedicated Sign Out button in header
    document.getElementById('btn-sign-out')?.addEventListener('click', async () => {
      if (confirm('Are you sure you want to sign out?')) {
        try {
          if (window.location.protocol.startsWith('http')) {
            await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
          }
        } catch (err) {
          console.log('Offline sign-out notice:', err);
        }
        window.iepStorage.logout();
        this.authenticatedUser = null;
        window.soundFx?.playPop();
        window.speechAssistant?.speak('You have signed out. See you soon!');
        this.showAuthView('student');
      }
    });

    // Return to Educator/Admin Dashboard from Preview Banner
    document.getElementById('btn-return-educator-dash')?.addEventListener('click', () => {
      const session = this.authenticatedUser || window.iepStorage.getActiveSession();
      const targetRole = (session && session.role === 'admin') ? 'admin' : 'teacher';
      this.setRole(targetRole, null, session);
    });

    // Brand logo click
    document.getElementById('btn-brand-home')?.addEventListener('click', () => {
      const session = this.authenticatedUser || window.iepStorage.getActiveSession();
      if (!session) {
        this.showAuthView('student');
      } else if (session.role === 'admin' || session.role === 'teacher') {
        this.setRole(session.role, null, session);
      } else {
        this.showHomeView();
      }
    });

    // Multi-Language Selector
    document.getElementById('select-app-language')?.addEventListener('change', (e) => {
      const lang = e.target.value;
      if (window.i18n) {
        window.i18n.setLanguage(lang);
      }
    });
  }

  toggleRegRole(role) {
    const btnStu = document.getElementById('btn-reg-select-student');
    const btnTea = document.getElementById('btn-reg-select-teacher');
    const formStu = document.getElementById('form-register-student');
    const formTea = document.getElementById('form-register-teacher');

    if (role === 'student') {
      btnStu?.classList.add('active', 'liquid-btn-active');
      btnTea?.classList.remove('active', 'liquid-btn-active');
      formStu?.classList.remove('hidden');
      formTea?.classList.add('hidden');
    } else {
      btnTea?.classList.add('active', 'liquid-btn-active');
      btnStu?.classList.remove('active', 'liquid-btn-active');
      formTea?.classList.remove('hidden');
      formStu?.classList.add('hidden');
    }
    this.clearAuthAlert();
  }

  setButtonLoading(btn, isLoading, loadingText = '⏳ Signing In...') {
    if (!btn) return;
    if (isLoading) {
      if (!btn.dataset.originalHtml) {
        btn.dataset.originalHtml = btn.innerHTML;
      }
      btn.disabled = true;
      btn.style.opacity = '0.82';
      btn.textContent = loadingText;
    } else {
      btn.disabled = false;
      btn.style.opacity = '1';
      if (btn.dataset.originalHtml) {
        btn.innerHTML = btn.dataset.originalHtml;
      }
    }
  }

  async authenticateWithBackend({ identifier, password, role, remember, submitBtn }) {
    if (!identifier) {
      this.showAuthAlert('Please enter your username or email.');
      window.speechAssistant?.speak('Please enter your username or email.');
      return;
    }
    if (!password) {
      this.showAuthAlert('Please enter your password.');
      window.speechAssistant?.speak('Please enter your password.');
      return;
    }

    this.clearAuthAlert();
    this.setButtonLoading(submitBtn, true, '⏳ Verifying Account...');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ identifier, password, role, remember })
      });

      const data = await res.json();
      this.setButtonLoading(submitBtn, false);

      if (res.ok && data.success && data.user) {
        this.clearAuthAlert();
        window.soundFx?.playSuccess();
        const synced = window.iepStorage.syncUserFromBackend(data.user);
        this.authenticatedUser = synced;
        this.setRole(data.user.role, synced.id, synced);
      } else {
        const errMsg = data.message || 'Invalid username/email or password. Please check and try again.';
        this.showAuthAlert(errMsg);
        window.speechAssistant?.speak(errMsg);
      }
    } catch (err) {
      console.log('Backend login unavailable, attempting offline fallback:', err);
      this.setButtonLoading(submitBtn, false);

      const offlineRes = window.iepStorage.authenticateUser({ identifier, password, role });
      if (offlineRes.success) {
        this.clearAuthAlert();
        window.soundFx?.playSuccess();
        this.authenticatedUser = offlineRes.user;
        this.setRole(role, offlineRes.user.id, offlineRes.user);
      } else {
        this.showAuthAlert(offlineRes.message || 'Could not sign in. Please verify your credentials.');
      }
    }
  }

  handleStudentLogin() {
    const identifier = document.getElementById('login-student-username')?.value.trim();
    const password = document.getElementById('login-student-pin')?.value.trim();
    const remember = document.getElementById('check-remember-student')?.checked || false;
    const submitBtn = document.getElementById('btn-submit-student-login');

    this.authenticateWithBackend({
      identifier,
      password,
      role: 'student',
      remember,
      submitBtn
    });
  }

  handleTeacherLogin() {
    const identifier = document.getElementById('login-teacher-email')?.value.trim();
    const password = document.getElementById('login-teacher-password')?.value.trim();
    const remember = document.getElementById('check-remember-teacher')?.checked || false;
    const submitBtn = document.getElementById('btn-submit-teacher-login');

    this.authenticateWithBackend({
      identifier,
      password,
      role: 'teacher',
      remember,
      submitBtn
    });
  }

  handleAdminLogin() {
    const identifier = document.getElementById('login-admin-email')?.value.trim();
    const password = document.getElementById('login-admin-password')?.value.trim();
    const remember = document.getElementById('check-remember-admin')?.checked || false;
    const submitBtn = document.getElementById('btn-submit-admin-login');

    this.authenticateWithBackend({
      identifier,
      password,
      role: 'admin',
      remember,
      submitBtn
    });
  }

  async handleStudentRegister() {
    const name = document.getElementById('reg-student-name')?.value.trim();
    const rawUsername = document.getElementById('reg-student-username')?.value.trim();
    const level = document.getElementById('reg-student-level')?.value || 'moderate';
    const disability = document.getElementById('reg-student-disability')?.value.trim() || 'Intellectual & Developmental Delay';
    const password = document.getElementById('reg-student-pin')?.value.trim();
    const submitBtn = document.getElementById('btn-submit-reg-student');

    if (!name) {
      this.showAuthAlert("Please enter the student's full name.");
      return;
    }

    let username = (rawUsername || name).toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_|_$/g, '');
    if (username.length < 3) {
      username = `${username}_stu`.slice(0, 20);
    }

    if (!password || password.length < 4) {
      this.showAuthAlert('Password / PIN must be at least 4 characters long.');
      return;
    }

    const email = `${username}@prerana.edu`;
    this.clearAuthAlert();
    this.setButtonLoading(submitBtn, true, '⏳ Creating Account...');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          role: 'student',
          full_name: name,
          username,
          email,
          password,
          avatar: this.selectedRegAvatar,
          support_tier: level,
          special_needs: disability
        })
      });

      const data = await res.json();
      this.setButtonLoading(submitBtn, false);

      if (res.ok && data.success && data.user) {
        window.soundFx?.playSuccess();
        const synced = window.iepStorage.syncUserFromBackend(data.user);
        this.authenticatedUser = synced;
        this.showAuthAlert(`🎉 Welcome to Prerana, ${name}! Your username is "${username}". Opening games...`, 'success');
        setTimeout(() => {
          this.setRole('student', synced.id, synced);
        }, 700);
      } else {
        this.showAuthAlert(data.message || 'Could not register student account.');
      }
    } catch (err) {
      console.log('Backend register unavailable, offline fallback:', err);
      this.setButtonLoading(submitBtn, false);

      const res = window.iepStorage.registerAccount({
        role: 'student',
        name,
        username,
        email,
        password,
        avatar: this.selectedRegAvatar,
        level,
        disability
      });

      if (res.success) {
        window.soundFx?.playSuccess();
        this.authenticatedUser = res.user;
        this.setRole('student', res.user.id, res.user);
      } else {
        this.showAuthAlert(res.message);
      }
    }
  }

  async handleTeacherRegister() {
    const name = document.getElementById('reg-teacher-name')?.value.trim();
    const email = document.getElementById('reg-teacher-email')?.value.trim().toLowerCase();
    const spec = document.getElementById('reg-teacher-spec')?.value.trim() || 'Special Education';
    const password = document.getElementById('reg-teacher-pass')?.value.trim();
    const submitBtn = document.getElementById('btn-submit-reg-teacher');

    if (!name || !email) {
      this.showAuthAlert('Please enter the educator full name and email address.');
      return;
    }
    if (!password || password.length < 4) {
      this.showAuthAlert('Password must be at least 4 characters long.');
      return;
    }

    let username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_|_$/g, '');
    if (username.length < 3) {
      username = `${username}_edu`;
    }

    this.clearAuthAlert();
    this.setButtonLoading(submitBtn, true, '⏳ Registering Educator...');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          role: 'teacher',
          full_name: name,
          username,
          email,
          password,
          avatar: '👩‍🏫',
          support_tier: 'moderate',
          special_needs: spec
        })
      });

      const data = await res.json();
      this.setButtonLoading(submitBtn, false);

      if (res.ok && data.success && data.user) {
        window.soundFx?.playSuccess();
        const synced = window.iepStorage.syncUserFromBackend(data.user);
        this.authenticatedUser = synced;
        this.showAuthAlert(`👩‍🏫 Welcome ${name}! Opening Educator Dashboard...`, 'success');
        setTimeout(() => {
          this.setRole('teacher', null, synced);
        }, 700);
      } else {
        this.showAuthAlert(data.message || 'Could not register educator account.');
      }
    } catch (err) {
      console.log('Backend register unavailable, offline fallback:', err);
      this.setButtonLoading(submitBtn, false);

      const res = window.iepStorage.registerAccount({
        role: 'teacher',
        name,
        username,
        email,
        specialization: spec,
        password
      });

      if (res.success) {
        window.soundFx?.playSuccess();
        this.authenticatedUser = res.user;
        this.setRole('teacher', null, res.user);
      } else {
        this.showAuthAlert(res.message);
      }
    }
  }

  /* =========================================================================
     Role & Portal Management (Student vs Teacher vs Admin)
     ========================================================================= */
  setRole(role, studentId = null, customUser = null) {
    this.currentRole = role;

    // Reveal the top navigation header bar once logged in
    document.body.classList.remove('auth-locked');
    document.getElementById('app-top-header')?.classList.remove('hidden');
    this.syncHeaderScrollState();

    // Hide auth view and reset content sections
    this.viewAuth?.classList.add('hidden');
    this.viewHome?.classList.add('hidden');
    this.viewPlay?.classList.add('hidden');
    this.viewTeacher?.classList.add('hidden');

    const roleBadge = document.getElementById('current-role-badge');
    const headerStudent = document.getElementById('header-student-status');
    const headerTeacher = document.getElementById('header-teacher-status');
    const btnSignOut = document.getElementById('btn-sign-out');
    const previewBanner = document.getElementById('educator-preview-banner');
    const hamburgerBtn = document.getElementById('btn-nav-hamburger');

    btnSignOut?.classList.remove('hidden');

    if (role === 'student') {
      // Show 3-line hamburger menu for students
      hamburgerBtn?.classList.remove('hidden');
      document.body.classList.remove('role-teacher', 'role-admin', 'portal-staff');
      document.body.classList.add('role-student');

      const roster = window.iepStorage.getStudents();
      const targetStudent =
        customUser ||
        roster.find(s => s.id === studentId || s.dbId === studentId) ||
        roster[0] || {
          id: 'stu_1',
          name: 'Learner',
          avatar: '🌟',
          level: 'moderate',
          stars: 0
        };

      if (!this.isEducatorPreview) {
        this.previewStudentProfile = null;
        window.iepStorage.setActiveSession(targetStudent);
        previewBanner?.classList.add('hidden');
      } else {
        this.previewStudentProfile = targetStudent;
        previewBanner?.classList.remove('hidden');
      }

      this.viewHome?.classList.remove('hidden');
      headerStudent?.classList.remove('hidden');
      headerTeacher?.classList.add('hidden');

      if (roleBadge) roleBadge.textContent = `Student: ${targetStudent.name}`;

      this.updateLearnerHeader(targetStudent);
      this.updateStarsDisplay();

      const staffRole = this.authenticatedUser?.role;
      const teacherShortcut = document.getElementById('btn-dash-teacher-shortcut');
      if (teacherShortcut) {
        if (this.isEducatorPreview || staffRole === 'teacher' || staffRole === 'admin') {
          teacherShortcut.classList.remove('hidden');
        } else {
          teacherShortcut.classList.add('hidden');
        }
      }

      this.activeDashTab = 'activities';
      document.querySelectorAll('.dash-feature-btn[data-dash-tab]').forEach(b => {
        const isAct = b.getAttribute('data-dash-tab') === 'activities';
        b.classList.toggle('active', isAct);
        b.setAttribute('aria-selected', isAct ? 'true' : 'false');
      });
      this.syncHomeSectionVisibility('activities');
      const cachedDash = window.iepStorage.getDashboardState();
      this.syncStudentDashboardUI(cachedDash);
      if (window.location.protocol.startsWith('http')) {
        window.iepStorage.fetchDashboardData().then((fresh) => {
          this.syncStudentDashboardUI(fresh);
        });
      }

      setTimeout(() => {
        window.speechAssistant?.speak(`Welcome back, ${targetStudent.name}! Choose an activity to play.`, true);
      }, 300);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (role === 'teacher' || role === 'admin') {
      this.isEducatorPreview = false;
      this.previewStudentProfile = null;
      const session = customUser || this.authenticatedUser || window.iepStorage.getActiveSession();
      const isAdmin = role === 'admin';
      const staffName = (session && (session.name || session.full_name)) || (isAdmin ? 'Administrator' : 'Mrs. Sunita Sharma');

      // Remove / hide 3-line hamburger menu option in teacher and admin section
      if (typeof this.closeNavDrawer === 'function') {
        this.closeNavDrawer();
      }
      hamburgerBtn?.classList.add('hidden');
      document.body.classList.remove('role-student');
      document.body.classList.add(isAdmin ? 'role-admin' : 'role-teacher', 'portal-staff');

      this.viewTeacher?.classList.remove('hidden');
      headerStudent?.classList.add('hidden');
      headerTeacher?.classList.remove('hidden');
      previewBanner?.classList.add('hidden');

      if (roleBadge) roleBadge.textContent = isAdmin ? 'Admin Portal' : 'Educator Portal';

      const teacherBadge = headerTeacher?.querySelector('.teacher-badge');
      if (teacherBadge) {
        teacherBadge.textContent = isAdmin
          ? `🛡️ ${staffName} (Administrator)`
          : `👩‍🏫 ${staffName} (IEP Dashboard)`;
      }

      const dashHeading = document.getElementById('staff-dashboard-heading');
      const dashSubtext = document.getElementById('staff-dashboard-subtext');
      if (dashHeading) {
        dashHeading.textContent = isAdmin
          ? '🛡️ Administrator & IEP Management Portal'
          : '👩‍🏫 Special Educator & IEP Monitoring Portal';
      }
      if (dashSubtext) {
        dashSubtext.textContent = isAdmin
          ? 'Manage enrolled learners, cognitive support tiers, MySQL accounts, and center analytics'
          : 'Manage student profiles, cognitive support levels, and track Individualized Education Programs';
      }

      this.refreshTeacherDashboard();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /* =========================================================================
     Teacher / Admin Dashboard Actions
     ========================================================================= */
  bindTeacherDashboard() {
    // Switch to student preview from teacher/admin dashboard
    document.getElementById('btn-teacher-switch-student')?.addEventListener('click', () => {
      this.isEducatorPreview = true;
      this.setRole('student');
    });
    document.getElementById('btn-teacher-play-as-student')?.addEventListener('click', () => {
      this.isEducatorPreview = true;
      this.setRole('student');
    });

    // Print & Export
    const triggerReportPdfExport = () => {
      // Export official Center-Wide IEP Progress Evaluation PDF in English
      if (window.location.protocol.startsWith('http')) {
        window.open('/api/teacher/class-progress-pdf?download=1', '_blank');
      } else {
        window.iepStorage.preparePrintableReport();
      }
    };

    document.getElementById('btn-teacher-print-report')?.addEventListener('click', triggerReportPdfExport);
    document.getElementById('btn-sidebar-export-report')?.addEventListener('click', triggerReportPdfExport);
    document.getElementById('btn-sidebar-export-json')?.addEventListener('click', triggerReportPdfExport);
    document.getElementById('btn-teacher-export-json')?.addEventListener('click', () => {
      window.iepStorage.exportIEPReport();
    });
    document.getElementById('btn-clear-teacher-logs')?.addEventListener('click', () => {
      if (confirm("Reset class session logs?")) {
        window.iepStorage.clearRecords();
        this.refreshTeacherDashboard();
      }
    });

    // Add Student Modal (inside Teacher Dashboard)
    const modalAdd = document.getElementById('modal-add-student');
    document.getElementById('btn-open-add-student-modal')?.addEventListener('click', () => {
      modalAdd?.classList.remove('hidden');
    });
    document.getElementById('btn-sidebar-add-student')?.addEventListener('click', () => {
      modalAdd?.classList.remove('hidden');
    });
    document.getElementById('btn-close-add-student')?.addEventListener('click', () => {
      modalAdd?.classList.add('hidden');
    });

    // Teacher Sidebar Section Navigation
    document.querySelectorAll('.sidebar-nav-btn[data-teacher-scroll]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-nav-btn[data-teacher-scroll]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-teacher-scroll');
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Avatar selector inside add student modal
    document.querySelectorAll('#new-avatar-selector .avatar-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#new-avatar-selector .avatar-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedRegAvatar = btn.getAttribute('data-avatar') || '🌟';
      });
    });

    // Save New Student from Teacher Modal (persists to MySQL + syncs locally)
    document.getElementById('btn-save-new-student')?.addEventListener('click', async () => {
      const name = document.getElementById('input-new-student-name')?.value.trim();
      const level = document.getElementById('select-new-student-level')?.value || 'moderate';
      const disability = document.getElementById('input-new-student-disability')?.value.trim() || 'Intellectual & Developmental Delay';

      if (!name) {
        alert("Please enter student name.");
        return;
      }

      let cleanUsername = name.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_|_$/g, '');
      if (cleanUsername.length < 3) cleanUsername = `${cleanUsername}_stu`;
      const uniqueSuffix = Date.now().toString().slice(-4);

      let savedToBackend = false;
      if (window.location.protocol.startsWith('http')) {
        try {
          const res = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
              full_name: name,
              username: cleanUsername,
              email: `${cleanUsername}.${uniqueSuffix}@prerana.edu`,
              avatar: this.selectedRegAvatar,
              support_tier: level,
              special_needs: disability
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            savedToBackend = true;
          } else if (res.status === 400 && data.message) {
            alert(data.message);
            return;
          }
        } catch (err) {
          console.log('Offline student add fallback:', err);
        }
      }

      if (!savedToBackend) {
        window.iepStorage.addStudent({
          name,
          avatar: this.selectedRegAvatar,
          level,
          disability
        });
      }

      const nameInput = document.getElementById('input-new-student-name');
      if (nameInput) nameInput.value = '';
      modalAdd?.classList.add('hidden');
      window.soundFx?.playSuccess();
      await this.refreshTeacherDashboard();
      alert(`Student profile for ${name} created successfully!`);
    });

    // Custom Lessons Studio Form & Toggles
    const btnToggleCreateLesson = document.getElementById('btn-toggle-create-lesson');
    const formCreateLesson = document.getElementById('form-create-custom-lesson');
    const btnCancelLesson = document.getElementById('btn-cancel-lesson');

    btnToggleCreateLesson?.addEventListener('click', () => {
      formCreateLesson?.classList.toggle('hidden');
    });

    btnCancelLesson?.addEventListener('click', () => {
      formCreateLesson?.classList.add('hidden');
    });

    formCreateLesson?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSaveCustomLesson();
    });

    // Adaptive AI BKT Evaluation
    document.getElementById('btn-run-ai-eval')?.addEventListener('click', async () => {
      await this.runAdaptiveAiEval();
    });
  }

  async refreshTeacherDashboard() {
    // Sync student roster from protected MySQL endpoint when online
    if (window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('/api/dashboard/teacher', { credentials: 'same-origin' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.students)) {
            window.iepStorage.syncStudentsFromBackend(data.students);
          }
          if (data.success && Array.isArray(data.activity_logs)) {
            this.serverTeacherLogs = data.activity_logs;
          }
        }
      } catch (err) {
        console.log('Teacher roster offline sync fallback:', err);
      }
    }

    const students = window.iepStorage.getStudents();
    const summary = window.iepStorage.getMetricsSummary();
    const localLogs = window.iepStorage.getLogs();
    const serverLogs = Array.isArray(this.serverTeacherLogs) ? this.serverTeacherLogs : [];
    const logs = serverLogs.length ? serverLogs : localLogs;

    // KPIs
    const kpiStudents = document.getElementById('teacher-kpi-students');
    const kpiSessions = document.getElementById('teacher-kpi-sessions');
    const kpiAccuracy = document.getElementById('teacher-kpi-accuracy');
    const kpiTime = document.getElementById('teacher-kpi-time');

    const totalSessions = Math.max(summary.totalTasks, logs.length);
    const firstTryCount = logs.filter(l => (l.status || '').includes('First')).length;
    const calcAcc = logs.length ? Math.round((firstTryCount / logs.length) * 100) : summary.accuracy;

    if (kpiStudents) kpiStudents.textContent = students.length;
    if (kpiSessions) kpiSessions.textContent = totalSessions;
    if (kpiAccuracy) kpiAccuracy.textContent = `${calcAcc}%`;
    if (kpiTime) kpiTime.textContent = `${summary.engagementMinutes}m`;

    // Render Student Performance Charts
    this.renderTeacherCharts(students, logs);

    // Populate Student Management Glass Cards Grid
    const cardsGrid = document.getElementById('teacher-student-cards-grid');
    if (cardsGrid) {
      cardsGrid.innerHTML = students.map(s => `
        <div class="student-mgmt-card glass-panel glass-card">
          <div class="student-mgmt-top">
            <div class="profile-avatar-orb">${s.avatar || '🌟'}</div>
            <div style="min-width:0; flex:1;">
              <strong style="font-size:1.08rem; color:var(--text-dark); display:block;">${s.name}</strong>
              <span style="font-size:0.82rem; color:var(--text-muted); font-weight:700;">
                ${s.username ? `@${s.username} • ` : ''}${s.disability || 'Special Education'}
              </span>
            </div>
            <span class="glass-pill" style="padding:0.25rem 0.65rem; font-weight:800; color:#D97706;">⭐ ${s.stars || 0}</span>
          </div>
          <div class="student-mgmt-actions" style="flex-wrap: wrap;">
            <select class="input-control glass-input glass-dropdown level-select" data-id="${s.id}" data-db-id="${s.dbId || ''}" style="flex:1; min-width:130px; padding:0.42rem 0.75rem; font-size:0.86rem;">
              <option value="mild" ${s.level === 'mild' ? 'selected' : ''}>Mild (4 Choices)</option>
              <option value="moderate" ${s.level === 'moderate' ? 'selected' : ''}>Moderate (3 Choices)</option>
              <option value="high" ${s.level === 'high' ? 'selected' : ''}>High Support (2)</option>
            </select>
            <button type="button" class="btn btn-primary btn-sm liquid-btn liquid-btn-primary liquid-btn-sm btn-play-as" data-id="${s.id}">🎮 View Student</button>
            <button type="button" class="btn btn-secondary btn-sm liquid-btn liquid-btn-secondary liquid-btn-sm btn-edit-student" data-id="${s.id}" data-db-id="${s.dbId || ''}">✏️ Edit Student</button>
            <button type="button" class="btn btn-secondary btn-sm liquid-btn liquid-btn-secondary liquid-btn-sm btn-download-pdf" data-id="${s.id}" data-db-id="${s.dbId || ''}" title="Download Individualized Education Program (IEP) Progress Evaluation PDF (English)">📄 Download IEP Report (PDF)</button>
            ${students.length > 1 ? `<button type="button" class="btn btn-danger btn-sm liquid-btn liquid-btn-danger liquid-btn-icon btn-del-student" data-id="${s.id}" data-db-id="${s.dbId || ''}" title="Delete student">🗑️</button>` : ''}
          </div>
          <div class="inline-edit-student-box hidden" data-edit-box="${s.id}" style="margin-top:0.65rem; padding:0.75rem; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:16px; display:flex; flex-direction:column; gap:0.5rem;">
            <input type="text" class="glass-input edit-stu-name" value="${s.name}" style="padding:0.45rem 0.85rem; font-size:0.9rem;" aria-label="Edit student name">
            <select class="glass-input glass-dropdown edit-stu-tier" style="padding:0.45rem 0.85rem; font-size:0.88rem;">
              <option value="mild" ${s.level === 'mild' ? 'selected' : ''}>Mild Support</option>
              <option value="moderate" ${s.level === 'moderate' ? 'selected' : ''}>Moderate Support</option>
              <option value="high" ${s.level === 'high' ? 'selected' : ''}>High Support</option>
            </select>
            <div style="display:flex; gap:0.4rem;">
              <button type="button" class="liquid-btn liquid-btn-success liquid-btn-sm btn-save-student-edit" data-id="${s.id}" data-db-id="${s.dbId || ''}">💾 Save</button>
              <button type="button" class="liquid-btn liquid-btn-secondary liquid-btn-sm btn-cancel-student-edit" data-id="${s.id}">Cancel</button>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Populate Roster Table
    const rosterTbody = document.getElementById('teacher-roster-tbody');
    if (rosterTbody) {
      rosterTbody.innerHTML = students.map(s => `
        <tr>
          <td style="font-size: 2rem; text-align: center;">${s.avatar}</td>
          <td><strong>${s.name}</strong>${s.username ? `<br><small style="color:var(--text-muted);">@${s.username}</small>` : ''}</td>
          <td><small>${s.disability || 'Special Education'}</small></td>
          <td>
            <select class="input-control glass-input glass-dropdown level-select" data-id="${s.id}" data-db-id="${s.dbId || ''}" style="padding: 0.45rem 0.75rem; font-size: 0.9rem;">
              <option value="mild" ${s.level === 'mild' ? 'selected' : ''}>Mild Support (4 Choices)</option>
              <option value="moderate" ${s.level === 'moderate' ? 'selected' : ''}>Moderate Support (3 Choices)</option>
              <option value="high" ${s.level === 'high' ? 'selected' : ''}>High Support (2 Choices)</option>
            </select>
          </td>
          <td><strong style="color: #F59E0B;">⭐ ${s.stars || 0}</strong></td>
          <td style="white-space: nowrap;">
            <button type="button" class="btn btn-primary btn-sm liquid-btn liquid-btn-primary liquid-btn-sm btn-play-as" data-id="${s.id}">🎮 Launch</button>
            <button type="button" class="btn btn-secondary btn-sm liquid-btn liquid-btn-secondary liquid-btn-sm btn-edit-student" data-id="${s.id}" data-db-id="${s.dbId || ''}" style="margin-left: 4px;">✏️ Update</button>
            <button type="button" class="btn btn-secondary btn-sm liquid-btn liquid-btn-secondary liquid-btn-sm btn-download-pdf" data-id="${s.id}" data-db-id="${s.dbId || ''}" style="margin-left: 4px;" title="Download Individualized Education Program (IEP) Progress Evaluation PDF (English)">📄 Download IEP Report (PDF)</button>
            ${students.length > 1 ? `<button type="button" class="btn btn-danger btn-sm liquid-btn liquid-btn-danger liquid-btn-icon btn-del-student" data-id="${s.id}" data-db-id="${s.dbId || ''}" style="margin-left: 4px;" title="Delete student">🗑️</button>` : ''}
          </td>
        </tr>
      `).join('');
    }

    // Uniformly bind both Student Management Cards & Roster Table controls
    const bindStudentControls = (rootEl) => {
      if (!rootEl) return;

      rootEl.querySelectorAll('.level-select').forEach(sel => {
        sel.addEventListener('change', () => {
          const id = sel.getAttribute('data-id');
          const dbId = sel.getAttribute('data-db-id');
          this.handleStudentTierChange(id, dbId, sel.value, students);
        });
      });

      rootEl.querySelectorAll('.btn-play-as').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          this.isEducatorPreview = true;
          this.setRole('student', id);
        });
      });

      rootEl.querySelectorAll('.btn-edit-student').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const box = document.querySelector(`[data-edit-box="${id}"]`);
          if (box) {
            box.classList.toggle('hidden');
            box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      });

      rootEl.querySelectorAll('.btn-download-pdf').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const dbId = btn.getAttribute('data-db-id');
          const rawId = btn.getAttribute('data-id');
          const studentId = dbId || (typeof rawId === 'string' ? rawId.replace(/^stu_db_/, '') : rawId);
          if (!studentId) {
            alert('Student identifier not found.');
            return;
          }
          window.open(`/api/teacher/student/${studentId}/progress-pdf?download=1`, '_blank');
        });
      });

      rootEl.querySelectorAll('.btn-cancel-student-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          document.querySelector(`[data-edit-box="${id}"]`)?.classList.add('hidden');
        });
      });

      rootEl.querySelectorAll('.btn-save-student-edit').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const dbId = btn.getAttribute('data-db-id');
          const box = document.querySelector(`[data-edit-box="${id}"]`);
          if (!box) return;
          const newName = box.querySelector('.edit-stu-name')?.value?.trim();
          const newTier = box.querySelector('.edit-stu-tier')?.value || 'moderate';
          const stu = students.find(x => x.id === id);
          if (stu && newName) {
            stu.name = newName;
            window.iepStorage.saveProfile({ ...stu, name: newName, level: newTier });
          }
          await this.handleStudentTierChange(id, dbId, newTier, students);
          box.classList.add('hidden');
        });
      });

      rootEl.querySelectorAll('.btn-del-student').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const dbId = btn.getAttribute('data-db-id');
          this.handleDeleteStudent(id, dbId);
        });
      });
    };

    bindStudentControls(cardsGrid);
    bindStudentControls(rosterTbody);

    // Populate Activity Logs Table
    const logsTbody = document.getElementById('teacher-logs-tbody');
    if (logsTbody) {
      if (!logs.length) {
        logsTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:1.2rem;">No student activities recorded yet in this session.</td></tr>`;
      } else {
        logsTbody.innerHTML = logs.map(l => {
          const statusStr = l.status || 'Completed';
          const isFirstTry = statusStr.includes('First');
          const formattedTime = String(l.timestamp || '').replace('T', ' ');
          return `
            <tr>
              <td><small>${formattedTime}</small></td>
              <td><strong>${l.studentName || 'Student'}</strong></td>
              <td>${l.moduleName}</td>
              <td>${l.objective}</td>
              <td><span class="log-status-badge ${isFirstTry ? 'status-pass' : 'status-warn'}" style="color: ${isFirstTry ? '#10B981' : '#F59E0B'}; font-weight:800;">${statusStr}</span></td>
              <td>${l.attempts}</td>
              <td>${l.responseTimeSec}s</td>
            </tr>
          `;
        }).join('');
      }
    }

    // Populate AI Evaluation student dropdown
    const aiSelect = document.getElementById('ai-student-select');
    if (aiSelect && Array.isArray(students)) {
      const prevVal = aiSelect.value;
      aiSelect.innerHTML = students.map(s => `<option value="${s.dbId || s.id}">${s.name} (${s.level || 'mild'})</option>`).join('');
      if (prevVal) aiSelect.value = prevVal;
    }

    // Load custom lessons in teacher studio
    this.loadTeacherCustomLessons();
  }

  async loadTeacherCustomLessons() {
    const grid = document.getElementById('teacher-custom-lessons-grid');
    if (!grid) return;
    try {
      const res = await fetch('/api/teacher/custom-lessons', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        const lessons = data.lessons || [];
        if (lessons.length === 0) {
          grid.innerHTML = '<p style="color:var(--text-muted); grid-column:1/-1;">No custom flashcards yet. Click "Create New Lesson" above to add one!</p>';
          return;
        }
        grid.innerHTML = lessons.map(les => `
          <div class="custom-lesson-card">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size: 2.2rem;">${les.image_url || '🎒'}</span>
                <span class="glass-pill" style="font-size:0.75rem; background:#EEF2FF; color:#4338CA;">${les.category}</span>
              </div>
              <h4 style="margin: 0.5rem 0 0.25rem 0; font-size:1.15rem; color:#1E1B4B;">${les.title}</h4>
              <p style="margin: 0; font-size:0.9rem; color:#475569;">"${les.prompt_text}"</p>
              <div style="margin-top:0.6rem; font-size:0.85rem;">
                <strong style="color:#059669;">✓ Correct:</strong> ${les.correct_answer}<br>
                <strong style="color:#64748B;">Choices:</strong> ${(les.distractors || []).join(', ')}
              </div>
            </div>
            <div style="margin-top:1rem; display:flex; justify-content:flex-end;">
              <button type="button" class="liquid-btn liquid-btn-danger liquid-btn-sm btn-delete-custom-lesson" data-lesson-id="${les.id}">🗑️ Delete</button>
            </div>
          </div>
        `).join('');

        grid.querySelectorAll('.btn-delete-custom-lesson').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.lessonId;
            if (confirm('Delete this custom flashcard?')) {
              await fetch(`/api/teacher/custom-lessons/${id}`, { method: 'DELETE', credentials: 'same-origin' });
              await this.loadTeacherCustomLessons();
            }
          });
        });
      }
    } catch (err) {
      console.log('Error loading custom lessons:', err);
    }
  }

  async handleSaveCustomLesson() {
    const title = document.getElementById('lesson-title')?.value.trim();
    const category = document.getElementById('lesson-category')?.value;
    const prompt_text = document.getElementById('lesson-prompt')?.value.trim();
    const image_url = document.getElementById('lesson-icon')?.value.trim() || '🎒';
    const correct_answer = document.getElementById('lesson-correct')?.value.trim();
    const distractorsRaw = document.getElementById('lesson-distractors')?.value.trim();

    if (!title || !prompt_text || !correct_answer) {
      alert('Please fill out all required lesson fields.');
      return;
    }

    const distractors = distractorsRaw ? distractorsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    try {
      const res = await fetch('/api/teacher/custom-lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          title,
          category,
          prompt_text,
          image_url,
          correct_answer,
          distractors
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        document.getElementById('form-create-custom-lesson')?.reset();
        document.getElementById('form-create-custom-lesson')?.classList.add('hidden');
        await this.loadTeacherCustomLessons();
        window.soundFx?.playSuccess();
        alert('Custom lesson created and published to students!');
      } else {
        alert(data.message || 'Failed to save lesson.');
      }
    } catch (err) {
      console.error('Save custom lesson error:', err);
    }
  }

  async runAdaptiveAiEval() {
    const sel = document.getElementById('ai-student-select');
    const studentId = sel?.value;
    if (!studentId) {
      alert('Please select a student for AI evaluation.');
      return;
    }

    try {
      const res = await fetch(`/api/adaptive/student/${studentId}`, { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        const ev = data.adaptive_analysis || data.evaluation;
        if (data.success && ev) {
          const mastery = ev.mastery_probability ?? ev.mastery_percentage ?? 85.0;
          document.getElementById('ai-mastery-val').textContent = `${mastery}%`;
          document.getElementById('ai-mastery-status').textContent = ev.mastery_level || ev.mastery_status || 'Proficient';
          document.getElementById('ai-mastery-status').style.color = mastery >= 75 ? '#059669' : '#D97706';
          
          const latency = ev.average_latency_sec ?? ev.mean_latency ?? 2.1;
          document.getElementById('ai-latency-val').textContent = `${latency}s`;
          document.getElementById('ai-latency-status').textContent = ev.cognitive_load_state || ev.latency_status || 'Autonomous Attention';
          
          const recTier = ev.recommended_tier || 'mild';
          document.getElementById('ai-tier-val').textContent = `${recTier.charAt(0).toUpperCase() + recTier.slice(1)} Support`;
          document.getElementById('ai-choices-val').textContent = `${ev.recommended_choices || ev.choice_count || 4}-Choice Multimodal Array`;
          
          document.getElementById('ai-insights-text').textContent = ev.ai_insights || ev.clinical_advice || 'Learner demonstrates robust retention.';
          window.soundFx?.playSuccess();
        }
      }
    } catch (err) {
      console.error('AI Eval error:', err);
    }
  }

  renderTeacherCharts(students, logs) {
    const chartsEl = document.getElementById('teacher-performance-charts');
    if (!chartsEl) return;

    const moduleCounts = {};
    logs.forEach(l => {
      const label = l.moduleName || 'General Activity';
      moduleCounts[label] = (moduleCounts[label] || 0) + 1;
    });

    let moduleRows = Object.entries(moduleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (!moduleRows.length) {
      moduleRows = [
        ['Alphabet Learning', 0],
        ['Numbers & Counting', 0],
        ['Social Skills', 0],
        ['Personal Hygiene', 0]
      ];
    }
    const maxModuleVal = Math.max(1, ...moduleRows.map(r => r[1]));

    const sortedStudents = [...students]
      .sort((a, b) => (b.stars || 0) - (a.stars || 0))
      .slice(0, 5);
    const maxStars = Math.max(10, ...sortedStudents.map(s => s.stars || 0));

    chartsEl.innerHTML = `
      <div class="chart-glass-card glass-panel glass-card">
        <h4>📊 Completed Activities by Section</h4>
        ${moduleRows.map(([name, count]) => {
          const pct = count > 0 ? Math.max(12, Math.round((count / maxModuleVal) * 100)) : 6;
          return `
            <div class="chart-bar-row">
              <span class="chart-bar-label" title="${name}">${name}</span>
              <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%;"></div></div>
              <span style="text-align:right; color:#4338CA;">${count}</span>
            </div>
          `;
        }).join('')}
      </div>
      <div class="chart-glass-card glass-panel glass-card">
        <h4>⭐ Learner Star Engagement</h4>
        ${sortedStudents.map(s => {
          const stars = s.stars || 0;
          const pct = stars > 0 ? Math.max(12, Math.round((stars / maxStars) * 100)) : 6;
          return `
            <div class="chart-bar-row">
              <span class="chart-bar-label">${s.avatar || '🌟'} ${s.name}</span>
              <div class="chart-bar-track"><div class="chart-bar-fill mint" style="width:${pct}%;"></div></div>
              <span style="text-align:right; color:#059669;">${stars} ⭐</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  async handleStudentTierChange(studentId, dbId, newLevel, studentsList) {
    const students = studentsList || window.iepStorage.getStudents();
    const student = students.find(item => item.id === studentId);
    if (!student) return;
    student.level = newLevel;
    window.iepStorage.saveStudents(students);

    // Keep synced across both the card grid and table selects
    document.querySelectorAll(`.level-select[data-id="${studentId}"]`).forEach(el => {
      if (el.value !== newLevel) el.value = newLevel;
    });

    if (dbId && window.location.protocol.startsWith('http')) {
      try {
        await fetch(`/api/students/${dbId}/tier`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ support_tier: newLevel })
        });
      } catch (err) {
        console.log('Tier sync error:', err);
      }
    }
  }

  async handleDeleteStudent(studentId, dbId) {
    if (!confirm('Delete this student profile?')) return;
    if (dbId && window.location.protocol.startsWith('http')) {
      try {
        await fetch(`/api/students/${dbId}`, {
          method: 'DELETE',
          credentials: 'same-origin'
        });
      } catch (err) {
        console.log('Delete student sync error:', err);
      }
    }
    window.iepStorage.deleteStudent(studentId);
    this.refreshTeacherDashboard();
  }

  /* =========================================================================
     PWA & Multi-Network Connectivity
     ========================================================================= */
  initPWA() {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
          .then((reg) => {
            reg.update();
            console.log('Prerana ServiceWorker registered:', reg.scope);
          })
          .catch((err) => console.log('ServiceWorker registration error:', err));
      });
    }

    const installBtn = document.getElementById('btn-install-pwa');
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      if (installBtn) {
        installBtn.classList.remove('hidden');
      }
    });

    installBtn?.addEventListener('click', async () => {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`User response to install: ${outcome}`);
        this.deferredPrompt = null;
        installBtn.classList.add('hidden');
      } else {
        alert("To install this app on your phone:\n- On Android: Tap Chrome menu (3 dots) > 'Add to Home screen' or 'Install App'.\n- On iPhone/iPad: Tap Share button > 'Add to Home Screen'.");
      }
    });
  }

  initNetworkStatus() {
    const netPill = document.getElementById('network-pill');
    const netLabel = document.getElementById('network-label');

    const updateStatus = () => {
      const isOnline = navigator.onLine;
      if (netPill && netLabel) {
        if (isOnline) {
          netPill.className = 'network-indicator glass-pill online';
          const dot = netPill.querySelector('.net-dot');
          if (dot) dot.textContent = '🟢';
          netLabel.textContent = 'Online';
        } else {
          netPill.className = 'network-indicator glass-pill offline';
          const dot = netPill.querySelector('.net-dot');
          if (dot) dot.textContent = '📶';
          netLabel.textContent = 'Offline Ready';
        }
      }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
  }

  bindNetworkSharingModal() {
    const btnShare = document.getElementById('btn-share-network');
    const modal = document.getElementById('network-modal');
    const btnClose = document.getElementById('btn-close-network-modal');
    const inputUrl = document.getElementById('input-wifi-url');
    const btnCopy = document.getElementById('btn-copy-url');
    const qrImage = document.getElementById('qr-image');

    const refreshNetworkInfo = async () => {
      const host = window.location.hostname || '';
      const isPrivateOrLocal =
        !host ||
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.startsWith('192.168.') ||
        host.startsWith('10.') ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(host);

      let targetUrl = window.location.origin && window.location.origin !== 'null'
        ? window.location.origin
        : window.location.href;

      if (isPrivateOrLocal) {
        try {
          const res = await fetch('/api/network-info');
          if (res.ok) {
            const data = await res.json();
            if (data.network_url) targetUrl = data.network_url;
          }
        } catch (err) {
          // Retain current origin fallback
        }
      }

      if (inputUrl) inputUrl.value = targetUrl;
      if (qrImage) {
        qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(targetUrl)}`;
      }
    };

    btnShare?.addEventListener('click', () => {
      refreshNetworkInfo();
      modal?.classList.remove('hidden');
    });

    btnClose?.addEventListener('click', () => {
      modal?.classList.add('hidden');
    });

    btnCopy?.addEventListener('click', () => {
      if (inputUrl) {
        inputUrl.select();
        navigator.clipboard?.writeText(inputUrl.value);
        btnCopy.textContent = '✅ Copied!';
        setTimeout(() => {
          btnCopy.textContent = '📋 Copy Link';
        }, 2000);
      }
    });
  }

  /* =========================================================================
     Student Game Navigation
     ========================================================================= */
  showHomeView(options = {}) {
    if (this.currentModuleKey === 'calming' && window.calmingModule) {
      window.calmingModule.destroy();
    }
    if (this.currentModuleKey === 'playground' && window.playgroundModule) {
      window.playgroundModule.destroy();
    }
    window.soundFx?.stopMelody();
    this.viewHome?.classList.remove('hidden');
    this.viewPlay?.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof this.closeNavDrawer === 'function') {
      this.closeNavDrawer();
    }

    if (!options.preserveDashTab) {
      this.setDashboardTab('activities');
    }

    if (!options.silentSpeech) {
      const profile = this.previewStudentProfile || window.iepStorage.getProfile();
      setTimeout(() => {
        window.speechAssistant?.speak(`Hello ${profile.name}! Pick an activity to play.`);
      }, 400);
    }
  }

  openModule(moduleKey) {
    if (this.currentModuleKey === 'calming' && window.calmingModule) {
      window.calmingModule.destroy();
    }
    if (this.currentModuleKey === 'playground' && window.playgroundModule) {
      window.playgroundModule.destroy();
    }
    window.soundFx?.stopMelody();

    this.currentModuleKey = moduleKey;
    this.viewHome?.classList.add('hidden');
    this.viewPlay?.classList.remove('hidden');

    const badge = document.getElementById('current-module-badge');
    if (badge) {
      badge.textContent = this.moduleLabels[moduleKey] || 'Activity';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const moduleMap = {
      alphabet: window.alphabetModule,
      numbers: window.numbersModule,
      animals: window.animalsModule,
      fruits: window.fruitsModule,
      bodyparts: window.bodyPartsModule,
      safety: window.safetyModule,
      hygiene: window.hygieneModule,
      memory: window.memoryModule,
      social: window.socialModule,
      communication: window.communicationModule,
      music: window.musicModule,
      timecalendar: window.timeCalendarModule,
      shapes: window.shapesModule,
      daily: window.dailyLivingModule,
      emotions: window.emotionsModule,
      counting: window.countingModule,
      sounds: window.soundsModule,
      calming: window.calmingModule,
      playground: window.playgroundModule
    };

    const mod = moduleMap[moduleKey] || window.alphabetModule || window.shapesModule;
    if (moduleKey === 'custom_teacher') {
      this.renderCustomLessonsPlayer(this.stageElement);
      return;
    }
    if (mod && typeof mod.render === 'function') {
      mod.render(this.stageElement);
    }
  }

  async renderCustomLessonsPlayer(container) {
    if (!container) return;
    container.innerHTML = '<div style="text-align:center; padding: 3rem;"><h3>Loading Special Educator Flashcards...</h3></div>';

    let lessons = [];
    try {
      const res = await fetch('/api/teacher/custom-lessons');
      if (res.ok) {
        const data = await res.json();
        lessons = data.lessons || [];
      }
    } catch (e) {
      console.log('Using local fallback lessons');
    }

    if (!lessons.length) {
      lessons = [
        {
          id: 1,
          category: 'Adaptive Life Skills',
          title: 'Pack School Bag',
          prompt_text: 'Which item do you pack for school?',
          image_url: '🎒',
          correct_answer: 'School Bag',
          distractors: ['Pillow', 'Television']
        },
        {
          id: 2,
          category: 'Adaptive Life Skills',
          title: 'Hand Washing',
          prompt_text: 'What keeps our hands clean and germ-free?',
          image_url: '🧼',
          correct_answer: 'Soap Bar',
          distractors: ['Mud', 'Crayon']
        },
        {
          id: 3,
          category: 'Nutrition & Healthy Foods',
          title: 'Healthy Snack',
          prompt_text: 'Which snack is crunchy and healthy?',
          image_url: '🍎',
          correct_answer: 'Red Apple',
          distractors: ['Plastic Toy', 'Rock']
        }
      ];
    }

    let currentIndex = 0;
    let startTime = Date.now();
    let attempts = 0;

    const renderCard = () => {
      if (currentIndex >= lessons.length) {
        container.innerHTML = `
          <div class="game-stage-card glass-panel glass-card" style="text-align:center; padding: 2.5rem 1.5rem; max-width: 650px; margin: 0 auto;">
            <div style="font-size: 4rem; animation: bounce 1s infinite;">🎉⭐🎓</div>
            <h2 style="font-size: 2rem; color: #4338CA; margin: 0.8rem 0 0.4rem 0;">Outstanding Effort!</h2>
            <p style="font-size: 1.15rem; color: #374151;">You completed all the customized teacher flashcards!</p>
            <div style="margin-top: 1.5rem; display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
              <button type="button" id="btn-replay-custom-lessons" class="liquid-btn liquid-btn-primary liquid-btn-lg">🔄 Play Again</button>
              <button type="button" id="btn-return-home-from-custom" class="liquid-btn liquid-btn-secondary liquid-btn-lg">🏠 Back to Activities</button>
            </div>
          </div>
        `;
        window.soundFx?.playFanfare();
        window.speechAssistant?.speak('Incredible job! You mastered all teacher flashcards!', true);
        container.querySelector('#btn-replay-custom-lessons')?.addEventListener('click', () => {
          currentIndex = 0;
          renderCard();
        });
        container.querySelector('#btn-return-home-from-custom')?.addEventListener('click', () => {
          document.getElementById('btn-back-home')?.click();
        });
        return;
      }

      const lesson = lessons[currentIndex];
      startTime = Date.now();
      attempts = 0;

      const options = [lesson.correct_answer, ...(lesson.distractors || [])]
        .map(val => ({ text: val, isCorrect: val === lesson.correct_answer }))
        .sort(() => Math.random() - 0.5);

      container.innerHTML = `
        <div class="game-stage-card glass-panel glass-card" style="max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem; text-align: center;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
            <span class="glass-pill" style="font-size: 0.85rem; background: #EEF2FF; color: #4338CA; font-weight:700;">Card ${currentIndex + 1} of ${lessons.length}</span>
            <span class="glass-pill" style="font-size: 0.85rem; background: #FEF3C7; color: #B45309; font-weight:700;">⭐ Flashcard Quest</span>
          </div>

          <div style="font-size: 4.5rem; margin: 0.5rem 0;" class="animate-pop">${lesson.image_url || '🎒'}</div>
          <h2 style="font-size: 1.6rem; color: #1E1B4B; margin: 0 0 0.5rem 0;">${lesson.title}</h2>
          <p id="custom-prompt-text" style="font-size: 1.25rem; font-weight: 700; color: #4F46E5; margin-bottom: 1.5rem; line-height: 1.4;">
            "${lesson.prompt_text}"
          </p>
          <button type="button" id="btn-speak-custom-prompt" class="liquid-btn liquid-btn-secondary liquid-btn-sm" style="margin-bottom: 1.5rem;">
            🔊 Repeat Question
          </button>

          <div class="custom-choices-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-top: 0.5rem;">
            ${options.map((opt) => `
              <button type="button" class="liquid-btn liquid-btn-choice btn-custom-choice" data-correct="${opt.isCorrect}" style="padding: 1.2rem 1rem; font-size: 1.15rem; font-weight: 700; border-radius: 18px; border: 2px solid #E0E7FF; background: #FFFFFF; cursor: pointer; transition: all 0.2s ease;">
                ${opt.text}
              </button>
            `).join('')}
          </div>

          <div id="custom-feedback-msg" style="margin-top: 1.25rem; min-height: 28px; font-weight: 700; font-size: 1.1rem;"></div>
        </div>
      `;

      window.speechAssistant?.speak(lesson.prompt_text, true);

      container.querySelector('#btn-speak-custom-prompt')?.addEventListener('click', () => {
        window.speechAssistant?.speak(lesson.prompt_text, true);
      });

      const choiceBtns = container.querySelectorAll('.btn-custom-choice');
      const feedbackEl = container.querySelector('#custom-feedback-msg');

      choiceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          attempts += 1;
          const isCorrect = btn.getAttribute('data-correct') === 'true';
          const latencySec = Math.max(0.8, (Date.now() - startTime) / 1000);

          if (isCorrect) {
            btn.style.background = '#ECFDF5';
            btn.style.borderColor = '#10B981';
            btn.style.color = '#065F46';
            feedbackEl.innerHTML = '<span style="color:#059669;">🌟 Excellent! That is the right answer!</span>';
            window.soundFx?.playSuccess();
            window.soundFx?.launchConfetti();
            window.speechAssistant?.speak(`Wonderful! ${lesson.correct_answer}!`, true);

            window.iepStorage.recordActivity({
              module_name: 'custom_teacher',
              objective: `Custom Lesson: ${lesson.title}`,
              status: 'Passed',
              attempts: attempts,
              latency_seconds: latencySec,
              stars_earned: attempts === 1 ? 3 : 2
            });

            choiceBtns.forEach(b => b.disabled = true);

            setTimeout(() => {
              currentIndex += 1;
              renderCard();
            }, 1800);
          } else {
            btn.style.background = '#FEF2F2';
            btn.style.borderColor = '#EF4444';
            btn.style.color = '#DC2626';
            feedbackEl.innerHTML = '<span style="color:#DC2626;">🌱 Gentle try! Look closely and tap again!</span>';
            window.soundFx?.playError();
            window.speechAssistant?.speak('Almost there, try once more!', true);
          }
        });
      });
    };

    renderCard();
  }

  bindHomeCards() {
    const cards = document.querySelectorAll('.activity-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.card-fav-btn')) return;
        const moduleKey = card.getAttribute('data-module');
        if (moduleKey) this.openModule(moduleKey);
      });

      card.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.card-fav-btn')) {
          e.preventDefault();
          const moduleKey = card.getAttribute('data-module');
          if (moduleKey) this.openModule(moduleKey);
        }
      });
    });

    document.querySelectorAll('.card-fav-btn').forEach(favBtn => {
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const modKey = favBtn.getAttribute('data-fav-module');
        window.soundFx?.playPop();
        window.iepStorage.toggleFavoriteRemote(modKey);
      });
    });

    document.getElementById('btn-listen-welcome')?.addEventListener('click', () => {
      const profile = this.previewStudentProfile || window.iepStorage.getProfile();
      window.speechAssistant?.speak(`Hello ${profile.name}! What fun activity would you like to play today?`, true);
    });

    document.getElementById('btn-continue-learning')?.addEventListener('click', () => {
      const state = window.iepStorage.getDashboardState();
      const progress = state.progress || {};
      const moduleOrder = Object.keys(this.moduleLabels);
      const nextMod = moduleOrder.find(k => !progress[k] || !progress[k].completed_count) || this.currentModuleKey || 'alphabet';
      window.soundFx?.playPop();
      this.openModule(nextMod);
    });
  }

  /* =========================================================================
     Dashboard Features (Achievements, Progress, Daily Rewards, Daily Plan,
     Favorites, Teacher Shortcut & Accessibility Settings)
     ========================================================================= */
  bindDashboardFeatures() {
    // Quick Difficulty Pills in Welcome Banner
    document.querySelectorAll('.home-diff-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const diff = btn.getAttribute('data-diff');
        window.soundFx?.playPop();
        window.iepStorage.saveSettingsRemote({}, diff);
        window.speechAssistant?.speak(`Difficulty set to ${diff} level.`, true);
      });
    });

    // Dashboard Feature Tabs (inside Navigation Drawer)
    document.querySelectorAll('.dash-feature-btn[data-dash-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-dash-tab');
        window.soundFx?.playPop();
        // Automatically close the menu drawer whenever user clicks a section
        if (typeof this.closeNavDrawer === 'function') {
          this.closeNavDrawer();
        }
        if (tab === 'teacher') return;
        this.setDashboardTab(tab, { ensureHomeView: true, scrollTop: true });
      });
    });

    // Authorized Staff Shortcut to Teacher Dashboard
    document.getElementById('btn-dash-teacher-shortcut')?.addEventListener('click', () => {
      if (typeof this.closeNavDrawer === 'function') {
        this.closeNavDrawer();
      }
      const staffRole = this.authenticatedUser?.role === 'admin' ? 'admin' : 'teacher';
      this.isEducatorPreview = false;
      this.setRole(staffRole, null, this.authenticatedUser);
    });

    // Category Filters
    document.querySelectorAll('.cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        this.activeCategory = pill.getAttribute('data-cat') || 'all';
        document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.filterLearningCards();
      });
    });

    document.getElementById('btn-show-all-activities')?.addEventListener('click', () => {
      this.activeCategory = 'all';
      document.querySelectorAll('.cat-pill').forEach(p => {
        p.classList.toggle('active', p.getAttribute('data-cat') === 'all');
      });
      this.setDashboardTab('activities', { scrollTop: true });
    });
  }

  /** Toggle visibility of home welcome/categories vs active drawer section. */
  syncHomeSectionVisibility(tab = this.activeDashTab) {
    const currentTab = tab || 'activities';
    const isActivities = currentTab === 'activities';
    const isFavorites = currentTab === 'favorites';

    document.querySelector('#view-home .welcome-banner')?.classList.toggle('hidden', !isActivities);
    document.querySelector('#view-home .learning-categories-header')?.classList.toggle('hidden', !isActivities);
    document.getElementById('category-filter-row')?.classList.toggle('hidden', !isActivities);
    document.getElementById('learning-cards-grid')?.classList.toggle('hidden', !(isActivities || isFavorites));
  }

  /** Activate a student navigation drawer section exclusively. */
  setDashboardTab(tab = 'activities', options = {}) {
    const targetTab = tab || 'activities';
    this.activeDashTab = targetTab;

    document.querySelectorAll('.dash-feature-btn[data-dash-tab]').forEach(b => {
      const isActive = b.getAttribute('data-dash-tab') === targetTab;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    if (targetTab === 'playground') {
      this.openModule('playground');
      return;
    }

    if (options.ensureHomeView && this.viewHome?.classList.contains('hidden') && targetTab !== 'teacher') {
      this.showHomeView({ preserveDashTab: true, silentSpeech: true });
    }

    this.syncHomeSectionVisibility(targetTab);
    this.renderDashboardFeaturePanel(targetTab);
    this.filterLearningCards();

    if (targetTab === 'activities') {
      window.requestAnimationFrame(() => window.refreshLiquidGlassToggleBars?.());
    }
    if (options.scrollTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  syncStudentDashboardUI(state) {
    if (!state) return;
    const settings = state.settings || {};

    // Apply Accessibility Preferences globally
    let isDarkTheme = false;
    try {
      const savedTheme = localStorage.getItem('prerana_theme');
      if (savedTheme) {
        isDarkTheme = (savedTheme === 'dark');
      } else {
        isDarkTheme = Boolean(settings.highContrast || settings.darkMode);
      }
    } catch (_) {
      isDarkTheme = Boolean(settings.highContrast || settings.darkMode);
    }
    this.setThemeMode(isDarkTheme, false, false);

    document.body.classList.toggle('font-dyslexic', Boolean(settings.dyslexicFont));
    document.body.classList.toggle('font-standard', !settings.dyslexicFont);
    document.body.classList.toggle('reduced-motion', Boolean(settings.reducedMotion));

    const textSize = settings.textSize || 'normal';
    document.body.classList.remove('text-size-large', 'text-size-xlarge');
    if (textSize === 'large') document.body.classList.add('text-size-large');
    if (textSize === 'xlarge') document.body.classList.add('text-size-xlarge');

    if (window.speechAssistant) {
      window.speechAssistant.toggle(settings.voiceEnabled !== false);
      window.speechAssistant.setRate(settings.voiceRate || 0.85);
    }
    if (window.soundFx) {
      window.soundFx.toggle(settings.soundEnabled !== false);
    }

    // Update top header Accessibility toggles visual state
    document.getElementById('btn-toggle-tts')?.classList.toggle('active', settings.voiceEnabled !== false);
    window.refreshLiquidGlassToggleBars?.();

    // Update Quick Stats & Stars
    const starEl = document.getElementById('star-count');
    const scoreEl = document.getElementById('home-score-count');
    const streakEl = document.getElementById('home-streak-count');
    const rewardDot = document.getElementById('reward-dot');
    if (starEl && typeof state.stars === 'number') starEl.textContent = state.stars;
    if (scoreEl) scoreEl.textContent = state.score || 0;
    if (streakEl) streakEl.textContent = state.daily_streak || 0;
    if (rewardDot) rewardDot.classList.toggle('hidden', Boolean(state.reward_claimed_today));
    const mobileRewardDot = document.getElementById('mobile-reward-dot');
    if (mobileRewardDot) mobileRewardDot.classList.toggle('hidden', Boolean(state.reward_claimed_today));

    // Sync Student Hero Profile Summary Card
    const progress = state.progress || {};
    const playedModulesCount = Object.values(progress).filter(p => (p.completed_count || 0) > 0).length;
    const totalModulesCount = Object.keys(this.moduleLabels || {}).length || 18;
    const journeyPct = Math.min(100, Math.round((playedModulesCount / totalModulesCount) * 100));

    const profileLabel = document.getElementById('home-overall-progress-label');
    const profileFill = document.getElementById('home-overall-progress-fill');
    if (profileLabel) profileLabel.textContent = `${playedModulesCount} / ${totalModulesCount}`;
    if (profileFill) profileFill.style.width = `${journeyPct}%`;
    this.syncProfileSummaryCard();

    // Highlight active difficulty pill
    const diff = state.difficulty || window.iepStorage.getDifficultyLevel();
    document.querySelectorAll('.home-diff-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-diff') === diff);
    });

    // Update Favorite hearts & Done badges on cards
    const favorites = Array.isArray(state.favorites) ? state.favorites : [];
    document.querySelectorAll('.activity-card').forEach(card => {
      const modKey = card.getAttribute('data-module');
      const favBtn = card.querySelector('.card-fav-btn');
      const doneBadge = card.querySelector('.card-done-badge');
      const isFav = favorites.includes(modKey);
      if (favBtn) {
        favBtn.textContent = isFav ? '❤️' : '🤍';
        favBtn.classList.toggle('is-fav', isFav);
      }
      if (doneBadge) {
        const playedCount = (progress[modKey] && progress[modKey].completed_count) || 0;
        doneBadge.classList.toggle('hidden', playedCount === 0);
        if (playedCount > 0) doneBadge.textContent = `✓ ${playedCount}x`;
      }
    });

    this.syncHomeSectionVisibility(this.activeDashTab);
    this.filterLearningCards();
    if (this.activeDashTab && this.activeDashTab !== 'activities') {
      this.renderDashboardFeaturePanel(this.activeDashTab);
    }
  }

  filterLearningCards() {
    const state = window.iepStorage.getDashboardState();
    const favorites = Array.isArray(state.favorites) ? state.favorites : [];
    const currentTab = this.activeDashTab || 'activities';
    const isActivities = currentTab === 'activities';
    const onlyFavs = currentTab === 'favorites';

    let visibleCount = 0;
    document.querySelectorAll('.activity-card').forEach(card => {
      const modKey = card.getAttribute('data-module');
      const cat = card.getAttribute('data-category');
      const matchesCat = onlyFavs || this.activeCategory === 'all' || cat === this.activeCategory;
      const matchesFav = !onlyFavs || favorites.includes(modKey);
      const show = (isActivities || onlyFavs) && matchesCat && matchesFav;
      card.classList.toggle('hidden', !show);
      if (show) visibleCount += 1;
    });

    const gridEl = document.getElementById('learning-cards-grid');
    if (gridEl) {
      gridEl.classList.toggle('hidden', !(isActivities || (onlyFavs && visibleCount > 0)));
    }

    const emptyNotice = document.getElementById('favorites-empty-notice');
    if (emptyNotice) {
      emptyNotice.classList.toggle('hidden', !(onlyFavs && visibleCount === 0));
    }
  }

  renderDashboardFeaturePanel(tab) {
    const panel = document.getElementById('dash-feature-panel');
    if (!panel) return;

    if (tab === 'activities') {
      panel.classList.add('hidden');
      panel.innerHTML = '';
      return;
    }

    const state = window.iepStorage.getDashboardState();
    panel.classList.remove('hidden');

    if (tab === 'favorites') {
      panel.innerHTML = `
        <div class="dash-panel-header" style="margin-bottom:0;">
          <h3 class="dash-panel-title">💖 My Favorite Activities</h3>
          <button type="button" class="btn btn-secondary btn-sm liquid-btn liquid-btn-secondary liquid-btn-sm btn-close-dash-panel">✖ Close</button>
        </div>
      `;
    } else if (tab === 'profile') {
      const profile = this.previewStudentProfile || window.iepStorage.getProfile();
      const session = this.authenticatedUser || window.iepStorage.getActiveSession() || {};
      const summary = state.summary || {};
      const unlockedIds = Array.isArray(state.achievements) ? state.achievements : [];
      const logs = (window.iepStorage.getLogs() || []).slice(0, 8);
      const avatars = ['🌟', '🦁', '🐻', '🦋', '🐰', '🐼', '🐬', '🚀', '🌈'];

      panel.innerHTML = `
        <div class="dash-panel-header">
          <h3 class="dash-panel-title">👤 My Learner Profile & History</h3>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <button type="button" id="btn-edit-profile" class="liquid-btn liquid-btn-primary liquid-btn-sm">✏️ Edit Profile</button>
            <button type="button" class="btn btn-secondary btn-sm liquid-btn liquid-btn-secondary liquid-btn-sm btn-close-dash-panel">✖ Close</button>
          </div>
        </div>
        <div class="profile-glass-layout">
          <div class="profile-glass-card glass-panel glass-card">
            <div class="profile-header-row">
              <div class="profile-avatar-orb" style="width:74px; height:74px; font-size:2.9rem;">${profile.avatar || '🌟'}</div>
              <div>
                <h4 style="font-size:1.35rem; font-weight:800; color:var(--text-dark); margin:0;">${profile.name || 'Learner'}</h4>
                <div style="color:var(--text-muted); font-size:0.9rem; font-weight:700;">
                  ${session.username ? `@${session.username} • ` : ''}${this.formatTierLabel(profile.level)}
                </div>
              </div>
            </div>
            <div id="profile-edit-drawer" class="hidden" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:18px; padding:1rem; margin-bottom:1rem; display:flex; flex-direction:column; gap:0.75rem;">
              <label for="input-edit-profile-name" style="font-weight:700; font-size:0.92rem; color:var(--text-dark);">Display Name:</label>
              <input type="text" id="input-edit-profile-name" class="glass-input" value="${profile.name || 'Learner'}" style="padding:0.65rem 1rem;">
              <div style="display:flex; gap:0.55rem; flex-wrap:wrap;">
                <button type="button" id="btn-save-profile-changes" class="liquid-btn liquid-btn-success liquid-btn-sm">💾 Save Changes</button>
                <button type="button" id="btn-update-profile" class="liquid-btn liquid-btn-primary liquid-btn-sm">🔄 Update Profile</button>
                <button type="button" id="btn-cancel-profile-edit" class="liquid-btn liquid-btn-secondary liquid-btn-sm">Cancel</button>
              </div>
            </div>
            <div style="font-weight:700; font-size:0.9rem; color:var(--text-muted); margin-bottom:0.45rem;">Choose My Mascot Avatar:</div>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-bottom:1rem;">
              ${avatars.map(av => `
                <button type="button" class="avatar-option ${profile.avatar === av ? 'selected' : ''}" data-pick-avatar="${av}" style="font-size:1.45rem;">${av}</button>
              `).join('')}
            </div>
            <div class="profile-stats-grid">
              <div class="profile-stat-tile glass-card"><span class="profile-stat-val">⭐ ${state.stars || 0}</span><span class="profile-stat-lbl">Earned Stars</span></div>
              <div class="profile-stat-tile glass-card"><span class="profile-stat-val">💯 ${state.score || 0}</span><span class="profile-stat-lbl">Total Score</span></div>
              <div class="profile-stat-tile glass-card"><span class="profile-stat-val">✅ ${summary.total_activities || 0}</span><span class="profile-stat-lbl">Completed</span></div>
              <div class="profile-stat-tile glass-card"><span class="profile-stat-val">🏆 ${unlockedIds.length}</span><span class="profile-stat-lbl">Badges</span></div>
            </div>
          </div>

          <div class="profile-glass-card glass-panel glass-card">
            <h4 style="font-size:1.15rem; font-weight:800; margin-bottom:0.85rem; color:var(--text-dark);">🕒 Recent Learning History</h4>
            <div class="profile-history-list">
              ${logs.length ? logs.map(l => `
                <div class="profile-history-item">
                  <div>
                    <strong style="display:block; color:var(--text-dark);">${l.moduleName}</strong>
                    <small style="color:var(--text-muted);">${l.objective || 'Activity completed'}</small>
                  </div>
                  <span class="glass-pill" style="padding:0.2rem 0.65rem; font-weight:800; color:#059669; white-space:nowrap;">
                    ${l.status && l.status.includes('First') ? '⭐ First Try' : '✅ Done'}
                  </span>
                </div>
              `).join('') : '<p style="color:var(--text-muted); font-weight:600;">Start playing any learning game to record your accomplishments right here!</p>'}
            </div>
          </div>
        </div>
      `;

      const editDrawer = panel.querySelector('#profile-edit-drawer');
      panel.querySelector('#btn-edit-profile')?.addEventListener('click', () => {
        editDrawer?.classList.toggle('hidden');
        window.soundFx?.playPop();
      });
      panel.querySelector('#btn-cancel-profile-edit')?.addEventListener('click', () => {
        editDrawer?.classList.add('hidden');
      });
      const saveProfileName = () => {
        const newName = panel.querySelector('#input-edit-profile-name')?.value?.trim();
        if (!newName) return;
        const prof = window.iepStorage.getProfile();
        prof.name = newName;
        window.iepStorage.saveProfile(prof);
        this.updateLearnerHeader(prof);
        this.syncProfileSummaryCard();
        window.soundFx?.playSuccess();
        window.speechAssistant?.speak(`Profile updated to ${newName}!`, true);
        this.renderDashboardFeaturePanel('profile');
      };
      panel.querySelector('#btn-save-profile-changes')?.addEventListener('click', saveProfileName);
      panel.querySelector('#btn-update-profile')?.addEventListener('click', saveProfileName);

      panel.querySelectorAll('[data-pick-avatar]').forEach(btn => {
        btn.addEventListener('click', () => {
          const picked = btn.getAttribute('data-pick-avatar');
          const prof = window.iepStorage.getProfile();
          prof.avatar = picked;
          window.iepStorage.saveProfile(prof);
          this.updateLearnerHeader();
          window.soundFx?.playPop();
          this.renderDashboardFeaturePanel('profile');
        });
      });
    } else if (tab === 'progress') {
      const summary = state.summary || {};
      const entries = Object.values(state.progress || {});
      const listHtml = entries.length
        ? entries.map(item => {
            const pct = Math.min(100, (item.completed_count || 0) * 20);
            return `
              <div class="module-prog-item glass-card">
                <div class="module-prog-top">
                  <span>${item.module_name}</span>
                  <span>${item.completed_count} done • ⭐ ${item.total_stars}</span>
                </div>
                <div class="liquid-progress-track"><div class="liquid-progress-fill" style="width:${pct}%;"></div></div>
              </div>
            `;
          }).join('')
        : '<p style="text-align:center; color:#475569;">Play any activity below to start building your progress chart!</p>';

      panel.innerHTML = `
        <div class="dash-panel-header">
          <h3 class="dash-panel-title">📊 My Learning Progress</h3>
          <button type="button" class="btn btn-secondary btn-sm liquid-btn liquid-btn-secondary liquid-btn-sm btn-close-dash-panel">✖ Close</button>
        </div>
        <div class="progress-overview-cards">
          <div class="progress-stat-card glass-card"><div class="progress-stat-val">⭐ ${state.stars || 0}</div><div class="progress-stat-lbl">Total Stars</div></div>
          <div class="progress-stat-card glass-card"><div class="progress-stat-val">💯 ${state.score || 0}</div><div class="progress-stat-lbl">Learning Score</div></div>
          <div class="progress-stat-card glass-card"><div class="progress-stat-val">✅ ${summary.total_activities || 0}</div><div class="progress-stat-lbl">Completed Tasks</div></div>
          <div class="progress-stat-card glass-card"><div class="progress-stat-val">🎯 ${summary.first_try_rate ?? 100}%</div><div class="progress-stat-lbl">First-Try Accuracy</div></div>
        </div>
        <div class="module-progress-list">${listHtml}</div>
      `;
    } else if (tab === 'achievements') {
      const unlockedIds = Array.isArray(state.achievements) ? state.achievements : [];
      const claimedToday = Boolean(state.reward_claimed_today);
      const catalog = (Array.isArray(state.achievements_catalog) && state.achievements_catalog.length)
        ? state.achievements_catalog
        : [
            { id: 'first_star', icon: '🌟', title: 'First Shining Star', desc: 'Complete your very first learning activity.' },
            { id: 'explorer_5', icon: '🧭', title: 'Curious Explorer', desc: 'Finish 5 learning activities.' },
            { id: 'star_15', icon: '🏆', title: 'Star Collector', desc: 'Earn 15 or more stars.' },
            { id: 'first_try_5', icon: '⚡', title: 'Sharp Mind', desc: 'Get 5 answers right on the first try.' },
            { id: 'multi_learner', icon: '🌈', title: 'All-Rounder', desc: 'Try 5 different learning sections.' },
            { id: 'streak_1', icon: '🎁', title: 'Daily Champion', desc: 'Claim your Daily Reward chest.' }
          ];

      panel.innerHTML = `
        <div class="dash-panel-header">
          <h3 class="dash-panel-title">🏆 My Achievements (${unlockedIds.length} / ${catalog.length} Unlocked)</h3>
          <button type="button" class="btn btn-secondary btn-sm liquid-btn liquid-btn-secondary liquid-btn-sm btn-close-dash-panel">✖ Close</button>
        </div>
        <div class="achievements-grid">
          ${catalog.map(a => {
            const isUnlocked = unlockedIds.includes(a.id);
            return `
              <div class="achievement-card glass-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="ach-icon">${a.icon}</div>
                <div class="ach-title">${a.title}</div>
                <div class="ach-desc">${a.desc}</div>
                <div style="margin-top:0.5rem; font-weight:800; font-size:0.85rem; color:${isUnlocked ? '#15803D' : '#64748B'};">
                  ${isUnlocked ? '✅ Unlocked!' : '🔒 Keep Playing'}
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="display:flex; justify-content:center; gap:0.75rem; flex-wrap:wrap; margin-top:1.25rem;">
          <button type="button" id="btn-ach-claim-reward" class="liquid-btn liquid-btn-success liquid-btn-sm" ${claimedToday ? 'disabled' : ''}>
            ${claimedToday ? '✅ Reward Claimed' : '🎁 Claim Reward'}
          </button>
          <button type="button" id="btn-ach-collect-stars" class="liquid-btn liquid-btn-warning liquid-btn-sm" ${claimedToday ? 'disabled' : ''}>
            ⭐ Collect Stars
          </button>
          <button type="button" id="btn-ach-continue" class="liquid-btn liquid-btn-primary liquid-btn-sm">
            ➡️ Continue
          </button>
        </div>
      `;

      const handleAchClaim = async () => {
        const res = await window.iepStorage.claimDailyRewardRemote();
        if (res.ok) {
          window.soundFx?.playSuccess();
          window.speechAssistant?.speak(res.message, true);
          this.renderDashboardFeaturePanel('achievements');
        } else {
          window.speechAssistant?.speak(res.message || 'Already collected today!', true);
        }
      };
      panel.querySelector('#btn-ach-claim-reward')?.addEventListener('click', handleAchClaim);
      panel.querySelector('#btn-ach-collect-stars')?.addEventListener('click', handleAchClaim);
      panel.querySelector('#btn-ach-continue')?.addEventListener('click', () => {
        document.getElementById('btn-show-all-activities')?.click();
      });
    } else if (tab === 'rewards') {
      const claimed = Boolean(state.reward_claimed_today);
      panel.innerHTML = `
        <div class="dash-panel-header">
          <h3 class="dash-panel-title">🎁 Daily Treasure Rewards</h3>
          <button type="button" class="btn btn-secondary btn-sm liquid-btn liquid-btn-secondary liquid-btn-sm btn-close-dash-panel">✖ Close</button>
        </div>
        <div class="daily-reward-hero glass-card">
          <div style="display:flex; align-items:center; gap:1rem;">
            <div class="reward-chest-art">${claimed ? '✨👑✨' : '🎁'}</div>
            <div>
              <h4 style="margin:0 0 0.3rem; font-size:1.3rem;">${claimed ? "Today's Reward Claimed!" : 'Open Your Daily Star Chest!'}</h4>
              <p style="margin:0; color:#78350F; font-weight:600;">
                Current Streak: 🔥 ${state.daily_streak || 0} Day(s) • Come back every day for bonus Stars & Score!
              </p>
            </div>
          </div>
          <div style="display:flex; gap:0.65rem; flex-wrap:wrap;">
            <button type="button" id="btn-claim-daily-reward" class="btn btn-primary btn-lg liquid-btn liquid-btn-primary liquid-btn-lg" ${claimed ? 'disabled' : ''}>
              ${claimed ? '✅ Come Back Tomorrow' : '🌟 Claim Reward (+5 Stars)'}
            </button>
            <button type="button" id="btn-rewards-continue" class="liquid-btn liquid-btn-secondary">➡️ Continue</button>
          </div>
        </div>
      `;

      panel.querySelector('#btn-claim-daily-reward')?.addEventListener('click', async () => {
        const res = await window.iepStorage.claimDailyRewardRemote();
        if (res.ok) {
          window.soundFx?.playSuccess();
          window.speechAssistant?.speak(res.message, true);
          this.renderDashboardFeaturePanel('rewards');
        } else {
          window.speechAssistant?.speak(res.message || 'Already claimed today!', true);
        }
      });
      panel.querySelector('#btn-rewards-continue')?.addEventListener('click', () => {
        document.getElementById('btn-show-all-activities')?.click();
      });
    } else if (tab === 'daily-plan') {
      const doneToday = Array.isArray(state.completed_today) ? state.completed_today : [];
      const plan = [
        { key: 'alphabet', title: '🔤 Alphabet Learning', goal: 'Practice A-Z letters & phonics' },
        { key: 'numbers', title: '🔢 Numbers & Counting', goal: 'Count objects aloud today' },
        { key: 'hygiene', title: '🧼 Personal Hygiene', goal: 'Review healthy daily habits' },
        { key: 'communication', title: '🗣️ Communication Skills', goal: 'Speak 1 phrase on AAC Board' },
        { key: 'music', title: '🎶 Music & Rhymes', goal: 'Play a joyful tune or rhyme' }
      ];

      panel.innerHTML = `
        <div class="dash-panel-header">
          <h3 class="dash-panel-title">📅 Daily Activities Checklist</h3>
          <button type="button" class="btn btn-secondary btn-sm liquid-btn liquid-btn-secondary liquid-btn-sm btn-close-dash-panel">✖ Close</button>
        </div>
        <div class="daily-plan-grid">
          ${plan.map(p => {
            const done = doneToday.includes(p.key);
            return `
              <div class="daily-task-card glass-card ${done ? 'is-done' : ''}">
                <div>
                  <div style="font-weight:800; font-size:1.05rem;">${done ? '✅' : '⭕'} ${p.title}</div>
                  <div style="font-size:0.88rem; color:#475569;">${p.goal}</div>
                </div>
                <button type="button" class="btn btn-sm liquid-btn liquid-btn-primary liquid-btn-sm btn-start-daily-task" data-mod="${p.key}">
                  ${done ? 'Play Again' : "Let's Start ➡️"}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      `;

      panel.querySelectorAll('.btn-start-daily-task').forEach(btn => {
        btn.addEventListener('click', () => this.openModule(btn.dataset.mod));
      });
    } else if (tab === 'settings') {
      const s = state.settings || {};
      const diff = state.difficulty || window.iepStorage.getDifficultyLevel();
      const rate = s.voiceRate || 0.85;
      const textSize = s.textSize || 'normal';
      const renderLiquidGlassSwitch = (id, isChecked, labelText) => `
        <label class="lg-switch-row" for="${id}">
          <span class="lg-switch-caption">${labelText}</span>
          <span class="lg-switch">
            <input type="checkbox" id="${id}" class="lg-switch-input" role="switch" ${isChecked ? 'checked' : ''}>
            <span class="lg-switch-track" aria-hidden="true">
              <span class="lg-switch-thumb"></span>
            </span>
          </span>
        </label>
      `;

      panel.innerHTML = `
        <div class="dash-panel-header">
          <h3 class="dash-panel-title">⚙️ Accessibility & Learning Settings</h3>
          <button type="button" class="btn btn-secondary btn-sm liquid-btn liquid-btn-secondary liquid-btn-sm btn-close-dash-panel">✖ Close</button>
        </div>
        <div class="a11y-settings-grid">
          <div class="a11y-card glass-card">
            <strong>🎯 Difficulty Level</strong>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              <button type="button" class="diff-pill-btn liquid-btn liquid-btn-secondary liquid-btn-sm ${diff === 'easy' ? 'active' : ''}" data-set-diff="easy">🌱 Level 1 · Easy</button>
              <button type="button" class="diff-pill-btn liquid-btn liquid-btn-secondary liquid-btn-sm ${diff === 'medium' ? 'active' : ''}" data-set-diff="medium">⭐ Level 2 · Medium</button>
              <button type="button" class="diff-pill-btn liquid-btn liquid-btn-secondary liquid-btn-sm ${diff === 'advanced' ? 'active' : ''}" data-set-diff="advanced">🚀 Level 3 · Advanced</button>
            </div>
            <strong style="margin-top:0.35rem;">🔤 Text Size Controls</strong>
            <div class="size-chip-group">
              <button type="button" class="size-chip-btn liquid-btn liquid-btn-secondary liquid-btn-sm ${textSize === 'normal' ? 'active' : ''}" data-set-textsize="normal">A Normal</button>
              <button type="button" class="size-chip-btn liquid-btn liquid-btn-secondary liquid-btn-sm ${textSize === 'large' ? 'active' : ''}" data-set-textsize="large">A+ Large</button>
              <button type="button" class="size-chip-btn liquid-btn liquid-btn-secondary liquid-btn-sm ${textSize === 'xlarge' ? 'active' : ''}" data-set-textsize="xlarge">A++ Extra Large</button>
            </div>
          </div>

          <div class="a11y-card glass-card">
            <strong>🔊 Voice Speed & Sound Checks</strong>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              <button type="button" class="diff-pill-btn liquid-btn liquid-btn-secondary liquid-btn-sm ${rate <= 0.72 ? 'active' : ''}" data-set-rate="0.7">🐢 Gentle</button>
              <button type="button" class="diff-pill-btn liquid-btn liquid-btn-secondary liquid-btn-sm ${rate > 0.72 && rate < 1.0 ? 'active' : ''}" data-set-rate="0.85">🙂 Normal</button>
              <button type="button" class="diff-pill-btn liquid-btn liquid-btn-secondary liquid-btn-sm ${rate >= 1.0 ? 'active' : ''}" data-set-rate="1.05">⚡ Clear Fast</button>
            </div>
            <div style="display:flex; gap:0.45rem; flex-wrap:wrap; margin-top:0.25rem;">
              <button type="button" id="btn-test-voice" class="btn btn-sm liquid-btn liquid-btn-primary liquid-btn-sm">🔊 Test Voice</button>
              <button type="button" id="btn-test-sound" class="btn btn-sm liquid-btn liquid-btn-secondary liquid-btn-sm">🔔 Test Sound</button>
            </div>
          </div>

          <div class="a11y-card glass-card">
            <strong>🌙 Theme & Typography</strong>
            ${renderLiquidGlassSwitch('chk-a11y-contrast', Boolean(s.highContrast || s.darkMode || document.body.classList.contains('theme-dark')), '🌙 Dark Theme (Apollo Slate)')}
            ${renderLiquidGlassSwitch('chk-a11y-dyslexic', Boolean(s.dyslexicFont), 'Dyslexia-Friendly Font')}
          </div>

          <div class="a11y-card glass-card">
            <strong>🎧 Audio & Calm Motion</strong>
            ${renderLiquidGlassSwitch('chk-a11y-voice', s.voiceEnabled !== false, 'Spoken Voice Guide')}
            ${renderLiquidGlassSwitch('chk-a11y-sound', s.soundEnabled !== false, 'Gentle Sound Effects')}
            ${renderLiquidGlassSwitch('chk-a11y-motion', Boolean(s.reducedMotion), 'Reduce Animations')}
          </div>

          <div class="a11y-card glass-card">
            <strong>🕹️ Assistive Motor Access</strong>
            ${renderLiquidGlassSwitch('chk-a11y-switch-scan', Boolean(window.assistiveAccess?.isSwitchScanning), 'Single-Switch Auto Scan (Spacebar)')}
            ${renderLiquidGlassSwitch('chk-a11y-dwell-click', Boolean(window.assistiveAccess?.isDwellEnabled), 'Eye-Tracking / Dwell Click (1.5s Hover)')}
          </div>
        </div>
      `;

      panel.querySelectorAll('[data-set-diff]').forEach(btn => {
        btn.addEventListener('click', () => {
          window.iepStorage.saveSettingsRemote({}, btn.dataset.setDiff);
        });
      });
      panel.querySelectorAll('[data-set-textsize]').forEach(btn => {
        btn.addEventListener('click', () => {
          window.soundFx?.playPop();
          window.iepStorage.saveSettingsRemote({ textSize: btn.dataset.setTextsize });
        });
      });
      panel.querySelectorAll('[data-set-rate]').forEach(btn => {
        btn.addEventListener('click', () => {
          const r = parseFloat(btn.dataset.setRate);
          window.iepStorage.saveSettingsRemote({ voiceRate: r });
          window.speechAssistant?.setRate(r);
          window.speechAssistant?.speak('Voice speed updated!', true);
        });
      });
      panel.querySelector('#btn-test-voice')?.addEventListener('click', () => {
        window.speechAssistant?.speak('Hello! Your Prerana voice assistant is clear and ready!', true);
      });
      panel.querySelector('#btn-test-sound')?.addEventListener('click', () => {
        window.soundFx?.playSuccess();
      });

      const bindToggle = (id, key) => {
        panel.querySelector(id)?.addEventListener('change', (e) => {
          window.iepStorage.saveSettingsRemote({ [key]: e.target.checked });
        });
      };
      panel.querySelector('#chk-a11y-contrast')?.addEventListener('change', (e) => {
        this.setThemeMode(e.target.checked, true);
      });
      bindToggle('#chk-a11y-dyslexic', 'dyslexicFont');
      bindToggle('#chk-a11y-voice', 'voiceEnabled');
      bindToggle('#chk-a11y-sound', 'soundEnabled');
      bindToggle('#chk-a11y-motion', 'reducedMotion');

      panel.querySelector('#chk-a11y-switch-scan')?.addEventListener('change', (e) => {
        window.assistiveAccess?.toggleSwitchScanning(e.target.checked);
      });
      panel.querySelector('#chk-a11y-dwell-click')?.addEventListener('change', (e) => {
        window.assistiveAccess?.toggleDwellSelection(e.target.checked);
      });
    }

    panel.querySelector('.btn-close-dash-panel')?.addEventListener('click', () => {
      this.setDashboardTab('activities', { scrollTop: true });
    });
  }

  bindNavigation() {
    document.getElementById('btn-back-home')?.addEventListener('click', () => {
      this.showHomeView();
    });
  }

  bindNavDrawer() {
    const hamburgerBtn = document.getElementById('btn-nav-hamburger');
    const drawer = document.getElementById('nav-menu-drawer');
    const backdrop = document.getElementById('nav-drawer-backdrop');
    const closeBtn = document.getElementById('btn-close-nav-drawer');

    this.openNavDrawer = () => {
      drawer?.classList.add('is-open');
      backdrop?.classList.add('is-open');
      hamburgerBtn?.classList.add('is-active');
      hamburgerBtn?.setAttribute('aria-expanded', 'true');
      drawer?.setAttribute('aria-hidden', 'false');
      backdrop?.setAttribute('aria-hidden', 'false');
      document.body.classList.add('nav-drawer-open');
    };

    this.closeNavDrawer = () => {
      drawer?.classList.remove('is-open');
      backdrop?.classList.remove('is-open');
      hamburgerBtn?.classList.remove('is-active');
      hamburgerBtn?.setAttribute('aria-expanded', 'false');
      drawer?.setAttribute('aria-hidden', 'true');
      backdrop?.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('nav-drawer-open');
    };

    this.toggleNavDrawer = () => {
      if (drawer?.classList.contains('is-open')) {
        this.closeNavDrawer();
      } else {
        this.openNavDrawer();
      }
    };

    hamburgerBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleNavDrawer();
    });

    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeNavDrawer();
    });

    backdrop?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeNavDrawer();
    });

    // Close menu drawer on Escape key press
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer?.classList.contains('is-open')) {
        this.closeNavDrawer();
      }
    });

    // Close menu drawer on clicking outside
    document.addEventListener('click', (e) => {
      if (
        drawer?.classList.contains('is-open') &&
        !drawer.contains(e.target) &&
        !hamburgerBtn?.contains(e.target)
      ) {
        this.closeNavDrawer();
      }
    });
  }

  bindAccessibilityControls() {
    const btnTts = document.getElementById('btn-toggle-tts');
    btnTts?.addEventListener('click', () => {
      const isEnabled = window.speechAssistant?.toggle();
      btnTts.classList.toggle('active', isEnabled);
      btnTts.setAttribute('aria-pressed', isEnabled.toString());
      const label = btnTts.querySelector('.ctrl-text');
      if (label) label.textContent = isEnabled ? "Voice" : "Mute";
      window.iepStorage?.saveSettingsRemote({ voiceEnabled: Boolean(isEnabled) });
    });

    const btnContrast = document.getElementById('btn-toggle-contrast');
    btnContrast?.addEventListener('click', () => {
      const isCurrentlyDark = document.body.classList.contains('theme-dark') || document.body.classList.contains('theme-high-contrast');
      this.setThemeMode(!isCurrentlyDark, true);
    });
  }

  bindAvatarSwitcher() {
    const btnAvatar = document.getElementById('btn-change-avatar');
    btnAvatar?.addEventListener('click', () => {
      const avatars = ['🌟', '🦁', '🐻', '🦋', '🐰', '🐼', '🐬', '🚀', '🌈'];
      const profile = window.iepStorage.getProfile();
      let currentIdx = avatars.indexOf(profile.avatar);
      currentIdx = (currentIdx + 1) % avatars.length;
      const newAvatar = avatars[currentIdx];

      profile.avatar = newAvatar;
      window.iepStorage.saveProfile(profile);
      this.updateLearnerHeader();
      window.soundFx?.playPop();
      window.speechAssistant?.speak(`Avatar changed!`);
    });
  }

  bindCelebrationModal() {
    const modal = document.getElementById('celebration-modal');
    const btnNext = document.getElementById('btn-next-activity');
    const btnRepeat = document.getElementById('btn-repeat-activity');

    btnNext?.addEventListener('click', () => {
      modal?.classList.add('hidden');
      if (typeof this.celebrationCallbackNext === 'function') {
        this.celebrationCallbackNext();
      }
    });

    btnRepeat?.addEventListener('click', () => {
      modal?.classList.add('hidden');
      if (typeof this.celebrationCallbackRepeat === 'function') {
        this.celebrationCallbackRepeat();
      }
    });
  }

  showCelebration({ title, message, emoji = "🎉", onNext, onRepeat }) {
    const modal = document.getElementById('celebration-modal');
    const emojiEl = document.getElementById('celebration-emoji');
    const titleEl = document.getElementById('celebration-title');
    const msgEl = document.getElementById('celebration-msg');

    if (emojiEl) emojiEl.textContent = emoji;
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    this.celebrationCallbackNext = onNext;
    this.celebrationCallbackRepeat = onRepeat;

    modal?.classList.remove('hidden');
  }

  formatTierLabel(level) {
    if (level === 'high') return 'High Support Tier';
    if (level === 'mild') return 'Mild Support Tier';
    return 'Moderate Support Tier';
  }

  syncProfileSummaryCard(overrideStudent = null) {
    const profile = overrideStudent || this.previewStudentProfile || window.iepStorage.getProfile();
    const heroName = document.getElementById('home-profile-name');
    const heroAvatar = document.getElementById('home-profile-avatar');
    const heroTier = document.getElementById('home-profile-tier');
    if (heroName) heroName.textContent = profile.name || 'Student';
    if (heroAvatar && profile.avatar) heroAvatar.textContent = profile.avatar;
    if (heroTier) heroTier.textContent = this.formatTierLabel(profile.level);
  }

  updateLearnerHeader(overrideStudent = null) {
    const profile = overrideStudent || this.previewStudentProfile || window.iepStorage.getProfile();
    const displayNameEl = document.getElementById('display-student-name');
    const welcomeNameEl = document.getElementById('welcome-name');
    const avatarIconEl = document.getElementById('student-avatar-icon');

    if (displayNameEl) displayNameEl.textContent = profile.name;
    if (welcomeNameEl) welcomeNameEl.textContent = profile.name;
    if (avatarIconEl && profile.avatar) avatarIconEl.textContent = profile.avatar;
    this.syncProfileSummaryCard(profile);
  }

  updateStarsDisplay() {
    const stars = window.iepStorage.getStars();
    const starEl = document.getElementById('star-count');
    if (starEl) starEl.textContent = stars;
  }
}

window.app = new AppController();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
