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
      },
      {
        question: "Tap the Red Triangle 🔺",
        speech: "Find the triangle with three corners!",
        targetId: "red-triangle",
        items: [
          { id: "red-triangle", visual: "🔺", label: "Red Triangle" },
          { id: "yellow-circle", visual: "🟡", label: "Yellow Circle" },
          { id: "blue-square", visual: "🟦", label: "Blue Square" },
          { id: "purple-heart", visual: "💜", label: "Purple Heart" }
        ]
      },
      {
        question: "Which shape is a Purple Heart? 💜",
        speech: "Tap the loving purple heart!",
        targetId: "purple-heart",
        items: [
          { id: "green-square", visual: "🟩", label: "Green Square" },
          { id: "purple-heart", visual: "💜", label: "Purple Heart" },
          { id: "orange-diamond", visual: "🔶", label: "Orange Diamond" },
          { id: "yellow-star", visual: "⭐", label: "Yellow Star" }
        ]
      },
      {
        question: "Find the Orange Diamond 🔶",
        speech: "Look for the sparkling orange diamond shape!",
        targetId: "orange-diamond",
        items: [
          { id: "orange-diamond", visual: "🔶", label: "Orange Diamond" },
          { id: "blue-circle", visual: "🔵", label: "Blue Circle" },
          { id: "red-triangle", visual: "🔺", label: "Red Triangle" },
          { id: "pink-flower", visual: "🌸", label: "Pink Flower" }
        ]
      },
      {
        question: "Which shape looks like a Glowing Moon? 🌙",
        speech: "Tap the curved crescent moon in the night sky!",
        targetId: "crescent-moon",
        items: [
          { id: "brown-cube", visual: "📦", label: "Box Cube" },
          { id: "crescent-moon", visual: "🌙", label: "Crescent Moon" },
          { id: "green-circle", visual: "🟢", label: "Green Circle" },
          { id: "red-square", visual: "🟥", label: "Red Square" }
        ]
      },
      {
        question: "Tap the Bright Green Circle 🟢",
        speech: "Can you find the round green circle?",
        targetId: "green-circle",
        items: [
          { id: "green-circle", visual: "🟢", label: "Green Circle" },
          { id: "orange-circle", visual: "🟠", label: "Orange Circle" },
          { id: "yellow-triangle", visual: "⚠️", label: "Yellow Triangle" },
          { id: "purple-square", visual: "🟪", label: "Purple Square" }
        ]
      },
      {
        question: "Find the Colorful Rainbow Arch 🌈",
        speech: "Touch the bright rainbow with all its pretty colors!",
        targetId: "rainbow-arch",
        items: [
          { id: "rainbow-arch", visual: "🌈", label: "Rainbow" },
          { id: "white-cloud", visual: "☁️", label: "White Cloud" },
          { id: "blue-drop", visual: "💧", label: "Blue Droplet" },
          { id: "brown-box", visual: "📦", label: "Square Box" }
        ]
      },
      {
        question: "Touch the Purple Square 🟪",
        speech: "Look carefully for the purple square with four equal sides!",
        targetId: "purple-square",
        items: [
          { id: "yellow-circle", visual: "🟡", label: "Yellow Circle" },
          { id: "purple-square", visual: "🟪", label: "Purple Square" },
          { id: "blue-diamond", visual: "🔷", label: "Blue Diamond" },
          { id: "green-triangle", visual: "🌲", label: "Green Tree" }
        ]
      },
      {
        question: "Which flower is Pink? 🌸",
        speech: "Find the soft pink flower blossom!",
        targetId: "pink-flower",
        items: [
          { id: "sunflower", visual: "🌻", label: "Yellow Sunflower" },
          { id: "pink-flower", visual: "🌸", label: "Pink Flower" },
          { id: "blue-wave", visual: "🌊", label: "Blue Wave" },
          { id: "red-apple", visual: "🍎", label: "Red Apple" }
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
