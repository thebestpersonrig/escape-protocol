import { getState, dispatch } from './state.js';
import { AudioSystem } from './audio.js';

export const ITEM_DEFS = {
  'sticky-note':    { label: 'Sticky Note',      icon: '📝', desc: 'A note with a code scrawled on it. Inspect it for clues.' },
  'screwdriver':    { label: 'Screwdriver',      icon: '🔧', desc: 'Use on the ventilation grate in the lab entry.' },
  'keycard-a':      { label: 'Keycard A',        icon: '💳', desc: 'A staff keycard. Swipe on the main lab door.' },
  'wire-cutter':    { label: 'Wire Cutter',      icon: '✂️', desc: 'Use on the server panel cover to open it.' },
  'fuse':           { label: 'Fuse',             icon: '⚡', desc: 'A replacement fuse. Insert into the server room fuse box.' },
  'server-diagram': { label: 'Wiring Diagram',   icon: '📋', desc: 'A diagram showing correct wire connections on the server panel.' },
  'access-card-b':  { label: 'Keycard B',        icon: '💳', desc: "A senior staff keycard. Opens the director's office." },
  'laser-key':      { label: 'Laser Key',        icon: '🔑', desc: 'Activates the laser grid bypass port in the final corridor.' },
  'lever-diagram':  { label: 'Lever Diagram',    icon: '📄', desc: 'Shows the correct lever positions for the emergency exit panel.' },
  'maintenance-key':{ label: 'Maintenance Key',  icon: '🗝️', desc: 'Releases the inner grate of the ventilation shaft in the server room.' },
  'office-id-card': { label: 'Emergency ID Card',icon: '🪪', desc: 'An authorised ID card. Required to activate the maintenance hatch override.' },
  'security-pass':  { label: 'Security Pass',    icon: '🔐', desc: "A guard's pass. Needed to unlock the emergency exit corridor." },
  'bypass-chip':    { label: 'Bypass Chip',      icon: '🔌', desc: 'Inserts into the laser grid control port to initiate bypass.' },
};

export class InventoryRenderer {
  constructor() {
    this._slotsEl = document.getElementById('inventory-slots');
    // Cursor item ghost
    this._cursorEl = document.createElement('div');
    this._cursorEl.id = 'cursor-item';
    this._cursorEl.style.cssText = 'position:fixed;width:36px;height:36px;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);opacity:0;font-size:22px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 6px rgba(0,255,224,0.6));transition:opacity 0.15s;';
    document.body.appendChild(this._cursorEl);
    document.addEventListener('mousemove', e => this._moveCursor(e));
  }

  render(state) {
    if (!this._slotsEl) return;
    this._slotsEl.innerHTML = '';

    for (const itemId of state.inventory) {
      const def  = ITEM_DEFS[itemId] || { label: itemId, icon: '◆', desc: '' };
      const slot = document.createElement('div');
      slot.className = 'inv-slot' + (state.selectedItem === itemId ? ' selected' : '');
      slot.title = def.label;
      slot.innerHTML = `
        <span style="font-size:22px;">${def.icon}</span>
        <div class="inv-label">${def.label}</div>
      `;
      slot.addEventListener('click', () => {
        dispatch('SELECT_ITEM', { itemId });
        AudioSystem.play('click-interact');
        this.render(getState());
        this._updateCursor(getState());
      });
      this._slotsEl.appendChild(slot);
    }

    // Show description of selected item
    const descEl = document.getElementById('inv-description');
    if (descEl) {
      const selDef = state.selectedItem ? ITEM_DEFS[state.selectedItem] : null;
      if (selDef) {
        descEl.textContent = `${selDef.icon}  ${selDef.label} — ${selDef.desc}`;
        descEl.classList.add('visible');
      } else {
        descEl.textContent = '';
        descEl.classList.remove('visible');
      }
    }

    this._updateCursor(state);
  }

  _updateCursor(state) {
    if (state.selectedItem) {
      const def = ITEM_DEFS[state.selectedItem] || { icon: '◆' };
      this._cursorEl.textContent = def.icon;
      this._cursorEl.style.opacity = '1';
      document.body.style.cursor = 'crosshair';
    } else {
      this._cursorEl.style.opacity = '0';
      document.body.style.cursor = '';
    }
  }

  _moveCursor(e) {
    this._cursorEl.style.left = e.clientX + 'px';
    this._cursorEl.style.top  = e.clientY + 'px';
  }
}
