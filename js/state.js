const DEFAULT_STATE = {
  version: "1.0",
  seed: null,
  currentRoom: "lab-entry",
  previousRoom: null,
  visitedRooms: [],
  timerSeconds: 3600,
  timerRunning: false,
  alarmTriggered: false,
  alarmSecondsLeft: 60,
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
  },
  objectives: [
    { id: "find-keycard",    text: "Find the lab access keycard",          done: false },
    { id: "unlock-lab",      text: "Unlock and enter the Main Lab",        done: false },
    { id: "restore-power",   text: "Restore server room power",            done: false },
    { id: "hack-terminal",   text: "Hack the security terminal",           done: false },
    { id: "escape",          text: "Reach the emergency exit and escape",  done: false },
  ],
  hintsUsed: 0,
  hintsAvailable: 3,
  clueLocations: {},
  inspectedObjects: [],
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
        dispatch("TRIGGER_ALARM");
        return;
      }
      break;

    case "UPDATE_LEVER_POSITIONS":
      if (_state.puzzles[payload.puzzleId]) {
        _state.puzzles[payload.puzzleId].leverPositions = payload.positions;
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

    case "LOAD_STATE":
      _state = JSON.parse(JSON.stringify(payload.state));
      break;

    case "RESET_STATE":
      _state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      break;

    case "SET_SEED":
      _state.seed = payload.seed;
      break;

    case "SET_CLUE_LOCATIONS":
      _state.clueLocations = payload.clueLocations;
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

export { DEFAULT_STATE };
