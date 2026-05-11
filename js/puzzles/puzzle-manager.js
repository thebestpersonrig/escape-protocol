import { getState, dispatch } from '../state.js';
import { AudioSystem } from '../audio.js';
import { showToast } from '../ui.js';
import { AchievementSystem } from '../achievements.js';
import { updateObjectiveDisplay } from '../ui.js';

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
        dispatch('FAIL_PUZZLE', { puzzleId });
        // Check if alarm should trigger
        const st = getState();
        if (st.alarmTriggered && !st._alarmStarted) {
          st._alarmStarted = true;
          AudioSystem.playAlarm();
          import('../ui.js').then(m => m.updateAlarmDisplay());
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
