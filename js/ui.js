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

// ── Hints ─────────────────────────────────────────────────
const HINTS = {
  'lab-entry': [
    'Have you checked inside the metal drawer near the left wall?',
    'The vent on the ceiling might be loose — you\'d need a tool to open it.',
    'The keypad code is somewhere in this room. Check every surface carefully.',
  ],
  'main-lab': [
    'Look inside the cabinets. One of them might be unlocked.',
    'The symbol puzzle on the wall corresponds to markings elsewhere in the room.',
    'You need power restored before the terminal will respond.',
  ],
  'server-room': [
    'The fuse box in the corner controls power to this section.',
    'Wire colours on the server panel match the diagram taped to the wall.',
    'Once power is restored, the terminal in the main lab will activate.',
  ],
  'final-exit': [
    'The lever combination is based on the sequence you found earlier.',
    'The laser beams move in patterns — time your movement carefully.',
    'Have you found everything in all the rooms before trying the exit?',
  ],
  'secret-room': [
    'This room has its own escape route. Look carefully at the walls.',
    'Combine what you found here with items from the main lab.',
    'The exit code for the secret tunnel is different from the main keypad.',
  ],
};

export function showHint() {
  const st = getState();
  if (st.hintsAvailable <= 0) return;

  const roomHints = HINTS[st.currentRoom] || ['Keep exploring. There must be something you missed.'];
  const hintText = roomHints[Math.min(st.hintsUsed, roomHints.length - 1)] || roomHints[roomHints.length - 1];

  dispatch('USE_HINT');
  updateHintButton();

  const popup = document.getElementById('hint-popup');
  const textEl = document.getElementById('hint-popup-text');
  if (!popup || !textEl) return;
  textEl.textContent = hintText;
  popup.classList.add('visible');
  setTimeout(() => popup.classList.remove('visible'), 5000);
}

export function updateHintButton() {
  const btn = document.getElementById('hint-button');
  if (!btn) return;
  const st = getState();
  if (st.hintsAvailable <= 0) {
    btn.textContent = 'No hints left';
    btn.classList.add('disabled');
  } else {
    btn.textContent = `Hint (${st.hintsAvailable} left)`;
    btn.classList.remove('disabled');
  }
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

// ── Module-level: wire journal controls immediately ────────
// (buttons exist in DOM from page load; don't wait for game start)
document.getElementById('journal-button')?.addEventListener('click', () => toggleJournal());
document.getElementById('journal-close')?.addEventListener('click', () => toggleJournal(false));
document.addEventListener('keydown', e => {
  if ((e.key === 'j' || e.key === 'J') && !e.ctrlKey && !e.metaKey) {
    const puzzleOpen = document.getElementById('puzzle-overlay')?.classList.contains('visible');
    if (!puzzleOpen) toggleJournal();
  }
});
