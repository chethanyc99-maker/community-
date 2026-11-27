/**
 * Module 3: Feelings & Social Emotions Recognition
 * Focus: Social-emotional literacy, facial affect recognition, and empathy building
 */
class EmotionsModule {
  constructor() {
    this.name = "Feelings & Emotions";
    this.currentIndex = 0;
    this.attempts = 0;
    this.startTime = 0;

    this.dataset = [
      {
        scenario: "Look at the face. Who looks HAPPY? 😊",
        speech: "Can you find the happy and smiling face?",
        targetId: "happy",
        items: [
          { id: "sad", visual: "😢", label: "Sad" },
          { id: "happy", visual: "😄", label: "Happy" },
          { id: "angry", visual: "😠", label: "Angry" },
          { id: "sleepy", visual: "😴", label: "Sleepy" }
        ]
      },
      {
        scenario: "Arjun got a gift! How does he feel? 🎁",
        speech: "Arjun received a wonderful gift. How does he feel?",
        targetId: "excited",
        items: [
          { id: "excited", visual: "🥳", label: "Excited & Joyful" },
          { id: "angry", visual: "😡", label: "Angry" },
          { id: "crying", visual: "😭", label: "Crying" },
          { id: "bored", visual: "😐", label: "Bored" }
        ]
      },
      {
        scenario: "Who looks CALM and peaceful? 🧘",
        speech: "Find the person who is taking deep breaths and feels calm.",
        targetId: "calm",
        items: [
          { id: "calm", visual: "😌", label: "Calm & Peaceful" },
          { id: "scared", visual: "😨", label: "Scared" },
          { id: "angry", visual: "🤬", label: "Frustrated" },
          { id: "sad", visual: "🙁", label: "Unhappy" }
        ]
      },
      {
        scenario: "Someone lost their favorite toy. How do they feel? 🧸",
        speech: "When someone loses their favorite toy, how do they feel?",
        targetId: "sad",
        items: [
          { id: "happy", visual: "😆", label: "Laughing" },
          { id: "surprised", visual: "😲", label: "Surprised" },
          { id: "sad", visual: "😢", label: "Sad / Needing a hug" },
          { id: "proud", visual: "😎", label: "Proud" }
        ]
      },
      {
        scenario: "Wow! A rainbow appeared right outside the window! 🌈",
        speech: "You see something unexpected and wonderful. Which face looks Surprised?",
        targetId: "surprised",
        items: [
          { id: "surprised", visual: "😲", label: "Surprised" },
          { id: "sleepy", visual: "😴", label: "Sleepy" },
          { id: "angry", visual: "😠", label: "Angry" },
          { id: "sad", visual: "😢", label: "Sad" }
        ]
      },
      {
        scenario: "Meera finished her puzzle all by herself! How does she feel? 🏆",
        speech: "Meera worked hard and solved a tough puzzle! Which face shows Proud?",
        targetId: "proud",
        items: [
          { id: "scared", visual: "😨", label: "Scared" },
          { id: "proud", visual: "😎", label: "Proud & Confident" },
          { id: "sad", visual: "🙁", label: "Down" },
          { id: "sleepy", visual: "🥱", label: "Yawning" }
        ]
      },
      {
        scenario: "It is late at night after a long day of play. Who is SLEEPY? 🌙",
        speech: "Which face shows feeling tired and ready for bedtime?",
        targetId: "sleepy",
        items: [
          { id: "sleepy", visual: "😴", label: "Sleepy & Tired" },
          { id: "excited", visual: "🥳", label: "Excited" },
          { id: "angry", visual: "😡", label: "Mad" },
          { id: "laugh", visual: "😄", label: "Full of Energy" }
        ]
      },
      {
        scenario: "Thunder goes BOOM outside during a storm. Who feels SCARED? ⛈️",
        speech: "Loud sudden thunder sounds can feel startling. Which face looks Scared?",
        targetId: "scared",
        items: [
          { id: "calm", visual: "😌", label: "Calm" },
          { id: "scared", visual: "😨", label: "Scared" },
          { id: "proud", visual: "😎", label: "Cool" },
          { id: "happy", visual: "😊", label: "Smiling" }
        ]
      },
      {
        scenario: "It is your first day meeting a new group. Who feels SHY? 🌸",
        speech: "Sometimes meeting new people makes our cheeks warm. Which face feels Shy?",
        targetId: "shy",
        items: [
          { id: "shy", visual: "😊", label: "A Little Shy" },
          { id: "angry", visual: "🤬", label: "Very Mad" },
          { id: "sleepy", visual: "😴", label: "Fast Asleep" },
          { id: "sick", visual: "🤒", label: "Unwell" }
        ]
      },
      {
        scenario: "Giving a friend a warm hug when they feel sad shows what? 🤗",
        speech: "Find the friendly Caring and Kind face!",
        targetId: "caring",
        items: [
          { id: "caring", visual: "🤗", label: "Warm & Caring" },
          { id: "angry", visual: "😤", label: "Grumpy" },
          { id: "scared", visual: "😱", label: "Frightened" },
          { id: "bored", visual: "😑", label: "Bored" }
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
        <h2 class="stage-title">😊 Emotion & Social Expression Zone</h2>
        <div class="stage-prompt">
          <span>${this.currentTask.scenario}</span>
          <button type="button" class="speaker-icon-btn liquid-btn liquid-btn-secondary liquid-btn-icon" id="btn-speak-emotion" aria-label="Listen to instruction">🔊</button>
        </div>
      </div>

      <div class="options-grid" role="group" aria-label="Emotion choices">
        ${displayItems.map(item => `
          <button class="choice-card glass-panel glass-card" data-id="${item.id}" data-label="${item.label}">
            <span class="choice-visual">${item.visual}</span>
            <span class="choice-label">${item.label}</span>
          </button>
        `).join('')}
      </div>
    `;

    setTimeout(() => {
      window.speechAssistant.speak(this.currentTask.speech, true);
    }, 200);

    document.getElementById('btn-speak-emotion')?.addEventListener('click', () => {
      window.speechAssistant.speak(this.currentTask.speech, true);
    });

    const cards = container.querySelectorAll('.choice-card');
    cards.forEach(card => {
      card.addEventListener('click', () => this.handleEmotionChoice(card));
      card.addEventListener('mouseenter', () => {
        window.speechAssistant.speak(card.getAttribute('data-label'));
      });
    });
  }

  handleEmotionChoice(cardElement) {
    const chosenId = cardElement.getAttribute('data-id');
    const isCorrect = chosenId === this.currentTask.targetId;
    this.attempts++;

    if (isCorrect) {
      cardElement.classList.add('correct-flash');
      window.soundFx.playSuccess();
      window.speechAssistant.speak("You understood the feeling so well!", true);

      const elapsed = Date.now() - this.startTime;
      window.iepStorage.recordActivity({
        moduleName: this.name,
        objective: this.currentTask.scenario,
        success: this.attempts === 1,
        attempts: this.attempts,
        responseTimeMs: elapsed
      });

      window.iepStorage.addStar(1);
      window.app.updateStarsDisplay();

      setTimeout(() => {
        window.app.showCelebration({
          title: "Empathy Champion!",
          message: `Great empathy! That face shows ${cardElement.getAttribute('data-label')}!`,
          emoji: "💛",
          onNext: () => this.nextTask(),
          onRepeat: () => this.render(document.getElementById('activity-stage'))
        });
      }, 700);

    } else {
      cardElement.classList.add('shake-retry');
      window.soundFx.playTryAgain();
      window.speechAssistant.speak("Look closely at the expression and eyes.", true);
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

window.emotionsModule = new EmotionsModule();
