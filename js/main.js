// Only import the two safest modules at the top level.
// Engine and all its complex deps are loaded lazily inside click handlers,
// so any import/init error surfaces visually instead of silently killing the page.
import { dispatch } from './state.js';
import { SaveSystem } from './save.js';

let _engine = null;
let _selectedDifficulty = 'medium';

async function getEngine() {
  if (!_engine) {
    const { Engine } = await import('./engine.js');
    _engine = new Engine();
  }
  return _engine;
}

function showButtonError(btn, msg) {
  btn.disabled = false;
  btn.textContent = btn.dataset.label || '▶ New Game';
  let errEl = document.getElementById('ep-start-error');
  if (!errEl) {
    errEl = document.createElement('div');
    errEl.id = 'ep-start-error';
    errEl.style.cssText = 'color:#ff6060;font-size:11px;font-family:monospace;margin-top:8px;max-width:300px;text-align:center;word-break:break-all;';
    btn.parentElement.appendChild(errEl);
  }
  errEl.textContent = 'Error: ' + msg;
  console.error('[EP]', msg);
}

// Difficulty selection
const DIFF_LABELS = { easy: '30 MIN · 10 MISTAKES', medium: '20 MIN · 5 MISTAKES', hard: '10 MIN · 3 MISTAKES' };
const _diffLabel = document.getElementById('diff-label');

function _applyDiffButtons(diff) {
  _selectedDifficulty = diff;
  document.querySelectorAll('.diff-btn').forEach(b => {
    const active = b.dataset.diff === diff;
    b.classList.toggle('selected', active);
    b.style.borderColor = active ? '#00ffe0' : '#2a2a3a';
    b.style.background  = active ? 'rgba(0,255,224,.1)' : '#111118';
    b.style.color       = active ? '#00ffe0' : '#5a6070';
  });
  if (_diffLabel) _diffLabel.textContent = DIFF_LABELS[diff] || '';
}

document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', function() { _applyDiffButtons(this.dataset.diff); });
});

// When the engine returns to the main menu, re-select the last-used difficulty
window.addEventListener('ep:show-menu', e => {
  _applyDiffButtons(e.detail?.difficulty || 'medium');
});

// Check for existing save
const btnCont = document.getElementById('btn-continue');
if (SaveSystem.hasSave() && btnCont) btnCont.disabled = false;

// New Game
document.getElementById('btn-new-game')?.addEventListener('click', async function() {
  const btn = this;
  btn.dataset.label = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Starting...';
  try {
    const engine = await getEngine();
    SaveSystem.deleteSave();
    dispatch('RESET_STATE');
    await engine.startNewGame(_selectedDifficulty);
  } catch (e) {
    showButtonError(btn, e?.message || String(e));
  }
});

// Continue
btnCont?.addEventListener('click', async function() {
  const saved = SaveSystem.load();
  if (!saved) return;
  try {
    const engine = await getEngine();
    dispatch('LOAD_STATE', { state: saved });
    await engine.resumeGame();
  } catch (e) {
    console.error('[EP] Resume failed:', e);
  }
});

// Achievements
document.getElementById('btn-achievements')?.addEventListener('click', async function() {
  try {
    const engine = await getEngine();
    engine.showAchievements();
  } catch (e) {
    console.error('[EP] Achievements failed:', e);
  }
});

console.log('[Escape Protocol] main.js loaded.');
