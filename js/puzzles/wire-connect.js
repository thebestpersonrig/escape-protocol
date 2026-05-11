// Wire connection puzzle — drag from source to matching terminal

const WIRE_COLORS = [
  { id: 'red',    color: '#cc3333', label: 'RED' },
  { id: 'blue',   color: '#3366cc', label: 'BLUE' },
  { id: 'green',  color: '#33aa55', label: 'GREEN' },
  { id: 'yellow', color: '#ccaa22', label: 'YELLOW' },
  { id: 'white',  color: '#aaaacc', label: 'WHITE' },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function init(container, puzzleState, callbacks) {
  // Shuffle right-side terminals
  const rightOrder = puzzleState.shuffledWires?.length === 5
    ? puzzleState.shuffledWires
    : shuffle(WIRE_COLORS.map(w => w.id));

  const connections = {}; // leftId → rightId
  let dragging = null;
  let dragLine = null;
  let mousePos = { x: 0, y: 0 };

  container.innerHTML = `
    <div class="puzzle-title">⚙ WIRE JUNCTION PANEL ⚙</div>
    <div class="puzzle-subtitle">Connect each wire to its matching terminal</div>
    <div class="wire-wrap" id="wire-wrap">
      <div class="wire-col" id="wire-left"></div>
      <div class="wire-svg-area" id="wire-svg-area">
        <svg id="wire-svg" overflow="visible"></svg>
      </div>
      <div class="wire-col" id="wire-right"></div>
    </div>
    <div style="margin-top:10px;font-size:11px;color:var(--text-dim);text-align:center;font-family:var(--font-mono);">
      Connected: <span id="wire-count">0</span> / 5
    </div>
  `;

  const leftCol  = container.querySelector('#wire-left');
  const rightCol = container.querySelector('#wire-right');
  const svg      = container.querySelector('#wire-svg');
  const svgArea  = container.querySelector('#wire-svg-area');
  const countEl  = container.querySelector('#wire-count');

  // Build left nodes (sources)
  WIRE_COLORS.forEach(wire => {
    const node = document.createElement('div');
    node.className = 'wire-node';
    node.dataset.wireId = wire.id;
    node.dataset.side = 'left';
    node.style.color = wire.color;
    node.style.borderColor = wire.color;
    node.title = wire.label;
    leftCol.appendChild(node);
  });

  // Build right nodes (terminals, shuffled)
  rightOrder.forEach(wireId => {
    const wire = WIRE_COLORS.find(w => w.id === wireId);
    const node = document.createElement('div');
    node.className = 'wire-node';
    node.dataset.wireId = wireId;
    node.dataset.side = 'right';
    node.style.color = wire.color;
    node.style.borderColor = wire.color;
    node.title = wire.label;
    rightCol.appendChild(node);
  });

  function getNodeCenter(node) {
    const wrapRect = container.querySelector('#wire-wrap').getBoundingClientRect();
    const rect = node.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - wrapRect.left,
      y: rect.top  + rect.height / 2 - wrapRect.top,
    };
  }

  function drawLines() {
    svg.innerHTML = '';
    // Draw confirmed connections
    Object.entries(connections).forEach(([leftId, rightId]) => {
      const leftNode  = leftCol.querySelector(`[data-wire-id="${leftId}"]`);
      const rightNode = rightCol.querySelector(`[data-wire-id="${rightId}"]`);
      if (!leftNode || !rightNode) return;
      const lc = getNodeCenter(leftNode);
      const rc = getNodeCenter(rightNode);
      const wire = WIRE_COLORS.find(w => w.id === leftId);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const mx = (lc.x + rc.x) / 2;
      line.setAttribute('d', `M${lc.x},${lc.y} C${mx},${lc.y} ${mx},${rc.y} ${rc.x},${rc.y}`);
      line.setAttribute('stroke', wire.color);
      line.setAttribute('stroke-width', '3');
      line.setAttribute('fill', 'none');
      line.setAttribute('opacity', '0.8');
      svg.appendChild(line);
    });

    // Draw in-progress drag
    if (dragging) {
      const wrapRect = container.querySelector('#wire-wrap').getBoundingClientRect();
      const lc = getNodeCenter(dragging.node);
      const wire = WIRE_COLORS.find(w => w.id === dragging.wireId);
      const mx = (lc.x + mousePos.x) / 2;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      line.setAttribute('d', `M${lc.x},${lc.y} C${mx},${lc.y} ${mx},${mousePos.y} ${mousePos.x},${mousePos.y}`);
      line.setAttribute('stroke', wire.color);
      line.setAttribute('stroke-width', '2');
      line.setAttribute('fill', 'none');
      line.setAttribute('stroke-dasharray', '4,4');
      line.setAttribute('opacity', '0.6');
      svg.appendChild(line);
    }
  }

  // Drag events on left nodes
  leftCol.querySelectorAll('.wire-node').forEach(node => {
    node.addEventListener('mousedown', e => {
      e.preventDefault();
      const wireId = node.dataset.wireId;
      if (connections[wireId]) {
        delete connections[wireId];
        countEl.textContent = Object.keys(connections).length;
      }
      dragging = { node, wireId };
    });
  });

  container.addEventListener('mousemove', e => {
    if (!dragging) return;
    const wrapRect = container.querySelector('#wire-wrap').getBoundingClientRect();
    mousePos = { x: e.clientX - wrapRect.left, y: e.clientY - wrapRect.top };
    drawLines();
  });

  container.addEventListener('mouseup', e => {
    if (!dragging) return;
    // Check if over a right node
    const rightNodes = rightCol.querySelectorAll('.wire-node');
    let connected = false;
    rightNodes.forEach(rNode => {
      const rect = rNode.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top  && e.clientY <= rect.bottom) {
        const targetId = rNode.dataset.wireId;
        // Only connect matching colours
        if (targetId === dragging.wireId) {
          // Remove any existing connection to this terminal
          Object.keys(connections).forEach(k => { if (connections[k] === targetId) delete connections[k]; });
          connections[dragging.wireId] = targetId;
          countEl.textContent = Object.keys(connections).length;
          connected = true;
          if (Object.keys(connections).length === 5) {
            drawLines();
            setTimeout(() => callbacks.onSuccess(), 400);
          }
        } else {
          callbacks.onFailure();
        }
      }
    });
    dragging = null;
    drawLines();
  });

  drawLines();
}

export function destroy(container) {
  container.innerHTML = '';
}
