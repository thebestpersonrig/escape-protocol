import { getState } from '../state.js';

const BOOT_LINES = [
  '> ARCADIA RESEARCH SYSTEMS v4.2.1',
  '> Initialising subsystems...',
  '> [OK] Memory banks: 8192 MB',
  '> [OK] Neural network: ONLINE',
  '> [WARN] Security breach detected',
  '> [WARN] Access logs corrupted',
  '> Emergency authentication required.',
  '> Enter password to proceed:',
  '',
];

export function init(container, puzzleState, callbacks) {
  const password = getState().terminalPassword || 'PROMETHEUS';
  let attempts   = puzzleState.attempts || 0;
  const MAX_ATT  = 3;

  container.innerHTML = `
    <div class="puzzle-title" style="color:#00cc55;">[ ARCADIA TERMINAL ]</div>
    <div class="terminal-wrap">
      <div class="terminal-output" id="term-output"></div>
      <div class="terminal-input-row">
        <span class="terminal-prompt">root@arcadia:~$</span>
        <input class="terminal-input" id="term-input" type="password" autocomplete="off" spellcheck="false" maxlength="20" placeholder="PASSWORD" />
      </div>
    </div>
    <div style="margin-top:8px;font-size:10px;color:#446644;text-align:center;font-family:monospace;">
      Attempts remaining: <span id="term-att">${MAX_ATT - attempts}</span>
    </div>
  `;

  const output  = container.querySelector('#term-output');
  const input   = container.querySelector('#term-input');
  const attEl   = container.querySelector('#term-att');

  function addLine(text, cls = '') {
    const p = document.createElement('p');
    p.textContent = text;
    if (cls) p.classList.add(cls);
    output.appendChild(p);
    output.scrollTop = output.scrollHeight;
  }

  // Boot sequence
  let i = 0;
  function bootNext() {
    if (i < BOOT_LINES.length) {
      addLine(BOOT_LINES[i++], i <= 3 ? '' : i === 4 ? '' : 'sys-line');
      setTimeout(bootNext, i < 4 ? 120 : 200);
    } else {
      input.focus();
    }
  }
  bootNext();

  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const val = input.value.trim().toUpperCase();
    input.value = '';

    addLine(`root@arcadia:~$ ${'*'.repeat(val.length)}`);

    if (val === password) {
      addLine('> ACCESS GRANTED', 'success-line');
      addLine('> Security protocols disabled.', 'success-line');
      addLine('> Welcome, Administrator.', 'success-line');
      input.disabled = true;
      setTimeout(() => callbacks.onSuccess(), 800);
    } else {
      attempts++;
      attEl.textContent = MAX_ATT - attempts;
      addLine(`> ACCESS DENIED — attempt ${attempts} of ${MAX_ATT}`, 'error-line');
      callbacks.onFailure();
      if (attempts >= MAX_ATT) {
        addLine('> LOCKOUT INITIATED. Security alerted.', 'error-line');
        input.disabled = true;
        setTimeout(() => callbacks.onClose(), 1500);
      }
    }
  });

  // Auto-focus
  setTimeout(() => input.focus(), 100);
}

export function destroy(container) {
  container.innerHTML = '';
}
