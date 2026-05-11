// Memory/matching card puzzle — match pairs of symbols
import { AudioSystem } from '../audio.js';

const SYMBOLS = ['⬡', '◈', '⬟', '✦', '⚙', '⬢', '◉', '✺'];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function init(container, puzzleState, callbacks) {
  // Build deck: 8 pairs = 16 cards
  let deck = shuffle([...SYMBOLS, ...SYMBOLS]);
  if (puzzleState.cardOrder?.length === 16) deck = puzzleState.cardOrder;

  let flipped   = [];   // indices currently face-up (not matched)
  let matched   = new Set();
  let locked    = false;

  container.innerHTML = `
    <div class="puzzle-title">◈ SYMBOL MATRIX ◈</div>
    <div class="puzzle-subtitle">Match all pairs to unlock</div>
    <div class="symbol-grid" id="sym-grid"></div>
    <div style="margin-top:12px;font-size:11px;color:var(--text-dim);text-align:center;font-family:var(--font-mono);">
      Matched: <span id="sym-count">0</span> / 8
    </div>
  `;

  const grid = container.querySelector('#sym-grid');
  const countEl = container.querySelector('#sym-count');

  function render() {
    grid.innerHTML = '';
    deck.forEach((sym, idx) => {
      const card = document.createElement('div');
      card.className = 'symbol-card';
      const isFlipped  = flipped.includes(idx);
      const isMatched  = matched.has(idx);

      if (isFlipped || isMatched) {
        card.textContent = sym;
        card.classList.add(isMatched ? 'matched' : 'face-up');
      } else {
        card.innerHTML = `<span class="sym-back">?</span>`;
      }

      if (!isFlipped && !isMatched && !locked) {
        card.addEventListener('click', () => flipCard(idx));
      }
      grid.appendChild(card);
    });
  }

  function flipCard(idx) {
    if (flipped.length >= 2 || flipped.includes(idx)) return;
    flipped.push(idx);
    render();

    if (flipped.length === 2) {
      locked = true;
      const [a, b] = flipped;
      if (deck[a] === deck[b]) {
        // Match!
        matched.add(a);
        matched.add(b);
        flipped = [];
        locked  = false;
        countEl.textContent = matched.size / 2;
        render();
        if (matched.size === 16) {
          setTimeout(() => callbacks.onSuccess(), 500);
        }
      } else {
        // No match — play sound locally, never counts as a global mistake
        AudioSystem.play('puzzle-fail');
        setTimeout(() => {
          flipped = [];
          locked  = false;
          render();
        }, 900);
      }
    }
  }

  render();
}

export function destroy(container) {
  container.innerHTML = '';
}
