/**
 * Prerana Secure Storage & Authentication Engine
 * Manages separate Student and Teacher accounts, user registration, active sessions, and IEP logs.
 */
class IEPStorageEngine {
  constructor() {
    this.accountsKey = 'prerana_user_accounts_v3';
    this.sessionKey = 'prerana_auth_session_v3';
    this.logsKey = 'prerana_activity_logs_v2';
    this.notesKey = 'prerana_educator_notes_v2';
    this.sessionStartTime = Date.now();

    this.initDefaultAccounts();
  }

  initDefaultAccounts() {
    const existing = localStorage.getItem(this.accountsKey);
    if (!existing) {
      const defaultAccounts = [
        // Default Students (matching MySQL pre-seeded accounts)
        {
          id: 'stu_1',
          role: 'student',
          username: 'student',
          email: 'student@prerana.edu',
          name: 'Arjun Kumar',
          pin: 'student123',
          avatar: '🌟',
          level: 'moderate',
          disability: 'Down Syndrome / Mild Cognitive Delay',
          stars: 5
        },
        {
          id: 'stu_2',
          role: 'student',
          username: 'priya',
          email: 'priya@prerana.edu',
          name: 'Priya Sharma',
          pin: 'student123',
          avatar: '🦋',
          level: 'mild',
          disability: 'Autism Spectrum Disorder (ASD)',
          stars: 8
        },
        {
          id: 'stu_3',
          role: 'student',
          username: 'rohan',
          email: 'rohan@prerana.edu',
          name: 'Rohan Patel',
          pin: 'student123',
          avatar: '🦁',
          level: 'high',
          disability: 'Intellectual & Motor Coordination Delay',
          stars: 3
        },
        // Default Teacher
        {
          id: 'tea_1',
          role: 'teacher',
          username: 'teacher',
          email: 'teacher@prerana.edu',
          name: 'Mrs. Sunita Sharma',
          password: 'teacher123',
          avatar: '👩‍🏫',
          specialization: 'Special Educator & Speech Therapist'
        },
        // Default Admin
        {
          id: 'adm_1',
          role: 'admin',
          username: 'admin',
          email: 'admin@prerana.edu',
          name: 'Dr. Ramesh Administrator',
          password: 'admin123',
          avatar: '🛡️',
          specialization: 'Center Director & IT Administrator'
        }
      ];
      localStorage.setItem(this.accountsKey, JSON.stringify(defaultAccounts));
    }
  }

  getAccounts() {
    try {
      return JSON.parse(localStorage.getItem(this.accountsKey)) || [];
    } catch {
      return [];
    }
  }

  saveAccounts(accounts) {
    localStorage.setItem(this.accountsKey, JSON.stringify(accounts));
  }

  // Authentication: Check credentials
  authenticateUser({ identifier, password, role }) {
    const accounts = this.getAccounts();
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const user = accounts.find(acc => {
      if (acc.role !== role) return false;
      const matchUsername = (acc.username || '').toLowerCase() === cleanId;
      const matchEmail = (acc.email || '').toLowerCase() === cleanId;
      const matchName = (acc.name || '').toLowerCase() === cleanId;
      const pass = acc.pin || acc.password || '1234';
      return (matchUsername || matchEmail || matchName) && pass === cleanPass;
    });

    if (user) {
      this.setActiveSession(user);
      return { success: true, user };
    }
    return { success: false, message: 'Invalid credentials. Please check your username and password/PIN.' };
  }

  // Registration: Create new student or teacher account
  registerAccount({ role, name, username, email, password, avatar, level, disability, specialization }) {
    const accounts = this.getAccounts();
    const cleanUser = (username || name || '').trim().toLowerCase().replace(/\s+/g, '_');

    // Check if username already exists
    const exists = accounts.find(a => (a.username || '').toLowerCase() === cleanUser || (email && (a.email || '').toLowerCase() === email.toLowerCase()));
    if (exists) {
      return { success: false, message: 'An account with this username or email already exists. Please choose another.' };
    }

    const newAccount = {
      id: (role === 'student' ? 'stu_' : 'tea_') + Date.now(),
      role,
      name: name.trim(),
      username: cleanUser,
      createdAt: new Date().toISOString()
    };

    if (role === 'student') {
      newAccount.pin = (password || '1234').trim();
      newAccount.avatar = avatar || '🌟';
      newAccount.level = level || 'moderate';
      newAccount.disability = disability || 'Special Needs';
      newAccount.stars = 0;
    } else {
      newAccount.email = (email || `${cleanUser}@school.edu`).trim();
      newAccount.password = (password || '1234').trim();
      newAccount.specialization = specialization || 'Special Education';
    }

    accounts.push(newAccount);
    this.saveAccounts(accounts);
    this.setActiveSession(newAccount);
    return { success: true, user: newAccount };
  }

  // Active Session
  getActiveSession() {
    try {
      const raw = localStorage.getItem(this.sessionKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null; // Not logged in by default
  }

  // Alias for backward compatibility
  getActiveUser() {
    return this.getActiveSession();
  }

  setActiveSession(user) {
    localStorage.setItem(this.sessionKey, JSON.stringify(user));
  }

  // Alias for backward compatibility
  setActiveUser(user) {
    this.setActiveSession(user);
  }

  logout() {
    localStorage.removeItem(this.sessionKey);
  }

  // Sync user object from Flask/MySQL backend
  syncUserFromBackend(backendUser) {
    if (!backendUser) return null;
    const accounts = this.getAccounts();
    const cleanUser = (backendUser.username || '').toLowerCase();
    const cleanEmail = (backendUser.email || '').toLowerCase();
    const dbId = backendUser.id;

    // Check if user is already in local accounts roster
    let existing = accounts.find(a => 
      (a.dbId && a.dbId === dbId) ||
      (a.username && a.username.toLowerCase() === cleanUser) ||
      (a.email && a.email.toLowerCase() === cleanEmail)
    );

    const normalized = {
      id: existing ? existing.id : `user_${dbId}`,
      dbId: dbId,
      role: backendUser.role || 'student',
      name: backendUser.full_name || backendUser.name || 'Learner',
      username: backendUser.username || cleanUser,
      email: backendUser.email || cleanEmail,
      avatar: backendUser.avatar || '🌟',
      level: backendUser.support_tier || 'moderate',
      disability: backendUser.special_needs || 'Special Needs Support',
      stars: existing ? (existing.stars || 0) : 5
    };

    if (existing) {
      Object.assign(existing, normalized);
    } else {
      accounts.push(normalized);
    }

    this.saveAccounts(accounts);
    this.setActiveSession(normalized);
    return normalized;
  }

  // Sync list of students from Flask /api/dashboard/teacher
  syncStudentsFromBackend(backendStudents) {
    if (!Array.isArray(backendStudents)) return;
    const accounts = this.getAccounts();
    const teachersAndAdmins = accounts.filter(a => a.role !== 'student');
    const existingStudents = accounts.filter(a => a.role === 'student');

    const syncedStudents = backendStudents.map(bs => {
      const match = existingStudents.find(s => 
        (s.dbId && s.dbId === bs.id) ||
        (s.username && s.username.toLowerCase() === (bs.username || '').toLowerCase()) ||
        (s.email && s.email.toLowerCase() === (bs.email || '').toLowerCase())
      );
      return {
        id: match ? match.id : `stu_db_${bs.id}`,
        dbId: bs.id,
        role: 'student',
        name: bs.full_name || 'Student',
        username: bs.username || '',
        email: bs.email || '',
        avatar: bs.avatar || '🌟',
        level: bs.support_tier || 'moderate',
        disability: bs.special_needs || 'Special Education',
        stars: typeof bs.stars === 'number' ? bs.stars : (match ? (match.stars || 0) : 5),
        score: typeof bs.score === 'number' ? bs.score : 0,
        completedActivities: typeof bs.completed_activities === 'number' ? bs.completed_activities : 0
      };
    });

    this.saveAccounts([...teachersAndAdmins, ...syncedStudents]);
  }

  // ============================================================================
  // Upgraded Dashboard State, Difficulty & MySQL Progress Sync
  // ============================================================================

  _getDefaultDashboardState() {
    return {
      stars: this.getProfile().stars || 5,
      score: 0,
      difficulty: this.getDifficultyLevel(),
      favorites: ['alphabet', 'numbers'],
      achievements: [],
      achievements_catalog: [],
      daily_streak: 0,
      last_reward_date: null,
      reward_claimed_today: false,
      completed_today: [],
      settings: {
        voiceEnabled: true,
        soundEnabled: true,
        voiceRate: 0.85,
        highContrast: false,
        dyslexicFont: false,
        reducedMotion: false,
        textSize: 'normal'
      },
      summary: { total_activities: 0, first_try_rate: 100, modules_explored: 0 },
      progress: {},
      logs: []
    };
  }

  getDashboardState() {
    if (!this.dashboardState) {
      try {
        const cached = JSON.parse(localStorage.getItem('prerana_dashboard_cache_v1') || 'null');
        this.dashboardState = cached || this._getDefaultDashboardState();
      } catch {
        this.dashboardState = this._getDefaultDashboardState();
      }
    }
    return this.dashboardState;
  }

  applyDashboardState(dashboard) {
    if (!dashboard || typeof dashboard !== 'object') return this.getDashboardState();
    this.dashboardState = { ...this._getDefaultDashboardState(), ...dashboard };
    try {
      localStorage.setItem('prerana_dashboard_cache_v1', JSON.stringify(this.dashboardState));
      if (dashboard.difficulty) {
        localStorage.setItem('prerana_difficulty_override', dashboard.difficulty);
      }
    } catch {}

    // Keep active student profile stars and mapped support tier synced
    const profile = this.getProfile();
    const diffToTier = { easy: 'high', medium: 'moderate', advanced: 'mild' };
    let profileChanged = false;
    if (typeof dashboard.stars === 'number') {
      profile.stars = dashboard.stars;
      profileChanged = true;
    }
    if (dashboard.difficulty && diffToTier[dashboard.difficulty] && this.getActiveSession()?.role === 'student') {
      profile.level = diffToTier[dashboard.difficulty];
      profileChanged = true;
    }
    if (profileChanged) {
      this.saveProfile(profile);
    }

    window.dispatchEvent(new CustomEvent('prerana:dashboard-updated', { detail: this.dashboardState }));
    return this.dashboardState;
  }

  async fetchDashboardData() {
    try {
      const res = await fetch('/api/student/dashboard-data', { credentials: 'same-origin' });
      const data = await res.json();
      if (res.ok && data.success && data.dashboard) {
        return this.applyDashboardState(data.dashboard);
      }
    } catch (e) {
      console.warn('[Prerana] Offline dashboard fallback:', e);
    }
    return this.getDashboardState();
  }

  getDifficultyLevel() {
    const state = this.dashboardState;
    if (state && ['easy', 'medium', 'advanced'].includes(state.difficulty)) {
      return state.difficulty;
    }
    const override = localStorage.getItem('prerana_difficulty_override');
    if (['easy', 'medium', 'advanced'].includes(override)) {
      return override;
    }
    const tier = (this.getProfile().level || 'moderate').toLowerCase();
    if (tier === 'high' || tier === 'easy') return 'easy';
    if (tier === 'mild' || tier === 'advanced') return 'advanced';
    return 'medium';
  }

  async saveSettingsRemote(settingsPatch = {}, difficulty = null) {
    const state = this.getDashboardState();
    if (difficulty && ['easy', 'medium', 'advanced'].includes(difficulty)) {
      state.difficulty = difficulty;
      localStorage.setItem('prerana_difficulty_override', difficulty);
    }
    if (settingsPatch && typeof settingsPatch === 'object') {
      state.settings = { ...state.settings, ...settingsPatch };
    }
    this.dashboardState = state;
    try {
      localStorage.setItem('prerana_dashboard_cache_v1', JSON.stringify(state));
    } catch {}

    try {
      const res = await fetch('/api/student/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ difficulty: state.difficulty, settings: state.settings })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        state.difficulty = data.difficulty;
        state.settings = data.settings;
        this.applyDashboardState(state);
        return { ok: true, state };
      }
    } catch (e) {
      console.warn('[Prerana] Offline settings save fallback:', e);
    }
    window.dispatchEvent(new CustomEvent('prerana:dashboard-updated', { detail: state }));
    return { ok: false, state };
  }

  async toggleFavoriteRemote(moduleKey) {
    const state = this.getDashboardState();
    const exists = state.favorites.includes(moduleKey);
    state.favorites = exists
      ? state.favorites.filter(k => k !== moduleKey)
      : [...state.favorites, moduleKey];
    this.dashboardState = state;
    window.dispatchEvent(new CustomEvent('prerana:dashboard-updated', { detail: state }));

    try {
      const res = await fetch('/api/student/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ module_key: moduleKey })
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.favorites)) {
        state.favorites = data.favorites;
        this.applyDashboardState(state);
      }
    } catch (e) {
      console.warn('[Prerana] Offline favorite fallback:', e);
    }
    return state.favorites;
  }

  async claimDailyRewardRemote() {
    try {
      const res = await fetch('/api/student/daily-reward', {
        method: 'POST',
        credentials: 'same-origin'
      });
      const data = await res.json();
      if (data.dashboard) {
        this.applyDashboardState(data.dashboard);
      }
      return { ok: Boolean(res.ok && data.success), message: data.message || '', dashboard: data.dashboard };
    } catch (e) {
      return { ok: false, message: 'Connect to server to claim Daily Reward.' };
    }
  }

  _inferModuleKey(moduleName) {
    const name = (moduleName || '').toLowerCase();
    const pairs = [
      ['alphabet', 'alphabet'],
      ['number', 'numbers'],
      ['count', 'counting'],
      ['animal', 'animals'],
      ['fruit', 'fruits'],
      ['vegetable', 'fruits'],
      ['body', 'bodyparts'],
      ['safety', 'safety'],
      ['hygiene', 'hygiene'],
      ['memory', 'memory'],
      ['social', 'social'],
      ['communication', 'communication'],
      ['music', 'music'],
      ['rhyme', 'music'],
      ['time', 'timecalendar'],
      ['calendar', 'timecalendar'],
      ['shape', 'shapes'],
      ['daily', 'daily'],
      ['emotion', 'emotions'],
      ['feel', 'emotions'],
      ['sound', 'sounds'],
      ['calm', 'calming'],
      ['bubble', 'calming']
    ];
    for (const [needle, key] of pairs) {
      if (name.includes(needle)) return key;
    }
    return name.replace(/[^a-z0-9]+/g, '_').slice(0, 40) || 'general';
  }

  // Helpers for Active Student
  getProfile() {
    const session = this.getActiveSession();
    if (session && session.role === 'student') {
      const accounts = this.getAccounts();
      const fresh = accounts.find(a => a.id === session.id || (session.dbId && a.dbId === session.dbId));
      return fresh || session;
    }
    return {
      id: 'stu_1',
      name: 'Arjun Kumar',
      avatar: '🌟',
      level: 'moderate'
    };
  }

  saveProfile(updated) {
    const accounts = this.getAccounts();
    const idx = accounts.findIndex(a => a.id === updated.id || (updated.dbId && a.dbId === updated.dbId));
    if (idx !== -1) {
      accounts[idx] = { ...accounts[idx], ...updated };
      this.saveAccounts(accounts);
    }
    const session = this.getActiveSession();
    if (session && (session.id === updated.id || (updated.dbId && session.dbId === updated.dbId))) {
      this.setActiveSession({ ...session, ...updated });
    }
  }

  getStudents() {
    return this.getAccounts().filter(a => a.role === 'student');
  }

  saveStudents(students) {
    const teachers = this.getAccounts().filter(a => a.role !== 'student');
    this.saveAccounts([...teachers, ...students]);
  }

  addStudent({ name, avatar, level, disability, pin = '1234' }) {
    return this.registerAccount({
      role: 'student',
      name,
      avatar,
      level,
      disability,
      password: pin
    });
  }

  deleteStudent(id) {
    let accounts = this.getAccounts();
    accounts = accounts.filter(a => a.id !== id);
    this.saveAccounts(accounts);
  }

  getStars() {
    const profile = this.getProfile();
    return typeof profile.stars === 'number' ? profile.stars : 0;
  }

  addStar(count = 1) {
    const profile = this.getProfile();
    const newStars = (profile.stars || 0) + count;
    profile.stars = newStars;
    this.saveProfile(profile);
    if (this.dashboardState) {
      this.dashboardState.stars = newStars;
    }
    return newStars;
  }

  getLogs() {
    try {
      return JSON.parse(localStorage.getItem(this.logsKey)) || [];
    } catch {
      return [];
    }
  }

  recordActivity({ moduleName, moduleKey = null, objective, success = true, attempts = 1, responseTimeMs = 1000, difficulty = null, starsEarned = 1, score = null }) {
    const resolvedKey = moduleKey || this._inferModuleKey(moduleName);
    const resolvedDifficulty = difficulty || this.getDifficultyLevel();
    const resolvedScore = typeof score === 'number' ? score : (success && attempts === 1 ? 15 : 10);

    const logs = this.getLogs();
    const profile = this.getProfile();
    const entry = {
      id: Date.now().toString(),
      studentName: profile.name,
      studentId: profile.id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      moduleKey: resolvedKey,
      moduleName,
      objective,
      difficulty: resolvedDifficulty,
      status: success ? 'First-Try Success' : 'Completed with Guidance',
      attempts: attempts || 1,
      responseTimeSec: Math.max(1, Math.round(responseTimeMs / 1000)),
      starsEarned
    };

    logs.unshift(entry);
    if (logs.length > 200) logs.pop();

    localStorage.setItem(this.logsKey, JSON.stringify(logs));

    // Sync asynchronously to Flask + MySQL database
    this.syncActivityToBackend({
      module_key: resolvedKey,
      module_name: moduleName,
      objective,
      difficulty: resolvedDifficulty,
      success,
      attempts: attempts || 1,
      response_time_ms: responseTimeMs || 1000,
      stars_earned: starsEarned,
      score: resolvedScore
    });

    return entry;
  }

  async syncActivityToBackend(payload) {
    try {
      const res = await fetch('/api/student/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success && data.dashboard) {
        this.applyDashboardState(data.dashboard);
      }
    } catch (e) {
      console.warn('[Prerana] Activity cached offline; MySQL sync skipped:', e);
    }
  }

  getNotes() {
    return localStorage.getItem(this.notesKey) || '';
  }

  saveNotes(notes) {
    localStorage.setItem(this.notesKey, notes);
  }

  clearRecords() {
    localStorage.removeItem(this.logsKey);
  }

  getMetricsSummary(filterStudentId = null) {
    let logs = this.getLogs();
    if (filterStudentId) {
      logs = logs.filter(l => l.studentId === filterStudentId);
    }
    const totalAttempts = logs.reduce((acc, curr) => acc + curr.attempts, 0);
    const firstTrySuccesses = logs.filter(l => l.status === 'First-Try Success').length;
    const accuracy = logs.length > 0 ? Math.round((firstTrySuccesses / logs.length) * 100) : 0;
    const engagementMinutes = Math.max(1, Math.round((Date.now() - this.sessionStartTime) / 60000));

    return {
      totalTasks: logs.length,
      totalAttempts,
      accuracy,
      stars: this.getStars(),
      engagementMinutes
    };
  }

  preparePrintableReport() {
    const profile = this.getProfile();
    const summary = this.getMetricsSummary();
    const logs = this.getLogs();

    document.getElementById('print-date').textContent = new Date().toLocaleString();
    document.getElementById('print-student-name').textContent = profile.name;
    document.getElementById('print-student-level').textContent = (profile.level || 'moderate').toUpperCase();
    document.getElementById('print-student-stars').textContent = summary.stars;

    document.getElementById('print-total-tasks').textContent = summary.totalTasks;
    document.getElementById('print-accuracy').textContent = `${summary.accuracy}%`;
    document.getElementById('print-duration').textContent = `${summary.engagementMinutes} minute(s)`;

    const tbody = document.getElementById('print-table-body');
    if (!logs.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No activity trials recorded.</td></tr>`;
    } else {
      tbody.innerHTML = logs.map(l => `
        <tr>
          <td>${l.timestamp}</td>
          <td>${l.moduleName}</td>
          <td>${l.objective}</td>
          <td>${l.status}</td>
          <td>${l.attempts}</td>
          <td>${l.responseTimeSec}s</td>
        </tr>
      `).join('');
    }

    window.print();
  }

  exportIEPReport() {
    const data = {
      reportType: "Special School Individualized Education Program (IEP) Computer Learning Report",
      institution: "Special Education Center",
      generatedAt: new Date().toISOString(),
      studentProfile: this.getProfile(),
      roster: this.getStudents(),
      summary: this.getMetricsSummary(),
      activityLogs: this.getLogs(),
      teacherNotes: this.getNotes(),
      accreditationMapping: {
        po5: "Modern Tool Usage: Procedural Web Audio API, Web Speech API, HTML5 Canvas",
        po6: "The Engineer and Society: Assistive learning technology for neurodivergent learners",
        sdg4: "Quality Education: Target 4.5 & Target 4.a inclusive disability education"
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IEP_Report_${data.studentProfile.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

window.iepStorage = new IEPStorageEngine();
