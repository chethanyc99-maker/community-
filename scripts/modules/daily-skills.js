/**
 * Module 2: Daily Living Skills (ADL Sequencing)
 * Focus: Functional independence, routine comprehension, and procedural memory
 */
class DailyLivingModule {
  constructor() {
    this.name = "Daily Living (ADL)";
    this.currentRoutine = null;
    this.currentStepIdx = 0;
    this.attempts = 0;
    this.startTime = 0;

    this.routines = [
      {
        id: "handwashing",
        title: "Clean Hands Routine 🧼",
        instruction: "What is the next step to wash your hands?",
        steps: [
          { order: 1, title: "Wet Hands", visual: "💧", prompt: "First, wet your hands with clean water." },
          { order: 2, title: "Apply Soap", visual: "🧼", prompt: "Next, put soap on your hands." },
          { order: 3, title: "Scrub Hands", visual: "🤲", prompt: "Rub and scrub your hands together." },
          { order: 4, title: "Rinse with Water", visual: "🚿", prompt: "Rinse all the bubbles away with water." },
          { order: 5, title: "Dry Hands", visual: "🧻", prompt: "Finally, dry your hands with a clean towel." }
        ]
      },
      {
        id: "brushing",
        title: "Brushing Teeth Routine 🪥",
        instruction: "Let's brush our teeth step by step!",
        steps: [
          { order: 1, title: "Paste on Brush", visual: "🪥", prompt: "Put a pea-sized toothpaste on the toothbrush." },
          { order: 2, title: "Brush Teeth", visual: "🦷", prompt: "Brush gently on top, front, and back." },
          { order: 3, title: "Rinse Mouth", visual: "💧", prompt: "Rinse your mouth with water and spit out." },
          { order: 4, title: "Wipe with Towel", visual: "✨", prompt: "Wipe your face and smile brightly!" }
        ]
      },
      {
        id: "schoolprep",
        title: "Morning School Prep 🎒",
        instruction: "Let's get ready for school!",
        steps: [
          { order: 1, title: "Wear Clean Clothes", visual: "👕", prompt: "First, put on your clean clothes or uniform." },
          { order: 2, title: "Put on Shoes", visual: "👟", prompt: "Next, wear your socks and shoes." },
          { order: 3, title: "Eat Breakfast", visual: "🥣", prompt: "Eat a healthy breakfast for energy!" },
          { order: 4, title: "Pack School Bag", visual: "🎒", prompt: "Now pack your books, water bottle, and bag." }
        ]
      },
      {
        id: "mealtime",
        title: "Healthy Mealtime Routine 🍽️",
        instruction: "Follow good habits during mealtime!",
        steps: [
          { order: 1, title: "Wash Hands First", visual: "🧼", prompt: "First, wash your hands cleanly before touching food." },
          { order: 2, title: "Sit at the Table", visual: "🪑", prompt: "Sit comfortably and calmly at the dining table." },
          { order: 3, title: "Eat Healthy Food", visual: "🥗", prompt: "Chew slowly and enjoy your nutritious meal." },
          { order: 4, title: "Drink Water & Wipe", visual: "🥤", prompt: "Drink clean water and wipe your mouth cleanly." }
        ]
      },
      {
        id: "bedtime",
        title: "Peaceful Bedtime Routine 🌙",
        instruction: "Let's wind down nicely for restful sleep!",
        steps: [
          { order: 1, title: "Put Toys Away", visual: "🧸", prompt: "First, put toys neatly back in their basket." },
          { order: 2, title: "Wear Soft Pajamas", visual: "👘", prompt: "Change into clean, cozy night pajamas." },
          { order: 3, title: "Brush Teeth", visual: "🪥", prompt: "Brush your teeth cleanly before sleep." },
          { order: 4, title: "Read Story & Sleep", visual: "📖", prompt: "Listen to a calm bedtime story and rest well." }
        ]
      },
      {
        id: "studydesk",
        title: "Tidy Study Desk Routine 📚",
        instruction: "Let's organize our study desk cleanly!",
        steps: [
          { order: 1, title: "Close Notebook", visual: "📓", prompt: "Close your reading book and notebook gently." },
          { order: 2, title: "Store Pencils", visual: "✏️", prompt: "Put pencils and crayons back in your pencil box." },
          { order: 3, title: "Stack Books Neatly", visual: "📚", prompt: "Place your books in one neat stack on the corner." },
          { order: 4, title: "Push Chair In", visual: "🪑", prompt: "Finally, push your chair neatly under the desk." }
        ]
      }
    ];

    this.routineIndex = 0;
  }

  render(container) {
    this.currentRoutine = this.routines[this.routineIndex];
    this.currentStepIdx = 0;
    this.attempts = 0;
    this.startTime = Date.now();

    this.renderStepView(container);
  }

  renderStepView(container) {
    const profile = window.iepStorage.getProfile();
    const currentTarget = this.currentRoutine.steps[this.currentStepIdx];

    let choices = [...this.currentRoutine.steps];
    choices = choices.filter(step => step.order >= currentTarget.order);
    choices.sort(() => Math.random() - 0.5);

    if (profile.level === 'high' && choices.length > 2) {
      choices = [currentTarget, choices.find(c => c.order !== currentTarget.order)].sort(() => Math.random() - 0.5);
    }

    container.innerHTML = `
      <div class="stage-header">
        <h2 class="stage-title">🪥 ${this.currentRoutine.title}</h2>
        <div class="stage-prompt">
          <span>Step ${currentTarget.order}: What do we do next?</span>
          <button type="button" class="speaker-icon-btn liquid-btn liquid-btn-secondary liquid-btn-icon" id="btn-speak-adl" aria-label="Listen to instruction">🔊</button>
        </div>
      </div>

      <div class="sequence-flow-container">
        <div class="sequence-target-area glass-panel" aria-label="Progress steps">
          ${this.currentRoutine.steps.map((s, idx) => {
            const isDone = idx < this.currentStepIdx;
            const isCurrent = idx === this.currentStepIdx;
            return `
              <div class="sequence-slot glass-card ${isDone ? 'done sequence-slot-done' : ''} ${isCurrent ? 'active-slot' : ''}">
                <span class="slot-step-num">${s.order}</span>
                <span style="font-size: 2rem;">${isDone ? s.visual : (isCurrent ? '❓' : '⏳')}</span>
                <span style="font-size: 0.85rem; font-weight: bold; margin-top: 4px;">${isDone ? s.title : 'Step ' + s.order}</span>
              </div>
            `;
          }).join('')}
        </div>

        <p style="text-align:center; font-weight: 700; color: var(--text-muted);">Select the picture that comes next:</p>

        <div class="sequence-pool">
          ${choices.map(step => `
            <button class="sequence-item-card glass-panel glass-card" data-order="${step.order}" data-title="${step.title}">
              <span class="seq-emoji">${step.visual}</span>
              <span class="seq-title">${step.title}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    setTimeout(() => {
      window.speechAssistant.speak(`Step ${currentTarget.order}. ${currentTarget.prompt}`, true);
    }, 200);

    document.getElementById('btn-speak-adl')?.addEventListener('click', () => {
      window.speechAssistant.speak(currentTarget.prompt, true);
    });

    const cards = container.querySelectorAll('.sequence-item-card');
    cards.forEach(card => {
      card.addEventListener('click', () => this.handleStepChoice(card, container));
      card.addEventListener('mouseenter', () => {
        window.speechAssistant.speak(card.getAttribute('data-title'));
      });
    });
  }

  handleStepChoice(cardElement, container) {
    const chosenOrder = parseInt(cardElement.getAttribute('data-order'), 10);
    const targetStep = this.currentRoutine.steps[this.currentStepIdx];
    this.attempts++;

    if (chosenOrder === targetStep.order) {
      window.soundFx.playSuccess();
      window.speechAssistant.speak(`Yes! ${targetStep.title}!`, true);
      cardElement.classList.add('correct-flash');

      this.currentStepIdx++;

      if (this.currentStepIdx >= this.currentRoutine.steps.length) {
        const elapsed = Date.now() - this.startTime;
        window.iepStorage.recordActivity({
          moduleName: this.name,
          objective: `Sequence: ${this.currentRoutine.title}`,
          success: this.attempts <= this.currentRoutine.steps.length,
          attempts: this.attempts,
          responseTimeMs: elapsed
        });

        window.iepStorage.addStar(2);
        window.app.updateStarsDisplay();

        setTimeout(() => {
          window.app.showCelebration({
            title: "Routine Mastered!",
            message: `You completed all steps of ${this.currentRoutine.title}!`,
            emoji: "🎉",
            onNext: () => this.nextRoutine(),
            onRepeat: () => this.render(document.getElementById('activity-stage'))
          });
        }, 700);

      } else {
        setTimeout(() => {
          this.renderStepView(container);
        }, 800);
      }

    } else {
      cardElement.classList.add('shake-retry');
      window.soundFx.playTryAgain();
      window.speechAssistant.speak("Not quite yet. Think about what happens first.", true);
      setTimeout(() => {
        cardElement.classList.remove('shake-retry');
      }, 600);
    }
  }

  nextRoutine() {
    this.routineIndex = (this.routineIndex + 1) % this.routines.length;
    this.render(document.getElementById('activity-stage'));
  }
}

window.dailyLivingModule = new DailyLivingModule();
