import { getState, dispatch, subscribe } from './state.js';
import { Engine } from './engine.js';
import { SaveSystem } from './save.js';

const engine = new Engine();

document.addEventListener('DOMContentLoaded', () => {
  const btnNew  = document.getElementById('btn-new-game');
  const btnCont = document.getElementById('btn-continue');
  const btnAch  = document.getElementById('btn-achievements');

  if (SaveSystem.hasSave()) {
    btnCont.disabled = false;
  }

  btnNew.addEventListener('click', () => {
    SaveSystem.deleteSave();
    dispatch('RESET_STATE');
    engine.startNewGame();
  });

  btnCont.addEventListener('click', () => {
    const saved = SaveSystem.load();
    if (saved) {
      dispatch('LOAD_STATE', { state: saved });
      engine.resumeGame();
    }
  });

  btnAch.addEventListener('click', () => {
    engine.showAchievements();
  });

  console.log('[Escape Protocol] Ready.');
});
