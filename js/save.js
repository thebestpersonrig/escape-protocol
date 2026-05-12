const DEFAULT_SAVE_KEY    = 'escape-protocol-save';
const DEFAULT_ENDINGS_KEY = 'ep-endings-seen';
const ACH_KEY             = 'escape-protocol-achievements';
const SETTINGS_KEY        = 'escape-protocol-settings';

let _saveKey    = DEFAULT_SAVE_KEY;
let _endingsKey = DEFAULT_ENDINGS_KEY;

export const SaveSystem = {
  setSaveKey(key)        { if (key) _saveKey    = key; },
  setEndingsSaveKey(key) { if (key) _endingsKey = key; },

  save(state) {
    try {
      const data = { schemaVersion: 1, timestamp: Date.now(), state };
      localStorage.setItem(_saveKey, JSON.stringify(data));
    } catch (e) {
      console.warn('[Save] Could not save:', e);
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(_saveKey);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data.state || null;
    } catch (e) {
      console.warn('[Save] Could not load:', e);
      return null;
    }
  },

  hasSave() {
    return localStorage.getItem(_saveKey) !== null;
  },

  deleteSave() {
    localStorage.removeItem(_saveKey);
  },

  saveAchievements(list) {
    try {
      localStorage.setItem(ACH_KEY, JSON.stringify({ unlocked: list }));
    } catch (e) {}
  },

  loadAchievements() {
    try {
      const raw = localStorage.getItem(ACH_KEY);
      return raw ? JSON.parse(raw).unlocked || [] : [];
    } catch (e) {
      return [];
    }
  },

  loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : { masterVolume: 0.8, sfxVolume: 1.0, ambientVolume: 0.6 };
    } catch (e) {
      return { masterVolume: 0.8, sfxVolume: 1.0, ambientVolume: 0.6 };
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {}
  },

  saveEndingsSeen(list) {
    try { localStorage.setItem(_endingsKey, JSON.stringify(list)); } catch (e) {}
  },

  loadEndingsSeen() {
    try {
      const raw = localStorage.getItem(_endingsKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  },
};
