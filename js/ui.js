import { getState, dispatch } from './state.js';

// ── Timer ─────────────────────────────────────────────────
let _timerInterval = null;

export function startTimer() {
  dispatch('START_TIMER');
  if (_timerInterval) clearInterval(_timerInterval);
  _timerInterval = setInterval(() => {
    dispatch('TICK_TIMER');
    updateTimerDisplay();
    checkAlarmCountdown();
    checkTimeOut();
  }, 1000);
}

export function stopTimer() {
  dispatch('STOP_TIMER');
  if (_timerInterval) {
    clearInterval(_timerInterval);
    _timerInterval = null;
  }
}

function pad(n) { return String(n).padStart(2, '0'); }

export function updateTimerDisplay() {
  const s = getState().timerSeconds;
  const min = Math.floor(s / 60);
  const sec = s % 60;
  const el = document.getElementById('timer');
  if (!el) return;
  el.textContent = `${pad(min)}:${pad(sec)}`;
  el.className = '';
  if (s <= 120) el.classList.add('danger');
  else if (s <= 300) el.classList.add('warn');
}

function checkTimeOut() {
  const st = getState();
  if (st.timerSeconds <= 0 && !st.ending) {
    stopTimer();
    dispatch('SET_ENDING', { ending: 'time-out' });
    import('./engine.js').then(m => m.Engine.instance?.showEnding('time-out'));
  }
}

function checkAlarmCountdown() {
  const st = getState();
  if (!st.alarmTriggered) return;
  updateAlarmDisplay();
  if (st.alarmSecondsLeft <= 0 && !st.ending) {
    stopTimer();
    dispatch('SET_ENDING', { ending: 'alarm-caught' });
    import('./engine.js').then(m => m.Engine.instance?.showEnding('alarm-caught'));
  }
}

// ── Alarm display ─────────────────────────────────────────
export function updateAlarmDisplay() {
  const st = getState();
  const overlay   = document.getElementById('alarm-overlay');
  const countdown = document.getElementById('alarm-countdown');
  const reasonEl  = document.getElementById('alarm-reason');
  if (!overlay) return;
  if (st.alarmTriggered) {
    overlay.classList.add('active');
    if (reasonEl && st.alarmReason) reasonEl.textContent = st.alarmReason;
    if (countdown) {
      const s = Math.max(0, st.alarmSecondsLeft);
      countdown.textContent = `SECURITY RESPONSE IN: 0:${pad(s)}`;
    }
  } else {
    overlay.classList.remove('active');
  }
}

// ── Objectives ────────────────────────────────────────────
export function updateObjectiveDisplay() {
  const el = document.getElementById('current-objective');
  if (!el) return;
  const st = getState();
  const next = st.objectives.find(o => !o.done);
  el.innerHTML = next
    ? `<span>${next.text}</span>`
    : '<span style="color:var(--accent)">All objectives complete — find the exit!</span>';
}

// ── Room indicator ────────────────────────────────────────
export function updateRoomIndicator(name) {
  const el = document.getElementById('room-name-display');
  if (el) el.textContent = (name || '—').toUpperCase();
}

// ── Hints ─────────────────────────────────────────────────
const HINTS = {
  'lab-entry': [
    'Have you checked inside the metal drawer near the left wall?',
    'The vent on the ceiling might be loose — you\'d need a tool to open it.',
    'The keypad code is somewhere in this room. Check every surface carefully.',
  ],
  'main-lab': [
    'Look inside the cabinets and the locker. Items are randomised each game.',
    'The symbol puzzle on the wall controls both the server room and biology wing doors.',
    'You need server power restored before the main terminal will respond.',
  ],
  'server-room': [
    'The fuse box in the corner controls power. You need a fuse from the main lab.',
    'Wire colours on the server panel match the diagram found in the lab.',
    'Once the wires are connected, check the security hub for the pass you\'ll need later.',
  ],
  'security-hub': [
    'The access control panel on the right wall needs to be solved first.',
    'Solve the symbol panel — the security locker below it will unlock automatically.',
    'The security pass from this locker is required to enter the emergency corridor.',
  ],
  'utility-corridor': [
    'Reset the power junction on the right — the compartment below it will unlock.',
    'The bypass chip inside is needed to activate the laser grid in the final corridor.',
    'Read the warning notice — it explains exactly how the bypass chip works.',
  ],
  'bio-lab': [
    'Check the specimen fridge — there\'s a research note inside.',
    'The vault sequence lock controls the key box below it.',
    'The maintenance key from this room is needed to crawl through the server room vent.',
  ],
  'director-office': [
    'The wall safe keypad is to the left — the code is in another room.',
    'Check the bio lab fridge for the safe combination.',
    'The emergency ID card in the safe is needed to open the maintenance hatch.',
  ],
  'final-exit': [
    'You need a bypass chip to activate the laser grid — check the utility corridor.',
    'The lever combination was written on a diagram somewhere in the main lab.',
    'The laser corridor moves — stay inside the safe zone and head right to the green exit.',
  ],
  'secret-room': [
    'Read every piece of writing in this room — the story connects.',
    'The hatch requires the emergency ID card from the director\'s office.',
    'Look at the wall near the back — something was left here on purpose.',
  ],
};

let _hintCooldown = 0;
let _hintCooldownInterval = null;
let _missionHints = {};

export function setMissionHints(hints) {
  _missionHints = hints || {};
}

export function showHint() {
  const st = getState();
  if (st.hintsAvailable <= 0 || _hintCooldown > 0) return;

  const missionEntry = _missionHints[st.currentRoom];
  const roomHints = missionEntry
    ? (Array.isArray(missionEntry) ? missionEntry : [missionEntry])
    : HINTS[st.currentRoom] || ['Keep exploring. There must be something you missed.'];
  const hintText = roomHints[Math.min(st.hintsUsed, roomHints.length - 1)] || roomHints[roomHints.length - 1];

  dispatch('USE_HINT');

  // Start 30s cooldown
  _hintCooldown = 30;
  if (_hintCooldownInterval) clearInterval(_hintCooldownInterval);
  _hintCooldownInterval = setInterval(() => {
    _hintCooldown--;
    updateHintButton();
    if (_hintCooldown <= 0) {
      clearInterval(_hintCooldownInterval);
      _hintCooldownInterval = null;
    }
  }, 1000);
  updateHintButton();

  const popup = document.getElementById('hint-popup');
  const textEl = document.getElementById('hint-popup-text');
  if (!popup || !textEl) return;
  textEl.textContent = hintText;
  popup.classList.add('visible');
  setTimeout(() => popup.classList.remove('visible'), 5500);
}

export function updateHintButton() {
  const btn = document.getElementById('hint-button');
  if (!btn) return;
  const st = getState();
  if (st.hintsAvailable <= 0) {
    btn.textContent = 'No hints left';
    btn.classList.add('disabled');
  } else if (_hintCooldown > 0) {
    btn.textContent = `Hint (${_hintCooldown}s)`;
    btn.classList.add('disabled');
  } else {
    btn.textContent = `Hint (${st.hintsAvailable} left)`;
    btn.classList.remove('disabled');
  }
}

// ── Objective flash ───────────────────────────────────────
export function flashObjective() {
  const el = document.getElementById('current-objective');
  if (!el) return;
  el.classList.remove('obj-flash');
  void el.offsetWidth;
  el.classList.add('obj-flash');
  setTimeout(() => el.classList.remove('obj-flash'), 1200);
}

// ── Item pickup fly-to-inventory animation ────────────────
export function animatePickup(srcEl, icon) {
  if (!srcEl) return;
  const rect   = srcEl.getBoundingClientRect();
  const invBar = document.getElementById('inventory-bar');
  if (!invBar) return;
  const invRect = invBar.getBoundingClientRect();

  const ghost = document.createElement('div');
  ghost.style.cssText = [
    'position:fixed',
    `left:${rect.left + rect.width  / 2}px`,
    `top:${rect.top  + rect.height / 2}px`,
    'transform:translate(-50%,-50%)',
    'font-size:22px',
    'pointer-events:none',
    'z-index:9999',
    'transition:all 0.55s cubic-bezier(0.2,0.8,0.3,1)',
    'filter:drop-shadow(0 0 8px rgba(0,255,224,0.8))',
  ].join(';');
  ghost.textContent = icon;
  document.body.appendChild(ghost);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    ghost.style.left    = (invRect.left + 28) + 'px';
    ghost.style.top     = (invRect.top  + invRect.height / 2) + 'px';
    ghost.style.opacity = '0';
    ghost.style.transform = 'translate(-50%,-50%) scale(0.3)';
  }));
  setTimeout(() => ghost.remove(), 650);
}

// ── Screen shake ──────────────────────────────────────────
export function triggerShake(hard = false) {
  // soft: shake scene only. hard: shake whole wrapper + red flash (alarm)
  const el = document.getElementById(hard ? 'game-wrapper' : 'scene-container');
  if (!el) return;
  const cls = hard ? 'shake-hard' : 'shake';
  el.classList.remove('shake', 'shake-hard');
  void el.offsetWidth; // force reflow so animation restarts
  el.classList.add(cls);
  if (hard) {
    el.classList.add('alarm-flash-border');
    setTimeout(() => el.classList.remove('alarm-flash-border'), 1600);
  }
  setTimeout(() => el.classList.remove(cls), hard ? 700 : 450);
}

// ── Toast ─────────────────────────────────────────────────
let _toastTimer = null;

export function showToast(message, type = '', duration = 2800) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.className = type ? `visible ${type}` : 'visible';
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('visible'), duration);
}

// ── Inspection popup ──────────────────────────────────────
export function showInspection(text, imageSrc = null, objectId = null) {
  const popup  = document.getElementById('inspection-popup');
  const textEl = document.getElementById('inspection-text');
  const imgEl  = document.getElementById('inspection-image');
  const noteBtn = document.getElementById('inspection-note-btn');
  if (!popup || !textEl) return;

  if (objectId) dispatch('MARK_INSPECTED', { objectId });
  textEl.textContent = text;

  if (imageSrc) {
    imgEl.src = imageSrc;
    imgEl.classList.add('visible');
  } else {
    imgEl.classList.remove('visible');
    imgEl.src = '';
  }

  // Reset Note-it button for each new inspection
  if (noteBtn) {
    noteBtn.textContent = '📓 Note it';
    noteBtn.classList.remove('noted');
    noteBtn.onclick = (e) => {
      e.stopPropagation();
      addJournalClue(text);
      noteBtn.textContent = '✓ Noted';
      noteBtn.classList.add('noted');
    };
  }

  popup.classList.add('visible');
}

export function hideInspection() {
  document.getElementById('inspection-popup')?.classList.remove('visible');
}

// ── Achievement toast ─────────────────────────────────────
let _achTimer = null;

export function showAchievementToast(name) {
  const toast = document.getElementById('achievement-toast');
  const nameEl = toast?.querySelector('.ach-toast-name');
  if (!toast || !nameEl) return;
  nameEl.textContent = name;
  toast.classList.add('visible');
  if (_achTimer) clearTimeout(_achTimer);
  _achTimer = setTimeout(() => toast.classList.remove('visible'), 4000);
}

// ── Narrative ─────────────────────────────────────────────
export function showNarrative(text) {
  const el = document.getElementById('room-narrative');
  if (!el) return;
  el.textContent = text;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 4500);
}

// ── Journal ───────────────────────────────────────────────
const _JOURNAL_NOTES_KEY = 'ep-journal-notes';
const _JOURNAL_CLUES_KEY = 'ep-journal-clues';
let _journalClues = [];

export function toggleJournal(force) {
  const overlay = document.getElementById('journal-overlay');
  if (!overlay) return;
  const willOpen = force !== undefined ? force : !overlay.classList.contains('visible');
  overlay.classList.toggle('visible', willOpen);
}

export function addJournalClue(text) {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  _journalClues.push({ text: text.trim(), time: `${h}:${m}` });
  localStorage.setItem(_JOURNAL_CLUES_KEY, JSON.stringify(_journalClues));
  _renderJournalClues();
  toggleJournal(true);
}

export function clearJournal() {
  _journalClues = [];
  localStorage.removeItem(_JOURNAL_CLUES_KEY);
  localStorage.removeItem(_JOURNAL_NOTES_KEY);
  const textarea = document.getElementById('journal-textarea');
  if (textarea) textarea.value = '';
  _renderJournalClues();
}

export function initJournal() {
  // Load saved free-form notes
  const savedNotes = localStorage.getItem(_JOURNAL_NOTES_KEY);
  const textarea = document.getElementById('journal-textarea');
  if (savedNotes && textarea) textarea.value = savedNotes;

  // Load saved clue entries
  try {
    const raw = localStorage.getItem(_JOURNAL_CLUES_KEY);
    if (raw) { _journalClues = JSON.parse(raw); _renderJournalClues(); }
  } catch (e) { _journalClues = []; }

  // Auto-save notes on every keystroke
  textarea?.addEventListener('input', () => {
    localStorage.setItem(_JOURNAL_NOTES_KEY, textarea.value);
  });
}

function _renderJournalClues() {
  const list = document.getElementById('journal-clues-list');
  if (!list) return;
  if (_journalClues.length === 0) {
    list.innerHTML = '<div id="journal-clues-empty">No clues noted yet — inspect objects and click "Note it".</div>';
    return;
  }
  list.innerHTML = _journalClues.map(c => `
    <div class="journal-clue-entry">
      <div class="journal-clue-time">${c.time}</div>${c.text}
    </div>
  `).join('');
  list.scrollTop = list.scrollHeight;
}

// ── Init UI listeners ─────────────────────────────────────
export function initUI() {
  document.getElementById('hint-button')?.addEventListener('click', () => {
    const st = getState();
    if (st.hintsAvailable > 0) showHint();
  });

  // Close inspection on backdrop click only (not on note button)
  document.getElementById('inspection-popup')?.addEventListener('click', e => {
    if (e.target.id === 'inspection-popup') hideInspection();
  });

  initJournal();
  updateTimerDisplay();
  updateObjectiveDisplay();
  updateHintButton();
}

// ── Module-level: wire journal + keyboard shortcuts ────────
document.getElementById('journal-button')?.addEventListener('click', () => toggleJournal());
document.getElementById('journal-close')?.addEventListener('click', () => toggleJournal(false));

document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const puzzleOpen = document.getElementById('puzzle-overlay')?.classList.contains('visible');
  const st = getState();
  if (!st.timerRunning && !st.alarmTriggered) return; // not in-game

  // J — journal
  if ((e.key === 'j' || e.key === 'J') && !puzzleOpen) {
    toggleJournal();
  }
  // H — hint
  if ((e.key === 'h' || e.key === 'H') && !puzzleOpen) {
    showHint();
  }
  // 1–9 — select inventory slot
  if (e.key >= '1' && e.key <= '9' && !puzzleOpen) {
    const idx = parseInt(e.key) - 1;
    const inv = st.inventory;
    if (idx < inv.length) {
      dispatch('SELECT_ITEM', { itemId: inv[idx] });
      import('./inventory.js').then(m => {
        const inv2 = document.createElement('div'); // trigger re-render
        import('./engine.js').then(eng => {
          eng.Engine.instance?._inventory?.render(getState());
        });
      });
    }
  }
});
