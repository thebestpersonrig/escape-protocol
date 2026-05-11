const SAVE_KEY   = 'escape-protocol-save';
const ACH_KEY    = 'escape-protocol-achievements';
const SETTINGS_KEY = 'escape-protocol-settings';

export const SaveSystem = {
  save(state) {
    try {
      const data = { schemaVersion: 1, timestamp: Date.now(), state };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[Save] Could not save:', e);
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data.state || null;
    } catch (e) {
      console.warn('[Save] Could not load:', e);
      return null;
    }
  },

  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  },

  deleteSave() {
    localStorage.removeItem(SAVE_KEY);
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
};
