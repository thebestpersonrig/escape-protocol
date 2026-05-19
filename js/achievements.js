import { getState, dispatch } from './state.js';
import { SaveSystem } from './save.js';

const DEFS = [
  // Escape endings
  { id: 'first-escape',   name: 'First Steps Out',     desc: 'Complete the escape for the first time.' },
  { id: 'speed-runner',   name: 'Speed Runner',        desc: 'Escape with more than half your time remaining.' },
  { id: 'no-hints',       name: "I Don't Need Help",   desc: 'Escape without using any hints.' },
  { id: 'no-mistakes',    name: 'Ghost Protocol',       desc: 'Escape without triggering the alarm.' },
  { id: 'secret-escape',  name: 'Shadow Exit',          desc: 'Find and use the secret room exit.' },
  { id: 'too-loud',       name: 'Too Loud',             desc: 'Escape while the alarm is still active.' },
  { id: 'under-pressure', name: 'Under Pressure',       desc: 'Escape on Hard with the alarm active.' },
  // Failure
  { id: 'time-out',       name: "Time's Up",            desc: 'Run out of time. Better luck next time.' },
  { id: 'patient-zero',   name: 'Patient Zero',         desc: 'Trigger the security alarm.' },
  // Exploration
  { id: 'explorer',       name: 'Every Room',           desc: 'Visit at least 7 of the 9 rooms.' },
  { id: 'cartographer',   name: 'Cartographer',         desc: 'Visit every room in the facility.' },
  { id: 'lore-hunter',    name: 'Deep Dive',            desc: 'Inspect 18 or more unique objects.' },
  { id: 'completionist',  name: 'Completionist',        desc: 'Inspect 20 or more objects in a single run.' },
  // Difficulty
  { id: 'speedrun-hard',  name: 'Hard Boiled',          desc: 'Escape on Hard difficulty.' },
  { id: 'no-hints-hard',  name: 'Purist',               desc: 'Escape on Hard without using any hints.' },
  // Puzzle skill
  { id: 'wire-first-try', name: 'Electrician',          desc: 'Solve the wire puzzle on the first try.' },
  { id: 'memory-master',  name: 'Memory Master',        desc: 'Complete the memory puzzle on the first try.' },
  { id: 'safe-cracker',   name: 'Safe Cracker',         desc: "Crack the director's safe on the first attempt." },
  // Delta collectibles
  { id: 'delta-hunter',   name: 'Delta Hunter',         desc: 'Find all Δ fragments in a single mission.' },
];

export class AchievementSystem {
  getDef(id) {
    return DEFS.find(d => d.id === id);
  }

  unlock(id) {
    const st = getState();
    if (st.achievements.includes(id)) return;
    dispatch('UNLOCK_ACHIEVEMENT', { achievementId: id });
    // Merge with previously saved achievements to preserve cross-session progress
    const saved  = SaveSystem.loadAchievements();
    const merged = [...new Set([...saved, id])];
    SaveSystem.saveAchievements(merged);
  }

  checkEnding(endingId, st) {
    st = st || getState();
    const remaining  = st.timerSeconds;
    const DIFF_TOTALS = { easy: 1800, medium: 1200, hard: 600 };
    const totalSecs  = DIFF_TOTALS[st.difficulty] ?? 1200;

    // Alarm trigger — can fire any ending
    if (st.alarmTriggered) this.unlock('patient-zero');

    // Explorer / Cartographer — check rooms visited
    if (st.visitedRooms.length >= 7) this.unlock('explorer');
    if (st.visitedRooms.length >= 9) this.unlock('cartographer');

    // Lore / completionist
    if (st.inspectedObjects.length >= 18) this.unlock('lore-hunter');
    if (st.inspectedObjects.length >= 20) this.unlock('completionist');

    if (endingId === 'escaped' || endingId === 'secret-escape') {
      this.unlock('first-escape');
      if (remaining > totalSecs * 0.5) this.unlock('speed-runner');
      if (st.hintsUsed === 0)          this.unlock('no-hints');
      if (!st.alarmTriggered)          this.unlock('no-mistakes');
      if (st.alarmTriggered)           this.unlock('too-loud');
      if (st.difficulty === 'hard')    this.unlock('speedrun-hard');
      if (st.difficulty === 'hard' && st.hintsUsed === 0)   this.unlock('no-hints-hard');
      if (st.difficulty === 'hard' && st.alarmTriggered)    this.unlock('under-pressure');
    }

    if (endingId === 'secret-escape') this.unlock('secret-escape');
    if (endingId === 'time-out')      this.unlock('time-out');

    // Delta hunter — find all delta fragments in a single mission
    const deltas = st.collectedDeltas || [];
    // Determine mission delta count by prefix
    const bwCount = deltas.filter(d => d.startsWith('delta-bw-')).length;
    const msCount = deltas.filter(d => d.startsWith('delta-ms-')).length;
    const arcCount = deltas.filter(d => !d.startsWith('delta-bw-') && !d.startsWith('delta-ms-')).length;
    // Arcadia: 9 deltas, Blackwood: 10, Meridian: 11
    if (arcCount >= 9 || bwCount >= 10 || msCount >= 11) {
      this.unlock('delta-hunter');
    }
  }

  checkPuzzleSolve(puzzleId, attempts) {
    if (puzzleId === 'server-wire'   && attempts === 0) this.unlock('wire-first-try');
    if (puzzleId === 'memory-card'   && attempts === 0) this.unlock('memory-master');
    if (puzzleId === 'director-safe' && attempts === 0) this.unlock('safe-cracker');
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
