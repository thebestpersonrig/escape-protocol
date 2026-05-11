import { AudioSystem } from '../audio.js';

// 5 possible codes — picked by seed at game start
const CODES = ['4821', '7364', '2957', '6140', '3589'];

function getCode() {
  const seed = parseInt(localStorage.getItem('ep-seed') || '0');
  return CODES[seed % CODES.length];
}

export function init(container, puzzleState, callbacks) {
  const code = getCode();
  let input = '';

  container.innerHTML = `
    <div class="puzzle-title">◈ SECURITY KEYPAD ◈</div>
    <div class="puzzle-subtitle">Enter the 4-digit access code</div>
    <div class="keypad-wrap">
      <div class="keypad-display" id="kp-display">____</div>
      <div class="keypad-grid">
        ${[1,2,3,4,5,6,7,8,9].map(n =>
          `<button class="keypad-btn" data-digit="${n}">${n}</button>`
        ).join('')}
        <button class="keypad-btn wide" data-digit="0">0</button>
        <button class="keypad-btn" id="kp-back">⌫</button>
      </div>
      <button class="keypad-btn enter" id="kp-enter" style="width:100%;margin-top:6px;">ENTER</button>
    </div>
    <div style="margin-top:14px;font-size:11px;color:var(--text-dim);text-align:center;font-family:var(--font-mono);">Attempts: ${puzzleState.attempts || 0}</div>
  `;

  const display = container.querySelector('#kp-display');

  function updateDisplay() {
    display.textContent = input.padEnd(4, '_').split('').join(' ');
    display.classList.remove('error');
  }

  container.querySelectorAll('.keypad-btn[data-digit]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (input.length < 4) {
        input += btn.dataset.digit;
        updateDisplay();
        AudioSystem.play('keypad-beep');
      }
    });
  });

  container.querySelector('#kp-back')?.addEventListener('click', () => {
    input = input.slice(0, -1);
    updateDisplay();
  });

  container.querySelector('#kp-enter')?.addEventListener('click', () => {
    if (input.length < 4) {
      display.classList.add('error');
      setTimeout(() => display.classList.remove('error'), 500);
      return;
    }
    if (input === code) {
      display.textContent = '✓ ✓ ✓ ✓';
      display.style.color = '#00ff88';
      display.style.borderColor = '#00ff88';
      display.style.textShadow = '0 0 10px rgba(0,255,136,0.6)';
      setTimeout(() => callbacks.onSuccess(), 600);
    } else {
      display.classList.add('error');
      display.textContent = 'X X X X';
      setTimeout(() => {
        input = '';
        updateDisplay();
      }, 700);
      callbacks.onFailure();
    }
  });
}

export function destroy(container) {
  container.innerHTML = '';
}
