import { getState, dispatch } from './state.js';
import { SaveSystem } from './save.js';

const DEFS = [
  { id: 'speed-runner',   name: 'Speed Runner',       desc: 'Escape with more than half your time remaining.' },
  { id: 'no-hints',       name: "I Don't Need Help",  desc: 'Escape without using any hints.' },
  { id: 'no-mistakes',    name: 'Ghost Protocol',      desc: 'Escape without triggering the alarm.' },
  { id: 'secret-escape',  name: 'Shadow Exit',         desc: 'Find and use the secret room exit.' },
  { id: 'too-loud',       name: 'Too Loud',            desc: 'Escape while the alarm is still active.' },
  { id: 'time-out',       name: "Time's Up",           desc: 'Run out of time. Better luck next time.' },
  { id: 'completionist',  name: 'Completionist',       desc: 'Inspect every object in every room.' },
  { id: 'wire-first-try', name: 'Electrician',         desc: 'Solve the wire puzzle on the first try.' },
  { id: 'memory-master',  name: 'Memory Master',       desc: 'Complete the memory puzzle on the first try.' },
];

export class AchievementSystem {
  getDef(id) {
    return DEFS.find(d => d.id === id);
  }

  unlock(id) {
    const st = getState();
    if (st.achievements.includes(id)) return;
    dispatch('UNLOCK_ACHIEVEMENT', { achievementId: id });
    SaveSystem.saveAchievements(getState().achievements);
  }

  checkEnding(endingId) {
    const st = getState();
    const remaining = st.timerSeconds;
    const DIFF_TOTALS = { easy: 1800, medium: 1200, hard: 600 };
    const totalSecs = DIFF_TOTALS[st.difficulty] ?? 1200;

    if (endingId === 'escaped' || endingId === 'secret-escape') {
      // Speed Runner: escaped with more than half the time left
      if (remaining > totalSecs * 0.5) this.unlock('speed-runner');
      if (st.hintsUsed === 0) this.unlock('no-hints');
      if (!st.alarmTriggered) this.unlock('no-mistakes');
      if (st.alarmTriggered) this.unlock('too-loud');
    }
    if (endingId === 'secret-escape') this.unlock('secret-escape');
    if (endingId === 'time-out')      this.unlock('time-out');

    // Completionist: check inspectedObjects vs total inspectable
    const totalInspectable = 12;
    if (st.inspectedObjects.length >= totalInspectable) this.unlock('completionist');
  }

  checkPuzzleSolve(puzzleId, attempts) {
    if (puzzleId === 'server-wire'  && attempts === 0) this.unlock('wire-first-try');
    if (puzzleId === 'memory-card'  && attempts === 0) this.unlock('memory-master');
  }

  renderScreen(screenEl) {
    const savedAchs = SaveSystem.loadAchievements();
    const grid = screenEl.querySelector('.achievement-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (const def of DEFS) {
      const unlocked = savedAchs.includes(def.id);
      const card = document.createElement('div');
      card.className = `ach-card ${unlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <div class="ach-name">${unlocked ? def.name : '???'}</div>
        <div class="ach-desc">${unlocked ? def.desc : 'Keep playing to unlock.'}</div>
      `;
      grid.appendChild(card);
    }
  }
}
