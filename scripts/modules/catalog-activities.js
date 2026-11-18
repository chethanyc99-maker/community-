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
// 1. Alphabet Learning
// ==============================================================================
window.alphabetModule = new MultiLevelActivityModule({
  key: 'alphabet',
  title: 'Alphabet Learning',
  badgeEmoji: '🔤',
  explorerTitle: 'Tap any letter card to hear its phonics sound!',
  explorerItems: [
    { visual: '🍎', label: 'A', speak: 'A is for Apple. Ahh.' },
    { visual: '⚽', label: 'B', speak: 'B is for Ball. Buh.' },
    { visual: '🐱', label: 'C', speak: 'C is for Cat. Kuh.' },
    { visual: '🐶', label: 'D', speak: 'D is for Dog. Duh.' },
    { visual: '🐘', label: 'E', speak: 'E is for Elephant. Eh.' },
    { visual: '🐟', label: 'F', speak: 'F is for Fish. Fff.' },
    { visual: '🍇', label: 'G', speak: 'G is for Grapes. Guh.' },
    { visual: '☀️', label: 'S', speak: 'S is for Sun. Sss.' }
  ],
  pools: {
    easy: [
      { id: 'A', visual: 'A', visualStyle: 'color:#FF3B30;font-weight:800;', label: 'Letter A', sub: '🍎 Apple', clueEmoji: '🍎', celebrateEmoji: '🍎', prompt: 'Tap the Letter A (Apple)!', voice: 'Tap the letter A! A is for Apple.', praise: 'Awesome! A is for Apple!' },
      { id: 'B', visual: 'B', visualStyle: 'color:#007AFF;font-weight:800;', label: 'Letter B', sub: '⚽ Ball', clueEmoji: '⚽', celebrateEmoji: '⚽', prompt: 'Tap the Letter B (Ball)!', voice: 'Tap the letter B! B is for Ball.', praise: 'Brilliant! B is for Ball!' },
      { id: 'C', visual: 'C', visualStyle: 'color:#34C759;font-weight:800;', label: 'Letter C', sub: '🐱 Cat', clueEmoji: '🐱', celebrateEmoji: '🐱', prompt: 'Tap the Letter C (Cat)!', voice: 'Tap the letter C! C is for Cat.', praise: 'Super! C is for Cat!' },
      { id: 'D', visual: 'D', visualStyle: 'color:#FF9500;font-weight:800;', label: 'Letter D', sub: '🐶 Dog', clueEmoji: '🐶', celebrateEmoji: '🐶', prompt: 'Tap the Letter D (Dog)!', voice: 'Tap the letter D! D is for Dog.', praise: 'Well done! D is for Dog!' }
    ],
    medium: [
      { id: 'E', visual: 'E', visualStyle: 'color:#AF52DE;font-weight:800;', label: 'E — Elephant', sub: '🐘', clueEmoji: '🐘', celebrateEmoji: '🐘', prompt: 'Which letter starts Elephant?', voice: 'Which letter is for Elephant? Tap E.', praise: 'Excellent! E is for Elephant!' },
      { id: 'F', visual: 'F', visualStyle: 'color:#00C7BE;font-weight:800;', label: 'F — Fish', sub: '🐟', clueEmoji: '🐟', celebrateEmoji: '🐟', prompt: 'Which letter starts Fish?', voice: 'Which letter is for Fish? Tap F.', praise: 'Fantastic! F is for Fish!' },
      { id: 'G', visual: 'G', visualStyle: 'color:#34C759;font-weight:800;', label: 'G — Grapes', sub: '🍇', clueEmoji: '🍇', celebrateEmoji: '🍇', prompt: 'Which letter starts Grapes?', voice: 'Which letter is for Grapes? Tap G.', praise: 'Great job! G is for Grapes!' },
      { id: 'H', visual: 'H', visualStyle: 'color:#FF2D55;font-weight:800;', label: 'H — House', sub: '🏠', clueEmoji: '🏠', celebrateEmoji: '🏠', prompt: 'Which letter starts House?', voice: 'Which letter is for House? Tap H.', praise: 'Hurray! H is for House!' },
      { id: 'M', visual: 'M', visualStyle: 'color:#5856D6;font-weight:800;', label: 'M — Mango', sub: '🥭', clueEmoji: '🥭', celebrateEmoji: '🥭', prompt: 'Which letter starts Mango?', voice: 'Which letter is for Mango? Tap M.', praise: 'Marvelous! M is for Mango!' }
    ],
    advanced: [
      { id: 'P', visual: 'P p', visualStyle: 'color:#FF9500;font-weight:800;', label: 'P — Pencil', sub: '✏️', clueEmoji: '✏️', celebrateEmoji: '✏️', prompt: 'Match the starting letter for Pencil!', hint: 'Sounds like Puh-Puh-Pencil', voice: 'Match the starting letter for Pencil.', praise: 'Yes! P is for Pencil!' },
      { id: 'R', visual: 'R r', visualStyle: 'color:#FF3B30;font-weight:800;', label: 'R — Rainbow', sub: '🌈', clueEmoji: '🌈', celebrateEmoji: '🌈', prompt: 'Find the starting letter for Rainbow!', hint: 'Sounds like Rrr-Rainbow', voice: 'Find the starting letter for Rainbow.', praise: 'Right on! R is for Rainbow!' },
      { id: 'S', visual: 'S s', visualStyle: 'color:#FFCC00;font-weight:800;', label: 'S — Sun', sub: '☀️', clueEmoji: '☀️', celebrateEmoji: '☀️', prompt: 'Which letter begins the word Sun?', hint: 'Sounds like Sss-Sun', voice: 'Which letter begins the word Sun?', praise: 'Sparkling! S is for Sun!' },
      { id: 'T', visual: 'T t', visualStyle: 'color:#34C759;font-weight:800;', label: 'T — Tree', sub: '🌳', clueEmoji: '🌳', celebrateEmoji: '🌳', prompt: 'Tap the letter that begins Tree!', hint: 'Sounds like Tuh-Tree', voice: 'Tap the letter that begins Tree.', praise: 'Terrific! T is for Tree!' },
      { id: 'Z', visual: 'Z z', visualStyle: 'color:#5856D6;font-weight:800;', label: 'Z — Zebra', sub: '🦓', clueEmoji: '🦓', celebrateEmoji: '🦓', prompt: 'Find the last letter of the alphabet: Zebra!', hint: 'Zzz-Zebra', voice: 'Find the letter Z for Zebra.', praise: 'Amazing! Z is for Zebra!' }
    ]
  }
});

// ==============================================================================
// 2. Animals & Birds
// ==============================================================================
window.animalsModule = new MultiLevelActivityModule({
  key: 'animals',
  title: 'Animals & Birds',
  badgeEmoji: '🦁',
  pools: {
    easy: [
      { id: 'dog', visual: '🐶', label: 'Dog', sub: 'Woof!', clueEmoji: '🦴', prompt: 'Tap the friendly Dog!', voice: 'Tap the friendly Dog that goes woof!', praise: 'Good job! That is a Dog!' },
      { id: 'cat', visual: '🐱', label: 'Cat', sub: 'Meow!', clueEmoji: '🐾', prompt: 'Find the cute Cat!', voice: 'Find the cute Cat that says meow!', praise: 'Purr-fect! That is a Cat!' },
      { id: 'duck', visual: '🦆', label: 'Duck', sub: 'Quack!', clueEmoji: '💧', prompt: 'Tap the Duck that swims in water!', voice: 'Tap the Duck that says quack!', praise: 'Yay! That is a Duck!' },
      { id: 'cow', visual: '🐄', label: 'Cow', sub: 'Moo!', clueEmoji: '🥛', prompt: 'Which animal gives us milk and says Moo?', voice: 'Which animal gives milk and says moo?', praise: 'Great! That is a Cow!' }
    ],
    medium: [
      { id: 'lion', visual: '🦁', label: 'Lion', sub: 'King of Jungle', clueEmoji: '🌿', prompt: 'Find the Lion with a big furry mane!', voice: 'Find the Lion!', praise: 'Roar! You found the Lion!' },
      { id: 'elephant', visual: '🐘', label: 'Elephant', sub: 'Long Trunk', clueEmoji: '💦', prompt: 'Tap the big Elephant with a long trunk!', voice: 'Tap the Elephant with a long trunk!', praise: 'Super! That is an Elephant!' },
      { id: 'parrot', visual: '🦜', label: 'Parrot', sub: 'Colorful Bird', clueEmoji: '🪶', prompt: 'Which green and colorful bird can talk?', voice: 'Find the colorful Parrot bird!', praise: 'Awesome! Parrots are clever birds!' },
      { id: 'owl', visual: '🦉', label: 'Owl', sub: 'Hoo Hoo', clueEmoji: '🌙', prompt: 'Tap the Owl that stays awake at night!', voice: 'Find the Owl that wakes up at night!', praise: 'Smart! That is an Owl!' }
    ],
    advanced: [
      { id: 'peacock', visual: '🦚', label: 'Peacock', sub: 'National Bird', clueEmoji: '✨', prompt: 'Which bird opens bright blue & green feathers?', hint: 'Hint: Dances when it rains', voice: 'Which bird dances with bright blue and green feathers?', praise: 'Magnificent! It is the Peacock!' },
      { id: 'penguin', visual: '🐧', label: 'Penguin', sub: 'Swims on Ice', clueEmoji: '❄️', prompt: 'Which black-and-white bird lives on ice and swims?', hint: 'Hint: Has flippers instead of flying wings', voice: 'Which bird lives on ice and swims?', praise: 'Cool! Penguins are amazing swimmers!' },
      { id: 'dolphin', visual: '🐬', label: 'Dolphin', sub: 'Ocean Friend', clueEmoji: '🌊', prompt: 'Find the smart ocean animal that jumps in waves!', hint: 'Hint: Lives in the ocean and clicks', voice: 'Find the smart ocean animal Dolphin!', praise: 'Splash! You found the Dolphin!' },
      { id: 'eagle', visual: '🦅', label: 'Eagle', sub: 'High Flyer', clueEmoji: '⛰️', prompt: 'Which strong bird flies high above mountains?', hint: 'Hint: Has sharp eyes and wide wings', voice: 'Which strong bird flies high above mountains?', praise: 'Soaring high! That is an Eagle!' }
    ]
  }
});

// ==============================================================================
// 3. Fruits & Vegetables
// ==============================================================================
window.fruitsModule = new MultiLevelActivityModule({
  key: 'fruits',
  title: 'Fruits & Vegetables',
  badgeEmoji: '🍎',
  pools: {
    easy: [
      { id: 'apple', visual: '🍎', label: 'Apple', sub: 'Sweet & Red', clueEmoji: '🧺', prompt: 'Tap the crunchy red Apple!', voice: 'Tap the crunchy red Apple!', praise: 'Yum! Apples keep us healthy!' },
      { id: 'banana', visual: '🍌', label: 'Banana', sub: 'Yellow Fruit', clueEmoji: '🧺', prompt: 'Find the yellow Banana!', voice: 'Find the yellow Banana!', praise: 'Great! Bananas give us energy!' },
      { id: 'mango', visual: '🥭', label: 'Mango', sub: 'Sweet Summer Fruit', clueEmoji: '☀️', prompt: 'Tap the juicy golden Mango!', voice: 'Tap the juicy Mango!', praise: 'Delicious! Mangoes are sweet!' },
      { id: 'carrot', visual: '🥕', label: 'Carrot', sub: 'Good for Eyes', clueEmoji: '🐰', prompt: 'Find the orange Carrot that rabbits love!', voice: 'Find the orange Carrot!', praise: 'Crunchy! Carrots help our eyes!' }
    ],
    medium: [
      { id: 'grapes', visual: '🍇', label: 'Grapes', sub: 'Small Bunch', clueEmoji: '🧺', prompt: 'Tap the purple bunch of Grapes!', voice: 'Tap the bunch of Grapes!', praise: 'Awesome! Sweet little Grapes!' },
      { id: 'tomato', visual: '🍅', label: 'Tomato', sub: 'Juicy Red', clueEmoji: '🥗', prompt: 'Find the round red Tomato!', voice: 'Find the round red Tomato!', praise: 'Yummy! Tomatoes go great in salads!' },
      { id: 'broccoli', visual: '🥦', label: 'Broccoli', sub: 'Green Tree Veggie', clueEmoji: '🌱', prompt: 'Which green vegetable looks like tiny trees?', voice: 'Find the green Broccoli vegetable!', praise: 'Healthy choice! Green Broccoli!' },
      { id: 'corn', visual: '🌽', label: 'Corn', sub: 'Golden Kernels', clueEmoji: '🌻', prompt: 'Tap the yellow Corn on the cob!', voice: 'Tap the yellow Corn!', praise: 'Pop! That is golden Corn!' }
    ],
    advanced: [
      { id: 'watermelon', visual: '🍉', label: 'Watermelon', sub: 'Green Outside, Red Inside', clueEmoji: '🌞', prompt: 'Which large summer fruit is green outside and red inside?', hint: 'Hint: Full of cool water', voice: 'Which large summer fruit is green outside and red inside?', praise: 'Refreshing! Watermelon!' },
      { id: 'spinach', visual: '🥬', label: 'Leafy Greens', sub: 'Rich in Iron', clueEmoji: '💪', prompt: 'Which leafy green vegetable gives us strong muscles?', hint: 'Hint: Dark green healthy leaves', voice: 'Which leafy green vegetable gives strong muscles?', praise: 'Strong hero! Leafy green vegetables!' },
      { id: 'potato', visual: '🥔', label: 'Potato', sub: 'Grows Underground', clueEmoji: '🌱', prompt: 'Which brown vegetable grows under the soil?', hint: 'Hint: Used to make mashed potatoes', voice: 'Which brown vegetable grows under the soil?', praise: 'Nice work! Potatoes grow underground!' },
      { id: 'strawberry', visual: '🍓', label: 'Strawberry', sub: 'Seeds on Outside', clueEmoji: '💖', prompt: 'Find the heart-shaped red berry with tiny seeds!', hint: 'Hint: Sweet pink/red berry', voice: 'Find the red Strawberry!', praise: 'Sweet! You found the Strawberry!' }
    ]
  }
});

// ==============================================================================
// 4. Body Parts
// ==============================================================================
window.bodyPartsModule = new MultiLevelActivityModule({
  key: 'bodyparts',
  title: 'Body Parts',
  badgeEmoji: '🧍',
  pools: {
    easy: [
      { id: 'eyes', visual: '👀', label: 'Eyes', sub: 'To See', clueEmoji: '👁️', prompt: 'Tap the Eyes that help us see!', voice: 'Tap the Eyes that help us see!', praise: 'Great! We see colors with our Eyes!' },
      { id: 'ears', visual: '👂', label: 'Ears', sub: 'To Listen', clueEmoji: '🎵', prompt: 'Tap the Ears that help us hear music!', voice: 'Tap the Ears that help us listen!', praise: 'Super! We listen with our Ears!' },
      { id: 'nose', visual: '👃', label: 'Nose', sub: 'To Smell', clueEmoji: '🌸', prompt: 'Find the Nose that smells sweet flowers!', voice: 'Find the Nose that smells flowers!', praise: 'Nice! We breathe and smell with our Nose!' },
      { id: 'hands', visual: '🙌', label: 'Hands', sub: 'To Clap & Wave', clueEmoji: '👏', prompt: 'Tap the Hands we use to wave Hello!', voice: 'Tap the Hands we use to wave hello!', praise: 'High five! Those are our Hands!' }
    ],
    medium: [
      { id: 'mouth', visual: '👄', label: 'Mouth', sub: 'To Smile & Speak', clueEmoji: '😊', prompt: 'Which body part helps us smile, talk, and eat?', voice: 'Which part helps us smile and speak?', praise: 'Wonderful smile! Mouth!' },
      { id: 'feet', visual: '🦶', label: 'Feet', sub: 'To Walk & Jump', clueEmoji: '👟', prompt: 'Which body part wears shoes and helps us walk?', voice: 'Which part wears shoes and helps us walk?', praise: 'Tap tap! Feet help us walk and run!' },
      { id: 'teeth', visual: '🦷', label: 'Teeth', sub: 'To Chew Food', clueEmoji: '🪥', prompt: 'Which white part inside our mouth chews food?', voice: 'Which white part helps chew healthy food?', praise: 'Sparkling clean! Teeth!' },
      { id: 'heart', visual: '❤️', label: 'Heart', sub: 'Pumps Blood', clueEmoji: '💓', prompt: 'Which organ inside our chest beats thump-thump?', voice: 'Which organ inside our chest pumps blood?', praise: 'Healthy beat! Our Heart!' }
    ],
    advanced: [
      { id: 'brain', visual: '🧠', label: 'Brain', sub: 'Thinking Center', clueEmoji: '💡', prompt: 'Which part inside our head helps us think and learn?', hint: 'Hint: Safe inside our skull', voice: 'Which part inside our head helps us think and remember?', praise: 'Genius! Your Brain helps you learn!' },
      { id: 'lungs', visual: '🫁', label: 'Lungs', sub: 'Take Deep Breaths', clueEmoji: '🌬️', prompt: 'Which pair of organs fills with fresh air when we breathe?', hint: 'Hint: Takes in oxygen', voice: 'Which organs fill with fresh air when we breathe in?', praise: 'Deep breath! Healthy Lungs!' },
      { id: 'knee', visual: '🦵', label: 'Leg & Knee', sub: 'Bend & Climb', clueEmoji: '⚽', prompt: 'Which part bends in the middle so we can kick a ball?', hint: 'Hint: Helps us sit and climb stairs', voice: 'Which part bends so we can jump and kick a ball?', praise: 'Awesome! Legs and knees help us move!' },
      { id: 'tongue', visual: '👅', label: 'Tongue', sub: 'Tastes Food', clueEmoji: '🍓', prompt: 'Which part tastes sweet, sour, and salty flavors?', hint: 'Hint: Inside the mouth', voice: 'Which part helps us taste sweet and sour food?', praise: 'Yum! Our Tongue helps us taste!' }
    ]
  }
});

// ==============================================================================
// 5. Safety & Awareness
// ==============================================================================
window.safetyModule = new MultiLevelActivityModule({
  key: 'safety',
  title: 'Safety & Awareness',
  badgeEmoji: '🚦',
  pools: {
    easy: [
      { id: 'traffic_red', visual: '🛑', label: 'STOP on Red', sub: 'Road Safety', clueEmoji: '🚦', prompt: 'The traffic light is RED. What should we do?', voice: 'The traffic light is red. Tap what we should do!', praise: 'Safe choice! Red means Stop and Wait!' },
      { id: 'helmet', visual: '🪖', label: 'Wear a Helmet', sub: 'Bicycle Safety', clueEmoji: '🚲', prompt: 'Before riding a bicycle, what protects your head?', voice: 'Before riding a bicycle, what keeps your head safe?', praise: 'Great job! Always wear a Helmet!' },
      { id: 'seatbelt', visual: '🚗', label: 'Buckle Seatbelt', sub: 'Car Safety', clueEmoji: '💺', prompt: 'When sitting inside a car, we always buckle our...', voice: 'Inside a car, what keeps us safe in our seat?', praise: 'Click-clack! Seatbelts keep us safe!' },
      { id: 'green_go', visual: '🚶‍♂️', label: 'Cross with Adult', sub: 'Zebra Crossing', clueEmoji: '🚦', prompt: 'How should we cross a busy road safely?', voice: 'How do we cross a busy road safely?', praise: 'Smart! Hold an adult hand and use the crossing!' }
    ],
    medium: [
      { id: 'hot_stove', visual: '🔥', label: 'Stay Back from Fire', sub: 'Kitchen Safety', clueEmoji: '🍳', prompt: 'A stove is hot and cooking. What is the safe choice?', voice: 'The kitchen stove is hot. What should we do?', praise: 'Safe! Stay away from hot stoves and ask an adult!' },
      { id: 'outlet', visual: '🔌', label: 'Never Touch Plugs', sub: 'Electric Safety', clueEmoji: '⚡', prompt: 'Should wet hands touch wall electric sockets?', voice: 'Wall sockets carry electricity. What is the safe rule?', praise: 'Well done! Never touch electrical sockets with wet hands!' },
      { id: 'wet_floor', visual: '⚠️', label: 'Walk Slowly on Wet Floor', sub: 'Slip Prevention', clueEmoji: '💧', prompt: 'The floor has water on it. How should we move?', voice: 'The floor is wet. How should we move safely?', praise: 'Careful! Walk slowly so we do not slip!' },
      { id: 'firefighter', visual: '🚒', label: 'Call Fire Help', sub: 'Emergency Helper', clueEmoji: '👨‍🚒', prompt: 'Who helps put out big fires and rescue people?', voice: 'Who helps put out fires safely?', praise: 'Yes! Firefighters are brave community helpers!' }
    ],
    advanced: [
      { id: 'stranger', visual: '🧑‍🤝‍🧑', label: 'Tell Parent or Teacher', sub: 'Trusted Adults', clueEmoji: '🛡️', prompt: 'If someone you do not know offers candy to go with them, what do you do?', hint: 'Stay with your trusted caregiver', voice: 'If a stranger asks you to go away with them, what should you do?', praise: 'Very brave and smart! Say No and tell a trusted adult!' },
      { id: 'medicine', visual: '💊', label: 'Only From Parent/Doctor', sub: 'Medicine Safety', clueEmoji: '🩺', prompt: 'You see colorful pills on a table. Who can give medicine?', hint: 'Pills are not candy', voice: 'When is it safe to take medicine?', praise: 'Safe choice! Only take medicine given by parents or a doctor!' },
      { id: 'first_aid', visual: '🩹', label: 'Clean & Bandage Cut', sub: 'First Aid Care', clueEmoji: '🏥', prompt: 'If you get a small scrape while playing, what helps heal it?', hint: 'Tell an adult to clean it', voice: 'If you get a small scrape, what helps protect it?', praise: 'Awesome! Clean it gently and put on a bandage!' },
      { id: 'address', visual: '📞', label: 'Know Parent Phone/Name', sub: 'Lost Helper Rule', clueEmoji: '👮', prompt: 'If you ever get lost in a mall, who can you ask to call your family?', hint: 'Look for a uniformed guard or store helper', voice: 'If you get lost in a store, who can help call your family?', praise: 'Smart! Stay in one place and ask a store helper or officer!' }
    ]
  }
});

// ==============================================================================
// 6. Personal Hygiene
// ==============================================================================
window.hygieneModule = new MultiLevelActivityModule({
  key: 'hygiene',
  title: 'Personal Hygiene',
  badgeEmoji: '🧼',
  pools: {
    easy: [
      { id: 'wash_hands', visual: '🧼', label: 'Wash Hands', sub: 'Soap & Water', clueEmoji: '🤲', prompt: 'What keeps germs off our hands before eating?', voice: 'Before eating food, tap how we clean our hands!', praise: 'Sparkly clean! Always wash hands with soap!' },
      { id: 'brush_teeth', visual: '🪥', label: 'Brush Teeth', sub: 'Morning & Night', clueEmoji: '😁', prompt: 'What keeps our smile healthy and clean?', voice: 'What should we use every morning and night for clean teeth?', praise: 'Minty fresh! Brush teeth twice a day!' },
      { id: 'comb_hair', visual: '🪮', label: 'Comb Hair', sub: 'Stay Neat', clueEmoji: '✨', prompt: 'Tap what makes our hair neat and tidy!', voice: 'What do we use to keep our hair neat and tidy?', praise: 'Looking sharp! Great job combing!' },
      { id: 'bath', visual: '🛁', label: 'Take a Bath', sub: 'Fresh Body', clueEmoji: '🫧', prompt: 'After playing outside, what cleans our whole body?', voice: 'What helps wash away sweat and dirt every day?', praise: 'Fresh and clean! Bath time is fun!' }
    ],
    medium: [
      { id: 'sneeze', visual: '🤧', label: 'Use Tissue or Elbow', sub: 'Cover Sneeze', clueEmoji: '💪', prompt: 'When we sneeze or cough, how do we keep friends healthy?', voice: 'When we cough or sneeze, how do we stop germs from spreading?', praise: 'Polite and safe! Cover with a tissue or elbow!' },
      { id: 'nails', visual: '💅', label: 'Keep Nails Trimmed', sub: 'Ask Adult Help', clueEmoji: '✂️', prompt: 'Why should we trim long fingernails cleanly?', voice: 'What keeps dirt from hiding under our fingernails?', praise: 'Neat hands! Trimming nails keeps dirt away!' },
      { id: 'towel', visual: '🧻', label: 'Dry With Clean Towel', sub: 'Your Own Towel', clueEmoji: '💧', prompt: 'After washing hands or bathing, what dries us cleanly?', voice: 'What should we use to dry wet hands cleanly?', praise: 'Nice and dry! Use a clean towel!' },
      { id: 'clean_clothes', visual: '👕', label: 'Wear Fresh Clothes', sub: 'Clean Shirt', clueEmoji: '☀️', prompt: 'Every morning after bathing, we put on...', voice: 'After our bath, what keeps us comfortable and fresh?', praise: 'Looking great in clean fresh clothes!' }
    ],
    advanced: [
      { id: 'wash_fruit', visual: '🍎', label: 'Wash Fruits First', sub: 'Food Hygiene', clueEmoji: '🚰', prompt: 'Before biting into a fresh fruit from the market, we should...', hint: 'Rinse off dust safely', voice: 'Before eating fresh fruits, what must we do first?', praise: 'Healthy habit! Always rinse fruits in clean water!' },
      { id: 'sleep_hygiene', visual: '😴', label: 'Sleep 8-9 Hours', sub: 'Rest & Clean Bed', clueEmoji: '🌙', prompt: 'Washing your face and resting at night helps your body...', hint: 'Recharges energy for tomorrow', voice: 'How does good nighttime sleep help our body?', praise: 'Well rested! Clean face and good sleep keep us strong!' },
      { id: 'flush_wash', visual: '🚽', label: 'Flush & Wash Hands', sub: 'Restroom Rule', clueEmoji: '🧼', prompt: 'After using the bathroom, what are the two important steps?', hint: 'Flush first, then soap', voice: 'After using the toilet, what must we always do?', praise: 'Clean superstar! Flush and wash with soap!' },
      { id: 'water_bottle', visual: '🥤', label: 'Drink Clean Water', sub: 'Stay Hydrated', clueEmoji: '💧', prompt: 'What clean drink keeps our body cool and hydrated all day?', hint: 'Better than sugary soda', voice: 'Which healthy drink keeps our body hydrated?', praise: 'Hydrated! Clean drinking water is the best!' }
    ]
  }
});

// ==============================================================================
// 7. Social Skills
// ==============================================================================
window.socialModule = new MultiLevelActivityModule({
  key: 'social',
  title: 'Social Skills',
  badgeEmoji: '🤝',
  pools: {
    easy: [
      { id: 'thank_you', visual: '🙏', label: 'Say Thank You', sub: 'Polite Word', clueEmoji: '🎁', prompt: 'When someone gives you a gift or helps you, what do you say?', voice: 'When a friend helps you, what magic word do you say?', praise: 'So polite! Saying Thank You makes people smile!' },
      { id: 'hello', visual: '👋', label: 'Wave & Say Hello', sub: 'Friendly Greeting', clueEmoji: '😊', prompt: 'When you meet your teacher or friend in the morning, tap how we greet!', voice: 'How do we greet friends kindly in the morning?', praise: 'Hello friend! Friendly greetings are wonderful!' },
      { id: 'share', visual: '🧸', label: 'Share Toys', sub: 'Play Together', clueEmoji: '👫', prompt: 'A friend wants to play with blocks too. What makes everyone happy?', voice: 'Your friend wants to build blocks too. Tap the kind choice!', praise: 'Kind heart! Sharing makes playtime twice as fun!' },
      { id: 'please', visual: '🌸', label: 'Say Please', sub: 'Kind Asking', clueEmoji: '💬', prompt: 'What gentle magic word helps when asking for something?', voice: 'What polite word do we use when asking nicely?', praise: 'Yes! Please is a wonderful magic word!' }
    ],
    medium: [
      { id: 'take_turns', visual: '⏳', label: 'Wait Your Turn', sub: 'Patience in Line', clueEmoji: '🛝', prompt: 'Friends are waiting to go down the slide. What should we do?', voice: 'Friends are lining up for the slide. What is the fair choice?', praise: 'Fair player! Taking turns keeps everyone happy!' },
      { id: 'sorry', visual: '💐', label: 'Say I Am Sorry', sub: 'Kind Apology', clueEmoji: '🤝', prompt: 'If you bump into a classmate by accident, what helps them feel better?', voice: 'If you accidentally bump a friend, what can you say?', praise: 'So caring! Saying sorry and checking if they are okay helps!' },
      { id: 'listen', visual: '👂', label: 'Listen Quietly', sub: 'Respect Speaker', clueEmoji: '🏫', prompt: 'When someone else is speaking in class, how do we show respect?', voice: 'When a teacher or friend is talking, what helps us listen?', praise: 'Great listener! Looking and listening shows respect!' },
      { id: 'clean_together', visual: '🧹', label: 'Help Tidy Up', sub: 'Teamwork', clueEmoji: '✨', prompt: 'Playtime is finished. How can friends help in the classroom?', voice: 'After playtime finishes, how do good classmates help?', praise: 'Awesome helper! Cleaning up together finishes fast!' }
    ],
    advanced: [
      { id: 'help_friend', visual: '📚', label: 'Help Pick Up', sub: 'Empathy', clueEmoji: '💛', prompt: 'Your classmate drops their books on the floor. What can a kind friend do?', hint: 'Lend a helping hand', voice: 'A classmate drops their books. What would a kind friend do?', praise: 'True friend! Helping others makes our school wonderful!' },
      { id: 'include_friend', visual: '🎈', label: 'Invite to Join', sub: 'Inclusion', clueEmoji: '🧑‍🤝‍🧑', prompt: 'A new student is sitting alone at recess. What makes them feel welcome?', hint: 'Ask if they want to play', voice: 'Someone is sitting alone. How can we help them feel welcome?', praise: 'Inclusive hero! Inviting others builds great friendships!' },
      { id: 'calm_words', visual: '🫧', label: 'Use Calm Words', sub: 'Problem Solving', clueEmoji: '🗣️', prompt: 'If you feel upset because a game did not go your way, what works best?', hint: 'Take a deep breath and explain calmly', voice: 'If you feel frustrated during a game, what is the helpful choice?', praise: 'Great self-control! Calm breathing and kind words solve problems!' },
      { id: 'personal_space', visual: '🫧', label: 'Respect Space', sub: 'Kind Boundaries', clueEmoji: '🙌', prompt: 'If a friend says "Please give me some space", what do we do?', hint: 'Listen to their feelings', voice: 'If a friend asks for quiet space, what should we do?', praise: 'Respectful friend! Always honor personal space!' }
    ]
  }
});
