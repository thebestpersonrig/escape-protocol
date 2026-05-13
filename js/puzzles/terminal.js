import { getState } from '../state.js';

const MISSION_THEMES = {
  arcadia: {
    title:    '[ ARCADIA TERMINAL ]',
    color:    '#00cc55',
    prompt:   'root@arcadia:~$',
    attColor: '#446644',
    boot: [
      '> ARCADIA RESEARCH SYSTEMS v4.2.1',
      '> Initialising subsystems...',
      '> [OK] Memory banks: 8192 MB',
      '> [OK] Neural network: ONLINE',
      '> [WARN] Security breach detected',
      '> [WARN] Access logs corrupted',
      '> Emergency authentication required.',
      '> Enter password to proceed:',
      '',
    ],
  },
  blackwood: {
    title:    '[ BLACKWOOD PATIENT RECORDS ]',
    color:    '#cc4444',
    prompt:   'BWPI\\records>',
    attColor: '#663333',
    boot: [
      '> BLACKWOOD PSYCHIATRIC INSTITUTE',
      '> Records Management System v2.1',
      '> Loading patient database...',
      '> [OK] Ward A records: LOADED',
      '> [OK] Ward B records: LOADED',
      '> [RESTRICTED] Director files: LOCKED',
      '> Authentication required to proceed.',
      '> Enter staff password:',
      '',
    ],
  },
  meridian: {
    title:    '[ MERIDIAN NAV TERMINAL ]',
    color:    '#00bfff',
    prompt:   'meridian@nav:~$',
    attColor: '#1a4466',
    boot: [
      '> MERIDIAN STATION ALPHA — NAV SYSTEM',
      '> Subsystem initialisation...',
      '> [OK] Orbital positioning: NOMINAL',
      '> [OK] Thruster control: STANDBY',
      '> [WARN] Life support: OFFLINE',
      '> [WARN] Comms: PARTIAL',
      '> Crew authentication required.',
      '> Enter station password:',
      '',
    ],
  },
};

export function init(container, puzzleState, callbacks, puzzleId = 'terminal-hack') {
  const mission = window.EP_MISSION || 'arcadia';
  const theme   = MISSION_THEMES[mission] || MISSION_THEMES.arcadia;
  const password = getState().terminalPassword || 'PROMETHEUS';
  let attempts   = puzzleState.attempts || 0;
  const MAX_ATT  = 3;

  container.innerHTML = `
    <div class="puzzle-title" style="color:${theme.color};">${theme.title}</div>
    <div class="terminal-wrap">
      <div class="terminal-output" id="term-output"></div>
      <div class="terminal-input-row">
        <span class="terminal-prompt">${theme.prompt}</span>
        <input class="terminal-input" id="term-input" type="password" autocomplete="off" spellcheck="false" maxlength="20" placeholder="PASSWORD" />
      </div>
    </div>
    <div style="margin-top:8px;font-size:10px;color:${theme.attColor};text-align:center;font-family:monospace;">
      Attempts remaining: <span id="term-att">${MAX_ATT - attempts}</span>
    </div>
  `;

  const BOOT_LINES = theme.boot;

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
