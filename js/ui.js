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

// Escalating time costs per hint: 30s, 60s, 90s, 120s, 150s
const HINT_TIME_COSTS = [30, 60, 90, 120, 150];

// Progress-aware fallback hints (Arcadia) — arrays of { text, when? }
const HINTS = {
  'lab-entry': [
    { text: 'Have you checked inside the metal drawer near the left wall?', when: { objectNot: 'entry-drawer:open' } },
    { text: 'The keypad code is written on the sticky note in the drawer.', when: { puzzleUnsolved: 'entry-keypad' } },
    { text: 'The vent on the ceiling looks loose — you\'d need a tool.', when: { puzzleSolved: 'entry-keypad' } },
    { text: 'Try the door to the main lab — the keypad should have unlocked it.' },
  ],
  'main-lab': [
    { text: 'Look inside the cabinets and the locker for items.', when: { objectNot: 'lab-cabinet-left:open' } },
    { text: 'The symbol puzzle on the wall controls the server room door.', when: { puzzleUnsolved: 'lab-symbol' } },
    { text: 'You need server power restored before the main terminal will respond.', when: { puzzleSolved: 'lab-symbol' } },
    { text: 'Head to the server room or explore other unlocked areas.' },
  ],
  'server-room': [
    { text: 'The fuse box in the corner controls power. You need a fuse from the main lab.', when: { missingItem: 'fuse' } },
    { text: 'Wire colours on the server panel match the diagram found in the lab.', when: { puzzleUnsolved: 'server-wire' } },
    { text: 'Check the security hub — the pass you need is there.', when: { puzzleSolved: 'server-wire' } },
    { text: 'Power is restored. Move on to the security hub or other rooms.' },
  ],
  'security-hub': [
    { text: 'The access control panel on the right wall needs to be solved first.', when: { puzzleUnsolved: 'security-panel' } },
    { text: 'The security locker unlocks after the panel — grab the pass inside.', when: { puzzleSolved: 'security-panel' } },
    { text: 'The security pass is required for the emergency corridor.' },
  ],
  'utility-corridor': [
    { text: 'Reset the power junction on the right — the compartment below it will unlock.', when: { puzzleUnsolved: 'power-frequency' } },
    { text: 'The bypass chip is inside the compartment. You\'ll need it for the laser grid.', when: { puzzleSolved: 'power-frequency' } },
    { text: 'Head to the final exit with the bypass chip.' },
  ],
  'bio-lab': [
    { text: 'Check the specimen fridge — there\'s a research note inside.', when: { objectNot: 'bio-fridge:open' } },
    { text: 'The vault sequence lock controls the key box below it.', when: { puzzleUnsolved: 'bio-switch' } },
    { text: 'The maintenance key from this room lets you access the secret room.', when: { puzzleSolved: 'bio-switch' } },
  ],
  'director-office': [
    { text: 'The wall safe keypad is to the left — the code is in the bio lab.', when: { puzzleUnsolved: 'director-safe' } },
    { text: 'The emergency ID card in the safe opens the maintenance hatch.', when: { puzzleSolved: 'director-safe' } },
  ],
  'final-exit': [
    { text: 'You need a bypass chip to activate the laser grid — check the utility corridor.', when: { missingItem: 'bypass-chip' } },
    { text: 'The lever combination was written on a diagram in the main lab.', when: { puzzleUnsolved: 'lever-combo' } },
    { text: 'Navigate the laser corridor — stay in the safe zone and reach the green exit.', when: { puzzleUnsolved: 'laser-avoid' } },
    { text: 'All puzzles solved — head for the exit!' },
  ],
  'secret-room': [
    { text: 'Read every piece of writing in this room — the story connects.' },
    { text: 'The hatch requires the emergency ID card from the director\'s office.', when: { missingItem: 'emergency-id' } },
    { text: 'The hatch keypad code is hidden in this room — look at everything.' },
  ],
};

let _hintCooldown = 0;
let _hintCooldownInterval = null;
let _missionHints = {};

export function setMissionHints(hints) {
  _missionHints = hints || {};
}

/** Pick the best hint for the current room based on player progress */
function _pickHint(st) {
  // Try mission config hints first
  const missionEntry = _missionHints[st.currentRoom];
  let candidates;

  if (missionEntry) {
    candidates = Array.isArray(missionEntry) ? missionEntry : [missionEntry];
  } else {
    candidates = HINTS[st.currentRoom] || [{ text: 'Keep exploring. There must be something you missed.' }];
  }

  // If hints are plain strings (from mission JSON), convert
  if (typeof candidates[0] === 'string') {
    candidates = candidates.map(t => ({ text: t }));
  }

  // Filter by conditions to find the most relevant hint
  for (const h of candidates) {
    if (!h.when) continue; // no condition = fallback
    const w = h.when;

    if (w.puzzleUnsolved && st.puzzles[w.puzzleUnsolved]?.solved) continue;
    if (w.puzzleSolved && !st.puzzles[w.puzzleSolved]?.solved) continue;
    if (w.missingItem && st.inventory.includes(w.missingItem)) continue;
    if (w.hasItem && !st.inventory.includes(w.hasItem)) continue;
    if (w.objectNot) {
      const [objId, objState] = w.objectNot.split(':');
      if (st.objects[objId] === objState) continue;
    }
    // All conditions passed — this hint is relevant
    return h.text;
  }

  // Fall back to last hint (no condition = always valid)
  const fallback = candidates.filter(h => !h.when);
  if (fallback.length > 0) return fallback[fallback.length - 1].text;
  return candidates[candidates.length - 1].text;
}

export function getHintTimeCost() {
  const st = getState();
  return HINT_TIME_COSTS[Math.min(st.hintsUsed, HINT_TIME_COSTS.length - 1)] || 150;
}

export function showHint() {
  const st = getState();
  if (st.speedRunMode) return; // no hints in speed run
  if (st.hintsAvailable <= 0 || _hintCooldown > 0) return;

  const hintText = _pickHint(st);
  const timeCost = getHintTimeCost();

  dispatch('USE_HINT');
  dispatch('DEDUCT_TIME', { seconds: timeCost });

  // Start 20s cooldown
  _hintCooldown = 20;
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
  updateTimerDisplay();

  const popup = document.getElementById('hint-popup');
  const textEl = document.getElementById('hint-popup-text');
  const labelEl = document.getElementById('hint-popup-label');
  if (!popup || !textEl) return;
  textEl.textContent = hintText;
  if (labelEl) labelEl.textContent = `\u{1F4A1} HINT  (-${timeCost}s)`;
  popup.classList.add('visible');
  setTimeout(() => popup.classList.remove('visible'), 5500);
}

export function updateHintButton() {
  const btn = document.getElementById('hint-button');
  if (!btn) return;
  const st = getState();
  if (st.speedRunMode) {
    btn.textContent = 'No hints (Speed Run)';
    btn.classList.add('disabled');
  } else if (st.hintsAvailable <= 0) {
    btn.textContent = 'No hints left';
    btn.classList.add('disabled');
  } else if (_hintCooldown > 0) {
    btn.textContent = `Hint (${_hintCooldown}s)`;
    btn.classList.add('disabled');
  } else {
    const nextCost = getHintTimeCost();
    btn.textContent = `Hint (${st.hintsAvailable} left · -${nextCost}s)`;
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

// ── Narrative (typewriter) ────────────────────────────────
let _narrativeTimer = null;
let _narrativeHideTimer = null;

export function showNarrative(text) {
  const el = document.getElementById('room-narrative');
  if (!el) return;

  // Clear any running typewriter
  if (_narrativeTimer) { clearInterval(_narrativeTimer); _narrativeTimer = null; }
  if (_narrativeHideTimer) { clearTimeout(_narrativeHideTimer); _narrativeHideTimer = null; }

  el.textContent = '';
  el.classList.add('visible');

  let i = 0;
  const speed = 22; // ms per character
  _narrativeTimer = setInterval(() => {
    if (i < text.length) {
      el.textContent += text[i];
      i++;
    } else {
      clearInterval(_narrativeTimer);
      _narrativeTimer = null;
      // Hold for a moment after typing finishes, then fade out
      _narrativeHideTimer = setTimeout(() => el.classList.remove('visible'), 3500);
    }
  }, speed);

  // Click to skip typewriter and show full text immediately
  const _skip = () => {
    if (_narrativeTimer) {
      clearInterval(_narrativeTimer);
      _narrativeTimer = null;
      el.textContent = text;
      if (_narrativeHideTimer) clearTimeout(_narrativeHideTimer);
      _narrativeHideTimer = setTimeout(() => el.classList.remove('visible'), 3500);
    }
    el.removeEventListener('click', _skip);
  };
  el.addEventListener('click', _skip);
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
    if (!st.speedRunMode && st.hintsAvailable > 0) showHint();
  });

  // Close inspection on backdrop click only (not on note button)
  document.getElementById('inspection-popup')?.addEventListener('click', e => {
    if (e.target.id === 'inspection-popup') hideInspection();
  });

  // Mode badges in HUD
  const st = getState();
  const hud = document.getElementById('hud-top');
  if (hud) {
    if (st.speedRunMode && !document.getElementById('speed-run-badge')) {
      const badge = document.createElement('div');
      badge.id = 'speed-run-badge';
      badge.textContent = '⚡ SPEED RUN';
      badge.style.cssText = 'font-family:var(--font-mono);font-size:9px;letter-spacing:0.15em;color:#ffb020;text-shadow:0 0 8px rgba(255,176,32,0.5);pointer-events:none;white-space:nowrap;';
      hud.insertBefore(badge, hud.firstChild);
    }
    if (st.newGamePlus && !document.getElementById('ngplus-badge')) {
      const badge = document.createElement('div');
      badge.id = 'ngplus-badge';
      badge.textContent = '+ NEW GAME+';
      badge.style.cssText = 'font-family:var(--font-mono);font-size:9px;letter-spacing:0.15em;color:#cc66ff;text-shadow:0 0 8px rgba(180,80,255,0.5);pointer-events:none;white-space:nowrap;';
      hud.insertBefore(badge, hud.firstChild);
    }
  }

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
