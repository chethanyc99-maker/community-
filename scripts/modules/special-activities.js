/**
 * PRERANA - Specialized Interactive Learning Modules
 *  8.  Numbers & Counting (numbersModule) - Tap-to-count + number recognition + addition
 *  9.  Memory & Matching (memoryModule) - Card-flip pair matching across 3 grid levels
 *  10. Communication Skills (communicationModule) - Interactive AAC Voice Board + Request Quiz
 *  11. Music & Rhymes (musicModule) - Rainbow Xylophone, Web Audio Nursery Rhymes & Music Quiz
 *  12. Time & Calendar (timeCalendarModule) - Dynamic SVG Clock, Routine & Calendar Explorer
 */

(function () {
  function getDiff() {
    return window.iepStorage ? window.iepStorage.getDifficultyLevel() : 'medium';
  }

  function renderDiffBar() {
    const current = getDiff();
    const levels = [
      { id: 'easy', label: '🌱 Level 1 · Easy' },
      { id: 'medium', label: '⭐ Level 2 · Medium' },
      { id: 'advanced', label: '🚀 Level 3 · Advanced' }
    ];
    return `
      <div class="activity-level-bar">
        <span class="level-bar-label">Level:</span>
        <div class="level-pills-row">
          ${levels.map(l => `
            <button type="button" class="diff-pill-btn liquid-btn liquid-btn-secondary liquid-btn-sm ${current === l.id ? 'active liquid-btn-active' : ''}" data-level="${l.id}" aria-pressed="${current === l.id}">
              <span>${l.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  function bindDiffBar(container, onChange) {
    container.querySelectorAll('.diff-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lvl = btn.dataset.level;
        if (window.iepStorage) window.iepStorage.saveSettingsRemote({}, lvl);
        onChange();
      });
    });
  }

  function completeModuleTask({ moduleKey, moduleName, objective, diff, attempts, startTime, emoji, praise }) {
    const isFirstTry = attempts <= 1;
    const responseTimeMs = Date.now() - startTime;
    const starsEarned = diff === 'advanced' ? (isFirstTry ? 3 : 2) : (diff === 'medium' ? (isFirstTry ? 2 : 1) : 1);
    const scoreEarned = (diff === 'advanced' ? 25 : diff === 'medium' ? 15 : 10) + (isFirstTry ? 5 : 0);

    if (window.iepStorage) {
      window.iepStorage.recordActivity({
        moduleKey,
        moduleName,
        objective: `${objective} (${diff})`,
        success: isFirstTry,
        attempts,
        responseTimeMs,
        difficulty: diff,
        starsEarned,
        score: scoreEarned
      });
      window.iepStorage.addStar(starsEarned);
      if (window.app) window.app.updateStarsDisplay();
    }
    return { starsEarned, praise: `${praise} (+${starsEarned} ⭐)` };
  }

  // ============================================================================
  // 8. Numbers & Counting Module
  // ============================================================================
  class NumbersModule {
    constructor() {
      this.attempts = 0;
      this.startTime = 0;
      this.locked = false;
      this.lastTarget = null;
    }

    render(container) {
      this.attempts = 0;
      this.locked = false;
      this.startTime = Date.now();

      const diff = getDiff();
      const emojis = ['🍎', '⭐', '🦋', '🎈', '🍓', '🐥'];
      const chosenEmoji = emojis[Math.floor(Math.random() * emojis.length)];

      let targetNum = 3;
      let promptHtml = '';
      let voiceText = '';
      let visualHtml = '';

      if (diff === 'advanced' && Math.random() > 0.45) {
        // Gentle visual addition (sum up to 10)
        const a = Math.floor(Math.random() * 4) + 2; // 2..5
        const b = Math.floor(Math.random() * 4) + 1; // 1..4
        targetNum = a + b;
        promptHtml = `Add them together! How many ${chosenEmoji} in all?`;
        voiceText = `Count and add together! ${a} plus ${b} equals how many?`;
        visualHtml = `
          <div class="addition-visual-row">
            <div class="counting-group">
              ${Array.from({ length: a }, (_, idx) => `<button type="button" class="tap-count-item" data-n="${idx + 1}">${chosenEmoji}</button>`).join('')}
            </div>
            <span class="math-operator">+</span>
            <div class="counting-group">
              ${Array.from({ length: b }, (_, idx) => `<button type="button" class="tap-count-item" data-n="${a + idx + 1}">${chosenEmoji}</button>`).join('')}
            </div>
            <span class="math-operator">= ?</span>
          </div>
        `;
      } else {
        const min = diff === 'easy' ? 1 : (diff === 'medium' ? 3 : 8);
        const max = diff === 'easy' ? 5 : (diff === 'medium' ? 9 : 14);
        do {
          targetNum = Math.floor(Math.random() * (max - min + 1)) + min;
        } while (targetNum === this.lastTarget && max > min);
        this.lastTarget = targetNum;

        promptHtml = `Tap each picture to count, then choose the matching number!`;
        voiceText = `Let us count together! How many pictures are there?`;
        visualHtml = `
          <div class="counting-items-tray">
            ${Array.from({ length: targetNum }, (_, idx) => `
              <button type="button" class="tap-count-item" data-n="${idx + 1}" title="Tap to count ${idx + 1}">${chosenEmoji}</button>
            `).join('')}
          </div>
        `;
      }

      const optionCount = diff === 'easy' ? 2 : (diff === 'advanced' ? 4 : 3);
      const numSet = new Set([targetNum]);
      while (numSet.size < optionCount) {
        const offset = Math.floor(Math.random() * 5) - 2;
        const cand = Math.max(1, targetNum + (offset === 0 ? 3 : offset));
        numSet.add(cand);
      }
      const options = Array.from(numSet).sort(() => 0.5 - Math.random());

      container.innerHTML = `
        <div class="task-stage-wrapper">
          ${renderDiffBar()}
          <div class="task-prompt-box glass-panel glass-card">
            <h2 class="task-prompt-text">${promptHtml}</h2>
            ${visualHtml}
            <div class="count-readout-pill glass-pill" id="live-count-pill">Tap a picture to count aloud!</div>
            <button type="button" id="btn-replay-numbers" class="btn-listen-prompt liquid-btn liquid-btn-primary liquid-btn-sm">🔊 Listen Again</button>
          </div>

          <div class="options-grid count-${options.length}">
            ${options.map(n => `
              <button type="button" class="choice-card glass-panel glass-card" data-num="${n}">
                <div class="choice-visual" style="font-weight:800; color:#2b59c3;">${n}</div>
                <div class="choice-label">Number ${n}</div>
              </button>
            `).join('')}
          </div>
        </div>
      `;

      bindDiffBar(container, () => this.render(container));
      if (window.speechAssistant) window.speechAssistant.speak(voiceText);

      const replay = container.querySelector('#btn-replay-numbers');
      if (replay) {
        replay.addEventListener('click', () => {
          if (window.soundFx) window.soundFx.playPop();
          if (window.speechAssistant) window.speechAssistant.speak(voiceText);
        });
      }

      let tapCounter = 0;
      const readout = container.querySelector('#live-count-pill');
      container.querySelectorAll('.tap-count-item').forEach(item => {
        item.addEventListener('click', () => {
          if (!item.classList.contains('counted')) {
            item.classList.add('counted');
            tapCounter += 1;
            const n = item.dataset.n;
            if (readout) readout.textContent = `Counted: ${tapCounter} of ${targetNum} ${chosenEmoji}`;
            if (window.soundFx) window.soundFx.playCount(parseInt(n, 10));
            if (window.speechAssistant) window.speechAssistant.speak(`${tapCounter}`, false);
          } else {
            if (window.soundFx) window.soundFx.playPop();
          }
        });
      });

      container.querySelectorAll('.choice-card').forEach(btn => {
        btn.addEventListener('click', () => {
          if (this.locked) return;
          this.attempts += 1;
          const chosen = parseInt(btn.dataset.num, 10);
          if (chosen === targetNum) {
            this.locked = true;
            btn.classList.add('correct-flash');
            if (window.soundFx) window.soundFx.playSuccess();
            const praise = `Awesome counting! There are ${targetNum}!`;
            if (window.speechAssistant) window.speechAssistant.speak(praise, true);

            const res = completeModuleTask({
              moduleKey: 'numbers',
              moduleName: 'Numbers & Counting',
              objective: `Counted & matched ${targetNum}`,
              diff,
              attempts: this.attempts,
              startTime: this.startTime,
              emoji: chosenEmoji,
              praise
            });
            window.setTimeout(() => {
              if (window.app) {
                window.app.showCelebration({
                  emoji: chosenEmoji,
                  title: 'Number Star!',
                  message: res.praise,
                  onNext: () => this.render(container),
                  onRepeat: () => this.render(container)
                });
              }
            }, 650);
          } else {
            btn.classList.add('shake-retry');
            if (window.soundFx) window.soundFx.playTryAgain();
            if (window.speechAssistant) window.speechAssistant.speak(`That is ${chosen}. Let us count carefully and find ${targetNum}!`, true);
            window.setTimeout(() => btn.classList.remove('shake-retry'), 550);
          }
        });
      });
    }
  }

  // ============================================================================
  // 9. Memory & Matching Module (Flip-Card Pair Matching)
  // ============================================================================
  class MemoryModule {
    constructor() {
      this.flipped = [];
      this.matchedPairs = 0;
      this.moves = 0;
      this.startTime = 0;
      this.lockBoard = false;
    }

    render(container) {
      const diff = getDiff();
      const pairCount = diff === 'easy' ? 2 : (diff === 'advanced' ? 4 : 3);
      const bank = [
        { id: 'panda', emoji: '🐼', name: 'Panda' },
        { id: 'apple', emoji: '🍎', name: 'Apple' },
        { id: 'sun', emoji: '☀️', name: 'Sun' },
        { id: 'rocket', emoji: '🚀', name: 'Rocket' },
        { id: 'flower', emoji: '🌸', name: 'Flower' },
        { id: 'butterfly', emoji: '🦋', name: 'Butterfly' }
      ];

      const picked = bank.sort(() => 0.5 - Math.random()).slice(0, pairCount);
      const deck = [...picked, ...picked].sort(() => 0.5 - Math.random());

      this.flipped = [];
      this.matchedPairs = 0;
      this.moves = 0;
      this.startTime = Date.now();
      this.lockBoard = false;

      container.innerHTML = `
        <div class="task-stage-wrapper">
          ${renderDiffBar()}
          <div class="task-prompt-box glass-panel glass-card">
            <h2 class="task-prompt-text">🧠 Tap two cards to find matching pairs!</h2>
            <div class="memory-stats-row">
              <span class="glass-pill" id="mem-pairs-badge">Pairs Found: 0 / ${pairCount}</span>
              <span class="glass-pill" id="mem-moves-badge">Moves: 0</span>
              <button type="button" id="btn-mem-restart" class="liquid-btn liquid-btn-secondary liquid-btn-sm">🔄 Shuffle New Cards</button>
            </div>
          </div>

          <div class="memory-grid cols-${pairCount}">
            ${deck.map((card, i) => `
              <button type="button" class="memory-card glass-panel" data-idx="${i}" data-id="${card.id}" data-name="${card.name}">
                <div class="mem-card-inner">
                  <div class="mem-face mem-back">❓</div>
                  <div class="mem-face mem-front">
                    <span class="mem-emoji">${card.emoji}</span>
                    <span class="mem-name">${card.name}</span>
                  </div>
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      `;

      bindDiffBar(container, () => this.render(container));
      const restartBtn = container.querySelector('#btn-mem-restart');
      if (restartBtn) restartBtn.addEventListener('click', () => this.render(container));

      if (window.speechAssistant) {
        window.speechAssistant.speak(`Let us play Memory Matching! Find all ${pairCount} matching pairs!`);
      }

      container.querySelectorAll('.memory-card').forEach(cardEl => {
        cardEl.addEventListener('click', () => {
          if (this.lockBoard) return;
          if (cardEl.classList.contains('is-flipped') || cardEl.classList.contains('is-matched')) return;

          cardEl.classList.add('is-flipped');
          if (window.soundFx) window.soundFx.playPop();
          if (window.speechAssistant) window.speechAssistant.speak(cardEl.dataset.name, false);

          this.flipped.push(cardEl);
          if (this.flipped.length < 2) return;

          this.moves += 1;
          const movesBadge = container.querySelector('#mem-moves-badge');
          if (movesBadge) movesBadge.textContent = `Moves: ${this.moves}`;

          const [first, second] = this.flipped;
          if (first.dataset.id === second.dataset.id) {
            first.classList.add('is-matched');
            second.classList.add('is-matched');
            this.flipped = [];
            this.matchedPairs += 1;

            const pairsBadge = container.querySelector('#mem-pairs-badge');
            if (pairsBadge) pairsBadge.textContent = `Pairs Found: ${this.matchedPairs} / ${pairCount}`;

            if (window.soundFx) window.soundFx.playSuccess();
            if (window.speechAssistant) window.speechAssistant.speak(`Great match! ${first.dataset.name}!`, true);

            if (this.matchedPairs === pairCount) {
              const effAttempts = this.moves <= pairCount + 2 ? 1 : 2;
              const res = completeModuleTask({
                moduleKey: 'memory',
                moduleName: 'Memory & Matching',
                objective: `Matched ${pairCount} pairs in ${this.moves} moves`,
                diff,
                attempts: effAttempts,
                startTime: this.startTime,
                emoji: '🧠',
                praise: `You matched every pair in ${this.moves} moves!`
              });
              window.setTimeout(() => {
                if (window.app) {
                  window.app.showCelebration({
                    emoji: '🧩',
                    title: 'Memory Master!',
                    message: res.praise,
                    onNext: () => this.render(container),
                    onRepeat: () => this.render(container)
                  });
                }
              }, 750);
            }
          } else {
            this.lockBoard = true;
            window.setTimeout(() => {
              first.classList.remove('is-flipped');
              second.classList.remove('is-flipped');
              this.flipped = [];
              this.lockBoard = false;
            }, 900);
          }
        });
      });
    }
  }

  // ============================================================================
  // 10. Communication Skills Module (AAC Voice Board + Quiz)
  // ============================================================================
  class CommunicationModule {
    constructor() {
      this.mode = 'board'; // 'board' | 'quiz'
      this.sentence = [];
      this.attempts = 0;
      this.startTime = 0;
      this.locked = false;
    }

    getTiles() {
      return [
        { id: 'water', emoji: '💧', label: 'Water', phrase: 'I would like some water please', quizPrompt: 'Your throat feels thirsty. Which card asks for a drink?' },
        { id: 'food', emoji: '🍽️', label: 'Hungry', phrase: 'I am hungry, may I eat please', quizPrompt: 'Your tummy is rumbling! Which picture shows you are hungry?' },
        { id: 'restroom', emoji: '🚻', label: 'Restroom', phrase: 'I need to use the restroom please', quizPrompt: 'You need to go to the bathroom. Which card can you tap?' },
        { id: 'help', emoji: '🙋', label: 'Help Please', phrase: 'Can you help me please', quizPrompt: 'A puzzle piece is stuck! Which card politely asks for help?' },
        { id: 'break', emoji: '🛋️', label: 'Take a Break', phrase: 'I need a quiet break please', quizPrompt: 'The room feels too loud. Which card asks for a quiet break?' },
        { id: 'happy', emoji: '😊', label: 'Happy', phrase: 'I feel happy today', quizPrompt: 'You are having fun and smiling! Which card expresses Happy?' },
        { id: 'yes', emoji: '✅', label: 'Yes', phrase: 'Yes please', quizPrompt: 'Your teacher asks if you want a sticker. Which card means Yes?' },
        { id: 'thanks', emoji: '🙏', label: 'Thank You', phrase: 'Thank you very much', quizPrompt: 'Someone shared crayons with you. Tap how we say Thank You!' }
      ];
    }

    render(container) {
      const diff = getDiff();
      const tiles = this.getTiles();

      if (this.mode === 'board') {
        container.innerHTML = `
          <div class="task-stage-wrapper">
            <div class="activity-top-controls">
              ${renderDiffBar()}
              <div class="submode-tabs">
                <button type="button" class="subtab-btn liquid-btn liquid-btn-secondary liquid-btn-sm active liquid-btn-active" data-sub="board">🗣️ Voice Board (AAC)</button>
                <button type="button" class="subtab-btn liquid-btn liquid-btn-secondary liquid-btn-sm" data-sub="quiz">🎯 Communication Quiz</button>
              </div>
            </div>

            <div class="task-prompt-box glass-panel glass-card">
              <h2 class="task-prompt-text">🗣️ Tap cards to speak out loud or build a sentence!</h2>
              <div class="aac-sentence-bar glass-panel">
                <span id="aac-sentence-text">${this.sentence.length ? this.sentence.join(' • ') : 'Tap any picture card below...'}</span>
                <div class="aac-sentence-actions">
                  <button type="button" id="btn-aac-speak" class="btn btn-primary liquid-btn liquid-btn-primary liquid-btn-sm">🔊 Speak</button>
                  <button type="button" id="btn-aac-clear" class="btn btn-secondary liquid-btn liquid-btn-secondary liquid-btn-sm">🧹 Clear</button>
                  <button type="button" id="btn-aac-save" class="btn btn-success liquid-btn liquid-btn-success liquid-btn-sm">⭐ Practice Complete</button>
                </div>
              </div>
            </div>

            <div class="aac-grid">
              ${tiles.map(t => `
                <button type="button" class="aac-tile glass-panel" data-id="${t.id}" data-label="${t.label}" data-phrase="${t.phrase}">
                  <div class="aac-emoji">${t.emoji}</div>
                  <div class="aac-title">${t.label}</div>
                </button>
              `).join('')}
            </div>
          </div>
        `;

        bindDiffBar(container, () => this.render(container));
        this._bindTabs(container);

        if (window.speechAssistant) {
          window.speechAssistant.speak('Communication Voice Board! Tap any card to speak.');
        }

        const sentenceSpan = container.querySelector('#aac-sentence-text');
        container.querySelectorAll('.aac-tile').forEach(btn => {
          btn.addEventListener('click', () => {
            if (window.soundFx) window.soundFx.playPop();
            const phrase = btn.dataset.phrase;
            const label = btn.dataset.label;
            this.sentence.push(label);
            if (this.sentence.length > 5) this.sentence.shift();
            if (sentenceSpan) sentenceSpan.textContent = this.sentence.join(' → ');
            if (window.speechAssistant) window.speechAssistant.speak(phrase, true);
          });
        });

        container.querySelector('#btn-aac-speak').addEventListener('click', () => {
          const text = this.sentence.length ? this.sentence.join(', ') : 'Please tap a card first!';
          if (window.speechAssistant) window.speechAssistant.speak(text, true);
        });

        container.querySelector('#btn-aac-clear').addEventListener('click', () => {
          this.sentence = [];
          if (sentenceSpan) sentenceSpan.textContent = 'Tap any picture card below...';
        });

        container.querySelector('#btn-aac-save').addEventListener('click', () => {
          if (window.soundFx) window.soundFx.playSuccess();
          const res = completeModuleTask({
            moduleKey: 'communication',
            moduleName: 'Communication Skills',
            objective: 'Practiced AAC Voice Board expression',
            diff,
            attempts: 1,
            startTime: Date.now() - 3000,
            emoji: '🗣️',
            praise: 'Great communicating with your Voice Board!'
          });
          if (window.app) {
            window.app.showCelebration({
              emoji: '💬',
              title: 'Clear Speaker!',
              message: res.praise,
              onNext: () => { this.mode = 'quiz'; this.render(container); },
              onRepeat: () => this.render(container)
            });
          }
        });
      } else {
        // Quiz mode
        this.attempts = 0;
        this.locked = false;
        this.startTime = Date.now();
        const optCount = diff === 'easy' ? 2 : (diff === 'advanced' ? 4 : 3);
        const target = tiles[Math.floor(Math.random() * tiles.length)];
        const distractors = tiles.filter(t => t.id !== target.id).sort(() => 0.5 - Math.random()).slice(0, optCount - 1);
        const options = [target, ...distractors].sort(() => 0.5 - Math.random());

        container.innerHTML = `
          <div class="task-stage-wrapper">
            <div class="activity-top-controls">
              ${renderDiffBar()}
              <div class="submode-tabs">
                <button type="button" class="subtab-btn liquid-btn liquid-btn-secondary liquid-btn-sm" data-sub="board">🗣️ Voice Board (AAC)</button>
                <button type="button" class="subtab-btn liquid-btn liquid-btn-secondary liquid-btn-sm active liquid-btn-active" data-sub="quiz">🎯 Communication Quiz</button>
              </div>
            </div>

            <div class="task-prompt-box glass-panel glass-card">
              <h2 class="task-prompt-text">${target.quizPrompt}</h2>
              <button type="button" id="btn-comm-listen" class="btn-listen-prompt liquid-btn liquid-btn-primary liquid-btn-sm">🔊 Listen Again</button>
            </div>

            <div class="options-grid count-${options.length}">
              ${options.map(opt => `
                <button type="button" class="choice-card glass-panel glass-card" data-id="${opt.id}" data-label="${opt.label}">
                  <div class="choice-visual">${opt.emoji}</div>
                  <div class="choice-label">${opt.label}</div>
                </button>
              `).join('')}
            </div>
          </div>
        `;

        bindDiffBar(container, () => this.render(container));
        this._bindTabs(container);

        if (window.speechAssistant) window.speechAssistant.speak(target.quizPrompt);
        container.querySelector('#btn-comm-listen').addEventListener('click', () => {
          if (window.speechAssistant) window.speechAssistant.speak(target.quizPrompt, true);
        });

        container.querySelectorAll('.choice-card').forEach(btn => {
          btn.addEventListener('click', () => {
            if (this.locked) return;
            this.attempts += 1;
            if (btn.dataset.id === target.id) {
              this.locked = true;
              btn.classList.add('correct-flash');
              if (window.soundFx) window.soundFx.playSuccess();
              if (window.speechAssistant) window.speechAssistant.speak(target.phrase, true);

              const res = completeModuleTask({
                moduleKey: 'communication',
                moduleName: 'Communication Skills',
                objective: `Selected "${target.label}" card`,
                diff,
                attempts: this.attempts,
                startTime: this.startTime,
                emoji: target.emoji,
                praise: `Great communicating! "${target.phrase}"`
              });
              window.setTimeout(() => {
                if (window.app) {
                  window.app.showCelebration({
                    emoji: target.emoji,
                    title: 'Awesome Expression!',
                    message: res.praise,
                    onNext: () => this.render(container),
                    onRepeat: () => this.render(container)
                  });
                }
              }, 750);
            } else {
              btn.classList.add('shake-retry');
              if (window.soundFx) window.soundFx.playTryAgain();
              if (window.speechAssistant) window.speechAssistant.speak(`That says ${btn.dataset.label}. Let us find ${target.label}!`, true);
              window.setTimeout(() => btn.classList.remove('shake-retry'), 550);
            }
          });
        });
      }
    }

    _bindTabs(container) {
      container.querySelectorAll('.subtab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.mode = btn.dataset.sub;
          this.render(container);
        });
      });
    }
  }

  // ============================================================================
  // 11. Music & Rhymes Module (Xylophone + Nursery Rhymes + Music Quiz)
  // ============================================================================
  class MusicModule {
    constructor() {
      this.mode = 'xylophone'; // 'xylophone' | 'quiz'
      this.attempts = 0;
      this.startTime = 0;
      this.locked = false;
    }

    getNotes() {
      return [
        { solfa: 'Do', note: 'C', freq: 261.63, color: '#FF595E' },
        { solfa: 'Re', note: 'D', freq: 293.66, color: '#FF924C' },
        { solfa: 'Mi', note: 'E', freq: 329.63, color: '#FFCA3A' },
        { solfa: 'Fa', note: 'F', freq: 349.23, color: '#8AC926' },
        { solfa: 'Sol', note: 'G', freq: 392.00, color: '#1982C4' },
        { solfa: 'La', note: 'A', freq: 440.00, color: '#4267AC' },
        { solfa: 'Ti', note: 'B', freq: 493.88, color: '#6A4C93' },
        { solfa: 'Do+', note: 'C5', freq: 523.25, color: '#EC4899' }
      ];
    }

    getRhymes() {
      const f = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392.00, A: 440.00, B: 493.88, C5: 523.25 };
      return [
        {
          id: 'twinkle',
          title: '⭐ Twinkle Twinkle Little Star',
          lyric: 'Twinkle, twinkle, little star — How I wonder what you are!',
          notes: [
            { freq: f.C, note: 'C', dur: 0.35 }, { freq: f.C, note: 'C', dur: 0.35 },
            { freq: f.G, note: 'G', dur: 0.35 }, { freq: f.G, note: 'G', dur: 0.35 },
            { freq: f.A, note: 'A', dur: 0.35 }, { freq: f.A, note: 'A', dur: 0.35 },
            { freq: f.G, note: 'G', dur: 0.65 },
            { freq: f.F, note: 'F', dur: 0.35 }, { freq: f.F, note: 'F', dur: 0.35 },
            { freq: f.E, note: 'E', dur: 0.35 }, { freq: f.E, note: 'E', dur: 0.35 },
            { freq: f.D, note: 'D', dur: 0.35 }, { freq: f.D, note: 'D', dur: 0.35 },
            { freq: f.C, note: 'C', dur: 0.65 }
          ]
        },
        {
          id: 'mary',
          title: '🐑 Mary Had a Little Lamb',
          lyric: 'Mary had a little lamb, little lamb, little lamb!',
          notes: [
            { freq: f.E, note: 'E', dur: 0.35 }, { freq: f.D, note: 'D', dur: 0.35 },
            { freq: f.C, note: 'C', dur: 0.35 }, { freq: f.D, note: 'D', dur: 0.35 },
            { freq: f.E, note: 'E', dur: 0.35 }, { freq: f.E, note: 'E', dur: 0.35 },
            { freq: f.E, note: 'E', dur: 0.65 },
            { freq: f.D, note: 'D', dur: 0.35 }, { freq: f.D, note: 'D', dur: 0.35 },
            { freq: f.D, note: 'D', dur: 0.65 },
            { freq: f.E, note: 'E', dur: 0.35 }, { freq: f.G, note: 'G', dur: 0.35 },
            { freq: f.G, note: 'G', dur: 0.65 }
          ]
        },
        {
          id: 'rainbow',
          title: '🌈 Happy Rainbow Scale',
          lyric: 'Do, Re, Mi, Fa, Sol, La, Ti, Do — Climb up the musical rainbow!',
          notes: [
            { freq: f.C, note: 'C', dur: 0.3 }, { freq: f.D, note: 'D', dur: 0.3 },
            { freq: f.E, note: 'E', dur: 0.3 }, { freq: f.F, note: 'F', dur: 0.3 },
            { freq: f.G, note: 'G', dur: 0.3 }, { freq: f.A, note: 'A', dur: 0.3 },
            { freq: f.B, note: 'B', dur: 0.3 }, { freq: f.C5, note: 'C5', dur: 0.6 }
          ]
        }
      ];
    }

    render(container) {
      const diff = getDiff();
      const keys = this.getNotes();
      const rhymes = this.getRhymes();

      if (this.mode === 'xylophone') {
        container.innerHTML = `
          <div class="task-stage-wrapper">
            <div class="activity-top-controls">
              ${renderDiffBar()}
              <div class="submode-tabs">
                <button type="button" class="subtab-btn liquid-btn liquid-btn-secondary liquid-btn-sm active liquid-btn-active" data-sub="xylophone">🎹 Play Xylophone & Rhymes</button>
                <button type="button" class="subtab-btn liquid-btn liquid-btn-secondary liquid-btn-sm" data-sub="quiz">🎵 Musical Quiz</button>
              </div>
            </div>

            <div class="task-prompt-box glass-panel glass-card">
              <h2 class="task-prompt-text">🎶 Tap colorful keys to play music or pick a Nursery Rhyme!</h2>
              <div class="rhyme-buttons-row">
                ${rhymes.map(r => `
                  <button type="button" class="rhyme-play-btn liquid-btn liquid-btn-secondary liquid-btn-sm" data-rhyme="${r.id}">
                    ${r.title}
                  </button>
                `).join('')}
                <button type="button" id="btn-music-stop" class="liquid-btn liquid-btn-warning liquid-btn-sm">⏹️ Stop</button>
                <button type="button" id="btn-music-star" class="btn btn-success liquid-btn liquid-btn-success liquid-btn-sm">⭐ Collect Music Star</button>
              </div>
              <p id="rhyme-lyric-banner" class="rhyme-lyric-text">Ready to sing and play!</p>
            </div>

            <div class="xylophone-board glass-panel">
              ${keys.map((k, idx) => `
                <button type="button" class="xylo-key" data-note="${k.note}" data-freq="${k.freq}"
                        style="--key-color:${k.color}; height:${210 - idx * 11}px;">
                  <span class="xylo-solfa">${k.solfa}</span>
                  <span class="xylo-note">${k.note}</span>
                </button>
              `).join('')}
            </div>
          </div>
        `;

        bindDiffBar(container, () => {
          if (window.soundFx) window.soundFx.stopMelody();
          this.render(container);
        });
        this._bindTabs(container);

        if (window.speechAssistant) {
          window.speechAssistant.speak('Welcome to Music and Rhymes! Tap the rainbow keys or listen to a song!');
        }

        const keyEls = Array.from(container.querySelectorAll('.xylo-key'));
        keyEls.forEach(kEl => {
          kEl.addEventListener('click', () => {
            const freq = parseFloat(kEl.dataset.freq);
            if (window.soundFx) window.soundFx.playNote(freq, 0.55);
            kEl.classList.add('key-lit');
            window.setTimeout(() => kEl.classList.remove('key-lit'), 260);
          });
        });

        const lyricBanner = container.querySelector('#rhyme-lyric-banner');
        container.querySelectorAll('.rhyme-play-btn').forEach(rBtn => {
          rBtn.addEventListener('click', () => {
            const rhyme = rhymes.find(r => r.id === rBtn.dataset.rhyme);
            if (!rhyme || !window.soundFx) return;
            if (lyricBanner) lyricBanner.textContent = rhyme.lyric;
            window.soundFx.playMelody(
              rhyme.notes,
              (n) => {
                keyEls.forEach(k => k.classList.remove('key-lit'));
                const matchKey = keyEls.find(k => k.dataset.note === n.note);
                if (matchKey) matchKey.classList.add('key-lit');
              },
              () => keyEls.forEach(k => k.classList.remove('key-lit'))
            );
          });
        });

        container.querySelector('#btn-music-stop').addEventListener('click', () => {
          if (window.soundFx) window.soundFx.stopMelody();
          keyEls.forEach(k => k.classList.remove('key-lit'));
        });

        container.querySelector('#btn-music-star').addEventListener('click', () => {
          if (window.soundFx) {
            window.soundFx.stopMelody();
            window.soundFx.playSuccess();
          }
          const res = completeModuleTask({
            moduleKey: 'music',
            moduleName: 'Music & Rhymes',
            objective: 'Played Xylophone & Nursery Rhymes',
            diff,
            attempts: 1,
            startTime: Date.now() - 4000,
            emoji: '🎶',
            praise: 'Bravo musician! Lovely music playing!'
          });
          if (window.app) {
            window.app.showCelebration({
              emoji: '🎵',
              title: 'Music Star!',
              message: res.praise,
              onNext: () => { this.mode = 'quiz'; this.render(container); },
              onRepeat: () => this.render(container)
            });
          }
        });
      } else {
        // Music Quiz mode
        this.attempts = 0;
        this.locked = false;
        this.startTime = Date.now();
        const quizBank = [
          { id: 'piano', visual: '🎹', label: 'Piano', prompt: 'Which colorful instrument has black and white keys we press?', voice: 'Which musical instrument has keys we press?', freq: 392.00 },
          { id: 'drum', visual: '🥁', label: 'Drum', prompt: 'Which instrument goes Boom-Boom when we tap it with sticks?', voice: 'Which instrument goes boom boom when we tap it?', freq: 130.81 },
          { id: 'bell', visual: '🔔', label: 'Bell', prompt: 'Which instrument rings Ding-Dong clearly?', voice: 'Which instrument rings ding dong?', freq: 783.99 },
          { id: 'guitar', visual: '🎸', label: 'Guitar', prompt: 'Which musical instrument has strings we strum with our hand?', voice: 'Which musical instrument has strings we strum?', freq: 329.63 }
        ];
        const optCount = diff === 'easy' ? 2 : (diff === 'advanced' ? 4 : 3);
        const target = quizBank[Math.floor(Math.random() * quizBank.length)];
        const distractors = quizBank.filter(q => q.id !== target.id).sort(() => 0.5 - Math.random()).slice(0, optCount - 1);
        const options = [target, ...distractors].sort(() => 0.5 - Math.random());

        container.innerHTML = `
          <div class="task-stage-wrapper">
            <div class="activity-top-controls">
              ${renderDiffBar()}
              <div class="submode-tabs">
                <button type="button" class="subtab-btn liquid-btn liquid-btn-secondary liquid-btn-sm" data-sub="xylophone">🎹 Play Xylophone & Rhymes</button>
                <button type="button" class="subtab-btn liquid-btn liquid-btn-secondary liquid-btn-sm active liquid-btn-active" data-sub="quiz">🎵 Musical Quiz</button>
              </div>
            </div>

            <div class="task-prompt-box glass-panel glass-card">
              <div class="prompt-visual-badge">🎵</div>
              <h2 class="task-prompt-text">${target.prompt}</h2>
              <button type="button" id="btn-music-quiz-listen" class="btn-listen-prompt liquid-btn liquid-btn-primary liquid-btn-sm">🔊 Listen & Hear Note</button>
            </div>

            <div class="options-grid count-${options.length}">
              ${options.map(opt => `
                <button type="button" class="choice-card glass-panel glass-card" data-id="${opt.id}" data-label="${opt.label}">
                  <div class="choice-visual">${opt.visual}</div>
                  <div class="choice-label">${opt.label}</div>
                </button>
              `).join('')}
            </div>
          </div>
        `;

        bindDiffBar(container, () => this.render(container));
        this._bindTabs(container);

        if (window.soundFx) window.soundFx.playNote(target.freq, 0.5);
        if (window.speechAssistant) window.speechAssistant.speak(target.voice);

        container.querySelector('#btn-music-quiz-listen').addEventListener('click', () => {
          if (window.soundFx) window.soundFx.playNote(target.freq, 0.5);
          if (window.speechAssistant) window.speechAssistant.speak(target.voice, true);
        });

        container.querySelectorAll('.choice-card').forEach(btn => {
          btn.addEventListener('click', () => {
            if (this.locked) return;
            this.attempts += 1;
            if (btn.dataset.id === target.id) {
              this.locked = true;
              btn.classList.add('correct-flash');
              if (window.soundFx) window.soundFx.playSuccess();
              const praise = `Bravo! That is the ${target.label}!`;
              if (window.speechAssistant) window.speechAssistant.speak(praise, true);

              const res = completeModuleTask({
                moduleKey: 'music',
                moduleName: 'Music & Rhymes',
                objective: `Identified musical instrument: ${target.label}`,
                diff,
                attempts: this.attempts,
                startTime: this.startTime,
                emoji: target.visual,
                praise
              });
              window.setTimeout(() => {
                if (window.app) {
                  window.app.showCelebration({
                    emoji: target.visual,
                    title: 'Musical Genius!',
                    message: res.praise,
                    onNext: () => this.render(container),
                    onRepeat: () => this.render(container)
                  });
                }
              }, 700);
            } else {
              btn.classList.add('shake-retry');
              if (window.soundFx) window.soundFx.playTryAgain();
              if (window.speechAssistant) window.speechAssistant.speak(`That is ${btn.dataset.label}. Try finding ${target.label}!`, true);
              window.setTimeout(() => btn.classList.remove('shake-retry'), 550);
            }
          });
        });
      }
    }

    _bindTabs(container) {
      container.querySelectorAll('.subtab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (window.soundFx) window.soundFx.stopMelody();
          this.mode = btn.dataset.sub;
          this.render(container);
        });
      });
    }
  }

  // ============================================================================
  // 12. Time & Calendar Module (Interactive SVG Clock & Days/Routines)
  // ============================================================================
  class TimeCalendarModule {
    constructor() {
      this.attempts = 0;
      this.startTime = 0;
      this.locked = false;
    }

    buildClockSvg(hour) {
      const hourAngle = ((hour % 12) * 30);
      return `
        <svg viewBox="0 0 120 120" class="analog-clock-svg" aria-label="Analog clock showing ${hour} o'clock">
          <circle cx="60" cy="60" r="54" fill="#FFFFFF" stroke="#4f46e5" stroke-width="4" />
          <text x="60" y="20" text-anchor="middle" font-size="11" font-weight="800" fill="#1e293b">12</text>
          <text x="103" y="64" text-anchor="middle" font-size="11" font-weight="800" fill="#1e293b">3</text>
          <text x="60" y="108" text-anchor="middle" font-size="11" font-weight="800" fill="#1e293b">6</text>
          <text x="18" y="64" text-anchor="middle" font-size="11" font-weight="800" fill="#1e293b">9</text>
          <line x1="60" y1="60" x2="60" y2="24" stroke="#6366f1" stroke-width="3" stroke-linecap="round" />
          <line x1="60" y1="60" x2="60" y2="34" stroke="#ec4899" stroke-width="4.5" stroke-linecap="round"
                transform="rotate(${hourAngle} 60 60)" />
          <circle cx="60" cy="60" r="4.5" fill="#1e293b" />
        </svg>
      `;
    }

    render(container) {
      this.attempts = 0;
      this.locked = false;
      this.startTime = Date.now();
      const diff = getDiff();

      const pools = {
        easy: [
          { id: 'morning', visual: '🌅', label: 'Morning', sub: 'Wake Up & Breakfast', prompt: 'When the bright morning sun rises, what time of day starts?', voice: 'When the sun rises and we wake up, is it Morning or Night?', praise: 'Yes! Morning starts with sunshine!' },
          { id: 'night', visual: '🌙', label: 'Night', sub: 'Moon & Bedtime', prompt: 'When stars shine and we sleep in bed, what time of day is it?', voice: 'When the moon and stars shine for bedtime, what time is it?', praise: 'Sweet dreams! That is Night time!' },
          { id: 'afternoon', visual: '☀️', label: 'Afternoon', sub: 'Lunch & Playtime', prompt: 'After school lunch when the sun is high, it is...', voice: 'Around lunch time when the sun shines high, what time is it?', praise: 'Great! That is Afternoon!' }
        ],
        medium: [
          { id: 'tuesday', visual: '📅', label: 'Tuesday', sub: 'After Monday', prompt: 'On the calendar, which day comes right after Monday?', voice: 'Look at the week strip! Which day comes right after Monday?', praise: 'Awesome calendar work! Tuesday comes after Monday!' },
          { id: 'sunday', visual: '🏡', label: 'Sunday', sub: 'Weekend Rest', prompt: 'Which weekend day comes after Saturday?', voice: 'Which weekend day comes right after Saturday?', praise: 'Hurray! Sunday is a relaxing weekend day!' },
          { id: 'rainy', visual: '🌧️', label: 'Rainy Season', sub: 'Umbrella Weather', prompt: 'When cool rain pours from gray clouds, which season or weather is it?', voice: 'When we carry umbrellas for rain drops, what weather is it?', praise: 'Splash! Rainy weather keeps trees green!' },
          { id: 'friday', visual: '🎉', label: 'Friday', sub: 'Before Saturday', prompt: 'Which school day comes right before Saturday?', voice: 'Which weekday comes right before Saturday?', praise: 'Great! Friday comes before the weekend!' }
        ],
        advanced: [
          { id: 'clock_3', hour: 3, visual: '🕒', label: "3:00 (3 O'Clock)", sub: 'Afternoon Snack', prompt: "Read the clock! What time does the short pink hand point to?", voice: "Look at the analog clock! What time does it show?", praise: "Spot on! The clock shows 3 o'clock!" },
          { id: 'clock_6', hour: 6, visual: '🕕', label: "6:00 (6 O'Clock)", sub: 'Evening Time', prompt: "Read the clock! What hour does this clock show?", voice: "Look closely at the pink hour hand! What time is shown?", praise: "Excellent! It is 6 o'clock!" },
          { id: 'clock_9', hour: 9, visual: '🕘', label: "9:00 (9 O'Clock)", sub: 'School Morning', prompt: "Look at the analog clock face! Which time matches?", voice: "What time does this analog clock show?", praise: "Sharp eyes! It is 9 o'clock!" },
          { id: 'clock_12', hour: 12, visual: '🕛', label: "12:00 (12 O'Clock)", sub: 'Noon Lunch', prompt: "Both clock hands point straight up! What time is it?", voice: "Both hands point straight up to the top! What time is it?", praise: "Wonderful! That is 12 o'clock noon!" }
        ]
      };

      const pool = pools[diff] || pools.medium;
      const optCount = diff === 'easy' ? 2 : (diff === 'advanced' ? 4 : 3);
      const target = pool[Math.floor(Math.random() * pool.length)];
      const distractors = pool.filter(i => i.id !== target.id).sort(() => 0.5 - Math.random()).slice(0, optCount - 1);
      const options = [target, ...distractors].sort(() => 0.5 - Math.random());

      const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const todayIdx = (new Date().getDay() + 6) % 7;

      const visualBanner = target.hour
        ? `<div class="clock-display-wrap">${this.buildClockSvg(target.hour)}</div>`
        : `<div class="weekday-strip">
            ${weekdays.map((d, idx) => `
              <button type="button" class="weekday-chip glass-pill ${idx === todayIdx ? 'today' : ''}" data-day="${d}">${d}</button>
            `).join('')}
           </div>`;

      container.innerHTML = `
        <div class="task-stage-wrapper">
          ${renderDiffBar()}
          <div class="task-prompt-box glass-panel glass-card">
            ${visualBanner}
            <h2 class="task-prompt-text">${target.prompt}</h2>
            <button type="button" id="btn-time-listen" class="btn-listen-prompt liquid-btn liquid-btn-primary liquid-btn-sm">🔊 Listen Again</button>
          </div>

          <div class="options-grid count-${options.length}">
            ${options.map(opt => `
              <button type="button" class="choice-card glass-panel glass-card" data-id="${opt.id}" data-label="${opt.label}">
                <div class="choice-visual">${opt.visual}</div>
                <div class="choice-label">${opt.label}</div>
                <div class="choice-sub">${opt.sub}</div>
              </button>
            `).join('')}
          </div>
        </div>
      `;

      bindDiffBar(container, () => this.render(container));
      if (window.speechAssistant) window.speechAssistant.speak(target.voice);

      container.querySelector('#btn-time-listen').addEventListener('click', () => {
        if (window.soundFx) window.soundFx.playClock();
        if (window.speechAssistant) window.speechAssistant.speak(target.voice, true);
      });

      container.querySelectorAll('.weekday-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const fullMap = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };
          if (window.speechAssistant) window.speechAssistant.speak(fullMap[chip.dataset.day] || chip.dataset.day, true);
        });
      });

      container.querySelectorAll('.choice-card').forEach(btn => {
        btn.addEventListener('click', () => {
          if (this.locked) return;
          this.attempts += 1;
          if (btn.dataset.id === target.id) {
            this.locked = true;
            btn.classList.add('correct-flash');
            if (window.soundFx) window.soundFx.playSuccess();
            if (window.speechAssistant) window.speechAssistant.speak(target.praise, true);

            const res = completeModuleTask({
              moduleKey: 'timecalendar',
              moduleName: 'Time & Calendar',
              objective: `Completed Time & Calendar: ${target.label}`,
              diff,
              attempts: this.attempts,
              startTime: this.startTime,
              emoji: target.visual,
              praise: target.praise
            });
            window.setTimeout(() => {
              if (window.app) {
                window.app.showCelebration({
                  emoji: target.visual,
                  title: 'Time Explorer!',
                  message: res.praise,
                  onNext: () => this.render(container),
                  onRepeat: () => this.render(container)
                });
              }
            }, 700);
          } else {
            btn.classList.add('shake-retry');
            if (window.soundFx) window.soundFx.playTryAgain();
            if (window.speechAssistant) window.speechAssistant.speak(`That is ${btn.dataset.label}. Let us find ${target.label}!`, true);
            window.setTimeout(() => btn.classList.remove('shake-retry'), 550);
          }
        });
      });
    }
  }

  window.numbersModule = new NumbersModule();
  window.memoryModule = new MemoryModule();
  window.communicationModule = new CommunicationModule();
  window.musicModule = new MusicModule();
  window.timeCalendarModule = new TimeCalendarModule();
})();
