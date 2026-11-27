/**
 * Audio Synthesizer using Web Audio API
 * Generates pleasant, non-startling auditory feedback & procedural environmental sounds
 * Zero external audio files required - 100% offline and low-latency.
 */
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle(enabled) {
    this.enabled = enabled;
  }

  // Soft, calming success chime (major triad: C5, E5, G5, C6)
  playSuccess() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0, this.ctx.currentTime + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + idx * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.12);
      osc.stop(this.ctx.currentTime + idx * 0.12 + 0.65);
    });
  }

  // Gentle low-frequency tap for wrong choice (non-punitive, warm tone)
  playTryAgain() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(220, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.26);
  }

  // Subtle bubble pop sound for motor / sensory module
  playPop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = 400 + Math.random() * 400;
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 2, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // Counting tap sound with pitch proportional to count
  playCount(num) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const baseFreq = 330;
    const freq = baseFreq + (num * 55);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.29);
  }

  // Resonant School Bell sound
  playBell() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const freqs = [880, 1760, 2640];
    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.25);
    });
  }

  // Two-tone Car Horn sound (Beep Beep)
  playCarHorn() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    [0, 0.22].forEach(delay => {
      [440, 554.37].forEach(f => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + delay);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + delay + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + 0.17);
      });
    });
  }

  // Clock tick-tock impulse
  playClock() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    [0, 0.25, 0.5, 0.75].forEach((t, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx % 2 === 0 ? 1200 : 900, this.ctx.currentTime + t);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + t + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + t);
      osc.stop(this.ctx.currentTime + t + 0.06);
    });
  }

  // Bird Chirp frequency modulation
  playBird() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    [0, 0.18, 0.36].forEach(delay => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2200, this.ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(3200, this.ctx.currentTime + delay + 0.08);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.11);
    });
  }

  // Deep gentle drum beat (Boom-Boom)
  playDrum() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    [0, 0.28, 0.56].forEach(delay => {
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(52, t + 0.22);
      gain.gain.setValueAtTime(0.32, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  // Friendly two-chord Train Whistle (Choo-Choo)
  playTrainWhistle() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    [0, 0.42].forEach(delay => {
      [392.0, 493.88, 587.33].forEach(freq => {
        const t = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.35);
      });
    });
  }

  // Soft Telephone Ring-Ring
  playPhoneRing() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    [0, 0.14, 0.28, 0.6, 0.74, 0.88].forEach((delay, idx) => {
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx % 2 === 0 ? 1050 : 1320, t);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  // Water / Raindrop plinks
  playRaindrop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    [660, 880, 740, 990].forEach((base, idx) => {
      const t = this.ctx.currentTime + idx * 0.16;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * 1.45, t + 0.08);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    });
  }

  // Pond Frog ribbit
  playFrog() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    [0, 0.34].forEach(delay => {
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(190, t);
      osc.frequency.linearRampToValueAtTime(340, t + 0.15);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.23);
    });
  }

  /**
   * Play a musical tone for Music & Rhymes Xylophone/Piano
   * @param {number} freq Frequency in Hz (e.g., 261.63 for Middle C)
   * @param {number} duration Note duration in seconds
   * @param {string} type Oscillator waveform ('sine' | 'triangle')
   */
  playNote(freq = 261.63, duration = 0.45, type = 'triangle') {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  /**
   * Play a sequence of timed notes ([{ freq, dur, delay, label }])
   */
  playMelody(notes, onNote = null, onDone = null) {
    this.stopMelody();
    if (!Array.isArray(notes) || !notes.length) return;
    this._melodyTimers = [];
    let elapsedMs = 0;
    notes.forEach((n, idx) => {
      const durSec = n.dur || 0.4;
      const timerId = window.setTimeout(() => {
        if (n.freq) this.playNote(n.freq, durSec, 'triangle');
        if (typeof onNote === 'function') onNote(n, idx);
      }, elapsedMs);
      this._melodyTimers.push(timerId);
      elapsedMs += Math.round((n.stepSec || durSec + 0.08) * 1000);
    });
    const doneId = window.setTimeout(() => {
      if (typeof onDone === 'function') onDone();
    }, elapsedMs + 80);
    this._melodyTimers.push(doneId);
  }

  stopMelody() {
    if (Array.isArray(this._melodyTimers)) {
      this._melodyTimers.forEach(id => clearTimeout(id));
    }
    this._melodyTimers = [];
  }
}

window.soundFx = new SoundEffects();
