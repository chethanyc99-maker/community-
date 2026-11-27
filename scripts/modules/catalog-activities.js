/**
 * PRERANA - Multi-Level Curated Learning Engine
 * Powers 7 rich interactive modules with Easy / Medium / Advanced difficulty,
 * TTS voice instructions, audio feedback, star rewards, and MySQL sync:
 *  - Alphabet Learning (alphabetModule)
 *  - Animals & Birds (animalsModule)
 *  - Fruits & Vegetables (fruitsModule)
 *  - Body Parts (bodyPartsModule)
 *  - Safety & Awareness (safetyModule)
 *  - Personal Hygiene (hygieneModule)
 *  - Social Skills (socialModule)
 */

class MultiLevelActivityModule {
  constructor(config) {
    this.key = config.key;
    this.title = config.title;
    this.subtitle = config.subtitle || '';
    this.badgeEmoji = config.badgeEmoji || '🌟';
    this.pools = config.pools; // { easy: [...], medium: [...], advanced: [...] }
    this.explorerItems = config.explorerItems || null; // Optional tap-to-explore banner items
    this.explorerTitle = config.explorerTitle || 'Tap any card to listen & explore!';
    this.attempts = 0;
    this.startTime = 0;
    this.activeTarget = null;
    this.locked = false;
    this.lastTargetId = null;
  }

  getDifficulty() {
    return window.iepStorage ? window.iepStorage.getDifficultyLevel() : 'medium';
  }

  renderDifficultyBar(container, onSwitch) {
    const current = this.getDifficulty();
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

  bindDifficultyBar(container) {
    container.querySelectorAll('.diff-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lvl = btn.dataset.level;
        if (window.iepStorage) {
          window.iepStorage.saveSettingsRemote({}, lvl);
        }
        this.render(container);
      });
    });
  }

  getOptionCount(diff, poolLength) {
    const desired = diff === 'easy' ? 2 : (diff === 'advanced' ? 4 : 3);
    return Math.min(desired, poolLength);
  }

  render(container) {
    this.attempts = 0;
    this.locked = false;
    this.startTime = Date.now();

    const diff = this.getDifficulty();
    const pool = (this.pools[diff] && this.pools[diff].length >= 2) ? this.pools[diff] : this.pools.medium;

    // Pick a target avoiding repeating the exact same item twice in a row when possible
    let candidates = pool.filter(item => item.id !== this.lastTargetId);
    if (!candidates.length) candidates = pool;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    this.lastTargetId = target.id;
    this.activeTarget = target;

    const optionCount = this.getOptionCount(diff, pool.length);
    const distractors = pool
      .filter(i => i.id !== target.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, optionCount - 1);

    const options = [target, ...distractors].sort(() => 0.5 - Math.random());

    const promptText = target.prompt || `Find ${target.label}!`;
    const voiceText = target.voice || promptText;

    const explorerHtml = this.explorerItems ? `
      <div class="explorer-strip glass-panel">
        <div class="explorer-strip-header">${this.explorerTitle}</div>
        <div class="explorer-chips">
          ${this.explorerItems.map(ex => `
            <button type="button" class="explorer-chip glass-pill" data-speak="${ex.speak.replace(/"/g, '&quot;')}">
              <span>${ex.visual}</span>
              <strong>${ex.label}</strong>
            </button>
          `).join('')}
        </div>
      </div>
    ` : '';

    container.innerHTML = `
      <div class="task-stage-wrapper">
        ${this.renderDifficultyBar(container)}

        <div class="task-prompt-box glass-panel glass-card">
          <div class="prompt-visual-badge">${target.clueEmoji || this.badgeEmoji}</div>
          <h2 class="task-prompt-text">${promptText}</h2>
          ${target.hint ? `<p class="task-hint-text">${target.hint}</p>` : ''}
          <button type="button" id="btn-replay-prompt" class="btn-listen-prompt liquid-btn liquid-btn-primary liquid-btn-sm">
            🔊 Listen Again
          </button>
        </div>

        <div class="options-grid count-${options.length}">
          ${options.map(opt => `
            <button type="button" class="choice-card glass-panel glass-card"
                    data-id="${opt.id}"
                    data-label="${opt.label.replace(/"/g, '&quot;')}"
                    style="--card-accent: ${opt.bg || '#FFFFFF'};">
              <div class="choice-visual" style="${opt.visualStyle || ''}">${opt.visual}</div>
              <div class="choice-label">${opt.label}</div>
              ${opt.sub ? `<div class="choice-sub">${opt.sub}</div>` : ''}
            </button>
          `).join('')}
        </div>

        ${explorerHtml}
      </div>
    `;

    this.bindDifficultyBar(container);

    if (window.speechAssistant) {
      window.speechAssistant.speak(voiceText);
    }

    const replayBtn = container.querySelector('#btn-replay-prompt');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        if (window.soundFx) window.soundFx.playPop();
        if (window.speechAssistant) window.speechAssistant.speak(voiceText);
      });
    }

    container.querySelectorAll('.explorer-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.explorer-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (window.soundFx) window.soundFx.playPop();
        if (window.speechAssistant) window.speechAssistant.speak(chip.dataset.speak);
      });
    });

    container.querySelectorAll('.choice-card').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        if (window.speechAssistant && btn.dataset.label) {
          window.speechAssistant.speak(btn.dataset.label, false);
        }
      });

      btn.addEventListener('click', () => {
        if (this.locked) return;
        this.attempts += 1;
        const selectedId = btn.dataset.id;

        if (selectedId === target.id) {
          this.locked = true;
          btn.classList.add('correct-flash');
          if (window.soundFx) window.soundFx.playSuccess();

          const successSpeech = target.praise || `Great job! ${target.label}!`;
          if (window.speechAssistant) window.speechAssistant.speak(successSpeech, true);

          const responseTimeMs = Date.now() - this.startTime;
          const isFirstTry = this.attempts === 1;
          const starsEarned = diff === 'advanced' ? (isFirstTry ? 3 : 2) : (diff === 'medium' ? (isFirstTry ? 2 : 1) : 1);
          const scoreEarned = (diff === 'advanced' ? 25 : diff === 'medium' ? 15 : 10) + (isFirstTry ? 5 : 0);

          if (window.iepStorage) {
            window.iepStorage.recordActivity({
              moduleKey: this.key,
              moduleName: this.title,
              objective: `${this.title}: ${target.label} (${diff})`,
              success: isFirstTry,
              attempts: this.attempts,
              responseTimeMs,
              difficulty: diff,
              starsEarned,
              score: scoreEarned
            });
            window.iepStorage.addStar(starsEarned);
            if (window.app) window.app.updateStarsDisplay();
          }

          window.setTimeout(() => {
            if (window.app) {
              window.app.showCelebration({
                emoji: target.celebrateEmoji || (typeof target.visual === 'string' && target.visual.length <= 4 ? target.visual : this.badgeEmoji),
                title: isFirstTry ? 'Amazing Job!' : 'You Did It!',
                message: `${successSpeech} (+${starsEarned} ⭐)`,
                onNext: () => this.render(container),
                onRepeat: () => this.render(container)
              });
            } else {
              this.render(container);
            }
          }, 700);
        } else {
          btn.classList.add('shake-retry');
          if (window.soundFx) window.soundFx.playTryAgain();
          if (window.speechAssistant) {
            window.speechAssistant.speak(`That is ${btn.dataset.label}. Let's try again and find ${target.label}!`, true);
          }
          window.setTimeout(() => btn.classList.remove('shake-retry'), 550);
        }
      });
    });
  }
}

// ==============================================================================
// 1. Alphabet Learning (Complete A-Z Phonics Explorer & Multi-Level Pools)
// ==============================================================================
window.alphabetModule = new MultiLevelActivityModule({
  key: 'alphabet',
  title: 'Alphabet Learning',
  badgeEmoji: '🔤',
  explorerTitle: 'Tap any letter (A–Z) to hear its phonics sound & word!',
  explorerItems: [
    { visual: '🍎', label: 'A', speak: 'A is for Apple. Ahh.' },
    { visual: '⚽', label: 'B', speak: 'B is for Ball. Buh.' },
    { visual: '🐱', label: 'C', speak: 'C is for Cat. Kuh.' },
    { visual: '🐶', label: 'D', speak: 'D is for Dog. Duh.' },
    { visual: '🐘', label: 'E', speak: 'E is for Elephant. Eh.' },
    { visual: '🐟', label: 'F', speak: 'F is for Fish. Fff.' },
    { visual: '🍇', label: 'G', speak: 'G is for Grapes. Guh.' },
    { visual: '🏠', label: 'H', speak: 'H is for House. Huh.' },
    { visual: '🍦', label: 'I', speak: 'I is for Ice Cream. Ih.' },
    { visual: '🧃', label: 'J', speak: 'J is for Juice. Juh.' },
    { visual: '🪁', label: 'K', speak: 'K is for Kite. Kuh.' },
    { visual: '🦁', label: 'L', speak: 'L is for Lion. Lll.' },
    { visual: '🥭', label: 'M', speak: 'M is for Mango. Mmm.' },
    { visual: '🌙', label: 'N', speak: 'N is for Night Moon. Nnn.' },
    { visual: '🍊', label: 'O', speak: 'O is for Orange. Ohh.' },
    { visual: '✏️', label: 'P', speak: 'P is for Pencil. Puh.' },
    { visual: '👑', label: 'Q', speak: 'Q is for Queen. Kwuh.' },
    { visual: '🌈', label: 'R', speak: 'R is for Rainbow. Rrr.' },
    { visual: '☀️', label: 'S', speak: 'S is for Sun. Sss.' },
    { visual: '🌳', label: 'T', speak: 'T is for Tree. Tuh.' },
    { visual: '☂️', label: 'U', speak: 'U is for Umbrella. Uhh.' },
    { visual: '🎻', label: 'V', speak: 'V is for Violin. Vvv.' },
    { visual: '🍉', label: 'W', speak: 'W is for Watermelon. Wuh.' },
    { visual: '🩻', label: 'X', speak: 'X is for X-ray. Eks.' },
    { visual: '🧶', label: 'Y', speak: 'Y is for Yarn. Yuh.' },
    { visual: '🦓', label: 'Z', speak: 'Z is for Zebra. Zzz.' }
  ],
  pools: {
    easy: [
      { id: 'A', visual: 'A', visualStyle: 'color:#FF3B30;font-weight:800;', label: 'Letter A', sub: '🍎 Apple', clueEmoji: '🍎', celebrateEmoji: '🍎', prompt: 'Tap the Letter A (Apple)!', voice: 'Tap the letter A! A is for Apple.', praise: 'Awesome! A is for Apple!' },
      { id: 'B', visual: 'B', visualStyle: 'color:#007AFF;font-weight:800;', label: 'Letter B', sub: '⚽ Ball', clueEmoji: '⚽', celebrateEmoji: '⚽', prompt: 'Tap the Letter B (Ball)!', voice: 'Tap the letter B! B is for Ball.', praise: 'Brilliant! B is for Ball!' },
      { id: 'C', visual: 'C', visualStyle: 'color:#34C759;font-weight:800;', label: 'Letter C', sub: '🐱 Cat', clueEmoji: '🐱', celebrateEmoji: '🐱', prompt: 'Tap the Letter C (Cat)!', voice: 'Tap the letter C! C is for Cat.', praise: 'Super! C is for Cat!' },
      { id: 'D', visual: 'D', visualStyle: 'color:#FF9500;font-weight:800;', label: 'Letter D', sub: '🐶 Dog', clueEmoji: '🐶', celebrateEmoji: '🐶', prompt: 'Tap the Letter D (Dog)!', voice: 'Tap the letter D! D is for Dog.', praise: 'Well done! D is for Dog!' },
      { id: 'E', visual: 'E', visualStyle: 'color:#AF52DE;font-weight:800;', label: 'Letter E', sub: '🐘 Elephant', clueEmoji: '🐘', celebrateEmoji: '🐘', prompt: 'Tap the Letter E (Elephant)!', voice: 'Tap the letter E! E is for Elephant.', praise: 'Excellent! E is for Elephant!' },
      { id: 'F', visual: 'F', visualStyle: 'color:#00C7BE;font-weight:800;', label: 'Letter F', sub: '🐟 Fish', clueEmoji: '🐟', celebrateEmoji: '🐟', prompt: 'Tap the Letter F (Fish)!', voice: 'Tap the letter F! F is for Fish.', praise: 'Fantastic! F is for Fish!' },
      { id: 'G', visual: 'G', visualStyle: 'color:#16A34A;font-weight:800;', label: 'Letter G', sub: '🍇 Grapes', clueEmoji: '🍇', celebrateEmoji: '🍇', prompt: 'Tap the Letter G (Grapes)!', voice: 'Tap the letter G! G is for Grapes.', praise: 'Great job! G is for Grapes!' },
      { id: 'H', visual: 'H', visualStyle: 'color:#FF2D55;font-weight:800;', label: 'Letter H', sub: '🏠 House', clueEmoji: '🏠', celebrateEmoji: '🏠', prompt: 'Tap the Letter H (House)!', voice: 'Tap the letter H! H is for House.', praise: 'Hurray! H is for House!' }
    ],
    medium: [
      { id: 'I', visual: 'I', visualStyle: 'color:#0EA5E9;font-weight:800;', label: 'I — Ice Cream', sub: '🍦', clueEmoji: '🍦', celebrateEmoji: '🍦', prompt: 'Which letter starts Ice Cream?', voice: 'Which letter starts Ice Cream? Tap I.', praise: 'Yum! I is for Ice Cream!' },
      { id: 'J', visual: 'J', visualStyle: 'color:#F97316;font-weight:800;', label: 'J — Juice', sub: '🧃', clueEmoji: '🧃', celebrateEmoji: '🧃', prompt: 'Which letter starts Juice?', voice: 'Which letter starts Juice? Tap J.', praise: 'Joyful! J is for Juice!' },
      { id: 'K', visual: 'K', visualStyle: 'color:#E11D48;font-weight:800;', label: 'K — Kite', sub: '🪁', clueEmoji: '🪁', celebrateEmoji: '🪁', prompt: 'Which letter starts Kite?', voice: 'Which letter starts Kite? Tap K.', praise: 'Flying high! K is for Kite!' },
      { id: 'L', visual: 'L', visualStyle: 'color:#D97706;font-weight:800;', label: 'L — Lion', sub: '🦁', clueEmoji: '🦁', celebrateEmoji: '🦁', prompt: 'Which letter starts Lion?', voice: 'Which letter starts Lion? Tap L.', praise: 'Roar! L is for Lion!' },
      { id: 'M', visual: 'M', visualStyle: 'color:#5856D6;font-weight:800;', label: 'M — Mango', sub: '🥭', clueEmoji: '🥭', celebrateEmoji: '🥭', prompt: 'Which letter starts Mango?', voice: 'Which letter is for Mango? Tap M.', praise: 'Marvelous! M is for Mango!' },
      { id: 'N', visual: 'N', visualStyle: 'color:#2563EB;font-weight:800;', label: 'N — Nest', sub: '🪺', clueEmoji: '🪺', celebrateEmoji: '🪺', prompt: 'Which letter starts Bird Nest?', voice: 'Which letter starts Nest? Tap N.', praise: 'Nice! N is for Nest!' },
      { id: 'O', visual: 'O', visualStyle: 'color:#EA580C;font-weight:800;', label: 'O — Orange', sub: '🍊', clueEmoji: '🍊', celebrateEmoji: '🍊', prompt: 'Which round letter starts Orange?', voice: 'Which round letter starts Orange? Tap O.', praise: 'Awesome! O is for Orange!' },
      { id: 'P', visual: 'P', visualStyle: 'color:#9333EA;font-weight:800;', label: 'P — Pencil', sub: '✏️', clueEmoji: '✏️', celebrateEmoji: '✏️', prompt: 'Which letter starts Pencil?', voice: 'Which letter starts Pencil? Tap P.', praise: 'Perfect! P is for Pencil!' },
      { id: 'Q', visual: 'Q', visualStyle: 'color:#DB2777;font-weight:800;', label: 'Q — Queen', sub: '👑', clueEmoji: '👑', celebrateEmoji: '👑', prompt: 'Which letter begins Queen?', voice: 'Which letter begins Queen? Tap Q.', praise: 'Royal work! Q is for Queen!' }
    ],
    advanced: [
      { id: 'R', visual: 'R r', visualStyle: 'color:#FF3B30;font-weight:800;', label: 'R — Rainbow', sub: '🌈', clueEmoji: '🌈', celebrateEmoji: '🌈', prompt: 'Find the starting letter for Rainbow!', hint: 'Sounds like Rrr-Rainbow', voice: 'Find the starting letter for Rainbow.', praise: 'Right on! R is for Rainbow!' },
      { id: 'S', visual: 'S s', visualStyle: 'color:#EAB308;font-weight:800;', label: 'S — Sun', sub: '☀️', clueEmoji: '☀️', celebrateEmoji: '☀️', prompt: 'Which letter begins the word Sun?', hint: 'Sounds like Sss-Sun', voice: 'Which letter begins the word Sun?', praise: 'Sparkling! S is for Sun!' },
      { id: 'T', visual: 'T t', visualStyle: 'color:#34C759;font-weight:800;', label: 'T — Tree', sub: '🌳', clueEmoji: '🌳', celebrateEmoji: '🌳', prompt: 'Tap the letter that begins Tree!', hint: 'Sounds like Tuh-Tree', voice: 'Tap the letter that begins Tree.', praise: 'Terrific! T is for Tree!' },
      { id: 'U', visual: 'U u', visualStyle: 'color:#0284C7;font-weight:800;', label: 'U — Umbrella', sub: '☂️', clueEmoji: '☂️', celebrateEmoji: '☂️', prompt: 'Match the starting vowel for Umbrella!', hint: 'Sounds like Uhh-Umbrella', voice: 'Find the letter U for Umbrella.', praise: 'Splendid! U is for Umbrella!' },
      { id: 'V', visual: 'V v', visualStyle: 'color:#7C3AED;font-weight:800;', label: 'V — Violin', sub: '🎻', clueEmoji: '🎻', celebrateEmoji: '🎻', prompt: 'Which letter starts the musical Violin?', hint: 'Sounds like Vvv-Violin', voice: 'Which letter starts Violin?', praise: 'Vibrant! V is for Violin!' },
      { id: 'W', visual: 'W w', visualStyle: 'color:#16A34A;font-weight:800;', label: 'W — Watermelon', sub: '🍉', clueEmoji: '🍉', celebrateEmoji: '🍉', prompt: 'Find the starting letter for Watermelon!', hint: 'Sounds like Wuh-Watermelon', voice: 'Find the letter W for Watermelon.', praise: 'Wonderful! W is for Watermelon!' },
      { id: 'X', visual: 'X x', visualStyle: 'color:#0F766E;font-weight:800;', label: 'X — X-ray', sub: '🩻', clueEmoji: '🩻', celebrateEmoji: '🩻', prompt: 'Which crisscross letter makes X-ray?', hint: 'Sounds like Eks-ray', voice: 'Find the letter X for X-ray.', praise: 'Extraordinary! X is for X-ray!' },
      { id: 'Y', visual: 'Y y', visualStyle: 'color:#C026D3;font-weight:800;', label: 'Y — Yarn', sub: '🧶', clueEmoji: '🧶', celebrateEmoji: '🧶', prompt: 'Match the starting letter for soft Yarn!', hint: 'Sounds like Yuh-Yarn', voice: 'Find the letter Y for Yarn.', praise: 'Yay! Y is for Yarn!' },
      { id: 'Z', visual: 'Z z', visualStyle: 'color:#5856D6;font-weight:800;', label: 'Z — Zebra', sub: '🦓', clueEmoji: '🦓', celebrateEmoji: '🦓', prompt: 'Find the last letter of the alphabet: Zebra!', hint: 'Sounds like Zzz-Zebra', voice: 'Find the letter Z for Zebra.', praise: 'Amazing! Z is for Zebra!' }
    ]
  }
});

// ==============================================================================
// 2. Animals & Birds (Interactive Sound Explorer + 24 Creatures)
// ==============================================================================
window.animalsModule = new MultiLevelActivityModule({
  key: 'animals',
  title: 'Animals & Birds',
  badgeEmoji: '🦁',
  explorerTitle: 'Tap any animal or bird to hear its sound & fun fact!',
  explorerItems: [
    { visual: '🐶', label: 'Dog', speak: 'Dog! Dogs say woof woof and love playing fetch.' },
    { visual: '🐱', label: 'Cat', speak: 'Cat! Cats say meow and purr softly.' },
    { visual: '🐄', label: 'Cow', speak: 'Cow! Cows say moo and give fresh milk.' },
    { visual: '🦆', label: 'Duck', speak: 'Duck! Ducks say quack and swim in ponds.' },
    { visual: '🐑', label: 'Sheep', speak: 'Sheep! Sheep say baa and have warm wool.' },
    { visual: '🐸', label: 'Frog', speak: 'Frog! Frogs say ribbit and hop near water.' },
    { visual: '🦁', label: 'Lion', speak: 'Lion! Lions roar loudly on sunny grasslands.' },
    { visual: '🐘', label: 'Elephant', speak: 'Elephant! Elephants use a long trunk to drink and wave.' },
    { visual: '🐒', label: 'Monkey', speak: 'Monkey! Monkeys swing playfully from tree branches.' },
    { visual: '🦜', label: 'Parrot', speak: 'Parrot! Parrots have bright feathers and can mimic words.' },
    { visual: '🦚', label: 'Peacock', speak: 'Peacock! Peacocks spread dazzling blue and green feathers.' },
    { visual: '🐬', label: 'Dolphin', speak: 'Dolphin! Dolphins are gentle smart ocean swimmers.' }
  ],
  pools: {
    easy: [
      { id: 'dog', visual: '🐶', label: 'Dog', sub: 'Woof!', clueEmoji: '🦴', prompt: 'Tap the friendly Dog!', voice: 'Tap the friendly Dog that goes woof!', praise: 'Good job! That is a Dog!' },
      { id: 'cat', visual: '🐱', label: 'Cat', sub: 'Meow!', clueEmoji: '🐾', prompt: 'Find the cute Cat!', voice: 'Find the cute Cat that says meow!', praise: 'Purr-fect! That is a Cat!' },
      { id: 'duck', visual: '🦆', label: 'Duck', sub: 'Quack!', clueEmoji: '💧', prompt: 'Tap the Duck that swims in water!', voice: 'Tap the Duck that says quack!', praise: 'Yay! That is a Duck!' },
      { id: 'cow', visual: '🐄', label: 'Cow', sub: 'Moo!', clueEmoji: '🥛', prompt: 'Which animal gives us milk and says Moo?', voice: 'Which animal gives milk and says moo?', praise: 'Great! That is a Cow!' },
      { id: 'sheep', visual: '🐑', label: 'Sheep', sub: 'Baa! Fluffy Wool', clueEmoji: '🧶', prompt: 'Tap the fluffy Sheep that says Baa!', voice: 'Tap the fluffy Sheep that gives soft wool!', praise: 'Soft and woolly! That is a Sheep!' },
      { id: 'rabbit', visual: '🐇', label: 'Rabbit', sub: 'Long Ears & Hop', clueEmoji: '🥕', prompt: 'Find the furry Rabbit with long ears!', voice: 'Find the Rabbit that hops and loves carrots!', praise: 'Hop hop! That is a cute Rabbit!' },
      { id: 'frog', visual: '🐸', label: 'Frog', sub: 'Ribbit!', clueEmoji: '🪷', prompt: 'Tap the green Frog that hops on lily pads!', voice: 'Tap the green Frog that says ribbit!', praise: 'Ribbit! You found the Frog!' },
      { id: 'chick', visual: '🐥', label: 'Baby Chick', sub: 'Cheep Cheep!', clueEmoji: '🥚', prompt: 'Find the little yellow Baby Chick!', voice: 'Find the sweet yellow Baby Chick!', praise: 'Cheep! That is a Baby Chick!' }
    ],
    medium: [
      { id: 'lion', visual: '🦁', label: 'Lion', sub: 'Golden Mane', clueEmoji: '🌿', prompt: 'Find the Lion with a big furry mane!', voice: 'Find the Lion!', praise: 'Roar! You found the Lion!' },
      { id: 'elephant', visual: '🐘', label: 'Elephant', sub: 'Long Trunk', clueEmoji: '💦', prompt: 'Tap the big Elephant with a long trunk!', voice: 'Tap the Elephant with a long trunk!', praise: 'Super! That is an Elephant!' },
      { id: 'parrot', visual: '🦜', label: 'Parrot', sub: 'Colorful Bird', clueEmoji: '🪶', prompt: 'Which green and colorful bird can talk?', voice: 'Find the colorful Parrot bird!', praise: 'Awesome! Parrots are clever birds!' },
      { id: 'owl', visual: '🦉', label: 'Owl', sub: 'Hoo Hoo', clueEmoji: '🌙', prompt: 'Tap the Owl that stays awake at night!', voice: 'Find the Owl that wakes up at night!', praise: 'Smart! That is an Owl!' },
      { id: 'monkey', visual: '🐒', label: 'Monkey', sub: 'Climbs Trees', clueEmoji: '🍌', prompt: 'Find the playful Monkey that swings in trees!', voice: 'Find the Monkey that loves bananas!', praise: 'Fun! That is a Monkey!' },
      { id: 'horse', visual: '🐴', label: 'Horse', sub: 'Fast Gallop', clueEmoji: '🌾', prompt: 'Which animal gallops fast and says Neigh?', voice: 'Tap the Horse that gallops across fields!', praise: 'Giddy up! That is a Horse!' },
      { id: 'giraffe', visual: '🦒', label: 'Giraffe', sub: 'Tallest Neck', clueEmoji: '🌳', prompt: 'Which spotted animal has the longest neck to reach treetops?', voice: 'Which tall animal eats leaves from high trees?', praise: 'Way up high! It is the Giraffe!' },
      { id: 'dove', visual: '🕊️', label: 'Dove', sub: 'Gentle Flyer', clueEmoji: '☁️', prompt: 'Tap the gentle white Bird flying peacefully!', voice: 'Find the gentle flying Dove bird!', praise: 'Lovely! That is a peaceful Dove!' }
    ],
    advanced: [
      { id: 'peacock', visual: '🦚', label: 'Peacock', sub: 'National Bird', clueEmoji: '✨', prompt: 'Which bird opens bright blue & green feathers?', hint: 'Hint: Dances when it rains', voice: 'Which bird dances with bright blue and green feathers?', praise: 'Magnificent! It is the Peacock!' },
      { id: 'penguin', visual: '🐧', label: 'Penguin', sub: 'Swims on Ice', clueEmoji: '❄️', prompt: 'Which black-and-white bird lives on ice and swims?', hint: 'Hint: Has flippers instead of flying wings', voice: 'Which bird lives on ice and swims?', praise: 'Cool! Penguins are amazing swimmers!' },
      { id: 'dolphin', visual: '🐬', label: 'Dolphin', sub: 'Ocean Friend', clueEmoji: '🌊', prompt: 'Find the smart ocean animal that jumps in waves!', hint: 'Hint: Lives in the ocean and clicks', voice: 'Find the smart ocean animal Dolphin!', praise: 'Splash! You found the Dolphin!' },
      { id: 'eagle', visual: '🦅', label: 'Eagle', sub: 'High Flyer', clueEmoji: '⛰️', prompt: 'Which strong bird flies high above mountains?', hint: 'Hint: Has sharp eyes and wide wings', voice: 'Which strong bird flies high above mountains?', praise: 'Soaring high! That is an Eagle!' },
      { id: 'flamingo', visual: '🦩', label: 'Flamingo', sub: 'Stands on One Leg', clueEmoji: '🩷', prompt: 'Which tall pink bird likes standing gracefully on one leg?', hint: 'Hint: Bright pink wading bird', voice: 'Which tall pink bird stands on one leg?', praise: 'Balanced! That is a Flamingo!' },
      { id: 'octopus', visual: '🐙', label: 'Octopus', sub: 'Eight Arms', clueEmoji: '🌊', prompt: 'Which clever ocean creature has eight wiggly arms?', hint: 'Hint: Swims deep underwater', voice: 'Which sea creature has eight arms?', praise: 'Eight thumbs up! Octopus!' },
      { id: 'kangaroo', visual: '🦘', label: 'Kangaroo', sub: 'Pouch Jumper', clueEmoji: '🌿', prompt: 'Which hopping animal carries its baby joey in a cozy pouch?', hint: 'Hint: Jumps high with strong back legs', voice: 'Which animal jumps high and carries a baby in a pouch?', praise: 'Boing! That is a Kangaroo!' },
      { id: 'turtle', visual: '🐢', label: 'Sea Turtle', sub: 'Protective Shell', clueEmoji: '🏖️', prompt: 'Which calm creature carries its hard shell home everywhere?', hint: 'Hint: Walks slowly on land, glides in sea', voice: 'Which animal carries its hard shell on its back?', praise: 'Steady and strong! Sea Turtle!' }
    ]
  }
});

// ==============================================================================
// 3. Fruits & Vegetables (Interactive Basket Explorer + 24 Healthy Foods)
// ==============================================================================
window.fruitsModule = new MultiLevelActivityModule({
  key: 'fruits',
  title: 'Fruits & Vegetables',
  badgeEmoji: '🍎',
  explorerTitle: 'Tap any fruit or vegetable to hear healthy nutrition facts!',
  explorerItems: [
    { visual: '🍎', label: 'Apple', speak: 'Apple! Red apples are crunchy and keep our heart happy.' },
    { visual: '🍌', label: 'Banana', speak: 'Banana! Bananas give quick energy for playing.' },
    { visual: '🥭', label: 'Mango', speak: 'Mango! Mangoes are sweet golden summer treats.' },
    { visual: '🍊', label: 'Orange', speak: 'Orange! Oranges are full of vitamin C.' },
    { visual: '🍇', label: 'Grapes', speak: 'Grapes! Little grapes grow in sweet bunches.' },
    { visual: '🍓', label: 'Strawberry', speak: 'Strawberry! Bright berries with tiny golden seeds.' },
    { visual: '🍉', label: 'Watermelon', speak: 'Watermelon! Cool and refreshing on sunny days.' },
    { visual: '🍍', label: 'Pineapple', speak: 'Pineapple! Spiky outside, juicy golden rings inside.' },
    { visual: '🥕', label: 'Carrot', speak: 'Carrot! Orange carrots help keep your eyes sharp.' },
    { visual: '🥦', label: 'Broccoli', speak: 'Broccoli! Green broccoli looks like crunchy mini trees.' },
    { visual: '🌽', label: 'Corn', speak: 'Corn! Sweet yellow corn kernels grow on a cob.' },
    { visual: '🥬', label: 'Greens', speak: 'Leafy Greens! Spinach helps muscles grow big and strong.' }
  ],
  pools: {
    easy: [
      { id: 'apple', visual: '🍎', label: 'Apple', sub: 'Sweet & Red', clueEmoji: '🧺', prompt: 'Tap the crunchy red Apple!', voice: 'Tap the crunchy red Apple!', praise: 'Yum! Apples keep us healthy!' },
      { id: 'banana', visual: '🍌', label: 'Banana', sub: 'Yellow Fruit', clueEmoji: '🧺', prompt: 'Find the yellow Banana!', voice: 'Find the yellow Banana!', praise: 'Great! Bananas give us energy!' },
      { id: 'mango', visual: '🥭', label: 'Mango', sub: 'Sweet Summer Fruit', clueEmoji: '☀️', prompt: 'Tap the juicy golden Mango!', voice: 'Tap the juicy Mango!', praise: 'Delicious! Mangoes are sweet!' },
      { id: 'carrot', visual: '🥕', label: 'Carrot', sub: 'Good for Eyes', clueEmoji: '🐰', prompt: 'Find the orange Carrot that rabbits love!', voice: 'Find the orange Carrot!', praise: 'Crunchy! Carrots help our eyes!' },
      { id: 'orange', visual: '🍊', label: 'Orange', sub: 'Juicy Citrus', clueEmoji: '🥤', prompt: 'Tap the round orange fruit full of juice!', voice: 'Tap the round juicy Orange!', praise: 'Fresh! Oranges have lots of Vitamin C!' },
      { id: 'pear', visual: '🍐', label: 'Pear', sub: 'Soft Green Fruit', clueEmoji: '🌳', prompt: 'Find the sweet green Pear fruit!', voice: 'Find the sweet green Pear!', praise: 'Yummy! Soft and sweet Pear!' },
      { id: 'corn', visual: '🌽', label: 'Corn', sub: 'Yellow Cob', clueEmoji: '🌻', prompt: 'Tap the bright yellow Corn on the cob!', voice: 'Tap the golden yellow Corn!', praise: 'Pop! Golden sweet Corn!' },
      { id: 'peas', visual: '🫛', label: 'Green Peas', sub: 'Tiny Round Beans', clueEmoji: '🌱', prompt: 'Find the green Peas cozy inside a pod!', voice: 'Find the little green Peas inside a pod!', praise: 'Cute and healthy! Green Peas!' }
    ],
    medium: [
      { id: 'grapes', visual: '🍇', label: 'Grapes', sub: 'Small Bunch', clueEmoji: '🧺', prompt: 'Tap the purple bunch of Grapes!', voice: 'Tap the bunch of Grapes!', praise: 'Awesome! Sweet little Grapes!' },
      { id: 'tomato', visual: '🍅', label: 'Tomato', sub: 'Juicy Red', clueEmoji: '🥗', prompt: 'Find the round red Tomato!', voice: 'Find the round red Tomato!', praise: 'Yummy! Tomatoes go great in salads!' },
      { id: 'broccoli', visual: '🥦', label: 'Broccoli', sub: 'Green Tree Veggie', clueEmoji: '🌱', prompt: 'Which green vegetable looks like tiny trees?', voice: 'Find the green Broccoli vegetable!', praise: 'Healthy choice! Green Broccoli!' },
      { id: 'pineapple', visual: '🍍', label: 'Pineapple', sub: 'Crown Leaves', clueEmoji: '👑', prompt: 'Which tropical fruit wears a spiky green crown on top?', voice: 'Find the Pineapple wearing a leafy crown!', praise: 'Sweet sunshine! That is a Pineapple!' },
      { id: 'cherry', visual: '🍒', label: 'Cherries', sub: 'Twin Red Pair', clueEmoji: '🍰', prompt: 'Tap the pair of bright shiny red Cherries!', voice: 'Find the pair of red Cherries!', praise: 'Sweet pair! Cherries!' },
      { id: 'cucumber', visual: '🥒', label: 'Cucumber', sub: 'Cool Crunch', clueEmoji: '🥗', prompt: 'Which long cool green veggie is crunchy in salads?', voice: 'Find the cool green Cucumber!', praise: 'Refreshing crunch! Cucumber!' },
      { id: 'onion', visual: '🧅', label: 'Onion', sub: 'Crunchy Layers', clueEmoji: '🍲', prompt: 'Which kitchen vegetable has rings and layers inside?', voice: 'Find the layered Onion used in cooking!', praise: 'Kitchen star! That is an Onion!' },
      { id: 'eggplant', visual: '🍆', label: 'Eggplant', sub: 'Purple Brinjal', clueEmoji: '🌿', prompt: 'Find the smooth dark-purple Eggplant brinjal!', voice: 'Find the smooth purple Eggplant!', praise: 'Great spotting! Eggplant!' }
    ],
    advanced: [
      { id: 'watermelon', visual: '🍉', label: 'Watermelon', sub: 'Green Outside, Red Inside', clueEmoji: '🌞', prompt: 'Which large summer fruit is green outside and red inside?', hint: 'Hint: Full of cool water', voice: 'Which large summer fruit is green outside and red inside?', praise: 'Refreshing! Watermelon!' },
      { id: 'spinach', visual: '🥬', label: 'Leafy Greens', sub: 'Rich in Iron', clueEmoji: '💪', prompt: 'Which leafy green vegetable gives us strong muscles?', hint: 'Hint: Dark green healthy leaves', voice: 'Which leafy green vegetable gives strong muscles?', praise: 'Strong hero! Leafy green vegetables!' },
      { id: 'potato', visual: '🥔', label: 'Potato', sub: 'Grows Underground', clueEmoji: '🌱', prompt: 'Which brown vegetable grows under the soil?', hint: 'Hint: Used to make mashed potatoes', voice: 'Which brown vegetable grows under the soil?', praise: 'Nice work! Potatoes grow underground!' },
      { id: 'strawberry', visual: '🍓', label: 'Strawberry', sub: 'Seeds on Outside', clueEmoji: '💖', prompt: 'Find the heart-shaped red berry with tiny seeds!', hint: 'Hint: Sweet pink/red berry', voice: 'Find the red Strawberry!', praise: 'Sweet! You found the Strawberry!' },
      { id: 'avocado', visual: '🥑', label: 'Avocado', sub: 'Creamy Green', clueEmoji: '🥪', prompt: 'Which green fruit has one big round seed in the center?', hint: 'Hint: Soft and creamy green inside', voice: 'Which fruit has a big round seed inside?', praise: 'Healthy fats! Avocado!' },
      { id: 'kiwi', visual: '🥝', label: 'Kiwi Fruit', sub: 'Fuzzy Outside, Green Inside', clueEmoji: '✨', prompt: 'Which fuzzy brown fruit is bright green inside with tiny black seeds?', hint: 'Hint: Tangy vitamin-rich fruit', voice: 'Find the fuzzy brown and green Kiwi fruit!', praise: 'Tangy and sweet! Kiwi!' },
      { id: 'lemon', visual: '🍋', label: 'Lemon', sub: 'Sour Yellow Citrus', clueEmoji: '🍋', prompt: 'Which bright yellow citrus fruit tastes tangy in lemonade?', hint: 'Hint: Makes refreshing summer drink', voice: 'Which yellow fruit makes tangy lemonade?', praise: 'Zesty! That is a Lemon!' },
      { id: 'pumpkin', visual: '🎃', label: 'Pumpkin', sub: 'Big Orange Gourd', clueEmoji: '🍂', prompt: 'Which big round orange vegetable grows on vines in autumn?', hint: 'Hint: Heavy round orange squash', voice: 'Find the big round orange Pumpkin!', praise: 'Awesome! Big round Pumpkin!' }
    ]
  }
});

// ==============================================================================
// 4. Body Parts (Interactive Body Sense Explorer + 24 Parts & Organs)
// ==============================================================================
window.bodyPartsModule = new MultiLevelActivityModule({
  key: 'bodyparts',
  title: 'Body Parts',
  badgeEmoji: '🧍',
  explorerTitle: 'Tap any body part to hear how your amazing body works!',
  explorerItems: [
    { visual: '👀', label: 'Eyes', speak: 'Eyes help us see bright colors, friends, and words.' },
    { visual: '👂', label: 'Ears', speak: 'Ears help us listen to music and gentle voices.' },
    { visual: '👃', label: 'Nose', speak: 'Nose helps us breathe fresh air and smell flowers.' },
    { visual: '👄', label: 'Mouth', speak: 'Mouth helps us smile, talk kindly, and eat healthy meals.' },
    { visual: '🙌', label: 'Hands', speak: 'Hands help us draw, clap, wave hello, and hug.' },
    { visual: '🖐️', label: 'Fingers', speak: 'Ten fingers help us count, hold pencils, and play.' },
    { visual: '🦶', label: 'Feet', speak: 'Feet keep our balance so we can walk, run, and jump.' },
    { visual: '🦵', label: 'Legs', speak: 'Strong legs bend at our knees and help us climb.' },
    { visual: '🦷', label: 'Teeth', speak: 'Clean white teeth chew food carefully.' },
    { visual: '👅', label: 'Tongue', speak: 'Our tongue helps us taste sweet, sour, and yummy food.' },
    { visual: '❤️', label: 'Heart', speak: 'Our heart beats steady thump-thump pumping blood everywhere.' },
    { visual: '🧠', label: 'Brain', speak: 'Our brain thinks, imagines, and remembers things we learn.' }
  ],
  pools: {
    easy: [
      { id: 'eyes', visual: '👀', label: 'Eyes', sub: 'To See', clueEmoji: '👁️', prompt: 'Tap the Eyes that help us see!', voice: 'Tap the Eyes that help us see!', praise: 'Great! We see colors with our Eyes!' },
      { id: 'ears', visual: '👂', label: 'Ears', sub: 'To Listen', clueEmoji: '🎵', prompt: 'Tap the Ears that help us hear music!', voice: 'Tap the Ears that help us listen!', praise: 'Super! We listen with our Ears!' },
      { id: 'nose', visual: '👃', label: 'Nose', sub: 'To Smell', clueEmoji: '🌸', prompt: 'Find the Nose that smells sweet flowers!', voice: 'Find the Nose that smells flowers!', praise: 'Nice! We breathe and smell with our Nose!' },
      { id: 'hands', visual: '🙌', label: 'Hands', sub: 'To Clap & Wave', clueEmoji: '👏', prompt: 'Tap the Hands we use to wave Hello!', voice: 'Tap the Hands we use to wave hello!', praise: 'High five! Those are our Hands!' },
      { id: 'mouth', visual: '👄', label: 'Mouth', sub: 'To Smile & Eat', clueEmoji: '😊', prompt: 'Tap the Mouth that smiles and eats yummy apples!', voice: 'Tap the Mouth we use to smile and eat!', praise: 'Bright smile! That is our Mouth!' },
      { id: 'feet', visual: '🦶', label: 'Feet', sub: 'Wear Socks & Shoes', clueEmoji: '👟', prompt: 'Find the Feet where we put on shoes!', voice: 'Find the Feet where we wear socks and shoes!', praise: 'Tap tap! Those are our Feet!' },
      { id: 'fingers', visual: '🖐️', label: 'Fingers', sub: 'Five on Each Hand', clueEmoji: '✏️', prompt: 'Tap the Hand showing five Fingers to count!', voice: 'Tap the five Fingers we use to hold crayons!', praise: 'Five fingers! Great job counting!' },
      { id: 'arm', visual: '💪', label: 'Strong Arm', sub: 'Lift & Hug', clueEmoji: '🎒', prompt: 'Tap the strong Arm that helps carry our school bag!', voice: 'Tap the strong Arm!', praise: 'Strong muscles! That is an Arm!' }
    ],
    medium: [
      { id: 'mouth', visual: '👄', label: 'Mouth', sub: 'To Smile & Speak', clueEmoji: '😊', prompt: 'Which body part helps us smile, talk, and eat?', voice: 'Which part helps us smile and speak?', praise: 'Wonderful smile! Mouth!' },
      { id: 'feet', visual: '🦶', label: 'Feet', sub: 'To Walk & Jump', clueEmoji: '👟', prompt: 'Which body part wears shoes and helps us walk?', voice: 'Which part wears shoes and helps us walk?', praise: 'Tap tap! Feet help us walk and run!' },
      { id: 'teeth', visual: '🦷', label: 'Teeth', sub: 'To Chew Food', clueEmoji: '🪥', prompt: 'Which white part inside our mouth chews food?', voice: 'Which white part helps chew healthy food?', praise: 'Sparkling clean! Teeth!' },
      { id: 'heart', visual: '❤️', label: 'Heart', sub: 'Pumps Blood', clueEmoji: '💓', prompt: 'Which organ inside our chest beats thump-thump?', voice: 'Which organ inside our chest pumps blood?', praise: 'Healthy beat! Our Heart!' },
      { id: 'hair', visual: '💇', label: 'Hair & Head', sub: 'Top of Body', clueEmoji: '🪮', prompt: 'Which part sits on top of our head that we comb neatly?', voice: 'Which part on top of our head do we comb?', praise: 'Neat and tidy! Hair on our head!' },
      { id: 'thumb', visual: '👍', label: 'Thumb', sub: 'Helps Grip', clueEmoji: '👍', prompt: 'Which short strong finger helps give a big Thumbs Up?', voice: 'Tap the Thumb giving a thumbs up!', praise: 'Thumbs up! Our Thumb helps us hold things!' },
      { id: 'leg', visual: '🦵', label: 'Leg', sub: 'Walk & Kick', clueEmoji: '⚽', prompt: 'Which long limb connects our hip down to our foot?', voice: 'Tap the Leg we use to run and kick!', praise: 'Great running! Those are our Legs!' },
      { id: 'palm', visual: '✋', label: 'Palm & Hand', sub: 'High Five!', clueEmoji: '🙌', prompt: 'Which flat front part of our hand gives a gentle High Five?', voice: 'Find the open Hand palm for a high five!', praise: 'High five! Nice work!' }
    ],
    advanced: [
      { id: 'brain', visual: '🧠', label: 'Brain', sub: 'Thinking Center', clueEmoji: '💡', prompt: 'Which part inside our head helps us think and learn?', hint: 'Hint: Safe inside our skull', voice: 'Which part inside our head helps us think and remember?', praise: 'Genius! Your Brain helps you learn!' },
      { id: 'lungs', visual: '🫁', label: 'Lungs', sub: 'Take Deep Breaths', clueEmoji: '🌬️', prompt: 'Which pair of organs fills with fresh air when we breathe?', hint: 'Hint: Takes in oxygen', voice: 'Which organs fill with fresh air when we breathe in?', praise: 'Deep breath! Healthy Lungs!' },
      { id: 'knee', visual: '🦵', label: 'Knee Joint', sub: 'Bend & Climb', clueEmoji: '⚽', prompt: 'Which joint in the middle of our leg bends when sitting?', hint: 'Hint: Helps us climb stairs smoothly', voice: 'Which joint bends in the middle of our leg?', praise: 'Awesome! Knees help us bend and jump!' },
      { id: 'tongue', visual: '👅', label: 'Tongue', sub: 'Tastes Food', clueEmoji: '🍓', prompt: 'Which part tastes sweet, sour, and salty flavors?', hint: 'Hint: Inside the mouth', voice: 'Which part helps us taste sweet and sour food?', praise: 'Yum! Our Tongue helps us taste!' },
      { id: 'bone', visual: '🦴', label: 'Bones', sub: 'Body Frame', clueEmoji: '🥛', prompt: 'What strong frame inside us helps stand tall like pillars?', hint: 'Hint: Milk and calcium keep them strong', voice: 'What strong parts inside our body help us stand tall?', praise: 'Strong skeleton! Healthy Bones!' },
      { id: 'eyelid', visual: '👁️', label: 'Eye & Blink', sub: 'Protects Sight', clueEmoji: '✨', prompt: 'Which sense organ blinks smoothly to stay moist and clear?', hint: 'Hint: Has an iris and pupil', voice: 'Which organ blinks cleanly to protect sight?', praise: 'Bright eyes! Caring for our vision!' },
      { id: 'muscle', visual: '💪', label: 'Muscles', sub: 'Helps Move & Lift', clueEmoji: '🏃', prompt: 'What stretchy power helpers pull on bones so we can run and jump?', hint: 'Hint: Grow stronger with exercise and protein', voice: 'What helps pull our arms and legs so we can move?', praise: 'Strong mover! Healthy Muscles!' },
      { id: 'spine', visual: '🧘', label: 'Back & Posture', sub: 'Sit Straight', clueEmoji: '🪑', prompt: 'Sitting tall keeps which central row of back bones happy?', hint: 'Hint: Straight posture during study', voice: 'Which part runs down the center of your back when sitting tall?', praise: 'Great posture! Straight back and spine!' }
    ]
  }
});

// ==============================================================================
// 5. Safety & Awareness (Explorer + 18 Practical Scenarios)
// ==============================================================================
window.safetyModule = new MultiLevelActivityModule({
  key: 'safety',
  title: 'Safety & Awareness',
  badgeEmoji: '🚦',
  explorerTitle: 'Tap any safety badge to hear an important safety tip!',
  explorerItems: [
    { visual: '🛑', label: 'Red Light Stop', speak: 'Red light means Stop and wait safely.' },
    { visual: '🟢', label: 'Green Light Go', speak: 'Green light means look both ways, then go with an adult.' },
    { visual: '🪖', label: 'Bike Helmet', speak: 'Always buckle a helmet before riding a bicycle.' },
    { visual: '💺', label: 'Seatbelt', speak: 'Click your seatbelt every time you sit in a car.' },
    { visual: '🔥', label: 'Hot Stove', speak: 'Never touch hot stoves or matches. Ask an adult for help.' },
    { visual: '🩹', label: 'First Aid', speak: 'Clean tiny scrapes gently and tell an adult.' },
    { visual: '📞', label: 'Call Helper', speak: 'Know your parents names and ask a uniform helper if lost.' }
  ],
  pools: {
    easy: [
      { id: 'traffic_red', visual: '🛑', label: 'STOP on Red', sub: 'Road Safety', clueEmoji: '🚦', prompt: 'The traffic light is RED. What should we do?', voice: 'The traffic light is red. Tap what we should do!', praise: 'Safe choice! Red means Stop and Wait!' },
      { id: 'helmet', visual: '🪖', label: 'Wear a Helmet', sub: 'Bicycle Safety', clueEmoji: '🚲', prompt: 'Before riding a bicycle, what protects your head?', voice: 'Before riding a bicycle, what keeps your head safe?', praise: 'Great job! Always wear a Helmet!' },
      { id: 'seatbelt', visual: '🚗', label: 'Buckle Seatbelt', sub: 'Car Safety', clueEmoji: '💺', prompt: 'When sitting inside a car, we always buckle our...', voice: 'Inside a car, what keeps us safe in our seat?', praise: 'Click-clack! Seatbelts keep us safe!' },
      { id: 'green_go', visual: '🚶‍♂️', label: 'Cross with Adult', sub: 'Zebra Crossing', clueEmoji: '🚦', prompt: 'How should we cross a busy road safely?', voice: 'How do we cross a busy road safely?', praise: 'Smart! Hold an adult hand and use the crossing!' },
      { id: 'school_bus', visual: '🚌', label: 'Stay Seated on Bus', sub: 'School Bus Rule', clueEmoji: '🎒', prompt: 'When riding the school bus, what keeps everyone safe?', voice: 'Inside a moving school bus, what is the safe rule?', praise: 'Safe rider! Stay seated calmly on the bus!' },
      { id: 'umbrella_rain', visual: '☔', label: 'Rain Coat & Boots', sub: 'Weather Safety', clueEmoji: '🌧️', prompt: 'When stepping outside in heavy rain, what keeps you dry and safe?', voice: 'In rainy weather, what protects you outdoors?', praise: 'Dry and healthy! Umbrella and raincoat!' }
    ],
    medium: [
      { id: 'hot_stove', visual: '🔥', label: 'Stay Back from Fire', sub: 'Kitchen Safety', clueEmoji: '🍳', prompt: 'A stove is hot and cooking. What is the safe choice?', voice: 'The kitchen stove is hot. What should we do?', praise: 'Safe! Stay away from hot stoves and ask an adult!' },
      { id: 'outlet', visual: '🔌', label: 'Never Touch Plugs', sub: 'Electric Safety', clueEmoji: '⚡', prompt: 'Should wet hands touch wall electric sockets?', voice: 'Wall sockets carry electricity. What is the safe rule?', praise: 'Well done! Never touch electrical sockets with wet hands!' },
      { id: 'wet_floor', visual: '⚠️', label: 'Walk Slowly on Wet Floor', sub: 'Slip Prevention', clueEmoji: '💧', prompt: 'The floor has water on it. How should we move?', voice: 'The floor is wet. How should we move safely?', praise: 'Careful! Walk slowly so we do not slip!' },
      { id: 'firefighter', visual: '🚒', label: 'Call Fire Help', sub: 'Emergency Helper', clueEmoji: '👨‍🚒', prompt: 'Who helps put out big fires and rescue people?', voice: 'Who helps put out fires safely?', praise: 'Yes! Firefighters are brave community helpers!' },
      { id: 'scissors', visual: '✂️', label: 'Point Scissors Down', sub: 'Craft Safety', clueEmoji: '🎨', prompt: 'When walking with craft scissors in class, how do we carry them safely?', voice: 'How do we safely hold craft scissors when walking?', praise: 'Safe hands! Hold the closed blades pointing down carefully!' },
      { id: 'swim_ring', visual: '🛟', label: 'Pool Float & Adult Watch', sub: 'Water Safety', clueEmoji: '🏊', prompt: 'Before swimming in a pool, what keeps us safe in deep water?', voice: 'Near a swimming pool, what keeps us safe?', praise: 'Splash safely! Always swim with an adult nearby!' }
    ],
    advanced: [
      { id: 'stranger', visual: '🧑‍🤝‍🧑', label: 'Tell Parent or Teacher', sub: 'Trusted Adults', clueEmoji: '🛡️', prompt: 'If someone you do not know offers candy to go with them, what do you do?', hint: 'Stay with your trusted caregiver', voice: 'If a stranger asks you to go away with them, what should you do?', praise: 'Very brave and smart! Say No and tell a trusted adult!' },
      { id: 'medicine', visual: '💊', label: 'Only From Parent/Doctor', sub: 'Medicine Safety', clueEmoji: '🩺', prompt: 'You see colorful pills on a table. Who can give medicine?', hint: 'Pills are not candy', voice: 'When is it safe to take medicine?', praise: 'Safe choice! Only take medicine given by parents or a doctor!' },
      { id: 'first_aid', visual: '🩹', label: 'Clean & Bandage Cut', sub: 'First Aid Care', clueEmoji: '🏥', prompt: 'If you get a small scrape while playing, what helps heal it?', hint: 'Tell an adult to clean it', voice: 'If you get a small scrape, what helps protect it?', praise: 'Awesome! Clean it gently and put on a bandage!' },
      { id: 'address', visual: '📞', label: 'Know Parent Phone/Name', sub: 'Lost Helper Rule', clueEmoji: '👮', prompt: 'If you ever get lost in a mall, who can you ask to call your family?', hint: 'Look for a uniformed guard or store helper', voice: 'If you get lost in a store, who can help call your family?', praise: 'Smart! Stay in one place and ask a store helper or officer!' },
      { id: 'fire_drill', visual: '🔔', label: 'Walk Calmly Outside', sub: 'School Drill', clueEmoji: '🏫', prompt: 'When the school fire alarm rings, how does the class exit?', hint: 'Listen to teacher and stay in single file', voice: 'When the fire drill alarm rings, what should students do?', praise: 'Calm and safe! Walk together outside with your teacher!' },
      { id: 'sun_hat', visual: '👒', label: 'Shade, Hat & Water', sub: 'Sunny Day Care', clueEmoji: '☀️', prompt: 'Playing outdoors in strong afternoon sun requires wearing a...', hint: 'Protect your head and stay cool', voice: 'In strong afternoon sunshine outdoors, what helps protect you?', praise: 'Smart care! Wear a sun hat and drink plenty of water!' }
    ]
  }
});

// ==============================================================================
// 6. Personal Hygiene (Explorer + 18 Clean Habit Scenarios)
// ==============================================================================
window.hygieneModule = new MultiLevelActivityModule({
  key: 'hygiene',
  title: 'Personal Hygiene',
  badgeEmoji: '🧼',
  explorerTitle: 'Tap a clean habit to learn how to stay healthy and fresh!',
  explorerItems: [
    { visual: '🧼', label: 'Wash Hands', speak: 'Wash hands for twenty seconds with soap and clean water.' },
    { visual: '🪥', label: 'Brush Teeth', speak: 'Brush morning and night to keep teeth shiny and healthy.' },
    { visual: '🛁', label: 'Daily Bath', speak: 'Taking a warm bath washes off sweat and dust.' },
    { visual: '🤧', label: 'Cover Sneeze', speak: 'Sneeze into a soft tissue or your bent elbow.' },
    { visual: '🧻', label: 'Dry Cleanly', speak: 'Dry wet hands cleanly using your own soft towel.' },
    { visual: '💧', label: 'Drink Water', speak: 'Clean water keeps your body hydrated and energized.' }
  ],
  pools: {
    easy: [
      { id: 'wash_hands', visual: '🧼', label: 'Wash Hands', sub: 'Soap & Water', clueEmoji: '🤲', prompt: 'What keeps germs off our hands before eating?', voice: 'Before eating food, tap how we clean our hands!', praise: 'Sparkly clean! Always wash hands with soap!' },
      { id: 'brush_teeth', visual: '🪥', label: 'Brush Teeth', sub: 'Morning & Night', clueEmoji: '😁', prompt: 'What keeps our smile healthy and clean?', voice: 'What should we use every morning and night for clean teeth?', praise: 'Minty fresh! Brush teeth twice a day!' },
      { id: 'comb_hair', visual: '🪮', label: 'Comb Hair', sub: 'Stay Neat', clueEmoji: '✨', prompt: 'Tap what makes our hair neat and tidy!', voice: 'What do we use to keep our hair neat and tidy?', praise: 'Looking sharp! Great job combing!' },
      { id: 'bath', visual: '🛁', label: 'Take a Bath', sub: 'Fresh Body', clueEmoji: '🫧', prompt: 'After playing outside, what cleans our whole body?', voice: 'What helps wash away sweat and dirt every day?', praise: 'Fresh and clean! Bath time is fun!' },
      { id: 'shampoo', visual: '🧴', label: 'Wash Hair', sub: 'Gentle Shampoo', clueEmoji: '🚿', prompt: 'What gentle soap washes dust cleanly out of our hair?', voice: 'What helps clean our hair nicely during bath time?', praise: 'So soft and fresh! Shampoo keeps hair clean!' },
      { id: 'clean_socks', visual: '🧦', label: 'Fresh Clean Socks', sub: 'Foot Hygiene', clueEmoji: '👟', prompt: 'Every morning before putting on school shoes, wear clean...', voice: 'Before putting on shoes, what should always be fresh and clean?', praise: 'Happy feet! Clean socks feel great!' }
    ],
    medium: [
      { id: 'sneeze', visual: '🤧', label: 'Use Tissue or Elbow', sub: 'Cover Sneeze', clueEmoji: '💪', prompt: 'When we sneeze or cough, how do we keep friends healthy?', voice: 'When we cough or sneeze, how do we stop germs from spreading?', praise: 'Polite and safe! Cover with a tissue or elbow!' },
      { id: 'nails', visual: '💅', label: 'Keep Nails Trimmed', sub: 'Ask Adult Help', clueEmoji: '✂️', prompt: 'Why should we trim long fingernails cleanly?', voice: 'What keeps dirt from hiding under our fingernails?', praise: 'Neat hands! Trimming nails keeps dirt away!' },
      { id: 'towel', visual: '🧻', label: 'Dry With Clean Towel', sub: 'Your Own Towel', clueEmoji: '💧', prompt: 'After washing hands or bathing, what dries us cleanly?', voice: 'What should we use to dry wet hands cleanly?', praise: 'Nice and dry! Use a clean towel!' },
      { id: 'clean_clothes', visual: '👕', label: 'Wear Fresh Clothes', sub: 'Clean Shirt', clueEmoji: '☀️', prompt: 'Every morning after bathing, we put on...', voice: 'After our bath, what keeps us comfortable and fresh?', praise: 'Looking great in clean fresh clothes!' },
      { id: 'wipe_desk', visual: '🧽', label: 'Wipe Study Table', sub: 'Clean Space', clueEmoji: '📚', prompt: 'After art and craft paint play, what cleans our table?', voice: 'How do we keep our art desk neat after painting?', praise: 'Tidy artist! A clean table makes learning fun!' },
      { id: 'wash_face', visual: '💧', label: 'Splash Cool Water', sub: 'Morning Freshness', clueEmoji: '🌅', prompt: 'When waking up sleepy in the morning, washing our face feels...', voice: 'Every morning when waking up, what refreshes your face?', praise: 'Wide awake and fresh!' }
    ],
    advanced: [
      { id: 'wash_fruit', visual: '🍎', label: 'Wash Fruits First', sub: 'Food Hygiene', clueEmoji: '🚰', prompt: 'Before biting into a fresh fruit from the market, we should...', hint: 'Rinse off dust safely', voice: 'Before eating fresh fruits, what must we do first?', praise: 'Healthy habit! Always rinse fruits in clean water!' },
      { id: 'sleep_hygiene', visual: '😴', label: 'Sleep 8-9 Hours', sub: 'Rest & Clean Bed', clueEmoji: '🌙', prompt: 'Washing your face and resting at night helps your body...', hint: 'Recharges energy for tomorrow', voice: 'How does good nighttime sleep help our body?', praise: 'Well rested! Clean face and good sleep keep us strong!' },
      { id: 'flush_wash', visual: '🚽', label: 'Flush & Wash Hands', sub: 'Restroom Rule', clueEmoji: '🧼', prompt: 'After using the bathroom, what are the two important steps?', hint: 'Flush first, then soap', voice: 'After using the toilet, what must we always do?', praise: 'Clean superstar! Flush and wash with soap!' },
      { id: 'water_bottle', visual: '🥤', label: 'Drink Clean Water', sub: 'Stay Hydrated', clueEmoji: '💧', prompt: 'What clean drink keeps our body cool and hydrated all day?', hint: 'Better than sugary soda', voice: 'Which healthy drink keeps our body hydrated?', praise: 'Hydrated! Clean drinking water is the best!' },
      { id: 'floss_clean', visual: '🦷', label: 'Clean Between Teeth', sub: 'Dental Care', clueEmoji: '✨', prompt: 'Besides brushing, gently cleaning between teeth stops...', hint: 'Stops tiny food bits hiding', voice: 'Why do dentists remind us to clean between teeth cleanly?', praise: 'Super smile! Caring well for teeth!' },
      { id: 'laundry_basket', visual: '🧺', label: 'Put Dirty Clothes in Basket', sub: 'Keep Room Fresh', clueEmoji: '👕', prompt: 'After playing muddy sports, where do sweaty clothes go?', hint: 'Put them ready for washing', voice: 'Where do dirty outdoor clothes belong?', praise: 'Organized! Straight into the laundry basket!' }
    ]
  }
});

// ==============================================================================
// 7. Social Skills (Explorer + 18 Social-Emotional Interactions)
// ==============================================================================
window.socialModule = new MultiLevelActivityModule({
  key: 'social',
  title: 'Social Skills',
  badgeEmoji: '🤝',
  explorerTitle: 'Tap any kindness badge to practice friendly words!',
  explorerItems: [
    { visual: '👋', label: 'Hello', speak: 'Smile, wave gently, and say Hello friend.' },
    { visual: '🙏', label: 'Thank You', speak: 'Saying Thank You shows appreciation for help.' },
    { visual: '🌸', label: 'Please', speak: 'Say Please when politely asking for something.' },
    { visual: '🧸', label: 'Share', speak: 'Sharing blocks and toys makes playtime happier.' },
    { visual: '👂', label: 'Listen', speak: 'Wait quietly and listen when someone else speaks.' },
    { visual: '💛', label: 'Help', speak: 'Offer a helping hand when a friend drops something.' }
  ],
  pools: {
    easy: [
      { id: 'thank_you', visual: '🙏', label: 'Say Thank You', sub: 'Polite Word', clueEmoji: '🎁', prompt: 'When someone gives you a gift or helps you, what do you say?', voice: 'When a friend helps you, what magic word do you say?', praise: 'So polite! Saying Thank You makes people smile!' },
      { id: 'hello', visual: '👋', label: 'Wave & Say Hello', sub: 'Friendly Greeting', clueEmoji: '😊', prompt: 'When you meet your teacher or friend in the morning, tap how we greet!', voice: 'How do we greet friends kindly in the morning?', praise: 'Hello friend! Friendly greetings are wonderful!' },
      { id: 'share', visual: '🧸', label: 'Share Toys', sub: 'Play Together', clueEmoji: '👫', prompt: 'A friend wants to play with blocks too. What makes everyone happy?', voice: 'Your friend wants to build blocks too. Tap the kind choice!', praise: 'Kind heart! Sharing makes playtime twice as fun!' },
      { id: 'please', visual: '🌸', label: 'Say Please', sub: 'Kind Asking', clueEmoji: '💬', prompt: 'What gentle magic word helps when asking for something?', voice: 'What polite word do we use when asking nicely?', praise: 'Yes! Please is a wonderful magic word!' },
      { id: 'smile', visual: '😊', label: 'Friendly Smile', sub: 'Warm Welcome', clueEmoji: '✨', prompt: 'What bright expression on your face helps friends feel welcome?', voice: 'What warm facial expression makes friends feel happy?', praise: 'Lovely smile! Warm smiles brighten the room!' },
      { id: 'gentle_hands', visual: '🤲', label: 'Gentle Hands', sub: 'Safe Touch', clueEmoji: '🐱', prompt: 'When petting a puppy or playing beside friends, we use...', voice: 'How should we use our hands when touching toys or pets?', praise: 'So gentle! Kind and gentle hands keep everyone safe!' }
    ],
    medium: [
      { id: 'take_turns', visual: '⏳', label: 'Wait Your Turn', sub: 'Patience in Line', clueEmoji: '🛝', prompt: 'Friends are waiting to go down the slide. What should we do?', voice: 'Friends are lining up for the slide. What is the fair choice?', praise: 'Fair player! Taking turns keeps everyone happy!' },
      { id: 'sorry', visual: '💐', label: 'Say I Am Sorry', sub: 'Kind Apology', clueEmoji: '🤝', prompt: 'If you bump into a classmate by accident, what helps them feel better?', voice: 'If you accidentally bump a friend, what can you say?', praise: 'So caring! Saying sorry and checking if they are okay helps!' },
      { id: 'listen', visual: '👂', label: 'Listen Quietly', sub: 'Respect Speaker', clueEmoji: '🏫', prompt: 'When someone else is speaking in class, how do we show respect?', voice: 'When a teacher or friend is talking, what helps us listen?', praise: 'Great listener! Looking and listening shows respect!' },
      { id: 'clean_together', visual: '🧹', label: 'Help Tidy Up', sub: 'Teamwork', clueEmoji: '✨', prompt: 'Playtime is finished. How can friends help in the classroom?', voice: 'After playtime finishes, how do good classmates help?', praise: 'Awesome helper! Cleaning up together finishes fast!' },
      { id: 'excuse_me', visual: '🙋', label: 'Say Excuse Me', sub: 'Polite Walking', clueEmoji: '🚪', prompt: 'If two people stand in a doorway and you need to pass, say...', voice: 'When you politely need space to pass, what do you say?', praise: 'Such good manners! Excuse me!' },
      { id: 'cheer_team', visual: '👏', label: 'Cheer for Friends', sub: 'Good Sport', clueEmoji: '🏆', prompt: 'When a friend scores a goal or wins a puzzle, what can we do?', voice: 'When a friend does a great job, how can you celebrate them?', praise: 'Awesome teammate! Clapping for friends feels wonderful!' }
    ],
    advanced: [
      { id: 'help_friend', visual: '📚', label: 'Help Pick Up', sub: 'Empathy', clueEmoji: '💛', prompt: 'Your classmate drops their books on the floor. What can a kind friend do?', hint: 'Lend a helping hand', voice: 'A classmate drops their books. What would a kind friend do?', praise: 'True friend! Helping others makes our school wonderful!' },
      { id: 'include_friend', visual: '🎈', label: 'Invite to Join', sub: 'Inclusion', clueEmoji: '🧑‍🤝‍🧑', prompt: 'A new student is sitting alone at recess. What makes them feel welcome?', hint: 'Ask if they want to play', voice: 'Someone is sitting alone. How can we help them feel welcome?', praise: 'Inclusive hero! Inviting others builds great friendships!' },
      { id: 'calm_words', visual: '🫧', label: 'Use Calm Words', sub: 'Problem Solving', clueEmoji: '🗣️', prompt: 'If you feel upset because a game did not go your way, what works best?', hint: 'Take a deep breath and explain calmly', voice: 'If you feel frustrated during a game, what is the helpful choice?', praise: 'Great self-control! Calm breathing and kind words solve problems!' },
      { id: 'personal_space', visual: '🫧', label: 'Respect Space', sub: 'Kind Boundaries', clueEmoji: '🙌', prompt: 'If a friend says "Please give me some space", what do we do?', hint: 'Listen to their feelings', voice: 'If a friend asks for quiet space, what should we do?', praise: 'Respectful friend! Always honor personal space!' },
      { id: 'knock_door', visual: '🚪', label: 'Knock Before Entering', sub: 'Privacy & Respect', clueEmoji: '🙏', prompt: 'Before walking into a closed room or office, what polite step comes first?', hint: 'Knock gently and wait', voice: 'What polite step comes before opening a closed room door?', praise: 'Respectful! Knock and wait calmly!' },
      { id: 'compliment', visual: '🌟', label: 'Give a Kind Compliment', sub: 'Spread Joy', clueEmoji: '🎨', prompt: 'Your friend painted a colorful rainbow picture. What kind words can you share?', hint: 'Tell them what you liked', voice: 'How can you encourage a friend who drew a nice painting?', praise: 'Kind heart! Encouraging words brighten someone day!' }
    ]
  }
});
