import { getState, dispatch } from '../state.js';
import { AudioSystem } from '../audio.js';
import { showToast, updateObjectiveDisplay, triggerShake } from '../ui.js';
import { AchievementSystem } from '../achievements.js';

const PUZZLE_NAMES = {
  'entry-keypad':  'Security Keypad',
  'lab-symbol':    'Symbol Matrix',
  'server-wire':   'Wire Junction',
  'memory-card':   'Sequence Memory',
  'terminal-hack': 'Terminal Hack',
  'lever-combo':   'Lever Controls',
  'laser-avoid':   'Laser Grid',
  'bio-memory':     'Specimen Vault',
  'director-safe':  'Director\'s Safe',
  'security-panel': 'Access Control',
  'power-junction': 'Power Junction',
};

const _ach = new AchievementSystem();

// Lazy-load puzzle modules
const PUZZLE_MODULES = {
  'entry-keypad':  () => import('./keypad.js'),
  'lab-symbol':    () => import('./symbol-match.js'),
  'server-wire':   () => import('./wire-connect.js'),
  'memory-card':   () => import('./memory-card.js'),
  'terminal-hack': () => import('./terminal.js'),
  'lever-combo':   () => import('./lever-combo.js'),
  'laser-avoid':   () => import('./laser-avoid.js'),
  'bio-memory':      () => import('./memory-card.js'),
  'director-safe':   () => import('./keypad.js'),
  'security-panel':  () => import('./symbol-match.js'),
  'power-junction':  () => import('./memory-card.js'),
};

let _currentModule = null;
let _currentPuzzleId = null;

export const PuzzleManager = {
  async open(puzzleId, state, onSolveCallback) {
    const loader = PUZZLE_MODULES[puzzleId];
    if (!loader) { console.warn('[PuzzleManager] No module for:', puzzleId); return; }
    if (state.puzzles[puzzleId]?.solved) {
      showToast('Already solved.', 'info');
      return;
    }

    const overlay   = document.getElementById('puzzle-overlay');
    const container = document.getElementById('puzzle-container');
    if (!overlay || !container) return;

    // Tear down previous
    if (_currentModule?.destroy) _currentModule.destroy(container);
    container.innerHTML = '';
    _currentPuzzleId = puzzleId;

    const mod = await loader();
    _currentModule = mod;

    const callbacks = {
      onSuccess: () => {
        AudioSystem.play('puzzle-success');
        dispatch('SOLVE_PUZZLE', { puzzleId });
        _ach.checkPuzzleSolve(puzzleId, state.puzzles[puzzleId]?.attempts || 0);
        this._checkObjectives(puzzleId);
        updateObjectiveDisplay();
        setTimeout(() => {
          overlay.classList.remove('visible');
          container.innerHTML = '';
          if (onSolveCallback) onSolveCallback();
        }, 800);
      },
      onFailure: () => {
        AudioSystem.play('puzzle-fail');
        triggerShake(false); // soft shake on every mistake
        const wasAlarm = getState().alarmTriggered;
        const reason = `Failed ${PUZZLE_NAMES[puzzleId] || puzzleId} too many times`;
        dispatch('FAIL_PUZZLE', { puzzleId, reason });
        const st = getState();
        const mistakesLeft = st.mistakeLimit - st.mistakeCount;
        if (st.alarmTriggered && !wasAlarm) {
          // Alarm just triggered — hard shake + red flash
          triggerShake(true);
          AudioSystem.playAlarm();
          showToast(`⚠ ALARM: ${reason}. Security in 60s!`, 'error');
          import('../ui.js').then(m => m.updateAlarmDisplay());
        } else if (!st.alarmTriggered && mistakesLeft <= 2 && mistakesLeft > 0) {
          showToast(`Warning: ${mistakesLeft} mistake${mistakesLeft === 1 ? '' : 's'} left before alarm triggers!`, 'info');
        }
      },
      onClose: () => {
        overlay.classList.remove('visible');
        container.innerHTML = '';
      },
    };

    mod.init(container, getState().puzzles[puzzleId] || {}, callbacks);
    overlay.classList.add('visible');
  },

  close() {
    const overlay = document.getElementById('puzzle-overlay');
    const container = document.getElementById('puzzle-container');
    overlay?.classList.remove('visible');
    if (_currentModule?.destroy) _currentModule.destroy(container);
    if (container) container.innerHTML = '';
    _currentModule = null;
    _currentPuzzleId = null;
  },

  _checkObjectives(puzzleId) {
    const MAP = {
      'entry-keypad':  'unlock-lab',
      'terminal-hack': 'hack-terminal',
    };
    const objId = MAP[puzzleId];
    if (objId) dispatch('COMPLETE_OBJECTIVE', { objectiveId: objId });
  },
};

// Close button
document.getElementById('puzzle-close')?.addEventListener('click', () => PuzzleManager.close());

// ESC key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') PuzzleManager.close();
});
