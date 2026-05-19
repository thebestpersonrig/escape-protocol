let DIFFICULTY_TIMERS = {
  easy:   1800,
  medium: 1200,
  hard:    600,
};

let DIFFICULTY_MISTAKE_LIMITS = {
  easy:   10,
  medium:  5,
  hard:    3,
};

const DEFAULT_STATE = {
  version: "1.0",
  seed: null,
  difficulty: "medium",
  currentRoom: "lab-entry",
  previousRoom: null,
  visitedRooms: [],
  timerSeconds: 1200,
  timerRunning: false,
  alarmTriggered: false,
  alarmSecondsLeft: 60,
  alarmReason: '',
  mistakeCount: 0,
  mistakeLimit: 5,
  inventory: [],
  selectedItem: null,
  puzzles: {
    "entry-keypad":  { solved: false, attempts: 0 },
    "lab-symbol":    { solved: false, attempts: 0, cardOrder: [] },
    "server-wire":   { solved: false, attempts: 0, shuffledWires: [] },
    "memory-card":   { solved: false, attempts: 0 },
    "terminal-hack": { solved: false, attempts: 0 },
    "lever-combo":   { solved: false, attempts: 0, leverPositions: [0, 0, 0, 0] },
    "laser-avoid":   { solved: false, attempts: 0 },
    "bio-switch":       { solved: false, attempts: 0, pattern: [1, 0, 1, 1] },
    "director-safe":   { solved: false, attempts: 0, code: '7391' },
    "security-panel":  { solved: false, attempts: 0, sequence: [2, 0, 3, 1, 2] },
    "power-frequency": { solved: false, attempts: 0, target: 500 },
    "hatch-keypad":    { solved: false, attempts: 0 },
  },
  objects: {
    "entry-drawer":       "closed",
    "entry-vent":         "closed",
    "lab-cabinet-left":   "closed",
    "lab-cabinet-right":  "closed",
    "lab-locker":         "closed",
    "server-panel":       "closed",
    "fuse-box":           "closed",
    "final-safe":         "closed",
    "secret-panel":       "closed",
    "bio-fridge":         "closed",
    "bio-key-box":        "closed",
    "director-desk":      "closed",
    "director-safe-door": "closed",
    "security-locker":    "closed",
    "chip-compartment":   "closed",
    "secret-filing-cabinet": "closed",
  },
  objectives: [
    { id: "find-keycard",    text: "Find the lab access keycard",          done: false },
    { id: "unlock-lab",      text: "Unlock and enter the Main Lab",        done: false },
    { id: "restore-power",   text: "Restore server room power",            done: false },
    { id: "hack-terminal",   text: "Hack the security terminal",           done: false },
    { id: "escape",          text: "Reach the emergency exit and escape",  done: false },
  ],
  hintsUsed: 0,
  hintsAvailable: 5,
  speedRunMode: false,
  newGamePlus: false,
  scoreMultiplier: 1,
  clueLocations: {},
  keypadCode: '4821',
  leverPattern: [1, 0, 1, 0],
  terminalPassword: 'PROMETHEUS',
  directorSafeCode: '7391',
  bioSwitchPattern: [1, 0, 1, 1],
  powerFrequency: 500,
  inspectedObjects: [],
  collectedDeltas: [],
  achievements: [],
  ending: null,
  secretRoomUnlocked: false,
};

let _state = JSON.parse(JSON.stringify(DEFAULT_STATE));
const _listeners = [];

export function getState() {
  return _state;
}

export function subscribe(fn) {
  _listeners.push(fn);
  return () => {
    const idx = _listeners.indexOf(fn);
    if (idx !== -1) _listeners.splice(idx, 1);
  };
}

function _notify(action, payload) {
  _listeners.forEach(fn => fn(_state, action, payload));
}

export function dispatch(action, payload = {}) {
  switch (action) {
    case "NAVIGATE_TO_ROOM":
      _state.previousRoom = _state.currentRoom;
      _state.currentRoom = payload.roomId;
      if (!_state.visitedRooms.includes(payload.roomId)) {
        _state.visitedRooms.push(payload.roomId);
      }
      break;

    case "PICK_UP_ITEM":
      if (!_state.inventory.includes(payload.itemId)) {
        _state.inventory.push(payload.itemId);
      }
      break;

    case "DROP_ITEM":
      _state.inventory = _state.inventory.filter(id => id !== payload.itemId);
      if (_state.selectedItem === payload.itemId) _state.selectedItem = null;
      break;

    case "SELECT_ITEM":
      _state.selectedItem = _state.selectedItem === payload.itemId ? null : payload.itemId;
      break;

    case "DESELECT_ITEM":
      _state.selectedItem = null;
      break;

    case "SET_OBJECT_STATE":
      _state.objects[payload.objectId] = payload.newState;
      break;

    case "SOLVE_PUZZLE":
      if (_state.puzzles[payload.puzzleId]) {
        _state.puzzles[payload.puzzleId].solved = true;
      }
      break;

    case "FAIL_PUZZLE":
      if (_state.puzzles[payload.puzzleId]) {
        _state.puzzles[payload.puzzleId].attempts++;
      }
      _state.mistakeCount++;
      if (_state.mistakeCount >= _state.mistakeLimit && !_state.alarmTriggered) {
        _state.alarmTriggered = true;
        _state.alarmSecondsLeft = 60;
        _state.alarmReason = payload.reason || 'Too many failed attempts';
        dispatch("TRIGGER_ALARM");
        return;
      }
      break;

    case "UPDATE_LEVER_POSITIONS":
      if (_state.puzzles[payload.puzzleId]) {
        _state.puzzles[payload.puzzleId].leverPositions = payload.positions;
      }
      break;

    case "UPDATE_DIAL_POSITIONS":
      if (_state.puzzles[payload.puzzleId]) {
        _state.puzzles[payload.puzzleId].dialPositions = payload.positions;
      }
      break;

    case "TICK_TIMER":
      if (_state.timerRunning && _state.timerSeconds > 0) {
        _state.timerSeconds--;
      }
      if (_state.alarmTriggered && _state.alarmSecondsLeft > 0) {
        _state.alarmSecondsLeft--;
      }
      break;

    case "START_TIMER":
      _state.timerRunning = true;
      break;

    case "STOP_TIMER":
      _state.timerRunning = false;
      break;

    case "TRIGGER_ALARM":
      _state.alarmTriggered = true;
      _state.alarmSecondsLeft = 60;
      break;

    case "USE_HINT":
      if (_state.hintsAvailable > 0) {
        _state.hintsAvailable--;
        _state.hintsUsed++;
      }
      break;

    case "DEDUCT_TIME":
      _state.timerSeconds = Math.max(0, _state.timerSeconds - (payload.seconds || 0));
      break;

    case "SET_SPEED_RUN":
      _state.speedRunMode = true;
      _state.hintsAvailable = 0;
      _state.scoreMultiplier = 2;
      break;

    case "SET_NEW_GAME_PLUS":
      _state.newGamePlus = true;
      break;

    case "COMPLETE_OBJECTIVE": {
      const obj = _state.objectives.find(o => o.id === payload.objectiveId);
      if (obj) obj.done = true;
      break;
    }

    case "UNLOCK_ACHIEVEMENT":
      if (!_state.achievements.includes(payload.achievementId)) {
        _state.achievements.push(payload.achievementId);
      }
      break;

    case "UNLOCK_SECRET_ROOM":
      _state.secretRoomUnlocked = true;
      break;

    case "SET_ENDING":
      _state.ending = payload.ending;
      _state.timerRunning = false;
      break;

    case "MARK_INSPECTED":
      if (!_state.inspectedObjects.includes(payload.objectId)) {
        _state.inspectedObjects.push(payload.objectId);
      }
      break;

    case "COLLECT_DELTA":
      if (!_state.collectedDeltas.includes(payload.deltaId)) {
        _state.collectedDeltas.push(payload.deltaId);
      }
      break;

    case "LOAD_STATE":
      _state = JSON.parse(JSON.stringify(payload.state));
      // Backward compat: ensure collectedDeltas exists for older saves
      if (!Array.isArray(_state.collectedDeltas)) _state.collectedDeltas = [];
      break;

    case "RESET_STATE":
      _state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      break;

    case "SET_SEED":
      _state.seed = payload.seed;
      break;

    case "SET_DIFFICULTY": {
      const d = payload.difficulty;
      _state.difficulty = d;
      _state.timerSeconds  = DIFFICULTY_TIMERS[d]       ?? DIFFICULTY_TIMERS.medium;
      _state.mistakeLimit  = DIFFICULTY_MISTAKE_LIMITS[d] ?? 5;
      break;
    }

    case "SET_CLUE_LOCATIONS":
      _state.clueLocations = payload.clueLocations;
      break;

    case "SET_KEYPAD_CODE":
      _state.keypadCode = payload.keypadCode;
      break;

    case "SET_LEVER_PATTERN":
      _state.leverPattern = payload.pattern;
      break;

    case "SET_TERMINAL_PASSWORD":
      _state.terminalPassword = payload.password;
      break;

    case "SET_DIRECTOR_SAFE_CODE":
      _state.directorSafeCode = payload.code;
      _state.puzzles["director-safe"].code = payload.code;
      break;

    case "SET_BIO_SWITCH_PATTERN":
      _state.bioSwitchPattern = payload.pattern;
      _state.puzzles["bio-switch"].pattern = payload.pattern;
      break;

    case "SET_POWER_FREQUENCY":
      _state.powerFrequency = payload.frequency;
      _state.puzzles["power-frequency"].target = payload.frequency;
      break;

    case "SET_SECURITY_SEQUENCE":
      _state.puzzles["security-panel"].sequence = payload.sequence;
      break;

    default:
      console.warn("[State] Unknown action:", action);
      return;
  }

  _notify(action, payload);
}

export function resetState() {
  dispatch("RESET_STATE");
}

export function initMission(config) {
  if (!config) return;

  // Difficulty timers & limits
  if (config.difficulty) {
    ['easy', 'medium', 'hard'].forEach(d => {
      if (config.difficulty[d]?.seconds  != null) DIFFICULTY_TIMERS[d]        = config.difficulty[d].seconds;
      if (config.difficulty[d]?.mistakes != null) DIFFICULTY_MISTAKE_LIMITS[d] = config.difficulty[d].mistakes;
    });
  }

  // Mission-specific state defaults
  DEFAULT_STATE.currentRoom  = config.startRoom || DEFAULT_STATE.currentRoom;
  DEFAULT_STATE.puzzles      = JSON.parse(JSON.stringify(config.puzzles  || DEFAULT_STATE.puzzles));
  DEFAULT_STATE.objects      = JSON.parse(JSON.stringify(config.objects  || DEFAULT_STATE.objects));
  DEFAULT_STATE.objectives   = (config.objectives || DEFAULT_STATE.objectives).map(o => ({...o}));

  // Initial randomisable values
  const iv = config.initialValues || {};
  if (iv.keypadCode       != null) DEFAULT_STATE.keypadCode       = iv.keypadCode;
  if (iv.leverPattern     != null) DEFAULT_STATE.leverPattern     = [...iv.leverPattern];
  if (iv.terminalPassword != null) DEFAULT_STATE.terminalPassword = iv.terminalPassword;
  if (iv.directorSafeCode != null) DEFAULT_STATE.directorSafeCode = iv.directorSafeCode;
  if (iv.bioSwitchPattern != null) DEFAULT_STATE.bioSwitchPattern = [...iv.bioSwitchPattern];
  if (iv.powerFrequency   != null) DEFAULT_STATE.powerFrequency   = iv.powerFrequency;

  // Reset live state so next RESET_STATE pulls these new defaults
  _state = JSON.parse(JSON.stringify(DEFAULT_STATE));
}

export { DEFAULT_STATE };
