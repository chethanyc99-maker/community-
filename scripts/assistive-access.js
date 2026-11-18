/**
 * assistive-access.js - Prerana Assistive Motor & Access Engine
 * Implements:
 * 1. Single-Switch Scanning Access (for motor impairments & single-key assistive devices)
 * 2. Dwell-Clicking Selection (for eye-tracking, head-pointers, and tremors)
 */

class AssistiveAccessEngine {
  constructor() {
    this.isScanning = false;
    this.scanInterval = null;
    this.scanSpeedMs = 2200;
    this.currentIndex = -1;
    this.focusableElements = [];

    this.isDwellActive = false;
    this.dwellTimeout = null;
    this.dwellDurationMs = 1500;
    this.currentDwellTarget = null;
    this.dwellOverlay = null;

    this.init();
  }

  init() {
    this.createDwellIndicator();
    this.bindGlobalKeyboard();
    this.restorePreferences();
  }

  createDwellIndicator() {
    if (document.getElementById('assistive-dwell-circle')) return;
    const ring = document.createElement('div');
    ring.id = 'assistive-dwell-circle';
    ring.className = 'assistive-dwell-ring hidden';
    ring.innerHTML = `<svg width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="18" class="dwell-bg"></circle>
      <circle cx="22" cy="22" r="18" class="dwell-fill"></circle>
    </svg>`;
    document.body.appendChild(ring);
    this.dwellOverlay = ring;
  }

  bindGlobalKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Spacebar or Enter triggers currently scanned element when Switch Access is enabled
      if (this.isScanning && (e.code === 'Space' || e.key === ' ' || e.code === 'Enter')) {
        // Prevent default spacebar page scrolling
        e.preventDefault();
        this.activateCurrentScannedElement();
      }
    });

    // Touching anywhere on screen in switch mode also activates the element
    window.addEventListener('pointerdown', (e) => {
      if (this.isScanning && e.target.classList.contains('switch-scan-screen-tap')) {
        e.preventDefault();
        this.activateCurrentScannedElement();
      }
    });

    // Dwell event listeners
    document.addEventListener('pointerover', (e) => {
      if (!this.isDwellActive) return;
      const target = e.target.closest('button, .clickable, .activity-card, .drawer-nav-item, .choice-btn, .shape-card');
      if (target && target !== this.currentDwellTarget) {
        this.startDwell(target, e);
      }
    });

    document.addEventListener('pointerout', (e) => {
      if (!this.isDwellActive) return;
      if (this.currentDwellTarget && !this.currentDwellTarget.contains(e.relatedTarget)) {
        this.cancelDwell();
      }
    });
  }

  // =========================================================================
  // SINGLE-SWITCH SCANNING LOGIC
  // =========================================================================

  toggleScanning(enable = null) {
    this.isScanning = enable !== null ? enable : !this.isScanning;
    localStorage.setItem('prerana_assistive_scan', this.isScanning ? '1' : '0');

    if (this.isScanning) {
      document.body.classList.add('assistive-scan-active');
      window.soundFx?.playChime?.(660);
      window.speechAssistant?.speak?.('Switch access scanning enabled. Press spacebar or enter to select.', true);
      this.refreshScanElements();
      this.startScanLoop();
    } else {
      document.body.classList.remove('assistive-scan-active');
      this.stopScanLoop();
      this.clearScanHighlights();
      window.speechAssistant?.speak?.('Switch scanning disabled.', true);
    }
    return this.isScanning;
  }

  refreshScanElements() {
    // Collect visible interactive buttons & options
    const candidates = Array.from(document.querySelectorAll(
      '#view-home:not(.hidden) .activity-card, ' +
      '#view-play:not(.hidden) .choice-btn, ' +
      '#view-play:not(.hidden) .shape-card, ' +
      '#view-play:not(.hidden) .btn-choice, ' +
      '#view-play:not(.hidden) #btn-play-sound, ' +
      '#nav-menu-drawer.open .drawer-nav-item, ' +
      '.btn-liquid-switch, .liquid-btn-primary'
    ));

    this.focusableElements = candidates.filter(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    });

    if (this.currentIndex >= this.focusableElements.length) {
      this.currentIndex = 0;
    }
  }

  startScanLoop() {
    this.stopScanLoop();
    if (this.focusableElements.length === 0) {
      this.refreshScanElements();
    }
    this.highlightNextElement();
    this.scanInterval = setInterval(() => {
      this.refreshScanElements();
      this.highlightNextElement();
    }, this.scanSpeedMs);
  }

  stopScanLoop() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  highlightNextElement() {
    this.clearScanHighlights();
    if (!this.focusableElements.length) return;

    this.currentIndex = (this.currentIndex + 1) % this.focusableElements.length;
    const el = this.focusableElements[this.currentIndex];
    if (el) {
      el.classList.add('assistive-focus-scan');
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      // Soft audio feedback of scan tick
      window.soundFx?.playChime?.(440);
    }
  }

  clearScanHighlights() {
    document.querySelectorAll('.assistive-focus-scan').forEach(el => {
      el.classList.remove('assistive-focus-scan');
    });
  }

  activateCurrentScannedElement() {
    if (!this.focusableElements.length || this.currentIndex < 0) return;
    const el = this.focusableElements[this.currentIndex];
    if (el) {
      el.classList.add('assistive-scan-selected');
      setTimeout(() => el.classList.remove('assistive-scan-selected'), 300);
      window.soundFx?.playSuccess?.();
      el.click();
    }
  }

  // =========================================================================
  // DWELL SELECTION (EYE-TRACKING & HOVER) LOGIC
  // =========================================================================

  toggleDwell(enable = null) {
    this.isDwellActive = enable !== null ? enable : !this.isDwellActive;
    localStorage.setItem('prerana_assistive_dwell', this.isDwellActive ? '1' : '0');

    if (this.isDwellActive) {
      document.body.classList.add('assistive-dwell-active');
      window.speechAssistant?.speak?.('Dwell selection enabled. Hold cursor over an option to choose it.', true);
    } else {
      document.body.classList.remove('assistive-dwell-active');
      this.cancelDwell();
      window.speechAssistant?.speak?.('Dwell selection disabled.', true);
    }
    return this.isDwellActive;
  }

  startDwell(target, ev) {
    this.cancelDwell();
    this.currentDwellTarget = target;

    const rect = target.getBoundingClientRect();
    if (this.dwellOverlay) {
      this.dwellOverlay.style.top = `${rect.top + (rect.height / 2) - 22}px`;
      this.dwellOverlay.style.left = `${rect.left + (rect.width / 2) - 22}px`;
      this.dwellOverlay.classList.remove('hidden', 'animating');
      void this.dwellOverlay.offsetWidth; // Trigger reflow
      this.dwellOverlay.classList.add('animating');
    }

    this.dwellTimeout = setTimeout(() => {
      if (this.currentDwellTarget) {
        window.soundFx?.playSuccess?.();
        this.currentDwellTarget.click();
        this.cancelDwell();
      }
    }, this.dwellDurationMs);
  }

  cancelDwell() {
    if (this.dwellTimeout) {
      clearTimeout(this.dwellTimeout);
      this.dwellTimeout = null;
    }
    if (this.dwellOverlay) {
      this.dwellOverlay.classList.add('hidden');
      this.dwellOverlay.classList.remove('animating');
    }
    this.currentDwellTarget = null;
  }

  restorePreferences() {
    if (localStorage.getItem('prerana_assistive_scan') === '1') {
      this.toggleScanning(true);
    }
    if (localStorage.getItem('prerana_assistive_dwell') === '1') {
      this.toggleDwell(true);
    }
  }
}

window.assistiveAccess = new AssistiveAccessEngine();
