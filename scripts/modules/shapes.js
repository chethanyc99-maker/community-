/**
 * Module 1: Shapes & Colors Discrimination
 * Focus: Visual-spatial perception, object discrimination, and auditory association
 */
class ShapesModule {
  constructor() {
    this.name = "Shapes & Colors";
    this.currentTask = null;
    this.attempts = 0;
    this.startTime = 0;

    this.dataset = [
      {
        question: "Find the Blue Circle 🔵",
        speech: "Can you touch the blue circle?",
        targetId: "blue-circle",
        items: [
          { id: "red-square", visual: "🟥", label: "Red Square" },
          { id: "blue-circle", visual: "🔵", label: "Blue Circle" },
          { id: "yellow-star", visual: "⭐", label: "Yellow Star" },
          { id: "green-triangle", visual: "🔺", label: "Green Triangle" }
        ]
      },
      {
        question: "Which one is Green? 🍏",
        speech: "Which one has the color green?",
        targetId: "green-apple",
        items: [
          { id: "red-heart", visual: "❤️", label: "Red Heart" },
          { id: "green-apple", visual: "🍏", label: "Green Apple" },
          { id: "orange-sun", visual: "🍊", label: "Orange Orange" },
          { id: "blue-diamond", visual: "🔷", label: "Blue Diamond" }
        ]
      },
      {
        question: "Touch the Yellow Star ⭐",
        speech: "Look closely and find the bright yellow star.",
        targetId: "yellow-star",
        items: [
          { id: "purple-circle", visual: "🟣", label: "Purple Circle" },
          { id: "yellow-star", visual: "⭐", label: "Yellow Star" },
          { id: "brown-box", visual: "📦", label: "Brown Box" },
          { id: "pink-flower", visual: "🌸", label: "Pink Flower" }
        ]
      },
      {
        question: "Find the Red Square 🟥",
        speech: "Can you spot the red square?",
        targetId: "red-square",
        items: [
          { id: "red-square", visual: "🟥", label: "Red Square" },
          { id: "blue-circle", visual: "🔵", label: "Blue Circle" },
          { id: "green-leaf", visual: "🍃", label: "Green Leaf" },
          { id: "yellow-banana", visual: "🍌", label: "Yellow Banana" }
        ]
      }
    ];

    this.currentIndex = 0;
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
        <h2 class="stage-title">🎨 Shapes & Colors Explorer</h2>
        <div class="stage-prompt">
          <span>${this.currentTask.question}</span>
          <button type="button" class="speaker-icon-btn liquid-btn liquid-btn-secondary liquid-btn-icon" id="btn-speak-prompt" aria-label="Listen to instruction">🔊</button>
        </div>
      </div>

      <div class="options-grid" role="group" aria-label="Choices">
        ${displayItems.map(item => `
          <button class="choice-card glass-panel glass-card" data-id="${item.id}" data-label="${item.label}">
            <span class="choice-visual" aria-hidden="true">${item.visual}</span>
            <span class="choice-label">${item.label}</span>
          </button>
        `).join('')}
      </div>
    `;

    setTimeout(() => {
      window.speechAssistant.speak(this.currentTask.speech, true);
    }, 200);

    document.getElementById('btn-speak-prompt')?.addEventListener('click', () => {
      window.speechAssistant.speak(this.currentTask.speech, true);
    });

    const cards = container.querySelectorAll('.choice-card');
    cards.forEach(card => {
      card.addEventListener('click', () => this.handleSelection(card));
      card.addEventListener('mouseenter', () => {
        const label = card.getAttribute('data-label');
        window.speechAssistant.speak(label);
      });
    });
  }

  handleSelection(cardElement) {
    const chosenId = cardElement.getAttribute('data-id');
    const isCorrect = chosenId === this.currentTask.targetId;
    this.attempts++;

    if (isCorrect) {
      cardElement.classList.add('correct-flash');
      window.soundFx.playSuccess();
      window.speechAssistant.speak("Great job! That's correct!", true);

      const elapsed = Date.now() - this.startTime;
      window.iepStorage.recordActivity({
        moduleName: this.name,
        objective: this.currentTask.question,
        success: this.attempts === 1,
        attempts: this.attempts,
        responseTimeMs: elapsed
      });

      window.iepStorage.addStar(1);
      window.app.updateStarsDisplay();

      setTimeout(() => {
        window.app.showCelebration({
          title: "Super Star!",
          message: `You identified the ${this.currentTask.items.find(i => i.id === this.currentTask.targetId).label}!`,
          emoji: "⭐",
          onNext: () => this.nextTask(),
          onRepeat: () => this.render(document.getElementById('activity-stage'))
        });
      }, 700);

    } else {
      cardElement.classList.add('shake-retry');
      window.soundFx.playTryAgain();
      window.speechAssistant.speak("Nice try! Look again carefully.", true);
      setTimeout(() => {
        cardElement.classList.remove('shake-retry');
      }, 600);
    }
  }

  nextTask() {
    this.currentIndex = (this.currentIndex + 1) % this.dataset.length;
    this.render(document.getElementById('activity-stage'));
  }
}

window.shapesModule = new ShapesModule();
