import { getState } from './state.js';

// ── Room map definitions per mission ─────────────────────
// Positions are visual grid coords for drawing the map overlay.
// Connections list bidirectional links.

const MAPS = {
  arcadia: {
    rooms: [
      { id: 'lab-entry',         label: 'Lab Entry',         x: 1, y: 2 },
      { id: 'main-lab',          label: 'Main Lab',          x: 3, y: 2 },
      { id: 'server-room',       label: 'Server Room',       x: 5, y: 1 },
      { id: 'security-hub',      label: 'Security Hub',      x: 7, y: 1 },
      { id: 'utility-corridor',  label: 'Utility Corridor',  x: 7, y: 3 },
      { id: 'bio-lab',           label: 'Bio Lab',           x: 3, y: 4 },
      { id: 'director-office',   label: "Director's Office", x: 5, y: 3 },
      { id: 'final-exit',        label: 'Final Exit',        x: 5, y: 5 },
      { id: 'secret-room',       label: 'Secret Room',       x: 7, y: 5, secret: true },
    ],
    connections: [
      ['lab-entry', 'main-lab'],
      ['main-lab', 'server-room'],
      ['main-lab', 'bio-lab'],
      ['main-lab', 'final-exit'],
      ['server-room', 'security-hub'],
      ['server-room', 'director-office'],
      ['server-room', 'secret-room'],
      ['security-hub', 'utility-corridor'],
      ['bio-lab', 'main-lab'],
      ['director-office', 'server-room'],
      ['final-exit', 'main-lab'],
    ],
  },

  blackwood: {
    rooms: [
      { id: 'bw-east-foyer',        label: 'East Foyer',        x: 1, y: 3 },
      { id: 'bw-patient-corridor',  label: 'Patient Corridor',  x: 3, y: 3 },
      { id: 'bw-patient-room-7',    label: 'Patient Room 7',    x: 3, y: 1 },
      { id: 'bw-solitary-cell',     label: 'Solitary Cell',     x: 5, y: 1 },
      { id: 'bw-nurses-station',    label: "Nurse's Station",   x: 5, y: 3 },
      { id: 'bw-treatment-room',    label: 'Treatment Room',    x: 5, y: 5 },
      { id: 'bw-records-vault',     label: 'Records Vault',     x: 7, y: 5 },
      { id: 'bw-directors-office',  label: "Director's Office", x: 7, y: 3 },
      { id: 'bw-chapel',            label: 'Chapel',            x: 3, y: 5 },
      { id: 'bw-maintenance-tunnel',label: 'Maint. Tunnel',     x: 1, y: 5, secret: true },
    ],
    connections: [
      ['bw-east-foyer', 'bw-patient-corridor'],
      ['bw-patient-corridor', 'bw-patient-room-7'],
      ['bw-patient-corridor', 'bw-solitary-cell'],
      ['bw-patient-corridor', 'bw-nurses-station'],
      ['bw-patient-corridor', 'bw-chapel'],
      ['bw-nurses-station', 'bw-treatment-room'],
      ['bw-treatment-room', 'bw-records-vault'],
      ['bw-records-vault', 'bw-directors-office'],
      ['bw-directors-office', 'bw-east-foyer'],
      ['bw-chapel', 'bw-maintenance-tunnel'],
    ],
  },

  meridian: {
    rooms: [
      { id: 'ms-airlock-bay',    label: 'Airlock Bay',     x: 1, y: 1 },
      { id: 'ms-corridor-a',     label: 'Corridor A',      x: 3, y: 1 },
      { id: 'ms-crew-quarters',  label: 'Crew Quarters',   x: 3, y: 3 },
      { id: 'ms-med-bay',        label: 'Med Bay',         x: 5, y: 3 },
      { id: 'ms-engineering',    label: 'Engineering',      x: 5, y: 1 },
      { id: 'ms-cargo-bay',      label: 'Cargo Bay',       x: 7, y: 1 },
      { id: 'ms-lower-corridor', label: 'Lower Corridor',  x: 5, y: 5 },
      { id: 'ms-reactor-deck',   label: 'Reactor Deck',    x: 7, y: 3 },
      { id: 'ms-command-deck',   label: 'Command Deck',    x: 1, y: 3 },
      { id: 'ms-comms-array',    label: 'Comms Array',     x: 1, y: 5 },
      { id: 'ms-escape-pod-bay', label: 'Escape Pods',     x: 3, y: 5 },
    ],
    connections: [
      ['ms-airlock-bay', 'ms-corridor-a'],
      ['ms-corridor-a', 'ms-crew-quarters'],
      ['ms-corridor-a', 'ms-med-bay'],
      ['ms-corridor-a', 'ms-engineering'],
      ['ms-corridor-a', 'ms-command-deck'],
      ['ms-engineering', 'ms-lower-corridor'],
      ['ms-engineering', 'ms-cargo-bay'],
      ['ms-cargo-bay', 'ms-reactor-deck'],
      ['ms-lower-corridor', 'ms-escape-pod-bay'],
      ['ms-lower-corridor', 'ms-comms-array'],
      ['ms-lower-corridor', 'ms-reactor-deck'],
      ['ms-command-deck', 'ms-comms-array'],
    ],
  },
};

let _visible = false;
let _overlay = null;
const _missionId = window.EP_MISSION || 'arcadia';

export function toggleMap(force) {
  _visible = force !== undefined ? force : !_visible;
  if (!_overlay) _createOverlay();
  if (_visible) {
    _renderMap();
    _overlay.classList.add('visible');
  } else {
    _overlay.classList.remove('visible');
  }
}

function _createOverlay() {
  _overlay = document.createElement('div');
  _overlay.id = 'map-overlay';
  _overlay.innerHTML = `
    <div id="map-panel">
      <div id="map-header">
        <div id="map-title">MAP</div>
        <button id="map-close">✕</button>
      </div>
      <div id="map-canvas-wrap">
        <canvas id="map-canvas"></canvas>
      </div>
      <div id="map-legend">
        <span class="map-leg"><span class="map-dot current"></span> Current</span>
        <span class="map-leg"><span class="map-dot visited"></span> Visited</span>
        <span class="map-leg"><span class="map-dot unvisited"></span> Undiscovered</span>
      </div>
    </div>
  `;
  document.getElementById('game-wrapper')?.appendChild(_overlay);
  _overlay.addEventListener('click', e => {
    if (e.target === _overlay) toggleMap(false);
  });
  document.getElementById('map-close')?.addEventListener('click', () => toggleMap(false));
}

function _renderMap() {
  const canvas = document.getElementById('map-canvas');
  if (!canvas) return;
  const mapDef = MAPS[_missionId];
  if (!mapDef) return;

  const st = getState();
  const visited = st.visitedRooms || [];
  const current = st.currentRoom;

  // Scale canvas
  const wrap = document.getElementById('map-canvas-wrap');
  const dpr = window.devicePixelRatio || 1;
  const W = wrap?.clientWidth || 400;
  const H = wrap?.clientHeight || 300;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Compute grid bounds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const r of mapDef.rooms) {
    minX = Math.min(minX, r.x); maxX = Math.max(maxX, r.x);
    minY = Math.min(minY, r.y); maxY = Math.max(maxY, r.y);
  }
  const padX = 50, padY = 40;
  const scaleX = (W - padX * 2) / Math.max(maxX - minX, 1);
  const scaleY = (H - padY * 2) / Math.max(maxY - minY, 1);
  const toX = gx => padX + (gx - minX) * scaleX;
  const toY = gy => padY + (gy - minY) * scaleY;

  // Build lookup
  const roomMap = {};
  for (const r of mapDef.rooms) roomMap[r.id] = r;

  // Draw connections
  ctx.lineWidth = 1.5;
  for (const [a, b] of mapDef.connections) {
    const ra = roomMap[a], rb = roomMap[b];
    if (!ra || !rb) continue;
    const aVis = visited.includes(a) || current === a;
    const bVis = visited.includes(b) || current === b;
    // Only draw if at least one room discovered
    if (!aVis && !bVis) continue;

    ctx.strokeStyle = (aVis && bVis) ? 'rgba(0,255,224,0.25)' : 'rgba(100,100,140,0.15)';
    ctx.beginPath();
    ctx.moveTo(toX(ra.x), toY(ra.y));
    ctx.lineTo(toX(rb.x), toY(rb.y));
    ctx.stroke();
  }

  // Draw rooms
  const nodeR = 18;
  for (const r of mapDef.rooms) {
    const x = toX(r.x), y = toY(r.y);
    const isCurrent = r.id === current;
    const isVisited = visited.includes(r.id);
    const isSecret = r.secret;

    // Hide undiscovered secret rooms entirely
    if (isSecret && !isVisited && !isCurrent) continue;

    ctx.beginPath();
    ctx.arc(x, y, nodeR, 0, Math.PI * 2);

    if (isCurrent) {
      ctx.fillStyle = 'rgba(0,255,224,0.2)';
      ctx.fill();
      ctx.strokeStyle = '#00ffe0';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Pulse ring
      ctx.beginPath();
      ctx.arc(x, y, nodeR + 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,255,224,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (isVisited) {
      ctx.fillStyle = 'rgba(0,255,224,0.06)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,255,224,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(40,40,60,0.3)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(80,80,110,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Label
    ctx.font = '9px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    if (isCurrent) {
      ctx.fillStyle = '#00ffe0';
    } else if (isVisited) {
      ctx.fillStyle = 'rgba(200,210,230,0.6)';
    } else {
      ctx.fillStyle = 'rgba(100,100,130,0.4)';
    }
    ctx.fillText(r.label, x, y + nodeR + 4);
  }
}

// Map button click
document.getElementById('map-button')?.addEventListener('click', () => {
  const st = getState();
  if (!st.timerRunning && !_visible) return;
  if (st.ending) return;
  toggleMap();
});

// Keyboard shortcut — M to toggle map
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'm' || e.key === 'M') {
    const st = getState();
    if (!st.timerRunning && !_visible) return;
    if (st.ending) return;
    const puzzleOpen = document.getElementById('puzzle-overlay')?.classList.contains('visible');
    if (puzzleOpen) return;
    toggleMap();
  }
});
