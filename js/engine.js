import { getState, dispatch, subscribe } from './state.js';
import { initUI, startTimer, stopTimer, updateObjectiveDisplay, updateTimerDisplay, showNarrative, showToast, showAchievementToast, clearJournal, updateRoomIndicator, setMissionHints } from './ui.js';
import { RoomRenderer } from './rooms.js';
import { InteractionSystem } from './interaction.js';
import { InventoryRenderer } from './inventory.js';
import { SaveSystem } from './save.js';
import { AudioSystem } from './audio.js';
import { ParticleSystem } from './particles.js';
import { AchievementSystem } from './achievements.js';
import { initClueLocations } from './clue-randomiser.js';

export class Engine {
  constructor() {
    Engine.instance = this;
    this._missionConfig = null;
    this._fadeEl    = document.getElementById('fade-cover');
    this._menuEl    = document.getElementById('main-menu');
    this._endEl     = document.getElementById('ending-screen');
    this._achScreenEl = document.getElementById('achievements-screen');
    this._pauseEl   = document.getElementById('pause-menu');
    this._paused    = false;
    this._restartArmed = false;
    this._restartTimer = null;

    this._renderer    = new RoomRenderer();
    this._interaction = new InteractionSystem(this._renderer);
    this._inventory   = new InventoryRenderer();
    this._particles   = new ParticleSystem();
    this._audio       = AudioSystem;
    this._achievements = new AchievementSystem();

    // Pre-load saved volume settings so sliders and audio start at correct levels
    {
      const _s = SaveSystem.loadSettings();
      this._audio._volume.master  = _s.masterVolume  ?? 0.7;
      this._audio._volume.sfx     = _s.sfxVolume     ?? 1.0;
      this._audio._volume.ambient = _s.ambientVolume  ?? 0.4;
    }

    subscribe((state, action) => this._onStateChange(state, action));

    document.getElementById('ending-play-again')?.addEventListener('click', () => {
      const _diff = getState().difficulty;
      this._endEl?.classList.remove('visible');
      this._menuEl?.classList.remove('hidden');
      window.dispatchEvent(new CustomEvent('ep:show-menu', { detail: { difficulty: _diff } }));
    });

    document.getElementById('ending-main-menu')?.addEventListener('click', () => {
      const _diff = getState().difficulty; // capture before reset wipes it
      this._endEl?.classList.remove('visible');
      dispatch('RESET_STATE');
      this._menuEl?.classList.remove('hidden');
      window.dispatchEvent(new CustomEvent('ep:show-menu', { detail: { difficulty: _diff } }));
    });

    document.getElementById('ach-back-btn')?.addEventListener('click', () => {
      this._achScreenEl?.classList.remove('visible');
      this._menuEl?.classList.remove('hidden');
    });

    // Pause menu buttons
    document.getElementById('pause-resume')?.addEventListener('click', () => this.togglePause());
    const _restartBtn = document.getElementById('pause-restart');
    _restartBtn?.addEventListener('click', () => {
      if (!this._restartArmed) {
        // First click — arm; revert automatically after 2.5 s
        this._restartArmed = true;
        if (_restartBtn) { _restartBtn.textContent = '⚠ Confirm restart?'; _restartBtn.classList.add('danger-btn'); }
        this._restartTimer = setTimeout(() => {
          this._restartArmed = false;
          if (_restartBtn) { _restartBtn.textContent = '↺ Restart'; _restartBtn.classList.remove('danger-btn'); }
        }, 2500);
      } else {
        // Second click — execute
        clearTimeout(this._restartTimer);
        const _diff = getState().difficulty;
        this._restartArmed = false;
        if (_restartBtn) { _restartBtn.textContent = '↺ Restart'; _restartBtn.classList.remove('danger-btn'); }
        this._hidePause();
        this._paused = false;
        stopTimer();
        dispatch('RESET_STATE');
        this._menuEl?.classList.remove('hidden');
        window.dispatchEvent(new CustomEvent('ep:show-menu', { detail: { difficulty: _diff } }));
      }
    });
    document.getElementById('pause-quit')?.addEventListener('click', () => {
      const _diff = getState().difficulty;
      this._hidePause();
      stopTimer();
      this._paused = false;
      dispatch('RESET_STATE');
      this._menuEl?.classList.remove('hidden');
      window.dispatchEvent(new CustomEvent('ep:show-menu', { detail: { difficulty: _diff } }));
    });

    // Volume sliders in pause menu
    const _wireSlider = (sliderId, valId, apply) => {
      const slider = document.getElementById(sliderId);
      const valEl  = document.getElementById(valId);
      if (!slider) return;
      slider.addEventListener('input', () => {
        const v = parseInt(slider.value) / 100;
        if (valEl) valEl.textContent = slider.value;
        apply(v);
      });
    };
    _wireSlider('vol-master', 'vol-master-val', v => {
      this._audio._volume.master = v;
      if (this._audio.masterGain) this._audio.masterGain.gain.value = v;
      this._saveSettings();
    });
    _wireSlider('vol-sfx', 'vol-sfx-val', v => {
      this._audio._volume.sfx = v;
      this._saveSettings();
    });
    _wireSlider('vol-ambient', 'vol-ambient-val', v => {
      this._audio._volume.ambient = v;
      if (this._audio.ambientGain) this._audio.ambientGain.gain.value = v;
      this._saveSettings();
    });

    // Sync slider UI to the values we just loaded from settings
    this._syncPauseSliders();

    // P key to toggle pause
    document.addEventListener('keydown', e => {
      if (e.key === 'p' || e.key === 'P') {
        const st = getState();
        // Only allow pause when game is actually running
        if (!st.timerRunning && !this._paused) return;
        if (st.ending) return;
        // Don't pause if puzzle is open
        const puzzleOverlay = document.getElementById('puzzle-overlay');
        if (puzzleOverlay?.classList.contains('visible')) return;
        this.togglePause();
      }
    });
  }

  togglePause() {
    const st = getState();
    if (st.ending) return;
    this._paused = !this._paused;
    if (this._paused) {
      stopTimer();
      this._pauseEl?.classList.add('visible');
      this._syncPauseSliders(); // always reflect current audio state on open
    } else {
      this._hidePause();
      startTimer();
    }
  }

  _hidePause() {
    this._pauseEl?.classList.remove('visible');
    // Reset restart confirmation if it was armed
    if (this._restartArmed) {
      clearTimeout(this._restartTimer);
      this._restartArmed = false;
      const btn = document.getElementById('pause-restart');
      if (btn) { btn.textContent = '↺ Restart'; btn.classList.remove('danger-btn'); }
    }
  }

  // ── Settings helpers ──────────────────────────────────────

  _saveSettings() {
    SaveSystem.saveSettings({
      masterVolume:  this._audio._volume.master,
      sfxVolume:     this._audio._volume.sfx,
      ambientVolume: this._audio._volume.ambient,
    });
  }

  _syncPauseSliders() {
    const sync = (sliderId, valId, value) => {
      const pct    = Math.round(value * 100);
      const slider = document.getElementById(sliderId);
      const valEl  = document.getElementById(valId);
      if (slider) slider.value = pct;
      if (valEl)  valEl.textContent = pct;
    };
    sync('vol-master',  'vol-master-val',  this._audio._volume.master);
    sync('vol-sfx',     'vol-sfx-val',     this._audio._volume.sfx);
    sync('vol-ambient', 'vol-ambient-val', this._audio._volume.ambient);
  }

  _applyAudioToNodes() {
    // Called after AudioSystem.init() so gain nodes exist
    if (this._audio.masterGain)  this._audio.masterGain.gain.value  = this._audio._volume.master;
    if (this._audio.ambientGain) this._audio.ambientGain.gain.value = this._audio._volume.ambient;
  }

  setMissionConfig(config) {
    this._missionConfig = config || null;
    if (config?.hints) setMissionHints(config.hints);
  }

  async startNewGame(difficulty = 'medium') {
    const seed = Date.now();
    dispatch('SET_SEED', { seed });
    dispatch('SET_DIFFICULTY', { difficulty });
    dispatch('START_TIMER');
    localStorage.setItem('ep-seed', String(seed));
    if (this._missionConfig?.clueRandomization !== false) initClueLocations(seed);
    clearJournal();
    await this._fadeOut();
    this._menuEl?.classList.add('hidden');
    initUI();
    await this._audio.init().catch(() => {});
    this._applyAudioToNodes();
    const startRoom = this._missionConfig?.startRoom || 'lab-entry';
    await this._loadRoom(startRoom);
    this._particles.init(document.getElementById('particle-canvas'));
    startTimer();
    await this._fadeIn();
    SaveSystem.save(getState());
  }

  async resumeGame() {
    const st = getState();
    if (st.seed) localStorage.setItem('ep-seed', String(st.seed));
    await this._fadeOut();
    this._menuEl?.classList.add('hidden');
    initUI();
    await this._audio.init().catch(() => {});
    this._applyAudioToNodes();
    await this._loadRoom(st.currentRoom);
    this._particles.init(document.getElementById('particle-canvas'));
    startTimer();
    await this._fadeIn();
  }

  showAchievements() {
    this._menuEl?.classList.add('hidden');
    this._achScreenEl?.classList.add('visible');
    this._achievements.renderScreen(this._achScreenEl);
  }

  async navigateTo(roomId) {
    // Special: 'escaped' means trigger the win ending
    if (roomId === 'escaped') {
      // Complete whichever escape objective this mission uses
      dispatch('COMPLETE_OBJECTIVE', { objectiveId: 'escape' });
      dispatch('COMPLETE_OBJECTIVE', { objectiveId: 'bw-escape' });
      dispatch('SET_ENDING', { ending: 'escaped' });
      await this.showEnding('escaped');
      return;
    }
    // Special: 'secret-escaped' means secret ending
    if (roomId === 'secret-escaped') {
      dispatch('COMPLETE_OBJECTIVE', { objectiveId: 'escape' });
      dispatch('COMPLETE_OBJECTIVE', { objectiveId: 'bw-escape' });
      dispatch('SET_ENDING', { ending: 'secret-escape' });
      await this.showEnding('secret-escape');
      return;
    }
    const st = getState();
    if (roomId === 'secret-room' && !st.secretRoomUnlocked) return;
    await this._fadeOut();
    dispatch('NAVIGATE_TO_ROOM', { roomId });
    await this._loadRoom(roomId);
    await this._fadeIn();
    SaveSystem.save(getState());
    updateObjectiveDisplay();
  }

  async showEnding(endingId) {
    stopTimer();
    this._audio.stopAlarm();
    try { this._audio.ambientNode?.stop(); } catch (e) {}
    await this._fadeOut(800);

    const st = getState();
    const DIFF_TOTALS = { easy: 1800, medium: 1200, hard: 600 };
    const totalSecs = this._missionConfig?.difficulty?.[st.difficulty]?.seconds
      ?? DIFF_TOTALS[st.difficulty]
      ?? 1200;
    const elapsed   = totalSecs - st.timerSeconds;
    const fast      = elapsed < totalSecs * 0.35;
    const noMistakes = st.mistakeCount === 0;
    const noHints   = st.hintsUsed === 0;
    const alarmOn   = st.alarmTriggered;

    // ── Ending text — from mission config or Arcadia fallback ──
    const mText = this._missionConfig?.endings?.text || {};

    function _pick(def, ...variants) {
      for (const v of variants) if (def[v]) return def[v];
      return def.default || '';
    }

    const ENDINGS = {
      escaped: (() => {
        const d = mText.escaped || {};
        return {
          title:     d.title     || 'ESCAPE SUCCESSFUL',
          titleClass:d.titleClass|| 'success',
          body: noMistakes && noHints && d.flawless ? d.flawless
              : noMistakes && d.clean              ? d.clean
              : alarmOn && d.alarm                 ? d.alarm
              : fast && d.fast                     ? d.fast
              : d.default || 'You made it out.',
        };
      })(),
      'secret-escape': (() => {
        const d = mText['secret-escape'] || {};
        return {
          title:     d.title     || 'SHADOW EXIT',
          titleClass:d.titleClass|| 'success',
          body: noHints && d.noHints ? d.noHints : d.default || 'You found the hidden exit.',
        };
      })(),
      'time-out': (() => {
        const d = mText['time-out'] || {};
        const startRoom = this._missionConfig?.startRoom || 'lab-entry';
        return {
          title:     d.title     || 'TIME EXPIRED',
          titleClass:d.titleClass|| 'fail',
          body: st.mistakeCount > 8 && d.manyMistakes                            ? d.manyMistakes
              : (st.currentRoom === 'final-exit' || st.currentRoom === startRoom) && d.nearExit ? d.nearExit
              : d.default || 'The lockdown sequence completes. You are still inside.',
        };
      })(),
      'alarm-caught': (() => {
        const d = mText['alarm-caught'] || {};
        return {
          title:     d.title     || 'SECURITY RESPONSE',
          titleClass:d.titleClass|| 'fail',
          body: st.alarmSecondsLeft <= 5 && d.nearEscape ? d.nearEscape : d.default || 'Security responds. You don\'t reach the exit.',
        };
      })(),
    };

    // ── Ending catalogue (for "Ending X of 4" pips) ────────
    const ENDING_CATALOGUE = this._missionConfig?.endings?.catalogue || [
      { id: 'escaped',       label: 'Standard Escape',   type: 'success', desc: 'Escape through the main exit' },
      { id: 'secret-escape', label: 'Shadow Exit',        type: 'success', desc: 'Find and use the hidden tunnel' },
      { id: 'alarm-caught',  label: 'Security Response',  type: 'fail',    desc: 'Caught by security after triggering the alarm' },
      { id: 'time-out',      label: 'Time Expired',       type: 'fail',    desc: 'Facility lockdown completes before you escape' },
    ];
    const catIdx  = ENDING_CATALOGUE.findIndex(e => e.id === endingId);
    const catEntry = catIdx >= 0 ? ENDING_CATALOGUE[catIdx] : null;

    // Persist this ending as seen
    const seenEndings = SaveSystem.loadEndingsSeen();
    if (!seenEndings.includes(endingId)) seenEndings.push(endingId);
    SaveSystem.saveEndingsSeen(seenEndings);

    const ending = ENDINGS[endingId] || ENDINGS.escaped;
    const titleEl  = document.getElementById('ending-title');
    const bodyEl   = document.getElementById('ending-body');
    const statsEl  = document.getElementById('ending-stats');
    const scoreEl  = document.getElementById('ending-score');
    const tagEl    = document.getElementById('ending-tag');

    // Populate the "Ending X of 4" tag with discovery pips
    if (tagEl && catEntry) {
      const pips = ENDING_CATALOGUE.map(e => {
        const seen    = seenEndings.includes(e.id);
        const current = e.id === endingId;
        const cls     = [
          'ending-seen-pip',
          seen    ? 'seen'    : '',
          current ? 'current' : '',
          e.type,
        ].filter(Boolean).join(' ');
        return `<span class="${cls}" title="${e.label}">
          <span class="pip-mark">${seen ? '◆' : '◇'}</span>
          <span class="pip-name">${e.label}</span>
        </span>`;
      }).join('');
      tagEl.innerHTML = `
        <span class="ending-num">ENDING ${catIdx + 1} OF ${ENDING_CATALOGUE.length}</span>
        <span class="ending-cat-label ${catEntry.type}">${catEntry.label}</span>
        <span class="ending-cat-desc">${catEntry.desc}</span>
        <div class="ending-seen-row">
          <span class="ending-seen-label">Discovered:</span>
          ${pips}
        </div>
      `;
    }

    if (titleEl) { titleEl.textContent = ending.title; titleEl.className = ending.titleClass; }
    if (bodyEl)  bodyEl.textContent = ending.body;

    const min = Math.floor(elapsed / 60);
    const sec = elapsed % 60;
    if (statsEl) statsEl.textContent = `Time: ${min}m ${sec}s  ·  Hints: ${st.hintsUsed}  ·  Mistakes: ${st.mistakeCount}`;

    // Score (only for success endings)
    if (scoreEl) {
      if (endingId === 'escaped' || endingId === 'secret-escape') {
        const score = Math.max(0,
          10000
          - Math.round(elapsed / 60) * 80
          - st.hintsUsed * 500
          - st.mistakeCount * 200
          + (endingId === 'secret-escape' ? 2000 : 0)
        );
        scoreEl.textContent = `SCORE: ${score.toLocaleString()}`;
        scoreEl.style.display = 'block';
      } else {
        scoreEl.style.display = 'none';
      }
    }

    this._endEl?.classList.add('visible');
    this._achievements.checkEnding(endingId, st);
    SaveSystem.deleteSave();
    await this._fadeIn(800);
  }

  async _loadRoom(roomId) {
    const st = getState();
    let config;
    try {
      const res = await fetch(`data/rooms/${roomId}.json`);
      config = await res.json();
    } catch (e) {
      console.error('[Engine] Failed to load room:', roomId, e);
      return;
    }

    this._renderer.render(config, st);
    this._interaction.attachTo(config, st);
    this._particles.setRoom(config);

    if (config.ambientSound) {
      this._audio.setAmbient(config.ambientSound);
    }

    updateRoomIndicator(config.name || roomId);

    if (config.narrativeOnEnter) {
      setTimeout(() => showNarrative(config.narrativeOnEnter), 600);
    }
  }

  _onStateChange(state, action) {
    if (action === 'PICK_UP_ITEM' || action === 'DROP_ITEM') {
      this._inventory.render(state);
    }
    if (action === 'SELECT_ITEM') {
      this._inventory.render(state);
    }
    if (action === 'UNLOCK_ACHIEVEMENT') {
      const id = state.achievements[state.achievements.length - 1];
      const def = this._achievements.getDef(id);
      if (def) showAchievementToast(def.name);
    }
  }

  async _fadeOut(ms = 400) {
    this._fadeEl?.classList.add('active');
    return new Promise(r => setTimeout(r, ms));
  }

  async _fadeIn(ms = 400) {
    this._fadeEl?.classList.remove('active');
    return new Promise(r => setTimeout(r, ms));
  }
}
