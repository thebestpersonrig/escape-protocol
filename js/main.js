import { dispatch, initMission } from './state.js';
import { SaveSystem } from './save.js';

let _engine = null;
let _selectedDifficulty = 'medium';
let _missionConfig = null;

// ── Load mission config eagerly ───────────────────────────────
const _missionId = window.EP_MISSION || 'arcadia';
const _missionConfigPromise = fetch(`data/missions/${_missionId}.json`)
  .then(r => r.json())
  .then(cfg => {
    _missionConfig = cfg;
    initMission(cfg);
    // Patch difficulty labels from config
    if (cfg.difficulty) {
      Object.keys(cfg.difficulty).forEach(d => {
        if (cfg.difficulty[d]?.label) DIFF_LABELS[d] = cfg.difficulty[d].label;
      });
      _applyDiffButtons(_selectedDifficulty);
    }
    return cfg;
  })
  .catch(err => console.warn('[EP] Could not load mission config:', err));

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

// ── Difficulty selection ──────────────────────────────────────
const DIFF_LABELS = { easy: '30 MIN · 10 MISTAKES', medium: '20 MIN · 5 MISTAKES', hard: '10 MIN · 3 MISTAKES' };
const _diffLabel = document.getElementById('diff-label');

function _applyDiffButtons(diff) {
  _selectedDifficulty = diff;
  document.querySelectorAll('.diff-btn').forEach(b => {
    const active = b.dataset.diff === diff;
    b.classList.toggle('selected', active);
    b.style.borderColor = active ? 'var(--accent, #00ffe0)' : '#2a2a3a';
    b.style.background  = active ? 'rgba(var(--accent-rgb, 0,255,224),.1)' : '#111118';
    b.style.color       = active ? 'var(--accent, #00ffe0)' : '#5a6070';
  });
  if (_diffLabel) _diffLabel.textContent = DIFF_LABELS[diff] || '';
}

document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', function() { _applyDiffButtons(this.dataset.diff); });
});

window.addEventListener('ep:show-menu', e => {
  _applyDiffButtons(e.detail?.difficulty || 'medium');
});

// Check for existing save
const btnCont = document.getElementById('btn-continue');
if (SaveSystem.hasSave(_missionId) && btnCont) btnCont.disabled = false;

// ── New Game ──────────────────────────────────────────────────
document.getElementById('btn-new-game')?.addEventListener('click', async function() {
  const btn = this;
  btn.dataset.label = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Starting...';
  try {
    const config = _missionConfig || await _missionConfigPromise;
    if (config) {
      initMission(config);
      SaveSystem.setSaveKey(config.saveKey);
      SaveSystem.setEndingsSaveKey(config.endingsSaveKey);
    }
    const engine = await getEngine();
    engine.setMissionConfig(config);
    SaveSystem.deleteSave();
    dispatch('RESET_STATE');
    await engine.startNewGame(_selectedDifficulty);
  } catch (e) {
    showButtonError(btn, e?.message || String(e));
  }
});

// ── Continue ──────────────────────────────────────────────────
btnCont?.addEventListener('click', async function() {
  const config = _missionConfig || await _missionConfigPromise;
  if (config) {
    SaveSystem.setSaveKey(config.saveKey);
    SaveSystem.setEndingsSaveKey(config.endingsSaveKey);
  }
  const saved = SaveSystem.load();
  if (!saved) return;
  try {
    const engine = await getEngine();
    engine.setMissionConfig(config);
    dispatch('LOAD_STATE', { state: saved });
    await engine.resumeGame();
  } catch (e) {
    console.error('[EP] Resume failed:', e);
  }
});

// ── Achievements ──────────────────────────────────────────────
document.getElementById('btn-achievements')?.addEventListener('click', async function() {
  try {
    const engine = await getEngine();
    engine.showAchievements();
  } catch (e) {
    console.error('[EP] Achievements failed:', e);
  }
});

console.log('[Escape Protocol] main.js loaded — mission:', _missionId);
