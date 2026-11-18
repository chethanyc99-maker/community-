/**
 * i18n.js - Prerana Tri-Lingual Localization & Regional Speech Engine
 * Supports: English (en), Kannada (kn - ಕನ್ನಡ), and Hindi (hi - हिन्दी)
 */

class I18nEngine {
  constructor() {
    this.currentLang = localStorage.getItem('prerana_lang') || 'en';
    this.translations = {
      en: {
        code: 'en',
        name: 'English',
        speechLang: 'en-IN',
        appTitle: 'Prerana',
        appSub: 'ASSISTIVE LEARNING',
        voice: 'Voice',
        contrast: 'Contrast',
        signOut: 'Sign Out',
        openMenu: 'Open Menu',
        navActivities: 'View Activities',
        navActivitiesSub: 'Play & learn',
        navProfile: 'My Profile',
        navProfileSub: 'Avatar & info',
        navAchievements: 'View Achievements',
        navAchievementsSub: 'Badges & stars',
        navProgress: 'My Progress',
        navProgressSub: 'Weekly milestones',
        navRewards: 'Daily Rewards',
        navRewardsSub: 'Claim daily gift',
        navDailyPlan: 'Daily Activities',
        navDailyPlanSub: 'Daily game plan',
        navFavorites: 'My Favorites',
        navFavoritesSub: 'Saved games',
        navSettings: 'Accessibility Settings',
        navSettingsSub: 'Sound, switch & contrast',
        navTeacher: 'Teacher Dashboard',
        navTeacherSub: 'Educator view',
        welcomeBack: 'Welcome back',
        chooseActivity: 'Choose an activity to play!',
        praiseGoodJob: 'Good job!',
        praiseAwesome: 'Awesome! You got it right!',
        tryAgain: 'Try again! You can do it!',
        switchScan: 'Single-Switch Scanning',
        dwellClick: 'Eye-Tracking / Dwell Selection',
        customLessons: 'Educator Custom Lessons',
        pictureLogin: 'Picture Login'
      },
      kn: {
        code: 'kn',
        name: 'ಕನ್ನಡ',
        speechLang: 'kn-IN',
        appTitle: 'ಪ್ರೇರಣಾ',
        appSub: 'ಸಹಾಯಕ ಕಲಿಕೆ',
        voice: 'ಧ್ವನಿ',
        contrast: 'ಬಣ್ಣ ಬದಲಾವಣೆ',
        signOut: 'ನಿರ್ಗಮಿಸಿ',
        openMenu: 'ಮೆನು ತೆರೆಯಿರಿ',
        navActivities: 'ಕಲಿಕಾ ಆಟಗಳು',
        navActivitiesSub: 'ಆಡಿ ಕಲಿಯಿರಿ',
        navProfile: 'ನನ್ನ ಪ್ರೊಫೈಲ್',
        navProfileSub: 'ಚಿಹ್ನೆ ಮತ್ತು ಮಾಹಿತಿ',
        navAchievements: 'ಸಾಧನೆಗಳು',
        navAchievementsSub: 'ನಕ್ಷತ್ರಗಳು ಮತ್ತು ಬ್ಯಾಡ್ಜ್‌ಗಳು',
        navProgress: 'ನನ್ನ ಪ್ರಗತಿ',
        navProgressSub: 'ವಾರದ ಪ್ರಗತಿ',
        navRewards: 'ದೈನಂದಿನ ಉಡುಗೊರೆ',
        navRewardsSub: 'ಉಡುಗೊರೆ ಪಡೆಯಿರಿ',
        navDailyPlan: 'ದೈನಂದಿನ ಆಟಗಳು',
        navDailyPlanSub: 'ದಿನದ ಯೋಜನೆ',
        navFavorites: 'ಮೆಚ್ಚಿನ ಆಟಗಳು',
        navFavoritesSub: 'ಉಳಿಸಿದ ಆಟಗಳು',
        navSettings: 'ಪ್ರವೇಶಿಸುವಿಕೆ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
        navSettingsSub: 'ಧ್ವನಿ, ಸ್ವಿಚ್ ಮತ್ತು ಕಾಂಟ್ರಾಸ್ಟ್',
        navTeacher: 'ಶಿಕ್ಷಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
        navTeacherSub: 'ಶಿಕ್ಷಕರ ವೀಕ್ಷಣೆ',
        welcomeBack: 'ಸ್ವಾಗತ',
        chooseActivity: 'ಕಲಿಯಲು ಆಟವನ್ನು ಆರಿಸಿ!',
        praiseGoodJob: 'ತುಂಬಾ ಒಳ್ಳೆಯದು!',
        praiseAwesome: 'ಅದ್ಭುತ! ಸರಿಯಾದ ಉತ್ತರ!',
        tryAgain: 'ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ! ನೀವು ಮಾಡಬಲ್ಲಿರಿ!',
        switchScan: 'ಸಿಂಗಲ್-ಸ್ವಿಚ್ ಸ್ಕ್ಯಾನಿಂಗ್',
        dwellClick: 'ಕಣ್ಣಿನ ಟ್ರ್ಯಾಕಿಂಗ್ / ಡ್ವೆಲ್ ಆಯ್ಕೆ',
        customLessons: 'ಶಿಕ್ಷಕರ ಕಸ್ಟಮ್ ಪಾಠಗಳು',
        pictureLogin: 'ಚಿತ್ರದ ಲಾಗಿನ್'
      },
      hi: {
        code: 'hi',
        name: 'हिन्दी',
        speechLang: 'hi-IN',
        appTitle: 'प्रेरणा',
        appSub: 'सहायक शिक्षण',
        voice: 'आवाज़',
        contrast: 'कंट्रास्ट',
        signOut: 'लॉग आउट',
        openMenu: 'मेनू खोलें',
        navActivities: 'कक्षा गतिविधियाँ',
        navActivitiesSub: 'खेलें और सीखें',
        navProfile: 'मेरी प्रोफ़ाइल',
        navProfileSub: 'अवतार और विवरण',
        navAchievements: 'उपलब्धियां',
        navAchievementsSub: 'सितारे और बैज',
        navProgress: 'मेरी प्रगति',
        navProgressSub: 'साप्ताहिक मील के पत्थर',
        navRewards: 'दैनिक पुरस्कार',
        navRewardsSub: 'दैनिक उपहार लें',
        navDailyPlan: 'दैनिक योजना',
        navDailyPlanSub: 'आज का गेम प्लान',
        navFavorites: 'पसंदीदा खेल',
        navFavoritesSub: 'सुरक्षित खेल',
        navSettings: 'एक्सेसिबिलिटी सेटिंग्स',
        navSettingsSub: 'ध्वनि, स्विच और कंट्रास्ट',
        navTeacher: 'शिक्षक डैशबोर्ड',
        navTeacherSub: 'शिक्षक पोर्टल',
        welcomeBack: 'नमस्ते',
        chooseActivity: 'खेलने के लिए एक गतिविधि चुनें!',
        praiseGoodJob: 'बहुत बढ़िया!',
        praiseAwesome: 'शाबाश! बिल्कुल सही उत्तर!',
        tryAgain: 'फिर से कोशिश करें! आप कर सकते हैं!',
        switchScan: 'सिंगल-स्विच स्कैनिंग',
        dwellClick: 'आई-ट्रैकिंग / ड्वेल चयन',
        customLessons: 'शिक्षक कस्टम पाठ',
        pictureLogin: 'चित्र लॉगिन'
      }
    };
  }

  setLanguage(langCode) {
    if (!this.translations[langCode]) return;
    this.currentLang = langCode;
    localStorage.setItem('prerana_lang', langCode);

    // Apply translations across UI
    this.applyTranslations();

    // Voice announcement in selected language
    const langObj = this.translations[langCode];
    if (window.speechAssistant) {
      window.speechAssistant.lang = langObj.speechLang;
      window.speechAssistant.speak(langObj.welcomeBack, true);
    }
  }

  t(key, fallback = '') {
    const dict = this.translations[this.currentLang] || this.translations.en;
    return dict[key] || this.translations.en[key] || fallback;
  }

  applyTranslations() {
    const dict = this.translations[this.currentLang];
    if (!dict) return;

    // Update Top Navigation Bar Text
    const voiceText = document.querySelector('#btn-toggle-voice .pill-label');
    if (voiceText) voiceText.textContent = dict.voice;

    const contrastText = document.querySelector('#btn-toggle-contrast .pill-label');
    if (contrastText) contrastText.textContent = dict.contrast;

    const signOutText = document.querySelector('#btn-sign-out .pill-label');
    if (signOutText) signOutText.textContent = dict.signOut;

    // Update Drawer Navigation Items
    const drawerMapping = [
      { tab: 'activities', title: dict.navActivities, sub: dict.navActivitiesSub },
      { tab: 'profile', title: dict.navProfile, sub: dict.navProfileSub },
      { tab: 'achievements', title: dict.navAchievements, sub: dict.navAchievementsSub },
      { tab: 'progress', title: dict.navProgress, sub: dict.navProgressSub },
      { tab: 'rewards', title: dict.navRewards, sub: dict.navRewardsSub },
      { tab: 'daily-plan', title: dict.navDailyPlan, sub: dict.navDailyPlanSub },
      { tab: 'favorites', title: dict.navFavorites, sub: dict.navFavoritesSub },
      { tab: 'settings', title: dict.navSettings, sub: dict.navSettingsSub },
      { tab: 'teacher', title: dict.navTeacher, sub: dict.navTeacherSub }
    ];

    drawerMapping.forEach(item => {
      const btn = document.querySelector(`.drawer-nav-item[data-dash-tab="${item.tab}"]`);
      if (btn) {
        const titleEl = btn.querySelector('.drawer-item-title');
        const subEl = btn.querySelector('.drawer-item-sub');
        if (titleEl) titleEl.textContent = item.title;
        if (subEl) subEl.textContent = item.sub;
      }
    });

    // Update Active Language Selector Dropdown or Buttons
    const langSelect = document.getElementById('select-app-language');
    if (langSelect && langSelect.value !== this.currentLang) {
      langSelect.value = this.currentLang;
    }
  }
}

window.i18n = new I18nEngine();
