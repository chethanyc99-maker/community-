/**
 * Module 4: Number Sense & Concrete Object Enumeration
 * Focus: One-to-one correspondence, visual enumeration, and symbol association
 */
class CountingModule {
  constructor() {
    this.name = "Number Counting";
    this.currentIndex = 0;
    this.attempts = 0;
    this.countedItems = 0;
    this.startTime = 0;

    this.tasks = [
      { count: 1, itemEmoji: "☀️", name: "Bright Sun", prompt: "How many bright suns shine in the sky?" },
      { count: 2, itemEmoji: "🚗", name: "Toy Cars", prompt: "How many toy cars do you see?" },
      { count: 3, itemEmoji: "🍎", name: "Apples", prompt: "Count the sweet red apples in the basket!" },
      { count: 4, itemEmoji: "🎈", name: "Balloons", prompt: "Let's count the colorful balloons!" },
      { count: 5, itemEmoji: "⭐", name: "Stars", prompt: "Touch each star to count how many there are!" },
      { count: 6, itemEmoji: "🦆", name: "Rubber Ducks", prompt: "Count all the happy little ducks!" },
      { count: 7, itemEmoji: "🦋", name: "Butterflies", prompt: "Touch each butterfly fluttering gently!" },
      { count: 8, itemEmoji: "🍓", name: "Strawberries", prompt: "Count every juicy red strawberry in the tray!" },
      { count: 9, itemEmoji: "🌻", name: "Sunflowers", prompt: "Count all the golden sunflowers one by one!" },
      { count: 10, itemEmoji: "🍪", name: "Cookies", prompt: "Count all ten yummy cookies on the plate!" }
    ];
  }

  render(container) {
    this.currentTask = this.tasks[this.currentIndex];
    this.attempts = 0;
    this.countedItems = 0;
    this.startTime = Date.now();

    const itemsArray = Array.from({ length: this.currentTask.count }, (_, i) => i + 1);

    container.innerHTML = `
      <div class="stage-header">
        <h2 class="stage-title">🔢 One-to-One Object Counting</h2>
        <div class="stage-prompt">
          <span>${this.currentTask.prompt}</span>
          <button type="button" class="speaker-icon-btn liquid-btn liquid-btn-secondary liquid-btn-icon" id="btn-speak-counting" aria-label="Listen to instruction">🔊</button>
        </div>
      </div>

      <div class="counting-display-basket counting-basket-glass glass-panel glass-card" id="counting-basket" aria-label="Item basket" style="display:flex; justify-content:center; gap:1.5rem; padding:1.5rem; margin:1.5rem 0; flex-wrap:wrap;">
        ${itemsArray.map(num => `
          <div class="countable-item" data-index="${num}" role="button" aria-label="${this.currentTask.name} ${num}" style="font-size:3.8rem; cursor:pointer; user-select:none; transition:transform 0.2s;">
            ${this.currentTask.itemEmoji}
          </div>
        `).join('')}
      </div>

      <p style="text-align:center; font-weight: 700; color: var(--text-muted); font-size: 1.15rem;">
        Counted so far: <span id="current-count-display" style="color: var(--primary-glass); font-size: 1.4rem;">0</span> / ${this.currentTask.count}
      </p>

      <p style="text-align:center; color: var(--text-muted); margin-top: 0.5rem;">Touch each item, then tap the matching number below:</p>

      <div class="number-keypad" role="group" aria-label="Number answers" style="display:flex; justify-content:center; gap:0.85rem; flex-wrap:wrap; margin-top:1.25rem;">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `
          <button class="keypad-btn keypad-glass-btn glass-button" data-num="${n}" aria-label="Number ${n}" style="width:68px; height:68px; font-size:1.85rem; font-weight:800; cursor:pointer;">${n}</button>
        `).join('')}
      </div>
    `;

    setTimeout(() => {
      window.speechAssistant.speak(this.currentTask.prompt, true);
    }, 200);

    document.getElementById('btn-speak-counting')?.addEventListener('click', () => {
      window.speechAssistant.speak(this.currentTask.prompt, true);
    });

    const items = container.querySelectorAll('.countable-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        if (!item.classList.contains('counted')) {
          item.classList.add('counted');
          item.style.filter = 'drop-shadow(0 0 10px #F59E0B) scale(1.1)';
          this.countedItems++;
          document.getElementById('current-count-display').textContent = this.countedItems;
          window.soundFx.playCount(this.countedItems);
          window.speechAssistant.speak(`${this.countedItems}`, true);
        }
      });
    });

    const keys = container.querySelectorAll('.keypad-btn');
    keys.forEach(key => {
      key.addEventListener('click', () => this.handleNumberChoice(key));
    });
  }

  handleNumberChoice(keyElement) {
    const selectedNum = parseInt(keyElement.getAttribute('data-num'), 10);
    const targetCount = this.currentTask.count;
    this.attempts++;

    if (selectedNum === targetCount) {
      keyElement.style.background = '#10B981';
      keyElement.style.color = '#FFFFFF';
      window.soundFx.playSuccess();
      window.speechAssistant.speak(`Awesome! There are indeed ${targetCount} ${this.currentTask.name}!`, true);

      const elapsed = Date.now() - this.startTime;
      window.iepStorage.recordActivity({
        moduleName: this.name,
        objective: `Count ${targetCount} ${this.currentTask.name}`,
        success: this.attempts === 1,
        attempts: this.attempts,
        responseTimeMs: elapsed
      });

      window.iepStorage.addStar(1);
      window.app.updateStarsDisplay();

      setTimeout(() => {
        window.app.showCelebration({
          title: "Math Whiz!",
          message: `Spot on! You counted all ${targetCount} ${this.currentTask.name}!`,
          emoji: "🎯",
          onNext: () => this.nextTask(),
          onRepeat: () => this.render(document.getElementById('activity-stage'))
        });
      }, 700);

    } else {
      keyElement.classList.add('shake-retry');
      window.soundFx.playTryAgain();
      window.speechAssistant.speak(`Let's count together. Try touching each ${this.currentTask.name} first.`, true);
      setTimeout(() => {
        keyElement.classList.remove('shake-retry');
      }, 600);
    }
  }

  nextTask() {
    this.currentIndex = (this.currentIndex + 1) % this.tasks.length;
    this.render(document.getElementById('activity-stage'));
  }
}

window.countingModule = new CountingModule();
