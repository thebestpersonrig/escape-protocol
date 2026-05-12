// 4-dial symbol combination lock — cycle each dial to match the correct sequence
import { AudioSystem } from '../audio.js';
import { dispatch } from '../state.js';

const SYMBOLS = ['✝', '☽', '★', '◉'];
const SYMBOL_NAMES = { '✝': 'Cross', '☽': 'Moon', '★': 'Star', '◉': 'Eye' };
// Correct sequence: Cross · Moon · Star · Eye
const SOLUTION = ['✝', '☽', '★', '◉'];

export function init(container, puzzleState, callbacks, puzzleId = 'bw-records-cipher') {
  // Restore dial positions from state, or start scrambled
  let dials = puzzleState.dialPositions?.slice()
    || [2, 3, 0, 1]; // default scramble: Star, Eye, Cross, Moon

  function renderDials() {
    const dialEls = container.querySelectorAll('.sym-dial');
    dialEls.forEach((el, i) => {
      el.dataset.sym = SYMBOLS[dials[i]];
      el.querySelector('.sym-face').textContent  = SYMBOLS[dials[i]];
      el.querySelector('.sym-name').textContent  = SYMBOL_NAMES[SYMBOLS[dials[i]]];
    });
  }

  container.innerHTML = `
    <div class="puzzle-title">✝ SYMBOL CIPHER ✝</div>
    <div class="puzzle-subtitle">Align the four symbols in the correct sequence</div>
    <div class="sym-lock-row">
      ${[0,1,2,3].map(i => `
        <div class="sym-dial-wrap">
          <button class="sym-arrow sym-up"   data-dial="${i}">▲</button>
          <div    class="sym-dial"            data-idx="${i}">
            <div class="sym-face">${SYMBOLS[dials[i]]}</div>
            <div class="sym-name">${SYMBOL_NAMES[SYMBOLS[dials[i]]]}</div>
          </div>
          <button class="sym-arrow sym-down" data-dial="${i}">▼</button>
          <div class="sym-position">Dial ${i + 1}</div>
        </div>
      `).join('')}
    </div>
    <div style="margin-top:6px;text-align:center;font-size:11px;color:var(--text-dim);font-family:var(--font-mono);font-style:italic;">
      The intake sequence is documented somewhere in Ward B…
    </div>
    <button class="lever-btn" id="sym-unlock" style="margin-top:14px;">UNLOCK</button>
    <div style="margin-top:10px;font-size:11px;color:var(--text-dim);text-align:center;font-family:var(--font-mono);">
      Attempts: <span id="sym-attempts">${puzzleState.attempts || 0}</span>
    </div>
  `;

  // Arrow buttons — cycle dials
  container.querySelectorAll('.sym-arrow').forEach(btn => {
    btn.addEventListener('click', () => {
      const i   = parseInt(btn.dataset.dial);
      const dir = btn.classList.contains('sym-up') ? 1 : -1;
      dials[i] = ((dials[i] + dir) + SYMBOLS.length) % SYMBOLS.length;
      AudioSystem.play('keypad-beep');
      dispatch('UPDATE_DIAL_POSITIONS', { puzzleId, positions: dials.slice() });
      renderDials();
    });
  });

  container.querySelector('#sym-unlock')?.addEventListener('click', () => {
    const correct = dials.every((pos, i) => SYMBOLS[pos] === SOLUTION[i]);
    if (correct) {
      container.querySelectorAll('.sym-face').forEach(f => {
        f.style.color       = '#00ff88';
        f.style.textShadow  = '0 0 10px rgba(0,255,136,0.7)';
      });
      container.querySelectorAll('.sym-dial').forEach(d => {
        d.style.borderColor = '#00ff88';
        d.style.boxShadow   = '0 0 10px rgba(0,255,136,0.3)';
      });
      setTimeout(() => callbacks.onSuccess(), 600);
    } else {
      const attEl = container.querySelector('#sym-attempts');
      if (attEl) attEl.textContent = parseInt(attEl.textContent) + 1;
      container.querySelectorAll('.sym-dial').forEach(d => {
        d.style.borderColor = 'rgba(192,57,43,0.8)';
        d.style.boxShadow   = '0 0 8px rgba(192,57,43,0.4)';
        setTimeout(() => { d.style.borderColor = ''; d.style.boxShadow = ''; }, 600);
      });
      callbacks.onFailure();
    }
  });
}

export function destroy(container) {
  container.innerHTML = '';
}
