import { getState } from './state.js';

export class RoomRenderer {
  constructor() {
    this._bgEl      = document.getElementById('room-background');
    this._objEl     = document.getElementById('room-objects');
    this._lightEl   = null;
    this._currentConfig = null;
  }

  render(config, state) {
    this._currentConfig = config;
    this._applyBackground(config);
    this._applyLighting(config);
    this._renderObjects(config, state);
  }

  rerender() {
    if (this._currentConfig) this.render(this._currentConfig, getState());
  }

  getConfig() { return this._currentConfig; }

  _applyBackground(config) {
    if (!this._bgEl) return;
    if (config.background) {
      this._bgEl.style.backgroundImage = `url('${config.background}')`;
    } else {
      // CSS-drawn fallback room — use gradient based on room id
      const gradients = {
        'lab-entry':    'linear-gradient(160deg,#0d0d18 0%,#0a1020 40%,#060810 100%)',
        'main-lab':     'linear-gradient(160deg,#0a1010 0%,#081218 40%,#050a0a 100%)',
        'server-room':  'linear-gradient(160deg,#100a08 0%,#180e08 40%,#0a0605 100%)',
        'final-exit':   'linear-gradient(160deg,#080810 0%,#0c0c1a 40%,#050508 100%)',
        'secret-room':  'linear-gradient(160deg,#060810 0%,#0a0d14 40%,#040508 100%)',
      };
      this._bgEl.style.backgroundImage = gradients[config.id] || gradients['lab-entry'];
    }
    this._bgEl.style.backgroundSize = 'cover';
    this._bgEl.style.backgroundPosition = 'center';
  }

  _applyLighting(config) {
    // Remove old light
    const old = document.getElementById('room-light-overlay');
    if (old) old.remove();

    const light = document.createElement('div');
    light.id = 'room-light-overlay';
    light.className = 'room-light';

    if (config.lighting === 'flicker') {
      light.classList.add('flicker');
      light.style.background = 'radial-gradient(ellipse at 50% 0%,rgba(180,200,255,0.04) 0%,transparent 70%)';
    } else if (config.lighting === 'flicker-fast') {
      light.classList.add('flicker-fast');
      light.style.background = 'radial-gradient(ellipse at 50% 0%,rgba(200,180,100,0.05) 0%,transparent 60%)';
    } else if (config.lighting === 'red-alert') {
      light.style.background = 'rgba(255,30,30,0.08)';
      light.style.animation  = 'alarm-flash 1.2s ease-in-out infinite';
    }

    document.getElementById('scene-container')?.appendChild(light);
    this._lightEl = light;
  }

  _renderObjects(config, state) {
    if (!this._objEl) return;
    this._objEl.innerHTML = '';

    // Render hotspot decorative objects (non-interactive visual only)
    this._renderDecorativeRoom(config, state);

    // Render hotspot objects
    for (const hs of config.hotspots || []) {
      this._renderHotspot(hs, config, state);
    }
  }

  _renderDecorativeRoom(config, state) {
    // Draw CSS room elements per room id
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    el.innerHTML = this._getRoomSVG(config.id, state);
    this._objEl.appendChild(el);
  }

  _getRoomSVG(roomId, state) {
    const svgs = {
      'lab-entry': `
        <!-- Floor -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:28%;background:linear-gradient(to top,#0d0d1a,transparent);"></div>
        <!-- Ceiling strip light left -->
        <div style="position:absolute;top:0;left:10%;width:30%;height:3px;background:linear-gradient(90deg,transparent,rgba(140,180,255,0.6),transparent);box-shadow:0 0 12px rgba(140,180,255,0.4);"></div>
        <!-- Ceiling strip light right -->
        <div style="position:absolute;top:0;right:8%;width:25%;height:3px;background:linear-gradient(90deg,transparent,rgba(140,180,255,0.5),transparent);box-shadow:0 0 10px rgba(140,180,255,0.3);"></div>
        <!-- Warning stripe left wall -->
        <div style="position:absolute;left:0;top:20%;width:4%;height:60%;background:repeating-linear-gradient(45deg,#1a1408,#1a1408 8px,#221c08 8px,#221c08 16px);opacity:0.5;"></div>
        <!-- Biohazard sign -->
        <div style="position:absolute;top:28%;left:5%;width:3%;aspect-ratio:1;border:2px solid rgba(255,176,0,0.4);border-radius:50%;display:flex;align-items:center;justify-content:center;color:rgba(255,176,0,0.5);font-size:1.5vw;">☣</div>
        <!-- Warning text -->
        <div style="position:absolute;top:22%;left:2%;color:rgba(255,150,0,0.3);font-family:monospace;font-size:0.7vw;letter-spacing:0.1em;writing-mode:vertical-rl;text-orientation:mixed;">AUTHORIZED PERSONNEL ONLY</div>
        <!-- Crack in wall -->
        <div style="position:absolute;top:30%;right:25%;width:1px;height:15%;background:linear-gradient(to bottom,transparent,rgba(255,255,255,0.08),transparent);transform:rotate(5deg);"></div>
        <!-- Security camera mount -->
        <div style="position:absolute;top:6%;right:15%;width:2%;height:3%;background:#1a1a28;border:1px solid #2a2a3a;border-radius:2px;"></div>
        <div style="position:absolute;top:6%;right:14.5%;width:0.5%;height:1%;background:#0a0a14;"></div>
        <!-- Emergency light -->
        <div style="position:absolute;top:5%;left:50%;width:1.5%;height:2%;background:#200000;border:1px solid #400000;border-radius:2px;box-shadow:0 0 4px rgba(255,0,0,0.2);"></div>
      `,
      'main-lab': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:30%;background:linear-gradient(to top,#081210,transparent);"></div>
        <!-- Lab bench -->
        <div style="position:absolute;bottom:22%;left:5%;right:5%;height:3%;background:linear-gradient(to bottom,#1a1f1a,#0e1210);border-top:1px solid #2a3a2a;"></div>
        <!-- Equipment on bench -->
        <div style="position:absolute;bottom:25%;left:10%;width:6%;height:8%;background:linear-gradient(to bottom,#0a1a12,#061008);border:1px solid #1a2a1a;border-radius:3px 3px 0 0;"></div>
        <div style="position:absolute;bottom:25%;left:18%;width:3%;height:5%;background:#080e0a;border:1px solid #182818;border-radius:2px;"></div>
        <!-- Green power indicators -->
        <div style="position:absolute;bottom:28%;left:11%;width:0.5%;height:0.5%;background:#00ff44;border-radius:50%;box-shadow:0 0 6px #00ff44;"></div>
        <div style="position:absolute;bottom:28%;left:19%;width:0.5%;height:0.5%;background:#00aa22;border-radius:50%;box-shadow:0 0 4px #00aa22;"></div>
        <!-- Overhead lighting bars -->
        <div style="position:absolute;top:0;left:15%;width:20%;height:2px;background:rgba(100,200,120,0.3);box-shadow:0 0 15px rgba(100,200,120,0.2);"></div>
        <div style="position:absolute;top:0;right:10%;width:25%;height:2px;background:rgba(100,200,120,0.25);box-shadow:0 0 12px rgba(100,200,120,0.15);"></div>
        <!-- Shelving unit outline right -->
        <div style="position:absolute;top:20%;right:3%;width:6%;height:50%;border:1px solid #1a2a1a;background:linear-gradient(to right,#080e0a,#060a08);"></div>
        <!-- Shelf dividers -->
        <div style="position:absolute;top:35%;right:3%;width:6%;height:1px;background:#1a2a1a;"></div>
        <div style="position:absolute;top:50%;right:3%;width:6%;height:1px;background:#1a2a1a;"></div>
        <!-- Symbol diagram on wall -->
        <div style="position:absolute;top:15%;left:40%;width:12%;height:20%;background:#0a0f0a;border:1px solid #1a2a1a;display:flex;align-items:center;justify-content:center;color:rgba(0,200,80,0.2);font-size:2vw;">⬡</div>
      `,
      'server-room': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:28%;background:linear-gradient(to top,#100808,transparent);"></div>
        <!-- Server racks -->
        <div style="position:absolute;top:15%;left:8%;width:10%;height:65%;background:linear-gradient(to right,#120808,#0e0606);border:1px solid #2a1010;border-radius:2px;"></div>
        <div style="position:absolute;top:15%;left:20%;width:10%;height:65%;background:linear-gradient(to right,#120808,#0e0606);border:1px solid #2a1010;border-radius:2px;"></div>
        <!-- Server unit LEDs -->
        <div style="position:absolute;top:20%;left:9%;width:8%;height:1px;background:rgba(255,80,0,0.6);box-shadow:0 0 4px rgba(255,80,0,0.4);"></div>
        <div style="position:absolute;top:25%;left:9%;width:8%;height:1px;background:rgba(0,120,255,0.4);"></div>
        <div style="position:absolute;top:30%;left:9%;width:8%;height:1px;background:rgba(255,80,0,0.3);"></div>
        <div style="position:absolute;top:20%;left:21%;width:8%;height:1px;background:rgba(255,160,0,0.5);box-shadow:0 0 4px rgba(255,160,0,0.3);"></div>
        <!-- Cable bundles -->
        <div style="position:absolute;top:40%;left:7%;width:25%;height:2%;background:repeating-linear-gradient(90deg,rgba(255,100,0,0.4),rgba(255,100,0,0.4) 2px,rgba(0,0,0,0) 2px,rgba(0,0,0,0) 6px);"></div>
        <!-- Overhead red emergency light -->
        <div style="position:absolute;top:3%;left:50%;width:2%;height:1.5%;background:#300000;border:1px solid #600000;border-radius:2px;box-shadow:0 0 10px rgba(255,0,0,0.3),0 4px 20px rgba(255,0,0,0.1);animation:alarm-flash 2s ease-in-out infinite;"></div>
        <!-- Fuse box on wall -->
        <div style="position:absolute;top:25%;right:8%;width:7%;height:12%;background:#0e0a08;border:1px solid #2a1a10;border-radius:2px;"></div>
        <div style="position:absolute;top:28%;right:8.5%;width:6%;height:1px;background:#2a1a10;"></div>
        <div style="position:absolute;top:32%;right:8.5%;width:6%;height:1px;background:#2a1a10;"></div>
      `,
      'final-exit': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:25%;background:linear-gradient(to top,#080810,transparent);"></div>
        <!-- Exit corridor perspective -->
        <div style="position:absolute;top:20%;left:35%;right:35%;bottom:30%;background:linear-gradient(to bottom,#050508,#080810);border-left:1px solid #1a1a28;border-right:1px solid #1a1a28;"></div>
        <!-- EXIT sign -->
        <div style="position:absolute;top:22%;left:43%;width:14%;height:5%;background:#001a00;border:1px solid #00ff44;border-radius:2px;display:flex;align-items:center;justify-content:center;color:rgba(0,255,68,0.8);font-family:monospace;font-size:1vw;letter-spacing:0.2em;box-shadow:0 0 10px rgba(0,255,68,0.3);">EXIT</div>
        <!-- Laser emitters (decorative) -->
        <div style="position:absolute;top:35%;left:33%;width:2%;height:1%;background:#200000;border:1px solid #600000;border-radius:1px;box-shadow:0 0 6px rgba(255,0,0,0.5);"></div>
        <div style="position:absolute;top:55%;right:31%;width:2%;height:1%;background:#200000;border:1px solid #600000;border-radius:1px;box-shadow:0 0 6px rgba(255,0,0,0.5);"></div>
        <!-- Floor grid pattern -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:30%;background:repeating-linear-gradient(90deg,rgba(30,30,60,0.3),rgba(30,30,60,0.3) 1px,transparent 1px,transparent 5%),repeating-linear-gradient(rgba(30,30,60,0.2),rgba(30,30,60,0.2) 1px,transparent 1px,transparent 30px);"></div>
        <!-- Control panel left -->
        <div style="position:absolute;top:40%;left:5%;width:12%;height:30%;background:#0a0a14;border:1px solid #1a1a2a;border-radius:3px;"></div>
        <div style="position:absolute;top:45%;left:6%;width:10%;height:1px;background:#2a2a4a;"></div>
        <div style="position:absolute;top:50%;left:6%;width:10%;height:1px;background:#2a2a4a;"></div>
      `,
      'secret-room': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:28%;background:linear-gradient(to top,#060608,transparent);"></div>
        <!-- Narrow passage feel -->
        <div style="position:absolute;top:0;left:0;width:15%;height:100%;background:linear-gradient(to right,#000,transparent);"></div>
        <div style="position:absolute;top:0;right:0;width:15%;height:100%;background:linear-gradient(to left,#000,transparent);"></div>
        <!-- Hidden room clues on wall -->
        <div style="position:absolute;top:30%;left:20%;width:20%;height:25%;background:#060608;border:1px solid #141420;padding:8px;display:flex;flex-direction:column;gap:4px;">
          <div style="width:80%;height:2px;background:#1a1a2a;"></div>
          <div style="width:60%;height:2px;background:#1a1a2a;"></div>
          <div style="width:90%;height:2px;background:#1a1a2a;"></div>
          <div style="width:40%;height:2px;background:#1a1a2a;"></div>
        </div>
        <!-- Glowing panel -->
        <div style="position:absolute;top:35%;right:15%;width:8%;height:15%;background:#080814;border:1px solid rgba(0,200,255,0.3);box-shadow:0 0 12px rgba(0,200,255,0.1);border-radius:3px;"></div>
        <!-- Dust and cobwebs implied by particles -->
        <div style="position:absolute;top:8%;left:8%;color:rgba(100,100,120,0.15);font-size:3vw;">⌂</div>
      `,
    };
    return svgs[roomId] || '';
  }

  _renderHotspot(hs, config, state) {
    const el = document.createElement('div');
    el.className = 'hotspot-object';
    el.dataset.hotspotId = hs.id;
    el.style.cssText = `
      left:${hs.x}%;top:${hs.y}%;
      width:${hs.w}%;height:${hs.h}%;
      position:absolute;
      cursor:${hs.cursor || 'pointer'};
      box-sizing:border-box;
    `;

    // Object state determines art / visibility
    const objState = state.objects[hs.objectId || hs.id] || 'closed';

    // Draw a visible CSS representation of the hotspot object
    const inner = this._getHotspotInnerHTML(hs, objState, state, config);
    if (inner) el.innerHTML = inner;

    // Contents (items inside containers) — pass parent container id for clue filtering
    if (hs.contents) {
      for (const item of hs.contents) {
        this._renderContentItem(item, state, hs.id);
      }
    }

    this._objEl.appendChild(el);
  }

  _renderContentItem(item, state, parentContainerId) {
    // Check visibility condition
    if (item.visibleWhen) {
      const condState = state.objects[item.visibleWhen.objectState];
      if (condState !== item.visibleWhen.equals) return;
    }

    // Check clue location randomisation:
    // clueLocations[itemId] = the container this item was assigned to.
    // Only show this item if it belongs to the current parent container.
    if (item.clueSlot) {
      const assignedContainer = state.clueLocations[item.clueSlot];
      if (assignedContainer && assignedContainer !== parentContainerId) return;
    }

    // Don't show if already taken
    if (state.inventory.includes(item.id)) return;
    if (state.objects[item.id] === 'taken') return;

    const el = document.createElement('div');
    el.className = 'hotspot-object';
    el.dataset.hotspotId = item.id;
    el.style.cssText = `
      left:${item.x}%;top:${item.y}%;
      width:${item.w || 4}%;height:${item.h || 4}%;
      position:absolute;
      cursor:pointer;
      z-index:15;
    `;
    el.innerHTML = this._getItemInnerHTML(item);
    this._objEl.appendChild(el);
  }

  _getHotspotInnerHTML(hs, objState, state, config) {
    const OBJECTS = {
      // --- Lab Entry ---
      'entry-keypad': `
        <div style="width:100%;height:100%;background:#0a0a14;border:1px solid #2a2a4a;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:space-around;padding:4% 6%;">
          <div style="width:80%;height:25%;background:#050510;border:1px solid var(--accent);border-radius:2px;display:flex;align-items:center;justify-content:center;color:var(--accent);font-family:monospace;font-size:1.2vw;letter-spacing:0.2em;box-shadow:0 0 6px rgba(0,255,224,0.3);">____</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;width:90%;">
            ${[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(n=>`<div style="aspect-ratio:1;background:#111120;border:1px solid #2a2a3a;border-radius:2px;display:flex;align-items:center;justify-content:center;color:#8888aa;font-family:monospace;font-size:0.8vw;">${n}</div>`).join('')}
          </div>
        </div>`,

      'entry-door-mainlab': (() => {
        const solved = state.puzzles['entry-keypad']?.solved;
        return `<div style="width:100%;height:100%;background:linear-gradient(to bottom,#0d0d20,#080812);border:2px solid ${solved ? 'rgba(0,255,224,0.4)' : '#1a1a2a'};border-radius:3px;display:flex;align-items:center;justify-content:flex-end;padding-right:8%;transition:all 0.3s;">
          <div style="width:8%;aspect-ratio:1;background:${solved ? 'rgba(0,255,224,0.3)' : '#1a1a28'};border:1px solid ${solved ? 'var(--accent)' : '#2a2a3a'};border-radius:50%;box-shadow:${solved ? '0 0 8px rgba(0,255,224,0.5)' : 'none'};"></div>
        </div>`;
      })(),

      'entry-drawer': `
        <div style="width:100%;height:100%;background:linear-gradient(to bottom,#141420,#0e0e18);border:1px solid #2a2a3a;border-radius:3px;position:relative;cursor:pointer;">
          <div style="position:absolute;top:20%;left:10%;right:10%;height:2px;background:#2a2a3a;"></div>
          ${objState === 'open' ? '<div style="position:absolute;bottom:0;left:5%;right:5%;height:40%;background:#0a0a14;border:1px solid #1a1a28;border-top:none;border-radius:0 0 3px 3px;"></div>' : ''}
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:15%;height:12%;background:#1a1a28;border:1px solid #2a2a3a;border-radius:2px;"></div>
        </div>`,

      'entry-vent': (() => {
        const isOpen = objState === 'open';
        return `<div style="width:100%;height:100%;background:#0c0c14;border:1px solid #2a2a3a;border-radius:2px;display:flex;align-items:center;justify-content:center;position:relative;">
          ${isOpen
            ? '<div style="width:90%;height:80%;background:#050508;border:1px solid #1a1a28;border-radius:1px;display:flex;align-items:center;justify-content:center;color:#2a2a3a;font-size:1.5vw;">▼</div>'
            : '<div style="width:90%;height:80%;display:grid;grid-template-columns:repeat(5,1fr);gap:2px;">'
              + Array(10).fill('<div style="background:#1a1a28;border-radius:1px;"></div>').join('')
              + '</div>'
          }
        </div>`;
      })(),

      'entry-computer': `
        <div style="width:100%;height:100%;background:#050510;border:1px solid #1a1a2a;border-radius:4px;display:flex;align-items:center;justify-content:center;position:relative;">
          <div style="width:80%;height:65%;background:#030308;border:1px solid #141428;border-radius:3px;display:flex;align-items:center;justify-content:center;color:#1a1a3a;font-size:1.5vw;font-family:monospace;">ERROR</div>
          <div style="position:absolute;bottom:5%;left:50%;transform:translateX(-50%);width:30%;height:8%;background:#0a0a18;border:1px solid #1a1a28;border-radius:2px;"></div>
        </div>`,

      'entry-note-wall': `
        <div style="width:100%;height:100%;background:#181408;border:1px solid #2a2010;border-radius:2px;padding:6%;display:flex;flex-direction:column;gap:8%;">
          <div style="height:3px;background:#2a2010;border-radius:1px;"></div>
          <div style="height:3px;background:#2a2010;border-radius:1px;width:80%;"></div>
          <div style="height:3px;background:#2a2010;border-radius:1px;width:90%;"></div>
          <div style="height:3px;background:#2a2010;border-radius:1px;width:60%;"></div>
        </div>`,

      // --- Main Lab ---
      'lab-cabinet-left': `
        <div style="width:100%;height:100%;background:linear-gradient(to right,#0a1210,#060e0a);border:1px solid #1a2a1a;border-radius:2px;position:relative;">
          ${objState === 'open'
            ? '<div style="position:absolute;inset:0;border:1px solid rgba(0,200,80,0.3);border-radius:2px;background:rgba(0,200,80,0.03);"></div>'
            : ''}
          <div style="position:absolute;top:50%;right:8%;width:6%;height:8%;background:#141e14;border:1px solid #2a3a2a;border-radius:50%;transform:translateY(-50%);"></div>
        </div>`,

      'lab-cabinet-right': `
        <div style="width:100%;height:100%;background:linear-gradient(to left,#0a1210,#060e0a);border:1px solid #1a2a1a;border-radius:2px;position:relative;">
          ${objState === 'open'
            ? '<div style="position:absolute;inset:0;border:1px solid rgba(0,200,80,0.3);border-radius:2px;background:rgba(0,200,80,0.03);"></div>'
            : ''}
          <div style="position:absolute;top:50%;left:8%;width:6%;height:8%;background:#141e14;border:1px solid #2a3a2a;border-radius:50%;transform:translateY(-50%);"></div>
        </div>`,

      'lab-locker': `
        <div style="width:100%;height:100%;background:linear-gradient(to bottom,#0a1210,#060e0a);border:2px solid #1a2a1a;border-radius:3px;position:relative;">
          <div style="position:absolute;top:5%;left:50%;transform:translateX(-50%);width:20%;height:3%;background:#1a2a1a;border-radius:1px;"></div>
          ${objState === 'open' ? '<div style="position:absolute;left:2%;right:2%;top:10%;bottom:5%;background:#040a04;border:1px solid #0a1a0a;"></div>' : ''}
          <div style="position:absolute;top:50%;left:10%;width:8%;height:5%;background:#141e14;border:1px solid #2a3a2a;border-radius:1px;transform:translateY(-50%);"></div>
        </div>`,

      'lab-symbol-board': `
        <div style="width:100%;height:100%;background:#080e08;border:1px solid #1a2a1a;border-radius:3px;display:grid;grid-template-columns:repeat(2,1fr);gap:4%;padding:6%;align-items:center;justify-items:center;">
          <div style="color:rgba(0,200,80,0.4);font-size:1.5vw;">⬡</div>
          <div style="color:rgba(0,200,80,0.3);font-size:1.5vw;">◈</div>
          <div style="color:rgba(0,200,80,0.4);font-size:1.5vw;">⬟</div>
          <div style="color:rgba(0,200,80,0.2);font-size:1.5vw;">✦</div>
        </div>`,

      'lab-terminal': (() => {
        const solved = state.puzzles['terminal-hack']?.solved;
        return `<div style="width:100%;height:100%;background:#020a04;border:1px solid ${solved ? '#00aa44' : '#0a1a0a'};border-radius:4px;display:flex;flex-direction:column;padding:6%;gap:4%;font-family:monospace;font-size:0.7vw;color:${solved ? '#00cc55' : '#1a3a1a'};">
          <div>${solved ? '> ACCESS GRANTED' : '> SYSTEM OFFLINE'}</div>
          <div style="height:1px;background:${solved ? '#004422' : '#0a1a0a'};"></div>
          <div>${solved ? '> SECURITY DISABLED' : '> AWAITING POWER...'}</div>
          <div style="width:40%;height:6px;background:${solved ? '#004422' : '#060e06'};border-radius:2px;margin-top:4%;"></div>
        </div>`;
      })(),

      // --- Server Room ---
      'server-panel': `
        <div style="width:100%;height:100%;background:#0e0806;border:2px solid #2a1a10;border-radius:3px;position:relative;padding:4%;">
          <div style="color:rgba(255,100,0,0.4);font-family:monospace;font-size:0.7vw;margin-bottom:6%;">SRV-PANEL-02</div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:4%;">
            ${['RED','BLUE','GREEN','YELLOW','WHITE'].map((c,i) => `
              <div style="display:flex;align-items:center;gap:4px;">
                <div style="width:8px;height:8px;border-radius:50%;background:${['#cc2020','#2060cc','#20cc60','#ccaa20','#aaaacc'][i]};opacity:0.6;"></div>
                <div style="height:2px;width:60%;background:${['#cc2020','#2060cc','#20cc60','#ccaa20','#aaaacc'][i]};opacity:0.3;"></div>
              </div>`).join('')}
          </div>
        </div>`,

      'fuse-box': `
        <div style="width:100%;height:100%;background:#0e0a08;border:1px solid #2a1a10;border-radius:2px;position:relative;">
          ${objState === 'open'
            ? `<div style="position:absolute;inset:0;background:#060604;border:1px solid #2a2010;display:flex;flex-direction:column;padding:8%;gap:6%;">
                <div style="height:3px;background:#3a2a10;border-radius:1px;"></div>
                <div style="height:3px;background:#1a0a00;border-radius:1px;opacity:0.4;"></div>
                <div style="height:3px;background:#3a2a10;border-radius:1px;"></div>
              </div>`
            : '<div style="position:absolute;inset:20%;border:1px solid #2a1a10;border-radius:1px;display:flex;align-items:center;justify-content:center;color:rgba(255,100,0,0.4);font-size:1.2vw;">⚡</div>'
          }
        </div>`,

      'server-wire-panel': `
        <div style="width:100%;height:100%;background:#0e0806;border:1px solid #2a1a10;border-radius:3px;display:flex;align-items:center;justify-content:center;">
          <div style="color:rgba(255,100,0,0.3);font-size:2vw;">⚙</div>
        </div>`,

      // --- Final Exit ---
      'final-lever-panel': `
        <div style="width:100%;height:100%;background:#0a0a14;border:1px solid #1a1a2a;border-radius:3px;display:flex;align-items:center;justify-content:space-around;padding:6%;">
          ${[0,1,2,3].map(i => `
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
              <div style="width:4px;height:30px;background:#1a1a2a;border-radius:2px;position:relative;">
                <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:12px;height:12px;background:#2a2a3a;border:1px solid #3a3a4a;border-radius:50%;"></div>
              </div>
            </div>`).join('')}
        </div>`,

      'final-door': (() => {
        const open = state.puzzles['lever-combo']?.solved && state.puzzles['laser-avoid']?.solved;
        return `<div style="width:100%;height:100%;background:linear-gradient(to bottom,#080810,#050508);border:2px solid ${open ? 'rgba(0,255,68,0.5)' : '#1a1a2a'};border-radius:3px;display:flex;align-items:center;justify-content:flex-end;padding-right:5%;">
          <div style="width:6%;aspect-ratio:1;background:${open ? 'rgba(0,255,68,0.3)' : '#0a0a14'};border:1px solid ${open ? '#00ff44' : '#2a2a3a'};border-radius:50%;box-shadow:${open ? '0 0 12px rgba(0,255,68,0.6)' : 'none'};"></div>
        </div>`;
      })(),

      // --- Secret Room ---
      'secret-exit-panel': `
        <div style="width:100%;height:100%;background:#08080e;border:1px solid rgba(0,200,255,0.3);border-radius:3px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px rgba(0,200,255,0.1);">
          <div style="color:rgba(0,200,255,0.4);font-size:1.8vw;">⊞</div>
        </div>`,
    };

    return OBJECTS[hs.id] || `<div style="width:100%;height:100%;border:1px dashed rgba(255,255,255,0.05);border-radius:3px;"></div>`;
  }

  _getItemInnerHTML(item) {
    const ITEM_SVGS = {
      'sticky-note':       `<div style="width:100%;height:100%;background:#ccc840;border-radius:2px;display:flex;align-items:center;justify-content:center;box-shadow:2px 2px 6px rgba(0,0,0,0.5);transform:rotate(-3deg);"><span style="color:#332200;font-size:1vw;">📝</span></div>`,
      'screwdriver':       `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><span style="font-size:1.5vw;filter:drop-shadow(0 0 4px rgba(200,200,255,0.4));">🔧</span></div>`,
      'keycard-a':         `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a2a4a,#0a1428);border:1px solid rgba(0,150,255,0.5);border-radius:3px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px rgba(0,100,255,0.3);"><span style="color:rgba(0,150,255,0.8);font-size:0.8vw;font-family:monospace;">KEY-A</span></div>`,
      'wire-cutter':       `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><span style="font-size:1.5vw;">✂️</span></div>`,
      'fuse':              `<div style="width:100%;height:100%;background:#1a1408;border:1px solid rgba(255,160,0,0.5);border-radius:2px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 6px rgba(255,160,0,0.3);"><span style="color:rgba(255,160,0,0.8);font-size:0.8vw;font-family:monospace;">FUSE</span></div>`,
      'server-diagram':    `<div style="width:100%;height:100%;background:#0a0a10;border:1px solid #2a2a3a;border-radius:2px;display:flex;align-items:center;justify-content:center;transform:rotate(2deg);"><span style="color:rgba(100,100,200,0.6);font-size:1vw;">📋</span></div>`,
      'access-card-b':     `<div style="width:100%;height:100%;background:linear-gradient(135deg,#2a1a3a,#180a28);border:1px solid rgba(180,0,255,0.5);border-radius:3px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px rgba(150,0,255,0.3);"><span style="color:rgba(180,0,255,0.8);font-size:0.8vw;font-family:monospace;">KEY-B</span></div>`,
      'laser-key':         `<div style="width:100%;height:100%;background:#080810;border:1px solid rgba(255,50,50,0.5);border-radius:2px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px rgba(255,0,0,0.3);"><span style="color:rgba(255,50,50,0.8);font-size:1vw;">🔑</span></div>`,
      'lever-diagram':     `<div style="width:100%;height:100%;background:#181408;border:1px solid #2a2010;border-radius:2px;display:flex;align-items:center;justify-content:center;transform:rotate(-2deg);"><span style="color:rgba(200,180,100,0.6);font-size:1vw;">📄</span></div>`,
    };
    return ITEM_SVGS[item.id] || `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><span style="font-size:1.2vw;opacity:0.7;">◆</span></div>`;
  }
}
