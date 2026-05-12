import { getState, dispatch } from './state.js';
import { showToast, showInspection, animatePickup } from './ui.js';
import { ITEM_DEFS } from './inventory.js';
import { PuzzleManager } from './puzzles/puzzle-manager.js';
import { SaveSystem } from './save.js';
import { AudioSystem } from './audio.js';

// itemId:objectId → handler name
const USE_TABLE = {
  'screwdriver:entry-vent':         'openVentWithScrewdriver',
  'keycard-a:entry-door-mainlab':   'swipeKeycardEntryDoor',
  'wire-cutter:server-panel':       'openServerPanel',
  'fuse:fuse-box':                  'insertFuse',
  'access-card-b:final-door':       'openFinalDoor',
  'laser-key:final-door':           'activateLaserPuzzle',
};

export class InteractionSystem {
  constructor(renderer) {
    this._renderer  = renderer;
    this._highlight = document.getElementById('hotspot-highlight');
    this._tooltip   = document.getElementById('hotspot-tooltip');
    this._scene     = document.getElementById('scene-container');
    this._config    = null;
    this._allHotspots = [];

    this._touchMoved = false;

    this._scene?.addEventListener('mousemove',  e => this._onMouseMove(e));
    this._scene?.addEventListener('click',      e => this._onClick(e));
    this._scene?.addEventListener('mouseleave',   () => this._clearHighlight());

    // Touch support — touchstart shows highlight, touchend fires action
    this._scene?.addEventListener('touchstart', e => this._onTouchStart(e), { passive: true });
    this._scene?.addEventListener('touchmove',  () => { this._touchMoved = true; }, { passive: true });
    this._scene?.addEventListener('touchend',   e => this._onTouchEnd(e),   { passive: false });
  }

  attachTo(config, state) {
    this._config = config;
    this._buildHotspotList(config, state);
  }

  _buildHotspotList(config, state) {
    // Collect main hotspots + content items
    this._allHotspots = [];
    for (const hs of config.hotspots || []) {
      this._allHotspots.push(hs);
      for (const item of hs.contents || []) {
        // Only include item if clue randomiser assigned it to this container
        if (item.clueSlot && state.clueLocations && Object.keys(state.clueLocations).length > 0) {
          const assigned = state.clueLocations[item.id];
          if (assigned && assigned !== hs.id) continue;
        }
        // Check visibility
        if (item.visibleWhen) {
          const cond = state.objects[item.visibleWhen.objectState];
          if (cond !== item.visibleWhen.equals) continue;
        }
        if (state.inventory.includes(item.id)) continue;
        if (state.objects[item.id] === 'taken') continue;
        this._allHotspots.push(item);
      }
    }
  }

  _onMouseMove(e) {
    const hs = this._findHotspotAt(e.clientX, e.clientY);
    if (hs) {
      this._showHighlight(hs);
      this._showTooltip(hs, e);
    } else {
      this._clearHighlight();
    }
  }

  _onTouchStart(e) {
    this._touchMoved = false;
    const t = e.touches[0];
    const hs = this._findHotspotAt(t.clientX, t.clientY);
    if (hs) this._showHighlight(hs);
  }

  _onTouchEnd(e) {
    if (this._touchMoved) { this._clearHighlight(); return; }
    e.preventDefault(); // stop ghost mouse-click
    const t = e.changedTouches[0];
    this._handleClickAt(t.clientX, t.clientY);
    this._clearHighlight();
  }

  _onClick(e) {
    this._handleClickAt(e.clientX, e.clientY);
  }

  _handleClickAt(clientX, clientY) {
    const hs = this._findHotspotAt(clientX, clientY);
    const state = getState();

    if (!hs) {
      if (state.selectedItem) dispatch('DESELECT_ITEM');
      return;
    }

    AudioSystem.play('click-interact');

    // If player has an item selected, try to use it
    if (state.selectedItem) {
      const key = `${state.selectedItem}:${hs.id}`;
      if (USE_TABLE[key]) {
        this._handleUse(USE_TABLE[key], state, hs);
      } else {
        showToast("That doesn't work here.", 'error');
        AudioSystem.play('door-locked');
      }
      return;
    }

    // Check condition
    if (hs.condition) {
      if (!this._checkCondition(hs.condition, state)) {
        // For 'all' conditions, find the first failing sub-condition and use its message
        let msg = hs.lockedMessage || 'This is locked.';
        if (hs.condition.all && hs.lockedMessages) {
          const failIdx = hs.condition.all.findIndex(c => !this._checkCondition(c, state));
          if (failIdx >= 0 && hs.lockedMessages[failIdx]) {
            msg = hs.lockedMessages[failIdx];
          }
        }
        showToast(msg, 'error');
        AudioSystem.play('door-locked');
        // Rattle the locked element for tactile feedback
        const _lockedEl = document.querySelector(`[data-hotspot-id="${hs.id}"]`);
        if (_lockedEl) {
          _lockedEl.classList.remove('rattle');
          void _lockedEl.offsetWidth;
          _lockedEl.classList.add('rattle');
          setTimeout(() => _lockedEl.classList.remove('rattle'), 600);
        }
        return;
      }
    }

    this._executeAction(hs.action, hs, state);
  }

  _checkCondition(condition, state) {
    // AND — every sub-condition must pass
    if (condition.all) {
      return condition.all.every(c => this._checkCondition(c, state));
    }
    // OR — at least one sub-condition must pass
    if (condition.any) {
      return condition.any.some(c => this._checkCondition(c, state));
    }
    if (condition.puzzleSolved) {
      return state.puzzles[condition.puzzleSolved]?.solved === true;
    }
    if (condition.hasItem) {
      return state.inventory.includes(condition.hasItem);
    }
    if (condition.secretRoomUnlocked) {
      return state.secretRoomUnlocked === true;
    }
    if (condition.objectState) {
      if (typeof condition.objectState === 'object') {
        return state.objects[condition.objectState.id] === condition.objectState.equals;
      }
      return state.objects[condition.objectState] === condition.equals;
    }
    return true;
  }

  _executeAction(action, hs, state) {
    if (!action) return;
    switch (action.type) {
      case 'navigate':
        import('./engine.js').then(m => m.Engine.instance?.navigateTo(action.to));
        break;

      case 'open-puzzle':
        PuzzleManager.open(action.puzzleId, state, () => {
          // On solve
          this._renderer.rerender();
          this._buildHotspotList(this._config, getState());
          SaveSystem.save(getState());
        });
        break;

      case 'toggle-container': {
        const current = state.objects[action.objectId] || 'closed';
        const next    = current === 'open' ? 'closed' : 'open';
        dispatch('SET_OBJECT_STATE', { objectId: action.objectId, newState: next });
        if (next === 'open') AudioSystem.play('door-unlock');
        this._renderer.rerender();
        this._buildHotspotList(this._config, getState());
        break;
      }

      case 'inspect': {
        const _st = getState();
        // Keypad code
        const _code = _st.keypadCode || '????';
        const _displayCode = _code.split('').join('-');
        // Terminal password
        const _pass = _st.terminalPassword || '?????????';
        // Lever pattern  e.g. "[ ↑ ][ ↓ ][ ↑ ][ ↓ ]"
        const _pat = (_st.leverPattern || [1,0,1,0])
          .map(p => p ? '[ ↑ ]' : '[ ↓ ]').join('');
        const _dirCode = _st.directorSafeCode || '????';
        let _text = (action.text || '')
          .replace(/\{\{keypad-code\}\}/g, _displayCode)
          .replace(/\{\{terminal-password\}\}/g, _pass)
          .replace(/\{\{lever-pattern\}\}/g, _pat)
          .replace(/\{\{director-safe-code\}\}/g, _dirCode);
        showInspection(_text, action.image || null, hs.id);
        AudioSystem.play('paper-rustle');
        if (action.unlocksRoom === 'secret-room') {
          dispatch('UNLOCK_SECRET_ROOM');
        }
        break;
      }

      case 'pick-up': {
        // Capture element + icon BEFORE rerender removes it from DOM
        const _pickupEl   = document.querySelector(`[data-hotspot-id="${action.itemId}"]`);
        const _pickupDef  = ITEM_DEFS[action.itemId];
        dispatch('PICK_UP_ITEM', { itemId: action.itemId });
        dispatch('SET_OBJECT_STATE', { objectId: action.itemId, newState: 'taken' });
        AudioSystem.play('pick-up');
        showToast(`Picked up: ${hs.label || action.itemId}`, 'success');
        if (_pickupEl && _pickupDef) animatePickup(_pickupEl, _pickupDef.icon);
        this._renderer.rerender();
        this._buildHotspotList(this._config, getState());
        SaveSystem.save(getState());
        break;
      }

      default:
        console.warn('[Interaction] Unknown action type:', action.type);
    }
  }

  _handleUse(handlerName, state, hs) {
    const handlers = {
      openVentWithScrewdriver: () => {
        dispatch('SET_OBJECT_STATE', { objectId: 'entry-vent', newState: 'open' });
        AudioSystem.play('door-unlock');
        showToast('You unscrew the vent cover.', 'success');
        dispatch('DESELECT_ITEM');
        this._renderer.rerender();
        this._buildHotspotList(this._config, getState());
      },
      swipeKeycardEntryDoor: () => {
        const st = getState();
        if (!st.puzzles['entry-keypad']?.solved) {
          showToast('The keypad light is red. Solve the access code first.', 'error');
          AudioSystem.play('door-locked');
          return;
        }
        dispatch('DESELECT_ITEM');
        AudioSystem.play('door-unlock');
        import('./engine.js').then(m => m.Engine.instance?.navigateTo('main-lab'));
      },
      openServerPanel: () => {
        dispatch('SET_OBJECT_STATE', { objectId: 'server-panel', newState: 'open' });
        AudioSystem.play('door-unlock');
        showToast('You cut away the panel cover.', 'success');
        dispatch('DESELECT_ITEM');
        this._renderer.rerender();
        this._buildHotspotList(this._config, getState());
      },
      insertFuse: () => {
        const st = getState();
        if (!st.puzzles['server-wire']?.solved) {
          showToast('The wiring must be reconnected before the fuse will hold.', 'error');
          AudioSystem.play('door-locked');
          return;
        }
        dispatch('SET_OBJECT_STATE', { objectId: 'fuse-box', newState: 'powered' });
        AudioSystem.play('door-unlock');
        showToast('Power restored! The server room hums to life.', 'success');
        dispatch('DROP_ITEM', { itemId: 'fuse' });
        dispatch('COMPLETE_OBJECTIVE', { objectiveId: 'restore-power' });
        import('./ui.js').then(m => m.updateObjectiveDisplay());
        this._renderer.rerender();
        this._buildHotspotList(this._config, getState());
      },
      openFinalDoor: () => {
        const st = getState();
        if (!st.puzzles['lever-combo']?.solved) {
          showToast('Set the lever combination first.', 'error');
          AudioSystem.play('door-locked');
          return;
        }
        if (!st.puzzles['laser-avoid']?.solved) {
          showToast('You must bypass the laser grid before the exit will open.', 'error');
          AudioSystem.play('door-locked');
          return;
        }
        dispatch('DESELECT_ITEM');
        AudioSystem.play('door-unlock');
        import('./engine.js').then(m => m.Engine.instance?.navigateTo('escaped'));
      },
      activateLaserPuzzle: () => {
        PuzzleManager.open('laser-avoid', getState(), () => {
          this._renderer.rerender();
        });
        dispatch('DESELECT_ITEM');
      },
    };

    const fn = handlers[handlerName];
    if (fn) fn();
    else console.warn('[Interaction] No handler for:', handlerName);
  }

  _findHotspotAt(clientX, clientY) {
    if (!this._scene) return null;
    const rect = this._scene.getBoundingClientRect();
    const pctX = ((clientX - rect.left) / rect.width)  * 100;
    const pctY = ((clientY - rect.top)  / rect.height) * 100;

    // Search reverse so top-most (last rendered) wins
    for (let i = this._allHotspots.length - 1; i >= 0; i--) {
      const hs = this._allHotspots[i];
      if (pctX >= hs.x && pctX <= hs.x + hs.w &&
          pctY >= hs.y && pctY <= hs.y + hs.h) {
        return hs;
      }
    }
    return null;
  }

  _showHighlight(hs) {
    if (!this._highlight || !this._scene) return;
    const rect = this._scene.getBoundingClientRect();
    this._highlight.style.left   = `${hs.x}%`;
    this._highlight.style.top    = `${hs.y}%`;
    this._highlight.style.width  = `${hs.w}%`;
    this._highlight.style.height = `${hs.h}%`;
    this._highlight.classList.add('active');
    this._scene.style.cursor = hs.cursor || 'pointer';
  }

  _clearHighlight() {
    this._highlight?.classList.remove('active');
    if (this._tooltip) this._tooltip.classList.remove('visible');
    if (this._scene)   this._scene.style.cursor = 'default';
  }

  _showTooltip(hs, e) {
    if (!this._tooltip) return;
    this._tooltip.textContent = hs.label || '';
    this._tooltip.classList.add('visible');
    const rect = this._scene.getBoundingClientRect();
    let x = e.clientX - rect.left + 14;
    let y = e.clientY - rect.top  - 28;
    if (x + 160 > rect.width)  x = e.clientX - rect.left - 170;
    if (y < 0)                  y = e.clientY - rect.top  + 16;
    this._tooltip.style.left = `${x}px`;
    this._tooltip.style.top  = `${y}px`;
  }
}
