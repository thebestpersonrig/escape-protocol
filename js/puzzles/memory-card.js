// Memory sequence puzzle — watch the sequence, then repeat it

const SYMBOLS = ['★', '◆', '▲', '●', '■', '♦', '⬟', '✦', '⬡', '◉', '✺', '⚙'];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function init(container, puzzleState, callbacks) {
  const SEQ_LENGTH = 5;
  // Pick 5 random symbols for the sequence
  const sequence = shuffle(SYMBOLS).slice(0, SEQ_LENGTH);
  // 12 symbols on the grid (sequence symbols + distractors)
  const gridSymbols = shuffle([...sequence, ...shuffle(SYMBOLS.filter(s => !sequence.includes(s))).slice(0, 7)]);

  let lives  = 3;
  let playerSeq = [];
  let phase  = 'showing'; // 'showing' | 'input'
  let showIdx = 0;

  container.innerHTML = `
    <div class="puzzle-title">◉ SEQUENCE MEMORY ◉</div>
    <div class="puzzle-subtitle" id="mem-status">Memorise the sequence...</div>
    <div class="memory-grid" id="mem-grid"></div>
    <div class="memory-lives" id="mem-lives">
      ${[0,1,2].map(() => `<div class="life-dot"></div>`).join('')}
    </div>
    <div style="margin-top:8px;font-size:11px;color:var(--text-dim);text-align:center;font-family:var(--font-mono);">
      Progress: <span id="mem-progress">0</span> / ${SEQ_LENGTH}
    </div>
  `;

  const grid     = container.querySelector('#mem-grid');
  const statusEl = container.querySelector('#mem-status');
  const livesEl  = container.querySelector('#mem-lives');
  const progressEl = container.querySelector('#mem-progress');

  function renderGrid(highlightSym = null) {
    grid.innerHTML = '';
    gridSymbols.forEach(sym => {
      const card = document.createElement('div');
      card.className = 'mem-card';
      if (phase === 'showing') {
        card.classList.add(sym === highlightSym ? 'revealed' : 'locked');
        card.textContent = sym;
      } else {
        card.textContent = sym;
        card.addEventListener('click', () => handleClick(sym));
      }
      grid.appendChild(card);
    });
  }

  function updateLives() {
    const dots = livesEl.querySelectorAll('.life-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('lost', i >= lives);
    });
  }

  function handleClick(sym) {
    if (phase !== 'input') return;
    const expected = sequence[playerSeq.length];
    if (sym === expected) {
      playerSeq.push(sym);
      progressEl.textContent = playerSeq.length;

      // Flash correct
      grid.querySelectorAll('.mem-card').forEach(card => {
        if (card.textContent === sym) card.classList.add('correct');
      });
      setTimeout(() => {
        grid.querySelectorAll('.mem-card.correct').forEach(c => c.classList.remove('correct'));
      }, 300);

      if (playerSeq.length === SEQ_LENGTH) {
        statusEl.textContent = '✓ Sequence correct!';
        statusEl.style.color = '#00ff88';
        setTimeout(() => callbacks.onSuccess(), 500);
      }
    } else {
      lives--;
      updateLives();
      // Each lost life counts as one global mistake
      callbacks.onFailure();
      // Flash wrong card
      grid.querySelectorAll('.mem-card').forEach(card => {
        if (card.textContent === sym) { card.classList.add('wrong'); setTimeout(() => card.classList.remove('wrong'), 400); }
      });
      if (lives <= 0) {
        statusEl.textContent = 'Memory wipe complete.';
        statusEl.style.color = 'var(--danger)';
        renderGrid();
        setTimeout(() => callbacks.onClose(), 1500);
      } else {
        playerSeq = [];
        progressEl.textContent = 0;
        statusEl.textContent = `Wrong! ${lives} life${lives === 1 ? '' : 's'} left. Starting over...`;
        // Brief pause then re-show the sequence so player can re-learn it
        setTimeout(() => {
          phase = 'showing';
          showIdx = 0;
          statusEl.style.color = '';
          setTimeout(showSequence, 400);
        }, 800);
      }
    }
  }

  // Show sequence one at a time, then switch to input phase
  function showSequence() {
    if (showIdx < SEQ_LENGTH) {
      renderGrid(sequence[showIdx]);
      statusEl.textContent = `Memorise: ${showIdx + 1} / ${SEQ_LENGTH}`;
      showIdx++;
      setTimeout(showSequence, 900);
    } else {
      // Switch to input phase BEFORE rendering so cards get click listeners
      phase = 'input';
      renderGrid();
      statusEl.textContent = 'Now repeat the sequence!';
    }
  }

  updateLives();
  renderGrid();
  setTimeout(showSequence, 500);
}

export function destroy(container) {
  container.innerHTML = '';
}
