/**
 * Module 6: Sensory Calm & Motor Coordination
 * Focus: Sensory decompression, hand-eye motor tracking, relaxation without failure states
 */
class CalmingModule {
  constructor() {
    this.name = "Sensory Calm & Motor";
    this.canvas = null;
    this.ctx = null;
    this.animationId = null;
    this.bubbles = [];
    this.poppedCount = 0;
    this.colors = [
      'rgba(77, 171, 247, 0.65)',
      'rgba(105, 219, 124, 0.65)',
      'rgba(255, 192, 120, 0.65)',
      'rgba(218, 119, 242, 0.65)',
      'rgba(140, 233, 154, 0.65)'
    ];
  }

  render(container) {
    this.poppedCount = 0;

    container.innerHTML = `
      <div class="stage-header">
        <h2 class="stage-title">🫧 Sensory Calm & Bubble Pop</h2>
        <div class="stage-prompt">
          <span>Gently touch or click the floating bubbles to pop them!</span>
          <button type="button" class="speaker-icon-btn liquid-btn liquid-btn-secondary liquid-btn-icon" id="btn-speak-calm" aria-label="Listen to instruction">🔊</button>
        </div>
      </div>

      <div class="sensory-canvas-container sensory-stage-glass glass-panel glass-card" id="canvas-wrapper" style="position:relative; width:100%; height:400px; overflow:hidden; cursor:crosshair;">
        <canvas class="sensory-canvas" id="bubble-canvas" style="width:100%; height:100%; display:block;"></canvas>
        <div class="sensory-prompt-overlay glass-pill" style="position:absolute; bottom:14px; left:50%; transform:translateX(-50%); padding:0.55rem 1.45rem; font-weight:700; color:#0369A1; pointer-events:none;">
          ✨ Popped: <span id="popped-counter">0</span> bubbles | Relax & breathe slowly
        </div>
      </div>

      <div style="display:flex; justify-content:center; gap:1rem; margin-top:1.5rem; flex-wrap:wrap;">
        <button type="button" id="btn-add-bubbles" class="btn btn-secondary liquid-btn liquid-btn-secondary">Release More Bubbles 🎈</button>
        <button type="button" id="btn-finish-calm" class="btn btn-primary liquid-btn liquid-btn-primary">Take a Deep Breath 🌿</button>
      </div>
    `;

    setTimeout(() => {
      window.speechAssistant.speak("Take a gentle breath. Touch the floating bubbles to hear them pop.", true);
    }, 200);

    document.getElementById('btn-speak-calm')?.addEventListener('click', () => {
      window.speechAssistant.speak("Take a gentle breath. Touch the floating bubbles to hear them pop.", true);
    });

    this.initCanvas();

    document.getElementById('btn-add-bubbles')?.addEventListener('click', () => {
      this.spawnBubbles(8);
      window.speechAssistant.speak("More bubbles are floating!");
    });

    document.getElementById('btn-finish-calm')?.addEventListener('click', () => {
      window.soundFx.playSuccess();
      window.iepStorage.addStar(1);
      window.app.updateStarsDisplay();

      window.iepStorage.recordActivity({
        moduleName: this.name,
        objective: "Sensory Decompression & Motor Coordination",
        success: true,
        attempts: 1,
        responseTimeMs: 30000
      });

      window.app.showCelebration({
        title: "Peaceful & Refreshed!",
        message: `You popped ${this.poppedCount} bubbles and practiced calm focus!`,
        emoji: "🌸",
        onNext: () => window.app.showHomeView(),
        onRepeat: () => this.render(container)
      });
    });
  }

  initCanvas() {
    this.canvas = document.getElementById('bubble-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    this.bubbles = [];
    this.spawnBubbles(14);

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.animate();

    const handleTap = (clientX, clientY) => {
      const r = this.canvas.getBoundingClientRect();
      const x = clientX - r.left;
      const y = clientY - r.top;

      for (let i = this.bubbles.length - 1; i >= 0; i--) {
        const b = this.bubbles[i];
        const dist = Math.hypot(b.x - x, b.y - y);
        if (dist <= b.radius + 15) {
          this.popBubble(i, x, y);
          break;
        }
      }
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      handleTap(e.clientX, e.clientY);
    });
  }

  spawnBubbles(count) {
    for (let i = 0; i < count; i++) {
      this.bubbles.push({
        x: Math.random() * (this.canvas.width - 80) + 40,
        y: this.canvas.height + Math.random() * 200,
        radius: 25 + Math.random() * 30,
        speed: 0.6 + Math.random() * 1.2,
        wobble: Math.random() * Math.PI * 2,
        color: this.colors[Math.floor(Math.random() * this.colors.length)]
      });
    }
  }

  popBubble(index, x, y) {
    this.bubbles.splice(index, 1);
    this.poppedCount++;
    const counter = document.getElementById('popped-counter');
    if (counter) counter.textContent = this.poppedCount;
    window.soundFx.playPop();
    this.spawnBubbles(1);
  }

  animate() {
    if (!this.canvas || !this.ctx) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.bubbles.length; i++) {
      const b = this.bubbles[i];
      b.y -= b.speed;
      b.wobble += 0.02;
      b.x += Math.sin(b.wobble) * 0.7;

      if (b.y < -b.radius * 2) {
        b.y = this.canvas.height + b.radius;
        b.x = Math.random() * (this.canvas.width - 60) + 30;
      }

      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = b.color;
      this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.lineWidth = 2.5;
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.arc(b.x - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.22, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      this.ctx.fill();
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

window.calmingModule = new CalmingModule();
