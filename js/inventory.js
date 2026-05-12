import { getState, dispatch } from './state.js';
import { AudioSystem } from './audio.js';

const ITEM_DEFS = {
  'sticky-note':    { label: 'Sticky Note',     icon: '📝' },
  'screwdriver':    { label: 'Screwdriver',     icon: '🔧' },
  'keycard-a':      { label: 'Keycard A',       icon: '💳' },
  'wire-cutter':    { label: 'Wire Cutter',     icon: '✂️' },
  'fuse':           { label: 'Fuse',            icon: '⚡' },
  'server-diagram': { label: 'Wiring Diagram',  icon: '📋' },
  'access-card-b':  { label: 'Keycard B',       icon: '💳' },
  'laser-key':       { label: 'Laser Key',         icon: '🔑' },
  'lever-diagram':   { label: 'Lever Diagram',     icon: '📄' },
  'maintenance-key': { label: 'Maintenance Key',   icon: '🗝️' },
  'office-id-card':  { label: 'Emergency ID Card', icon: '🪪' },
  'security-pass':   { label: 'Security Pass',     icon: '🔐' },
  'bypass-chip':     { label: 'Bypass Chip',       icon: '🔌' },
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
      const def  = ITEM_DEFS[itemId] || { label: itemId, icon: '◆' };
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
