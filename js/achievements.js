import { getState, dispatch } from './state.js';
import { SaveSystem } from './save.js';

/* ══════════════════════════════════════════════════════════════
   Achievement Definitions — organised by section
   Room counts: Arcadia 9, Blackwood 10, Meridian 11
   ══════════════════════════════════════════════════════════════ */

const SECTIONS = [
  {
    label: 'General',
    defs: [
      { id: 'first-escape',    name: 'First Steps Out',      desc: 'Escape any mission for the first time.' },
      { id: 'speed-runner',    name: 'Speed Runner',         desc: 'Escape any mission with more than half your time remaining.' },
      { id: 'no-hints',        name: "I Don't Need Help",    desc: 'Escape any mission without using hints.' },
      { id: 'ghost-protocol',  name: 'Ghost Protocol',       desc: 'Escape any mission without triggering the alarm.' },
      { id: 'too-loud',        name: 'Too Loud',             desc: 'Escape while the alarm is still active.' },
      { id: 'under-pressure',  name: 'Under Pressure',       desc: 'Escape on Hard with the alarm active.' },
      { id: 'hard-boiled',     name: 'Hard Boiled',          desc: 'Escape any mission on Hard difficulty.' },
      { id: 'purist',          name: 'Purist',               desc: 'Escape on Hard without using any hints.' },
      { id: 'time-out',        name: "Time's Up",            desc: 'Run out of time.' },
      { id: 'patient-zero',    name: 'Patient Zero',         desc: 'Trigger the security alarm.' },
    ],
  },
  {
    label: 'Arcadia Research Facility',
    defs: [
      { id: 'arcadia-escape',    name: 'Facility Cleared',   desc: 'Escape Arcadia Research Facility.' },
      { id: 'arcadia-secret',    name: 'Shadow Exit',        desc: 'Find and use the secret room exit in Arcadia.' },
      { id: 'arcadia-explorer',  name: 'Lab Rat',            desc: 'Visit every room in Arcadia (9 rooms).' },
      { id: 'arcadia-lore',      name: 'Research Notes',     desc: 'Inspect 15+ unique objects in Arcadia.' },
      { id: 'arcadia-speed-5',   name: 'Speed Demon',        desc: 'Escape Arcadia in under 5 minutes.' },
      { id: 'arcadia-speed-3',   name: 'Lightning Run',      desc: 'Escape Arcadia in under 3 minutes.' },
      { id: 'arcadia-wire',      name: 'Electrician',        desc: 'Solve the wire puzzle on the first try.' },
      { id: 'arcadia-memory',    name: 'Memory Master',      desc: 'Complete the memory card puzzle on the first try.' },
      { id: 'arcadia-safe',      name: 'Safe Cracker',       desc: "Crack the director's safe on the first attempt." },
    ],
  },
  {
    label: 'Blackwood Asylum',
    defs: [
      { id: 'blackwood-escape',    name: 'Asylum Cleared',     desc: 'Escape Blackwood Psychiatric Institute.' },
      { id: 'blackwood-secret',    name: 'Tunnel Rat',         desc: 'Find and use the secret exit in Blackwood.' },
      { id: 'blackwood-explorer',  name: 'Ward Walker',        desc: 'Visit every room in Blackwood (10 rooms).' },
      { id: 'blackwood-lore',      name: 'Case Files',         desc: 'Inspect 15+ unique objects in Blackwood.' },
      { id: 'blackwood-speed-8',   name: 'Quick Getaway',      desc: 'Escape Blackwood in under 8 minutes.' },
      { id: 'blackwood-speed-5',   name: 'Asylum Sprinter',    desc: 'Escape Blackwood in under 5 minutes.' },
      { id: 'blackwood-bells',     name: 'Bell Ringer',        desc: 'Solve the chapel bells on the first try.' },
      { id: 'blackwood-cipher',    name: 'Codebreaker',        desc: 'Solve the records cipher on the first try.' },
      { id: 'blackwood-safe',      name: 'Harlan\'s Secret',   desc: "Crack the director's safe on the first attempt." },
    ],
  },
  {
    label: 'Meridian Station Alpha',
    defs: [
      { id: 'meridian-escape',    name: 'Station Cleared',     desc: 'Escape Meridian Station Alpha.' },
      { id: 'meridian-secret',    name: 'Ghost Signal',        desc: 'Find and use the secret exit on Meridian.' },
      { id: 'meridian-explorer',  name: 'Station Sweep',       desc: 'Visit every room on Meridian (11 rooms).' },
      { id: 'meridian-lore',      name: 'Flight Recorder',     desc: 'Inspect 15+ unique objects on Meridian.' },
      { id: 'meridian-speed-10',  name: 'Orbital Rush',        desc: 'Escape Meridian in under 10 minutes.' },
      { id: 'meridian-speed-6',   name: 'Zero-G Sprint',       desc: 'Escape Meridian in under 6 minutes.' },
      { id: 'meridian-reactor',   name: 'Nuclear Precision',   desc: 'Solve the reactor sequence on the first try.' },
      { id: 'meridian-wires',     name: 'Rewired',             desc: 'Solve the power reroute on the first try.' },
      { id: 'meridian-pod',       name: 'Pod Jockey',          desc: 'Crack the escape pod code on the first attempt.' },
    ],
  },
  {
    label: 'Cross-Mission',
    defs: [
      { id: 'triple-threat',   name: 'Triple Threat',       desc: 'Escape all three missions.' },
      { id: 'all-endings',     name: 'Seen It All',          desc: 'Witness every ending across all missions.' },
      { id: 'delta-hunter',    name: 'Delta Hunter',         desc: 'Find all Δ fragments in a single mission.' },
      { id: 'delta-master',    name: 'Delta Master',         desc: 'Find all Δ fragments across all three missions.' },
      { id: 'completionist',   name: 'Completionist',        desc: 'Unlock every other achievement.' },
    ],
  },
];

// Flat list for lookups
const DEFS = SECTIONS.flatMap(s => s.defs);
const TOTAL_COUNT = DEFS.length;

/* ── Helper: detect mission from startRoom ─────────────────── */
function _detectMission(startRoom) {
  if (!startRoom) return 'arcadia';
  if (startRoom === 'bw-east-foyer' || startRoom.startsWith('bw-')) return 'blackwood';
  if (startRoom.startsWith('ms-')) return 'meridian';
  return 'arcadia';
}

const ROOM_TOTALS  = { arcadia: 9, blackwood: 10, meridian: 11 };
const DELTA_TOTALS = { arcadia: 9, blackwood: 10, meridian: 11 };

export { SECTIONS, DEFS, TOTAL_COUNT };

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

  /* ── Called by engine.showEnding() ──────────────────────────
     extra = { missionId, elapsed, totalSecs }                */
  checkEnding(endingId, st, extra = {}) {
    st = st || getState();
    const missionId = extra.missionId || 'arcadia';
    const elapsed   = extra.elapsed   || 0;
    const totalSecs = extra.totalSecs || 1200;
    const remaining = st.timerSeconds;

    // ── General ─────────────────────────────────────────────
    if (st.alarmTriggered) this.unlock('patient-zero');

    // Lore per-mission
    const inspected = (st.inspectedObjects || []).length;
    if (inspected >= 15) this.unlock(`${missionId}-lore`);

    // Explorer per-mission
    const roomTotal = ROOM_TOTALS[missionId] || 9;
    if ((st.visitedRooms || []).length >= roomTotal) this.unlock(`${missionId}-explorer`);

    const isEscape = endingId === 'escaped' || endingId === 'secret-escape' || endingId === 'self-sacrifice';

    if (isEscape) {
      this.unlock('first-escape');
      this.unlock(`${missionId}-escape`);

      if (remaining > totalSecs * 0.5) this.unlock('speed-runner');
      if (st.hintsUsed === 0)          this.unlock('no-hints');
      if (!st.alarmTriggered)          this.unlock('ghost-protocol');
      if (st.alarmTriggered)           this.unlock('too-loud');
      if (st.difficulty === 'hard')    this.unlock('hard-boiled');
      if (st.difficulty === 'hard' && st.hintsUsed === 0)  this.unlock('purist');
      if (st.difficulty === 'hard' && st.alarmTriggered)   this.unlock('under-pressure');

      // ── Speed challenge achievements ──────────────────────
      const SPEED_TARGETS = {
        arcadia:   [['arcadia-speed-5', 300], ['arcadia-speed-3', 180]],
        blackwood: [['blackwood-speed-8', 480], ['blackwood-speed-5', 300]],
        meridian:  [['meridian-speed-10', 600], ['meridian-speed-6', 360]],
      };
      for (const [achId, target] of (SPEED_TARGETS[missionId] || [])) {
        if (elapsed <= target) this.unlock(achId);
      }
    }

    if (endingId === 'secret-escape') this.unlock(`${missionId}-secret`);
    if (endingId === 'time-out')      this.unlock('time-out');

    // ── Delta collectibles ──────────────────────────────────
    const deltas = st.collectedDeltas || [];
    const prefixMap = { arcadia: '', blackwood: 'delta-bw-', meridian: 'delta-ms-' };
    const prefix = prefixMap[missionId];
    let missionDeltas;
    if (missionId === 'arcadia') {
      missionDeltas = deltas.filter(d => !d.startsWith('delta-bw-') && !d.startsWith('delta-ms-'));
    } else {
      missionDeltas = deltas.filter(d => d.startsWith(prefix));
    }
    if (missionDeltas.length >= (DELTA_TOTALS[missionId] || 9)) {
      this.unlock('delta-hunter');
    }

    // ── Cross-mission checks (read from localStorage) ───────
    this._checkCrossMission();
  }

  checkPuzzleSolve(puzzleId, attempts) {
    // Arcadia puzzles
    if (puzzleId === 'server-wire'   && attempts === 0) this.unlock('arcadia-wire');
    if (puzzleId === 'memory-card'   && attempts === 0) this.unlock('arcadia-memory');
    if (puzzleId === 'director-safe' && attempts === 0) this.unlock('arcadia-safe');

    // Blackwood puzzles
    if (puzzleId === 'bw-chapel-bells'   && attempts === 0) this.unlock('blackwood-bells');
    if (puzzleId === 'bw-records-cipher' && attempts === 0) this.unlock('blackwood-cipher');
    if (puzzleId === 'bw-director-safe'  && attempts === 0) this.unlock('blackwood-safe');

    // Meridian puzzles
    if (puzzleId === 'ms-reactor-sequence' && attempts === 0) this.unlock('meridian-reactor');
    if (puzzleId === 'ms-power-reroute'   && attempts === 0) this.unlock('meridian-wires');
    if (puzzleId === 'ms-escape-pod-code' && attempts === 0) this.unlock('meridian-pod');
  }

  /* ── Cross-mission achievements (localStorage based) ─────── */
  _checkCrossMission() {
    try {
      const arcSeen = JSON.parse(localStorage.getItem('ep-endings-seen') || '[]');
      const bwSeen  = JSON.parse(localStorage.getItem('ep-blackwood-endings-seen') || '[]');
      const msSeen  = JSON.parse(localStorage.getItem('ep-meridian-endings-seen') || '[]');

      const arcDone = arcSeen.some(e => e === 'escaped' || e === 'secret-escape');
      const bwDone  = bwSeen.some(e => e === 'escaped' || e === 'secret-escape');
      const msDone  = msSeen.some(e => e === 'escaped' || e === 'secret-escape' || e === 'self-sacrifice');

      // Triple Threat — all 3 missions escaped
      if (arcDone && bwDone && msDone) this.unlock('triple-threat');

      // Seen It All — every ending across all missions
      const arcEndings = ['escaped', 'secret-escape', 'alarm-caught', 'time-out'];
      const bwEndings  = ['escaped', 'secret-escape', 'alarm-caught', 'time-out'];
      const msEndings  = ['escaped', 'secret-escape', 'self-sacrifice', 'alarm-caught', 'time-out'];
      const allArcSeen = arcEndings.every(e => arcSeen.includes(e));
      const allBwSeen  = bwEndings.every(e => bwSeen.includes(e));
      const allMsSeen  = msEndings.every(e => msSeen.includes(e));
      if (allArcSeen && allBwSeen && allMsSeen) this.unlock('all-endings');

      // Delta Master — check all deltas across all saves
      // We read the per-mission delta counts from a shared localStorage key
      const deltaData = JSON.parse(localStorage.getItem('ep-delta-progress') || '{}');
      if (deltaData.arcadia >= 9 && deltaData.blackwood >= 10 && deltaData.meridian >= 11) {
        this.unlock('delta-master');
      }

      // Completionist — unlock every other achievement
      const saved = SaveSystem.loadAchievements();
      const nonCompletionist = DEFS.filter(d => d.id !== 'completionist');
      if (nonCompletionist.every(d => saved.includes(d.id))) {
        this.unlock('completionist');
      }
    } catch (e) { /* ignore localStorage errors */ }
  }

  /* ── Save per-mission delta progress to shared key ─────────
     Called by engine after ending screen                       */
  saveDeltaProgress(missionId, count) {
    try {
      const data = JSON.parse(localStorage.getItem('ep-delta-progress') || '{}');
      data[missionId] = Math.max(data[missionId] || 0, count);
      localStorage.setItem('ep-delta-progress', JSON.stringify(data));
    } catch (e) {}
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
