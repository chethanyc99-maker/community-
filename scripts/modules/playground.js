/**
 * ============================================================================
 * Prerana Tactile Playground — Study Break & Creative Lab
 * Multi-Sensory Interactive Section for Special Education
 * 
 * Features 4 Lightweight Native HTML5 Canvas & Web Audio API Modules:
 * - MOD.01: Pocket Synth Pad (4x4 matrix, polyphonic Web Audio, live oscilloscope, 3 scales)
 * - MOD.02: Gravity Toybox (2D canvas physics sandbox, grab/drag/throw with inertia, +Drop, Zero-G)
 * - MOD.03: Kinetic Typography Lab (Custom text, 4 live sliders: Amp, Speed, Tracking, Skew)
 * - MOD.04: Magnetic Dial (Rotary encoder with magnetic detents, Mood states, live Lissajous mandala)
 *
 * Designed with strict lifecycle management: all RAF loops, ResizeObservers,
 * and AudioContext instances are cleanly destroyed on unmount.
 * ============================================================================
 */

class TactilePlaygroundModule {
  constructor() {
    this.name = "Tactile Playground";
    this.isMounted = false;

    // Lifecycle tracking collections
    this.animationFrameIds = new Set();
    this.resizeObservers = [];
    this.abortControllers = [];

    // Shared Web Audio context & nodes
    this.audioCtx = null;
    this.masterGain = null;
    this.analyserNode = null;
    this.isMuted = false;

    // Sub-module instances & state
    this.synth = null;
    this.toybox = null;
    this.kinetic = null;
    this.dial = null;
  }

  /* =========================================================================
     Lifecycle: Render
     ========================================================================= */
  render(container) {
    // Clean up any previous instance first
    this.destroy();
    this.isMounted = true;
    if (container) container.classList.add('stage-playground-active');

    container.innerHTML = `
      <div class="playground-container" id="tactile-playground-root">
        <!-- Header & Study Break Banner -->
        <header class="playground-header">
          <div class="playground-title-group">
            <div class="playground-badge-row">
              <span class="playground-tag">🧪 Sensory Creative Lab</span>
              <span class="playground-tag" style="background:#FEF3C7; color:#92400E; border-color:#FDE68A;">⚡ Study Break</span>
            </div>
            <h2 class="playground-title">Tactile Playground</h2>
            <p class="playground-subtitle">Touch, listen, throw, and create! A multi-sensory sandbox designed for relaxed focus &amp; motor coordination.</p>
          </div>
          <div class="playground-header-actions">
            <button type="button" class="mod-pill-btn" id="btn-playground-audio-toggle" title="Toggle audio sound effects">
              <span id="playground-audio-icon">🔊</span> <span id="playground-audio-label">Audio ON</span>
            </button>
            <button type="button" class="btn btn-primary mod-pill-btn active" id="btn-playground-finish" style="height:38px; padding:0 1.25rem;">
              🌸 Take a Breath &amp; Save
            </button>
          </div>
        </header>

        <!-- 2x2 Responsive Module Grid -->
        <div class="playground-grid">
          
          <!-- MOD.01: Pocket Synth Pad -->
          <section class="playground-card" id="mod-card-synth" aria-label="Pocket Synth Pad">
            <div class="card-mod-header">
              <div class="card-mod-info">
                <span class="mod-id-badge">MOD.01</span>
                <h3 class="card-mod-title">🎹 Pocket Synth Pad</h3>
                <p class="card-mod-sub">Tap or drag across the 16 pads to play notes &amp; watch the wave.</p>
              </div>
              <div class="card-mod-controls">
                <div class="scale-select-pills" id="synth-scale-pills" role="radiogroup" aria-label="Musical Scale">
                  <button type="button" class="scale-pill active" data-scale="pentatonic" role="radio" aria-checked="true">Pentatonic</button>
                  <button type="button" class="scale-pill" data-scale="minor" role="radio" aria-checked="false">Minor</button>
                  <button type="button" class="scale-pill" data-scale="lydian" role="radio" aria-checked="false">Lydian</button>
                </div>
              </div>
            </div>

            <!-- Oscilloscope Display -->
            <div class="synth-scope-container" id="synth-scope-wrapper">
              <canvas class="synth-scope-canvas" id="synth-scope-canvas"></canvas>
              <div class="synth-scope-hud" id="synth-scope-hud">OSC 440Hz</div>
            </div>

            <!-- 4x4 Pad Matrix -->
            <div class="synth-pad-matrix" id="synth-pad-grid" role="grid" aria-label="Synthesizer Pads">
              <!-- Rendered dynamically -->
            </div>
          </section>

          <!-- MOD.02: Gravity Toybox -->
          <section class="playground-card" id="mod-card-toybox" aria-label="Gravity Toybox">
            <div class="card-mod-header">
              <div class="card-mod-info">
                <span class="mod-id-badge">MOD.02</span>
                <h3 class="card-mod-title">🪐 Gravity Toybox</h3>
                <p class="card-mod-sub">Grab, fling, and bounce geometric pills with real inertia.</p>
              </div>
              <div class="card-mod-controls">
                <button type="button" class="mod-pill-btn btn-action-drop" id="btn-toybox-drop" title="Drop a new pill from the top">
                  <span>➕ DROP</span>
                </button>
                <button type="button" class="mod-pill-btn btn-action-zerog" id="btn-toybox-zerog" title="Toggle weightlessness">
                  <span id="toybox-zerog-text">ZERO-G</span>
                </button>
                <button type="button" class="mod-pill-btn" id="btn-toybox-reset" title="Reset toybox">
                  <span>🔄 Reset</span>
                </button>
              </div>
            </div>

            <div class="toybox-canvas-container" id="toybox-canvas-wrapper">
              <canvas class="toybox-canvas" id="toybox-canvas"></canvas>
              <div class="toybox-status-overlay" id="toybox-status-pill">
                <span>🟢</span> <span id="toybox-count-label">6 Capsules</span> | <span id="toybox-gravity-label">1G Active</span>
              </div>
            </div>
          </section>

          <!-- MOD.03: Kinetic Typography Lab -->
          <section class="playground-card" id="mod-card-kinetic" aria-label="Kinetic Typography Lab">
            <div class="card-mod-header">
              <div class="card-mod-info">
                <span class="mod-id-badge">MOD.03</span>
                <h3 class="card-mod-title">🔤 Kinetic Typography Lab</h3>
                <p class="card-mod-sub">Type custom words and modulate the real-time wave physics.</p>
              </div>
            </div>

            <div class="kinetic-input-bar">
              <input type="text" class="kinetic-text-input" id="input-kinetic-text" value="PRERANA" maxlength="20" placeholder="Type letters here..." autocomplete="off">
              <div class="kinetic-quick-chips">
                <button type="button" class="kinetic-chip" data-phrase="🌟 PRERANA">Prerana</button>
                <button type="button" class="kinetic-chip" data-phrase="🚀 EXPLORE">Explore</button>
                <button type="button" class="kinetic-chip" data-phrase="✨ MAGIC">Magic</button>
              </div>
            </div>

            <div class="kinetic-canvas-container" id="kinetic-canvas-wrapper">
              <canvas class="kinetic-canvas" id="kinetic-canvas"></canvas>
            </div>

            <!-- 4 Real-time Range Sliders -->
            <div class="kinetic-sliders-grid">
              <div class="kinetic-slider-item">
                <div class="slider-label-row">
                  <span>🌊 Wave Amplitude</span>
                  <span class="slider-val-badge" id="val-kinetic-amp">24px</span>
                </div>
                <input type="range" class="kinetic-range-input" id="range-kinetic-amp" min="0" max="50" value="24" step="1">
              </div>

              <div class="kinetic-slider-item">
                <div class="slider-label-row">
                  <span>⚡ Speed</span>
                  <span class="slider-val-badge" id="val-kinetic-speed">1.2x</span>
                </div>
                <input type="range" class="kinetic-range-input" id="range-kinetic-speed" min="0.2" max="3.0" value="1.2" step="0.1">
              </div>

              <div class="kinetic-slider-item">
                <div class="slider-label-row">
                  <span>↔️ Tracking (Spacing)</span>
                  <span class="slider-val-badge" id="val-kinetic-tracking">16px</span>
                </div>
                <input type="range" class="kinetic-range-input" id="range-kinetic-tracking" min="-5" max="45" value="16" step="1">
              </div>

              <div class="kinetic-slider-item">
                <div class="slider-label-row">
                  <span>📐 Skew Angle</span>
                  <span class="slider-val-badge" id="val-kinetic-skew">14°</span>
                </div>
                <input type="range" class="kinetic-range-input" id="range-kinetic-skew" min="-45" max="45" value="14" step="1">
              </div>
            </div>
          </section>

          <!-- MOD.04: Magnetic Dial & Lissajous Mandala -->
          <section class="playground-card" id="mod-card-dial" aria-label="Magnetic Dial and Lissajous Mandala">
            <div class="card-mod-header">
              <div class="card-mod-info">
                <span class="mod-id-badge">MOD.04</span>
                <h3 class="card-mod-title">🧭 Magnetic Dial</h3>
                <p class="card-mod-sub">Rotate the magnetic knob to shift Moods &amp; Lissajous mandalas.</p>
              </div>
              <div class="card-mod-controls">
                <div class="dial-meta-badges">
                  <span class="dial-meta-pill pill-mood" id="dial-mood-badge">🎯 FOCUS</span>
                  <span class="dial-meta-pill pill-ratio" id="dial-ratio-badge">RATIO 1:1</span>
                </div>
              </div>
            </div>

            <div class="dial-module-body">
              <!-- Draggable Rotary Encoder Knob -->
              <div class="dial-control-area">
                <div class="dial-encoder-wrapper" id="dial-encoder-wrapper" title="Drag clockwise or counter-clockwise">
                  <svg class="dial-ticks-ring" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r="62" fill="none" stroke="#E2E8F0" stroke-width="4"></circle>
                    <!-- 4 Magnetic Detent Ticks -->
                    <circle cx="70" cy="8" r="4" fill="#4F46E5"></circle>
                    <circle cx="132" cy="70" r="4" fill="#10B981"></circle>
                    <circle cx="70" cy="132" r="4" fill="#F59E0B"></circle>
                    <circle cx="8" cy="70" r="4" fill="#EC4899"></circle>
                  </svg>
                  <div class="dial-knob-disc" id="dial-knob-disc">
                    <div class="dial-knob-indicator"></div>
                    <div class="dial-center-cap" id="dial-angle-label">0°</div>
                  </div>
                </div>
                <div style="font-size:0.75rem; color:#64748B; font-weight:700;">Drag knob around center to snap</div>
              </div>

              <!-- Live Lissajous Mandala Canvas -->
              <div class="lissajous-canvas-container" id="lissajous-canvas-wrapper">
                <canvas class="lissajous-canvas" id="lissajous-canvas"></canvas>
                <div class="lissajous-caption" id="lissajous-formula-label">x=sin(1t), y=sin(1t)</div>
              </div>
            </div>
          </section>

        </div>
      </div>
    `;

    // Initialize Web Audio Engine
    this.initAudioEngine();

    // Initialize All 4 Sub-Modules
    this.initSynthPad();
    this.initToybox();
    this.initKineticTypography();
    this.initMagneticDial();

    // Attach Header Controls
    this.attachHeaderControls();

    // Voice Prompt
    setTimeout(() => {
      window.speechAssistant?.speak("Welcome to the Tactile Playground! Play with the sound pads, gravity toybox, dancing letters, and magnetic dial.", true);
    }, 250);
  }

  /* =========================================================================
     Lifecycle: Destroy (Memory Leak Prevention)
     ========================================================================= */
  destroy() {
    this.isMounted = false;
    const stage = document.getElementById('activity-stage');
    if (stage) stage.classList.remove('stage-playground-active');

    // 1. Cancel all active animation frame loops
    this.animationFrameIds.forEach(id => cancelAnimationFrame(id));
    this.animationFrameIds.clear();

    // 2. Disconnect all ResizeObservers
    this.resizeObservers.forEach(ro => {
      try { ro.disconnect(); } catch (e) {}
    });
    this.resizeObservers = [];

    // 3. Abort all attached pointer / event listeners
    this.abortControllers.forEach(ac => {
      try { ac.abort(); } catch (e) {}
    });
    this.abortControllers = [];

    // 4. Clean up Web Audio Context
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close().catch(() => {});
      } catch (e) {}
      this.audioCtx = null;
    }

    // 5. Clean up sub-module references
    this.synth = null;
    this.toybox = null;
    this.kinetic = null;
    this.dial = null;
  }

  /* Helper to register safe RAF loops */
  registerLoop(loopFn) {
    if (!this.isMounted) return;
    const run = (time) => {
      if (!this.isMounted) return;
      loopFn(time);
      const nextId = requestAnimationFrame(run);
      this.animationFrameIds.add(nextId);
    };
    const id = requestAnimationFrame(run);
    this.animationFrameIds.add(id);
  }

  /* Helper to create an AbortController for event listeners */
  createListenerSignal() {
    const ac = new AbortController();
    this.abortControllers.push(ac);
    return ac.signal;
  }

  /* =========================================================================
     Audio Engine Initialization
     ========================================================================= */
  initAudioEngine() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      this.audioCtx = new AudioContextClass();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);

      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 512;
      this.analyserNode.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyserNode);
      this.analyserNode.connect(this.audioCtx.destination);
    } catch (e) {
      console.warn("Playground Web Audio init error:", e);
    }
  }

  unlockAudio() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleAudio(forceState) {
    if (typeof forceState === 'boolean') {
      this.isMuted = !forceState;
    } else {
      this.isMuted = !this.isMuted;
    }

    if (this.masterGain && this.audioCtx) {
      const targetGain = this.isMuted ? 0 : 0.25;
      this.masterGain.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.04);
    }

    const icon = document.getElementById('playground-audio-icon');
    const label = document.getElementById('playground-audio-label');
    const btn = document.getElementById('btn-playground-audio-toggle');
    if (icon) icon.textContent = this.isMuted ? '🔇' : '🔊';
    if (label) label.textContent = this.isMuted ? 'Audio MUTED' : 'Audio ON';
    if (btn) btn.classList.toggle('active', !this.isMuted);
  }

  attachHeaderControls() {
    const signal = this.createListenerSignal();

    const audioBtn = document.getElementById('btn-playground-audio-toggle');
    audioBtn?.addEventListener('click', () => {
      this.unlockAudio();
      this.toggleAudio();
    }, { signal });

    const finishBtn = document.getElementById('btn-playground-finish');
    finishBtn?.addEventListener('click', () => {
      window.soundFx?.playSuccess();
      window.iepStorage?.addStar(2);
      window.app?.updateStarsDisplay();

      window.iepStorage?.recordActivity({
        moduleName: "Tactile Playground",
        objective: "Multi-Sensory Study Break & Creative Motor Exploration",
        success: true,
        attempts: 1,
        responseTimeMs: 45000
      });

      window.app?.showCelebration({
        title: "Creative Spark Earned!",
        message: "You enjoyed creative motor exploration and peaceful focus! You earned 2 bonus stars!",
        emoji: "🧪",
        onNext: () => window.app?.showHomeView(),
        onRepeat: () => {
          const stage = document.getElementById('activity-stage');
          if (stage) this.render(stage);
        }
      });
    }, { signal });
  }

  /* =========================================================================
     MOD.01: POCKET SYNTH PAD
     ========================================================================= */
  initSynthPad() {
    const signal = this.createListenerSignal();
    const padGrid = document.getElementById('synth-pad-grid');
    const scopeCanvas = document.getElementById('synth-scope-canvas');
    const scopeWrapper = document.getElementById('synth-scope-wrapper');
    const scopeHud = document.getElementById('synth-scope-hud');
    if (!padGrid || !scopeCanvas) return;

    // Musical Scale Definitions (16 notes each)
    const SCALES = {
      pentatonic: {
        name: "C Major Pentatonic",
        notes: [
          { name: "C4", freq: 261.63 }, { name: "D4", freq: 293.66 }, { name: "E4", freq: 329.63 }, { name: "G4", freq: 392.00 },
          { name: "A4", freq: 440.00 }, { name: "C5", freq: 523.25 }, { name: "D5", freq: 587.33 }, { name: "E5", freq: 659.25 },
          { name: "G5", freq: 783.99 }, { name: "A5", freq: 880.00 }, { name: "C6", freq: 1046.50 }, { name: "D6", freq: 1174.66 },
          { name: "E6", freq: 1318.51 }, { name: "G6", freq: 1567.98 }, { name: "A6", freq: 1760.00 }, { name: "C7", freq: 2093.00 }
        ]
      },
      minor: {
        name: "A Minor Pentatonic",
        notes: [
          { name: "A3", freq: 220.00 }, { name: "C4", freq: 261.63 }, { name: "D4", freq: 293.66 }, { name: "E4", freq: 329.63 },
          { name: "G4", freq: 392.00 }, { name: "A4", freq: 440.00 }, { name: "C5", freq: 523.25 }, { name: "D5", freq: 587.33 },
          { name: "E5", freq: 659.25 }, { name: "G5", freq: 783.99 }, { name: "A5", freq: 880.00 }, { name: "C6", freq: 1046.50 },
          { name: "D6", freq: 1174.66 }, { name: "E6", freq: 1318.51 }, { name: "G6", freq: 1567.98 }, { name: "A6", freq: 1760.00 }
        ]
      },
      lydian: {
        name: "F Lydian Celestial",
        notes: [
          { name: "F3", freq: 174.61 }, { name: "G3", freq: 196.00 }, { name: "A3", freq: 220.00 }, { name: "B3", freq: 246.94 },
          { name: "C4", freq: 261.63 }, { name: "D4", freq: 293.66 }, { name: "E4", freq: 329.63 }, { name: "F4", freq: 349.23 },
          { name: "G4", freq: 392.00 }, { name: "A4", freq: 440.00 }, { name: "B4", freq: 493.88 }, { name: "C5", freq: 523.25 },
          { name: "D5", freq: 587.33 }, { name: "E5", freq: 659.25 }, { name: "F5", freq: 698.46 }, { name: "G5", freq: 783.99 }
        ]
      }
    };

    let currentScaleKey = 'pentatonic';
    let isPointerDragging = false;
    let activePointerId = null;

    // Helper to render 16 pads
    const renderPads = () => {
      const scale = SCALES[currentScaleKey];
      padGrid.innerHTML = '';
      scale.notes.forEach((note, index) => {
        const row = Math.floor(index / 4);
        const pad = document.createElement('button');
        pad.type = 'button';
        pad.className = 'synth-pad';
        pad.setAttribute('data-index', index);
        pad.setAttribute('data-row', row);
        pad.setAttribute('data-freq', note.freq);
        pad.setAttribute('aria-label', `Play note ${note.name}`);
        pad.innerHTML = `
          <span class="pad-note-name">${note.name}</span>
          <span class="pad-note-octave">${Math.round(note.freq)} Hz</span>
        `;
        padGrid.appendChild(pad);
      });
    };

    renderPads();

    // Scale Switcher Pills
    document.querySelectorAll('#synth-scale-pills .scale-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const key = pill.getAttribute('data-scale');
        if (SCALES[key]) {
          currentScaleKey = key;
          document.querySelectorAll('#synth-scale-pills .scale-pill').forEach(p => {
            const isActive = p === pill;
            p.classList.toggle('active', isActive);
            p.setAttribute('aria-checked', isActive ? 'true' : 'false');
          });
          renderPads();
          if (scopeHud) scopeHud.textContent = `${SCALES[key].name}`;
          window.soundFx?.playPop();
        }
      }, { signal });
    });

    // Web Audio Voice Synthesizer Function
    const playNote = (freq, noteName) => {
      this.unlockAudio();
      if (!this.audioCtx || !this.masterGain) return;

      if (scopeHud && noteName) {
        scopeHud.textContent = `NOTE ${noteName} • ${Math.round(freq)}Hz`;
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const noteGain = this.audioCtx.createGain();

      // Warm, pleasing tone: triangle oscillator with lowpass filter
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Soft envelope: 15ms attack, exponential decay
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.32, now + 0.015);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.7);
    };

    // Pad Interaction (PointerDown + Dragging PointerEnter)
    const triggerPad = (padElement) => {
      if (!padElement) return;
      const freq = parseFloat(padElement.getAttribute('data-freq'));
      const noteName = padElement.querySelector('.pad-note-name')?.textContent || '';
      if (!isNaN(freq)) {
        playNote(freq, noteName);
        padElement.classList.add('is-pressed');
        setTimeout(() => padElement.classList.remove('is-pressed'), 180);
      }
    };

    padGrid.addEventListener('pointerdown', (e) => {
      const pad = e.target.closest('.synth-pad');
      if (pad) {
        isPointerDragging = true;
        activePointerId = e.pointerId;
        try { padGrid.setPointerCapture(e.pointerId); } catch (err) {}
        triggerPad(pad);
      }
    }, { signal });

    padGrid.addEventListener('pointermove', (e) => {
      if (!isPointerDragging) return;
      const elem = document.elementFromPoint(e.clientX, e.clientY);
      const pad = elem?.closest('.synth-pad');
      if (pad && !pad.classList.contains('is-pressed')) {
        triggerPad(pad);
      }
    }, { signal });

    const endDrag = () => {
      isPointerDragging = false;
      activePointerId = null;
    };
    window.addEventListener('pointerup', endDrag, { signal });
    window.addEventListener('pointercancel', endDrag, { signal });

    // Live Oscilloscope Visualizer
    const ctx = scopeCanvas.getContext('2d');
    const resizeScope = () => {
      if (!scopeWrapper) return;
      const rect = scopeWrapper.getBoundingClientRect();
      scopeCanvas.width = rect.width * (window.devicePixelRatio || 1);
      scopeCanvas.height = rect.height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resizeScope();

    const scopeObserver = new ResizeObserver(() => resizeScope());
    scopeObserver.observe(scopeWrapper);
    this.resizeObservers.push(scopeObserver);

    const bufferLength = this.analyserNode ? this.analyserNode.frequencyBinCount : 256;
    const dataArray = new Uint8Array(bufferLength);

    this.registerLoop(() => {
      const w = scopeCanvas.width / (window.devicePixelRatio || 1);
      const h = scopeCanvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      // Background subtle grid
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();

      if (!this.analyserNode) {
        // Idle flat line
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        return;
      }

      this.analyserNode.getByteTimeDomainData(dataArray);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#38BDF8';
      ctx.shadowColor = '#0EA5E9';
      ctx.shadowBlur = 8;
      ctx.beginPath();

      const sliceWidth = w / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(w, h / 2);
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow
    });
  }

  /* =========================================================================
     MOD.02: GRAVITY TOYBOX
     ========================================================================= */
  initToybox() {
    const signal = this.createListenerSignal();
    const canvas = document.getElementById('toybox-canvas');
    const wrapper = document.getElementById('toybox-canvas-wrapper');
    const statusPill = document.getElementById('toybox-count-label');
    const gravityPill = document.getElementById('toybox-gravity-label');
    const btnDrop = document.getElementById('btn-toybox-drop');
    const btnZeroG = document.getElementById('btn-toybox-zerog');
    const btnReset = document.getElementById('btn-toybox-reset');
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext('2d');
    let width = 400;
    let height = 290;

    const resizeCanvas = () => {
      const rect = wrapper.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * (window.devicePixelRatio || 1);
      canvas.height = height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resizeCanvas();

    const ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(wrapper);
    this.resizeObservers.push(ro);

    // Physics Engine State
    let isZeroG = false;
    let gravity = 0.42;
    const restitution = 0.75; // Bounciness
    const friction = 0.992;   // Air damping

    const COLORS = [
      { fill: '#6366F1', border: '#4338CA', label: 'Indigo' },
      { fill: '#10B981', border: '#059669', label: 'Emerald' },
      { fill: '#F59E0B', border: '#D97706', label: 'Amber' },
      { fill: '#EC4899', border: '#DB2777', label: 'Pink' },
      { fill: '#0EA5E9', border: '#0284C7', label: 'Sky' },
      { fill: '#8B5CF6', border: '#7C3AED', label: 'Purple' }
    ];

    class Pill {
      constructor(x, y, vx, vy, length, radius, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.angle = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 0.08;
        this.length = length || 42;
        this.radius = radius || 18;
        this.color = color || COLORS[Math.floor(Math.random() * COLORS.length)];
        this.mass = this.radius * 1.5;
        this.isHeld = false;
      }

      update() {
        if (this.isHeld) return;

        // Apply Gravity
        if (!isZeroG) {
          this.vy += gravity;
        }

        // Apply Friction
        this.vx *= friction;
        this.vy *= friction;
        this.vRot *= 0.985;

        // Move
        this.x += this.vx;
        this.y += this.vy;
        this.angle += this.vRot;

        // Wall collisions
        const effectiveR = this.radius + this.length * 0.35;
        if (this.x - effectiveR < 0) {
          this.x = effectiveR;
          this.vx = -this.vx * restitution;
          this.vRot += (Math.random() - 0.5) * 0.05;
        } else if (this.x + effectiveR > width) {
          this.x = width - effectiveR;
          this.vx = -this.vx * restitution;
          this.vRot += (Math.random() - 0.5) * 0.05;
        }

        if (this.y - effectiveR < 0) {
          this.y = effectiveR;
          this.vy = -this.vy * restitution;
        } else if (this.y + effectiveR > height) {
          this.y = height - effectiveR;
          this.vy = -this.vy * restitution;
          // Floor rolling friction
          this.vx *= 0.94;
          if (Math.abs(this.vy) < 0.6) this.vy = 0;
        }
      }

      draw(c) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.angle);

        const halfL = this.length / 2;
        const r = this.radius;

        // Draw Smooth Capsule
        c.beginPath();
        c.arc(-halfL, 0, r, Math.PI / 2, (Math.PI * 3) / 2);
        c.arc(halfL, 0, r, (Math.PI * 3) / 2, Math.PI / 2);
        c.closePath();

        c.fillStyle = this.color.fill;
        c.fill();
        c.lineWidth = 2.5;
        c.strokeStyle = this.isHeld ? '#FFFFFF' : this.color.border;
        c.stroke();

        // Capsule Center Dividing Line / Highlight
        c.beginPath();
        c.arc(-halfL + 6, -4, r * 0.35, 0, Math.PI * 2);
        c.fillStyle = 'rgba(255, 255, 255, 0.6)';
        c.fill();

        if (this.isHeld) {
          c.beginPath();
          c.arc(0, 0, r * 0.5, 0, Math.PI * 2);
          c.fillStyle = '#FFFFFF';
          c.fill();
        }

        c.restore();
      }

      containsPoint(px, py) {
        const dx = px - this.x;
        const dy = py - this.y;
        const dist = Math.hypot(dx, dy);
        return dist <= (this.radius + this.length * 0.45);
      }
    }

    let pills = [];
    const spawnInitialPills = () => {
      pills = [];
      for (let i = 0; i < 6; i++) {
        const p = new Pill(
          60 + i * (width > 300 ? 50 : 35),
          40 + (i % 3) * 45,
          (Math.random() - 0.5) * 4,
          Math.random() * 2,
          40 + Math.random() * 12,
          16 + Math.random() * 4,
          COLORS[i % COLORS.length]
        );
        pills.push(p);
      }
      updateCounts();
    };

    const updateCounts = () => {
      if (statusPill) statusPill.textContent = `${pills.length} Capsules`;
      if (gravityPill) gravityPill.textContent = isZeroG ? 'Zero-G Active' : '1G Active';
    };

    spawnInitialPills();

    // Toolbar Actions
    btnDrop?.addEventListener('click', () => {
      const p = new Pill(
        width * 0.2 + Math.random() * (width * 0.6),
        25,
        (Math.random() - 0.5) * 5,
        2 + Math.random() * 3,
        42,
        18,
        COLORS[Math.floor(Math.random() * COLORS.length)]
      );
      pills.push(p);
      window.soundFx?.playPop();
      updateCounts();
    }, { signal });

    btnZeroG?.addEventListener('click', () => {
      isZeroG = !isZeroG;
      btnZeroG.classList.toggle('is-zero-g', isZeroG);
      const text = document.getElementById('toybox-zerog-text');
      if (text) text.textContent = isZeroG ? 'ZERO-G [ON]' : 'ZERO-G';
      window.soundFx?.playPop();
      updateCounts();
    }, { signal });

    btnReset?.addEventListener('click', () => {
      spawnInitialPills();
      window.soundFx?.playPop();
    }, { signal });

    // Grab, Drag, and Throw Interaction
    let heldPill = null;
    let pointerTrail = []; // [{ x, y, t }]

    const getCanvasPos = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    canvas.addEventListener('pointerdown', (e) => {
      const pos = getCanvasPos(e.clientX, e.clientY);
      for (let i = pills.length - 1; i >= 0; i--) {
        const p = pills[i];
        if (p.containsPoint(pos.x, pos.y)) {
          heldPill = p;
          p.isHeld = true;
          pointerTrail = [{ x: pos.x, y: pos.y, t: performance.now() }];
          try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
          window.soundFx?.playPop();
          break;
        }
      }
    }, { signal });

    canvas.addEventListener('pointermove', (e) => {
      if (!heldPill) return;
      const pos = getCanvasPos(e.clientX, e.clientY);
      heldPill.x = pos.x;
      heldPill.y = pos.y;

      const now = performance.now();
      pointerTrail.push({ x: pos.x, y: pos.y, t: now });
      if (pointerTrail.length > 5) pointerTrail.shift();
    }, { signal });

    const releaseHeldPill = () => {
      if (!heldPill) return;
      heldPill.isHeld = false;

      // Calculate throw velocity from pointer history
      if (pointerTrail.length >= 2) {
        const oldest = pointerTrail[0];
        const newest = pointerTrail[pointerTrail.length - 1];
        const dt = Math.max(1, (newest.t - oldest.t) / 1000);
        const vx = (newest.x - oldest.x) / dt / 60;
        const vy = (newest.y - oldest.y) / dt / 60;
        heldPill.vx = Math.max(-16, Math.min(16, vx * 1.3));
        heldPill.vy = Math.max(-16, Math.min(16, vy * 1.3));
      }

      heldPill = null;
      pointerTrail = [];
    };

    canvas.addEventListener('pointerup', releaseHeldPill, { signal });
    canvas.addEventListener('pointercancel', releaseHeldPill, { signal });

    // Pill-to-Pill Elastic Collision Resolution
    const resolveCollisions = () => {
      for (let i = 0; i < pills.length; i++) {
        for (let j = i + 1; j < pills.length; j++) {
          const p1 = pills[i];
          const p2 = pills[j];

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.hypot(dx, dy);
          const minDist = (p1.radius + p2.radius) * 1.25;

          if (dist < minDist && dist > 0.001) {
            // Normal vector
            const nx = dx / dist;
            const ny = dy / dist;

            // Separate overlapping pills
            const overlap = minDist - dist;
            if (!p1.isHeld) {
              p1.x -= nx * overlap * 0.5;
              p1.y -= ny * overlap * 0.5;
            }
            if (!p2.isHeld) {
              p2.x += nx * overlap * 0.5;
              p2.y += ny * overlap * 0.5;
            }

            // Relative velocity
            const kx = p1.vx - p2.vx;
            const ky = p1.vy - p2.vy;
            const p = 2 * (nx * kx + ny * ky) / (p1.mass + p2.mass);

            if (!p1.isHeld) {
              p1.vx -= p * p2.mass * nx * restitution;
              p1.vy -= p * p2.mass * ny * restitution;
            }
            if (!p2.isHeld) {
              p2.vx += p * p1.mass * nx * restitution;
              p2.vy += p * p1.mass * ny * restitution;
            }
          }
        }
      }
    };

    // Main Physics Simulation Loop
    this.registerLoop(() => {
      ctx.clearRect(0, 0, width, height);

      // Resolve Physics
      pills.forEach(p => p.update());
      resolveCollisions();

      // Render
      pills.forEach(p => p.draw(ctx));
    });
  }

  /* =========================================================================
     MOD.03: KINETIC TYPOGRAPHY LAB
     ========================================================================= */
  initKineticTypography() {
    const signal = this.createListenerSignal();
    const textInput = document.getElementById('input-kinetic-text');
    const canvas = document.getElementById('kinetic-canvas');
    const wrapper = document.getElementById('kinetic-canvas-wrapper');

    const rangeAmp = document.getElementById('range-kinetic-amp');
    const rangeSpeed = document.getElementById('range-kinetic-speed');
    const rangeTracking = document.getElementById('range-kinetic-tracking');
    const rangeSkew = document.getElementById('range-kinetic-skew');

    const valAmp = document.getElementById('val-kinetic-amp');
    const valSpeed = document.getElementById('val-kinetic-speed');
    const valTracking = document.getElementById('val-kinetic-tracking');
    const valSkew = document.getElementById('val-kinetic-skew');
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext('2d');
    let width = 400;
    let height = 140;

    const resizeCanvas = () => {
      const rect = wrapper.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * (window.devicePixelRatio || 1);
      canvas.height = height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resizeCanvas();

    const ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(wrapper);
    this.resizeObservers.push(ro);

    // Live Modulating Parameters
    let text = "PRERANA";
    let amplitude = 24;
    let speed = 1.2;
    let tracking = 16;
    let skewDeg = 14;

    // Range Slider Event Listeners
    rangeAmp?.addEventListener('input', (e) => {
      amplitude = parseFloat(e.target.value);
      if (valAmp) valAmp.textContent = `${amplitude}px`;
    }, { signal });

    rangeSpeed?.addEventListener('input', (e) => {
      speed = parseFloat(e.target.value);
      if (valSpeed) valSpeed.textContent = `${speed.toFixed(1)}x`;
    }, { signal });

    rangeTracking?.addEventListener('input', (e) => {
      tracking = parseFloat(e.target.value);
      if (valTracking) valTracking.textContent = `${tracking}px`;
    }, { signal });

    rangeSkew?.addEventListener('input', (e) => {
      skewDeg = parseFloat(e.target.value);
      if (valSkew) valSkew.textContent = `${skewDeg}°`;
    }, { signal });

    // Text Input Listener
    textInput?.addEventListener('input', (e) => {
      text = e.target.value.toUpperCase() || "A";
    }, { signal });

    // Preset Chips
    document.querySelectorAll('.kinetic-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const phrase = chip.getAttribute('data-phrase') || 'HELLO';
        if (textInput) textInput.value = phrase;
        text = phrase;
        window.soundFx?.playPop();
      }, { signal });
    });

    const LETTER_COLORS = [
      '#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#F97316'
    ];

    // Kinetic Typography Animation Loop
    this.registerLoop((time) => {
      ctx.clearRect(0, 0, width, height);

      const chars = Array.from(text);
      if (chars.length === 0) return;

      const tSec = time * 0.001 * speed;
      const fontSize = Math.max(20, Math.min(48, Math.floor((width - 40) / (chars.length * 0.85))));
      ctx.font = `800 ${fontSize}px Fredoka, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Measure character widths
      const charMetrics = chars.map(c => ctx.measureText(c).width);
      const totalWidth = charMetrics.reduce((a, b) => a + b, 0) + (chars.length - 1) * tracking;
      let startX = (width - totalWidth) / 2;

      const skewRad = (skewDeg * Math.PI) / 180;
      const centerY = height / 2;

      chars.forEach((char, i) => {
        const charW = charMetrics[i];
        const charCenterX = startX + charW / 2;

        // Wave displacement
        const waveOffset = Math.sin(tSec * 2.8 + i * 0.65) * amplitude;
        const charY = centerY + waveOffset;

        ctx.save();
        ctx.translate(charCenterX, charY);
        // Apply Skew / Shear transform
        ctx.transform(1, 0, Math.tan(skewRad * Math.cos(tSec * 1.5 + i * 0.4)), 1, 0, 0);

        // Character Shadow Block
        ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
        ctx.fillText(char, 2, 4);

        // Character Foreground
        ctx.fillStyle = LETTER_COLORS[i % LETTER_COLORS.length];
        ctx.fillText(char, 0, 0);

        ctx.restore();

        startX += charW + tracking;
      });
    });
  }

  /* =========================================================================
     MOD.04: MAGNETIC DIAL & LISSAJOUS MANDALA
     ========================================================================= */
  initMagneticDial() {
    const signal = this.createListenerSignal();
    const encoderWrapper = document.getElementById('dial-encoder-wrapper');
    const knobDisc = document.getElementById('dial-knob-disc');
    const angleLabel = document.getElementById('dial-angle-label');

    const moodBadge = document.getElementById('dial-mood-badge');
    const ratioBadge = document.getElementById('dial-ratio-badge');
    const formulaLabel = document.getElementById('lissajous-formula-label');

    const canvas = document.getElementById('lissajous-canvas');
    const wrapper = document.getElementById('lissajous-canvas-wrapper');
    if (!canvas || !wrapper || !knobDisc) return;

    const ctx = canvas.getContext('2d');
    let width = 200;
    let height = 200;

    const resizeCanvas = () => {
      const rect = wrapper.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * (window.devicePixelRatio || 1);
      canvas.height = height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resizeCanvas();

    const ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(wrapper);
    this.resizeObservers.push(ro);

    // 4 Harmonic Mood States mapped to Quadrant Angles
    const MOOD_STATES = [
      { angleDeg: 0,   name: "FOCUS", emoji: "🎯", a: 1, b: 1, ratio: "1:1", color: "#4F46E5" },
      { angleDeg: 90,  name: "FLOW",  emoji: "🌊", a: 3, b: 2, ratio: "3:2", color: "#10B981" },
      { angleDeg: 180, name: "DRIFT", emoji: "🍃", a: 5, b: 4, ratio: "5:4", color: "#F59E0B" },
      { angleDeg: 270, name: "PULSE", emoji: "⚡", a: 7, b: 6, ratio: "7:6", color: "#EC4899" }
    ];

    let currentAngleDeg = 0;
    let currentMood = MOOD_STATES[0];
    let isDialDragging = false;

    const updateMoodAndRatio = (deg) => {
      // Find nearest mood state
      let nearest = MOOD_STATES[0];
      let minDiff = 999;

      MOOD_STATES.forEach(m => {
        let diff = Math.abs(deg - m.angleDeg);
        if (diff > 180) diff = 360 - diff;
        if (diff < minDiff) {
          minDiff = diff;
          nearest = m;
        }
      });

      // Magnetic Snapping when within 18° of detent
      if (minDiff <= 18) {
        deg = nearest.angleDeg;
      }

      currentAngleDeg = deg;
      currentMood = nearest;

      if (knobDisc) {
        knobDisc.style.transform = `rotate(${currentAngleDeg}deg)`;
      }
      if (angleLabel) {
        angleLabel.textContent = `${Math.round(currentAngleDeg)}°`;
      }
      if (moodBadge) {
        moodBadge.textContent = `${currentMood.emoji} ${currentMood.name}`;
        moodBadge.style.color = currentMood.color;
      }
      if (ratioBadge) {
        ratioBadge.textContent = `RATIO ${currentMood.ratio}`;
      }
      if (formulaLabel) {
        formulaLabel.textContent = `x=sin(${currentMood.a}t+δ), y=sin(${currentMood.b}t)`;
      }
    };

    updateMoodAndRatio(0);

    // Pointer-based Rotary Drag Calculation
    const handleDialPointer = (clientX, clientY) => {
      const rect = encoderWrapper.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      // Calculate angle in degrees from -180 to 180, normalize to 0..360
      let rad = Math.atan2(dy, dx);
      let deg = (rad * 180) / Math.PI + 90; // Top is 0
      if (deg < 0) deg += 360;

      updateMoodAndRatio(deg);
    };

    encoderWrapper.addEventListener('pointerdown', (e) => {
      isDialDragging = true;
      try { encoderWrapper.setPointerCapture(e.pointerId); } catch (err) {}
      handleDialPointer(e.clientX, e.clientY);
      window.soundFx?.playPop();
    }, { signal });

    encoderWrapper.addEventListener('pointermove', (e) => {
      if (!isDialDragging) return;
      handleDialPointer(e.clientX, e.clientY);
    }, { signal });

    const endDialDrag = () => {
      if (isDialDragging) {
        isDialDragging = false;
        // Snap firmly to nearest detent on release
        updateMoodAndRatio(currentMood.angleDeg);
        window.soundFx?.playPop();
      }
    };
    window.addEventListener('pointerup', endDialDrag, { signal });
    window.addEventListener('pointercancel', endDialDrag, { signal });

    // Live Lissajous Mandala Canvas Loop
    this.registerLoop((time) => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const radiusX = Math.min(width, height) * 0.42;
      const radiusY = radiusX;

      const a = currentMood.a;
      const b = currentMood.b;
      const delta = (currentAngleDeg * Math.PI) / 180 + time * 0.0008;

      ctx.save();
      ctx.translate(cx, cy);

      // Subtle Background Mandala Crosshair
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, radiusX, 0, Math.PI * 2);
      ctx.stroke();

      // Glowing Lissajous Curve
      ctx.beginPath();
      const steps = 360;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        const x = radiusX * Math.sin(a * t + delta);
        const y = radiusY * Math.sin(b * t);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = currentMood.color;
      ctx.shadowColor = currentMood.color;
      ctx.shadowBlur = 10;
      ctx.stroke();

      // Second harmonic phase curve for depth
      ctx.beginPath();
      for (let i = 0; i <= steps; i += 2) {
        const t = (i / steps) * Math.PI * 2;
        const x = (radiusX * 0.85) * Math.sin(a * t + delta + Math.PI / 4);
        const y = (radiusY * 0.85) * Math.sin(b * t);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.shadowBlur = 0;
      ctx.stroke();

      ctx.restore();
    });
  }
}

// Global Singleton Instance
window.playgroundModule = new TactilePlaygroundModule();
