import { getState, dispatch, subscribe } from './state.js';
import { initUI, startTimer, stopTimer, updateObjectiveDisplay, updateTimerDisplay, showNarrative, showToast, showAchievementToast, clearJournal } from './ui.js';
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
    this._fadeEl    = document.getElementById('fade-cover');
    this._menuEl    = document.getElementById('main-menu');
    this._endEl     = document.getElementById('ending-screen');
    this._achScreenEl = document.getElementById('achievements-screen');
    this._pauseEl   = document.getElementById('pause-menu');
    this._paused    = false;

    this._renderer    = new RoomRenderer();
    this._interaction = new InteractionSystem(this._renderer);
    this._inventory   = new InventoryRenderer();
    this._particles   = new ParticleSystem();
    this._audio       = AudioSystem;
    this._achievements = new AchievementSystem();

    subscribe((state, action) => this._onStateChange(state, action));

    document.getElementById('ending-play-again')?.addEventListener('click', () => {
      this._endEl?.classList.remove('visible');
      this._menuEl?.classList.remove('hidden');
    });

    document.getElementById('ach-back-btn')?.addEventListener('click', () => {
      this._achScreenEl?.classList.remove('visible');
      this._menuEl?.classList.remove('hidden');
    });

    // Pause menu buttons
    document.getElementById('pause-resume')?.addEventListener('click', () => this.togglePause());
    document.getElementById('pause-restart')?.addEventListener('click', () => {
      this._hidePause();
      this._endEl?.classList.remove('visible');
      this._paused = false;
      dispatch('RESET_STATE');
      this._menuEl?.classList.remove('hidden');
    });
    document.getElementById('pause-quit')?.addEventListener('click', () => {
      this._hidePause();
      stopTimer();
      this._paused = false;
      dispatch('RESET_STATE');
      this._menuEl?.classList.remove('hidden');
    });

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
    } else {
      this._hidePause();
      startTimer();
    }
  }

  _hidePause() {
    this._pauseEl?.classList.remove('visible');
  }

  async startNewGame(difficulty = 'medium') {
    const seed = Date.now();
    dispatch('SET_SEED', { seed });
    dispatch('SET_DIFFICULTY', { difficulty });
    dispatch('START_TIMER');
    localStorage.setItem('ep-seed', String(seed));
    initClueLocations(seed);
    clearJournal();
    await this._fadeOut();
    this._menuEl?.classList.add('hidden');
    initUI();
    this._audio.init().catch(() => {});
    await this._loadRoom('lab-entry');
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
    this._audio.init().catch(() => {});
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
      dispatch('COMPLETE_OBJECTIVE', { objectiveId: 'escape' });
      dispatch('SET_ENDING', { ending: 'escaped' });
      await this.showEnding('escaped');
      return;
    }
    // Special: 'secret-escaped' means secret ending
    if (roomId === 'secret-escaped') {
      dispatch('COMPLETE_OBJECTIVE', { objectiveId: 'escape' });
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

    const ENDINGS = {
      escaped: {
        title: 'ESCAPE SUCCESSFUL',
        titleClass: 'success',
        body: 'You burst through the exit door as the lab goes into lockdown. Fresh air rushes in. You made it.',
      },
      'time-out': {
        title: 'TIME EXPIRED',
        titleClass: 'fail',
        body: 'The lockdown sequence completes. The automated doors seal. You are trapped inside as the ventilation purges. Next time, move faster.',
      },
      'alarm-caught': {
        title: 'SECURITY RESPONSE',
        titleClass: 'fail',
        body: 'Red lights flood the corridor. The security team arrives. You don\'t reach the exit in time.',
      },
      'secret-escape': {
        title: 'SHADOW EXIT',
        titleClass: 'success',
        body: 'The hidden maintenance tunnel leads to daylight. No one will ever know you were here.',
      },
    };

    const ending = ENDINGS[endingId] || ENDINGS.escaped;
    const titleEl = document.getElementById('ending-title');
    const bodyEl  = document.getElementById('ending-body');
    const statsEl = document.getElementById('ending-stats');

    if (titleEl) { titleEl.textContent = ending.title; titleEl.className = ending.titleClass; }
    if (bodyEl)  bodyEl.textContent = ending.body;

    const st = getState();
    const DIFF_TOTALS = { easy: 1800, medium: 1200, hard: 600 };
    const totalSecs = DIFF_TOTALS[st.difficulty] ?? 1200;
    const elapsed = totalSecs - st.timerSeconds;
    const min = Math.floor(elapsed / 60);
    const sec = elapsed % 60;
    if (statsEl) statsEl.textContent = `Time elapsed: ${min}m ${sec}s  |  Hints used: ${st.hintsUsed}  |  Mistakes: ${st.mistakeCount}`;

    this._endEl?.classList.add('visible');
    this._achievements.checkEnding(endingId);
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
