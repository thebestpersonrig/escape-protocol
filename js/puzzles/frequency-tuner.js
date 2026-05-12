// Frequency Tuner puzzle — tune a slider to match the target frequency

const TOLERANCE = 10; // ±10 Hz out of 100–999 range

export function init(container, puzzleState, callbacks) {
  const target = puzzleState.target ?? 500;
  let   value  = Math.floor(Math.random() * 800) + 100; // random start, never exactly target
  if (value === target) value = target > 500 ? target - 50 : target + 50;
  let   locked = false;
  let   canLock = false;

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:20px;padding:24px 20px;font-family:'Courier New',monospace;min-width:360px;">

      <div style="color:rgba(255,150,40,0.8);font-size:12px;letter-spacing:0.25em;">POWER JUNCTION PJ-7 — FREQ. STABILISER</div>

      <div style="
        background:rgba(20,12,0,0.8);
        border:1px solid rgba(255,140,30,0.35);
        border-radius:6px;padding:12px 20px;text-align:center;
      ">
        <div style="color:rgba(255,130,30,0.5);font-size:10px;letter-spacing:0.18em;margin-bottom:6px;">TARGET FREQUENCY</div>
        <div style="color:rgba(255,160,60,0.95);font-size:26px;letter-spacing:0.12em;">${target} <span style="font-size:14px;opacity:0.6;">Hz</span></div>
      </div>

      <div style="width:100%;">
        <canvas id="ft-canvas" width="340" height="72"
          style="display:block;border:1px solid rgba(255,120,30,0.2);border-radius:4px;background:#0a0600;"></canvas>
      </div>

      <div style="
        display:flex;align-items:center;gap:12px;width:100%;
      ">
        <span style="color:rgba(180,100,30,0.5);font-size:10px;">100</span>
        <input type="range" id="ft-slider" min="100" max="999" value="${value}"
          style="flex:1;accent-color:#ff8020;cursor:pointer;">
        <span style="color:rgba(180,100,30,0.5);font-size:10px;">999</span>
      </div>

      <div style="text-align:center;">
        <div style="color:rgba(200,130,50,0.6);font-size:10px;letter-spacing:0.1em;margin-bottom:4px;">CURRENT</div>
        <div id="ft-current" style="color:rgba(255,140,60,0.9);font-size:20px;letter-spacing:0.1em;">${value} Hz</div>
      </div>

      <div id="ft-status" style="font-size:11px;letter-spacing:0.15em;min-height:18px;color:rgba(200,120,40,0.4);"></div>

      <button id="ft-lock-btn" disabled
        style="
          padding:10px 28px;
          background:rgba(255,120,30,0.08);
          border:1px solid rgba(255,120,30,0.25);
          border-radius:4px;
          color:rgba(255,140,60,0.4);
          font-family:'Courier New',monospace;
          font-size:11px;letter-spacing:0.18em;
          cursor:default;
          transition:all 0.2s;
        ">LOCK IN FREQUENCY</button>

    </div>
  `;

  const canvas  = document.getElementById('ft-canvas');
  const ctx     = canvas.getContext('2d');
  const slider  = document.getElementById('ft-slider');
  const currEl  = document.getElementById('ft-current');
  const statusEl= document.getElementById('ft-status');
  const lockBtn = document.getElementById('ft-lock-btn');

  function drawWave(freq, color, alpha, yBase) {
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    const cycles = 2 + (freq / 999) * 6;
    for (let x = 0; x <= 340; x++) {
      const y = yBase + Math.sin((x / 340) * cycles * Math.PI * 2) * 22;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function update(val) {
    value = parseInt(val);
    currEl.textContent = `${value} Hz`;

    const diff = Math.abs(value - target);
    canLock = diff <= TOLERANCE;

    // Waveform
    ctx.clearRect(0, 0, 340, 72);
    ctx.globalAlpha = 1;
    drawWave(target, '#ff8020', 0.3, 36); // target (dim)
    drawWave(value,  canLock ? '#00ff88' : diff < 60 ? '#ffaa00' : '#ff4040', 0.9, 36);
    ctx.globalAlpha = 1;

    // Readout
    if (canLock) {
      statusEl.textContent = '✓ SIGNAL LOCKED — READY TO ENGAGE';
      statusEl.style.color = '#00ff88';
      lockBtn.disabled = false;
      lockBtn.style.color  = 'rgba(0,255,136,0.9)';
      lockBtn.style.borderColor = 'rgba(0,255,136,0.5)';
      lockBtn.style.background  = 'rgba(0,255,136,0.1)';
      lockBtn.style.cursor = 'pointer';
    } else if (diff < 80) {
      statusEl.textContent = '~ CLOSE — FINE-TUNE';
      statusEl.style.color = 'rgba(255,160,40,0.7)';
      _resetLockBtn();
    } else {
      statusEl.textContent = '';
      _resetLockBtn();
    }
  }

  function _resetLockBtn() {
    lockBtn.disabled = true;
    lockBtn.style.color  = 'rgba(255,140,60,0.35)';
    lockBtn.style.borderColor = 'rgba(255,120,30,0.2)';
    lockBtn.style.background  = 'rgba(255,120,30,0.05)';
    lockBtn.style.cursor = 'default';
  }

  slider.addEventListener('input', e => {
    if (!locked) update(e.target.value);
  });

  lockBtn.addEventListener('click', () => {
    if (locked || !canLock) return;
    locked = true;
    lockBtn.textContent = '✓ FREQUENCY STABILISED';
    lockBtn.style.background = 'rgba(0,255,136,0.15)';
    setTimeout(() => callbacks.onSuccess(), 600);
  });

  update(value);
}

export function destroy(container) {
  container.innerHTML = '';
}
