/**
 * Module 5: Daily Sounds & Environmental Object Association
 * Focus: Auditory discrimination, environmental awareness, and real-world sound matching
 */
class SoundsModule {
  constructor() {
    this.name = "Daily Sounds & Objects";
    this.currentIndex = 0;
    this.attempts = 0;
    this.startTime = 0;

    this.dataset = [
      {
        id: "bell",
        prompt: "Listen to the chime! What makes this ringing sound? 🔔",
        speech: "Listen carefully. Which object makes a ringing bell sound?",
        soundType: "bell",
        targetId: "school-bell",
        items: [
          { id: "school-bell", visual: "🔔", label: "School Bell" },
          { id: "drum", visual: "🥁", label: "Drum" },
          { id: "book", visual: "📚", label: "Book" },
          { id: "pillow", visual: "🛏️", label: "Pillow" }
        ]
      },
      {
        id: "car",
        prompt: "Honk Honk! What vehicle makes this horn sound? 🚗",
        speech: "Beep beep! Which vehicle makes a car horn sound?",
        soundType: "car-horn",
        targetId: "car",
        items: [
          { id: "car", visual: "🚗", label: "Car" },
          { id: "bicycle", visual: "🚲", label: "Bicycle" },
          { id: "airplane", visual: "✈️", label: "Airplane" },
          { id: "boat", visual: "⛵", label: "Sailboat" }
        ]
      },
      {
        id: "clock",
        prompt: "Tick tock, tick tock! What tells us the time? ⏰",
        speech: "Tick tock, tick tock. Which object tells us the time?",
        soundType: "clock",
        targetId: "alarm-clock",
        items: [
          { id: "cup", visual: "☕", label: "Cup" },
          { id: "alarm-clock", visual: "⏰", label: "Alarm Clock" },
          { id: "shoe", visual: "👟", label: "Running Shoe" },
          { id: "pencil", visual: "✏️", label: "Pencil" }
        ]
      },
      {
        id: "bird",
        prompt: "Tweet tweet, chirp chirp! Who is singing in the tree? 🐦",
        speech: "Chirp chirp! Which happy animal sings up in the trees?",
        soundType: "bird",
        targetId: "bird",
        items: [
          { id: "cat", visual: "🐱", label: "Little Cat" },
          { id: "fish", visual: "🐟", label: "Swimming Fish" },
          { id: "bird", visual: "🐦", label: "Singing Bird" },
          { id: "turtle", visual: "🐢", label: "Slow Turtle" }
        ]
      }
    ];
  }

  render(container) {
    this.currentTask = this.dataset[this.currentIndex];
    this.attempts = 0;
    this.startTime = Date.now();

    const profile = window.iepStorage.getProfile();
    let displayItems = [...this.currentTask.items];

    if (profile.level === 'high') {
      const target = displayItems.find(i => i.id === this.currentTask.targetId);
      const other = displayItems.find(i => i.id !== this.currentTask.targetId);
      displayItems = [target, other].sort(() => Math.random() - 0.5);
    } else if (profile.level === 'moderate') {
      const target = displayItems.find(i => i.id === this.currentTask.targetId);
      const others = displayItems.filter(i => i.id !== this.currentTask.targetId).slice(0, 2);
      displayItems = [target, ...others].sort(() => Math.random() - 0.5);
    }

    container.innerHTML = `
      <div class="stage-header">
        <h2 class="stage-title">🔔 Environmental Sounds & Objects</h2>
        <div class="stage-prompt">
          <span>${this.currentTask.prompt}</span>
          <button type="button" class="speaker-icon-btn liquid-btn liquid-btn-primary liquid-btn-sm" id="btn-play-sound-fx" title="Play sound effect" style="margin-left: 0.75rem;">▶️ Play Sound</button>
        </div>
      </div>

      <div style="text-align: center; margin-bottom: 1.5rem;">
        <button type="button" id="btn-re-listen" class="btn btn-secondary liquid-btn liquid-btn-secondary liquid-btn-sm">
          🔊 Hear Sound Again
        </button>
      </div>

      <div class="options-grid" role="group" aria-label="Object choices">
        ${displayItems.map(item => `
          <button class="choice-card glass-panel glass-card" data-id="${item.id}" data-label="${item.label}">
            <span class="choice-visual" aria-hidden="true">${item.visual}</span>
            <span class="choice-label">${item.label}</span>
          </button>
        `).join('')}
      </div>
    `;

    setTimeout(() => {
      this.playSound(this.currentTask.soundType);
      setTimeout(() => {
        window.speechAssistant.speak(this.currentTask.speech);
      }, 1200);
    }, 400);

    document.getElementById('btn-play-sound-fx')?.addEventListener('click', () => {
      this.playSound(this.currentTask.soundType);
    });

    document.getElementById('btn-re-listen')?.addEventListener('click', () => {
      this.playSound(this.currentTask.soundType);
    });

    const cards = container.querySelectorAll('.choice-card');
    cards.forEach(card => {
      card.addEventListener('click', () => this.handleSelection(card));
      card.addEventListener('mouseenter', () => {
        window.speechAssistant.speak(card.getAttribute('data-label'));
      });
    });
  }

  playSound(soundType) {
    if (!window.soundFx) return;

    switch (soundType) {
      case 'bell':
        window.soundFx.playBell();
        break;
      case 'car-horn':
        window.soundFx.playCarHorn();
        break;
      case 'clock':
        window.soundFx.playClock();
        break;
      case 'bird':
        window.soundFx.playBird();
        break;
      default:
        window.soundFx.playSuccess();
    }
  }

  handleSelection(cardElement) {
    const chosenId = cardElement.getAttribute('data-id');
    const isCorrect = chosenId === this.currentTask.targetId;
    this.attempts++;

    if (isCorrect) {
      cardElement.classList.add('correct-flash');
      window.soundFx.playSuccess();
      window.speechAssistant.speak("Splendid! That makes the sound!", true);

      const elapsed = Date.now() - this.startTime;
      window.iepStorage.recordActivity({
        moduleName: this.name,
        objective: this.currentTask.prompt,
        success: this.attempts === 1,
        attempts: this.attempts,
        responseTimeMs: elapsed
      });

      window.iepStorage.addStar(1);
      window.app.updateStarsDisplay();

      setTimeout(() => {
        window.app.showCelebration({
          title: "Auditory Star!",
          message: `You identified the ${cardElement.getAttribute('data-label')}!`,
          emoji: "🎶",
          onNext: () => this.nextTask(),
          onRepeat: () => this.render(document.getElementById('activity-stage'))
        });
      }, 700);

    } else {
      cardElement.classList.add('shake-retry');
      window.soundFx.playTryAgain();
      window.speechAssistant.speak("Listen to the sound again and choose the matching picture.", true);
      setTimeout(() => {
        cardElement.classList.remove('shake-retry');
        this.playSound(this.currentTask.soundType);
      }, 600);
    }
  }

  nextTask() {
    this.currentIndex = (this.currentIndex + 1) % this.dataset.length;
    this.render(document.getElementById('activity-stage'));
  }
}

window.soundsModule = new SoundsModule();
