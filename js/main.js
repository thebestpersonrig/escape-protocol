import { dispatch } from './state.js';
import { Engine } from './engine.js';
import { SaveSystem } from './save.js';

// type="module" scripts are deferred — DOM is already ready here, no DOMContentLoaded needed
const engine = new Engine();

const btnNew  = document.getElementById('btn-new-game');
const btnCont = document.getElementById('btn-continue');
const btnAch  = document.getElementById('btn-achievements');

if (SaveSystem.hasSave()) {
  btnCont.disabled = false;
}

btnNew.addEventListener('click', () => {
  SaveSystem.deleteSave();
  dispatch('RESET_STATE');
  engine.startNewGame().catch(e => console.error('[Game] startNewGame failed:', e));
});

btnCont.addEventListener('click', () => {
  const saved = SaveSystem.load();
  if (saved) {
    dispatch('LOAD_STATE', { state: saved });
    engine.resumeGame().catch(e => console.error('[Game] resumeGame failed:', e));
  }
});

btnAch.addEventListener('click', () => {
  engine.showAchievements();
});

console.log('[Escape Protocol] Ready.');
