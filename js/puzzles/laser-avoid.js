// Laser corridor minigame — follow the moving safe corridor to the exit

let _animId  = null;
let _cleanup = () => {};

export function init(container, puzzleState, callbacks) {
  if (_animId !== null) { cancelAnimationFrame(_animId); _animId = null; }
  _cleanup();

  const W = 360, H = 260;
  let lives = 3;
  let won   = false;

  container.innerHTML = `
    <div class="puzzle-title">⚡ LASER GRID ⚡</div>
    <div class="puzzle-subtitle">Stay inside the corridor — reach the green exit</div>
    <div class="laser-wrap">
      <canvas id="laser-canvas" width="${W}" height="${H}" style="display:block;margin:0 auto;touch-action:none;"></canvas>
      <div class="laser-lives" id="laser-lives">
        ${[0,1,2].map(() => `<div class="life-dot"></div>`).join('')}
      </div>
      <div class="laser-dpad" id="laser-dpad">
        <div class="dpad-row"><button class="dpad-btn" data-dir="up">▲</button></div>
        <div class="dpad-row">
          <button class="dpad-btn" data-dir="left">◀</button>
          <div class="dpad-center"></div>
          <button class="dpad-btn" data-dir="right">▶</button>
        </div>
        <div class="dpad-row"><button class="dpad-btn" data-dir="down">▼</button></div>
      </div>
      <div class="laser-instructions">WASD / Arrow keys — stay inside the corridor</div>
    </div>
  `;

  const canvas  = container.querySelector('#laser-canvas');
  const ctx     = canvas.getContext('2d');
  const livesEl = container.querySelector('#laser-lives');

  // ── Corridor (two horizontal beams that move together) ────
  const GAP      = 88;   // total gap height — comfortable for player r=7
  let   cY       = H / 2; // corridor centre
  let   cDY      = 0.7;   // corridor drift speed (slow enough to track)
  const C_MIN    = GAP / 2 + 10;   // minimum cY (top beam ≥ y=10)
  const C_MAX    = H - GAP / 2 - 10; // maximum cY (bottom beam ≤ y=250)

  // ── Player ────────────────────────────────────────────────
  let player = { x: 28, y: H / 2, r: 7, speed: 2.6 };

  // ── Exit ──────────────────────────────────────────────────
  const exit = { x: W - 28, y: H / 2, r: 14 };

  // ── Key state ─────────────────────────────────────────────
  const keys = {};
  function onKey(e) {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
         'w','a','s','d','W','A','S','D'].includes(e.key)) {
      keys[e.key] = e.type === 'keydown';
      e.preventDefault();
    }
  }
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup',   onKey);

  // D-pad buttons
  const DIR_KEYS = { up:'ArrowUp', down:'ArrowDown', left:'ArrowLeft', right:'ArrowRight' };
  container.querySelectorAll('.dpad-btn').forEach(btn => {
    const k = DIR_KEYS[btn.dataset.dir];
    btn.addEventListener('pointerdown',  e => { e.preventDefault(); keys[k] = true;  });
    btn.addEventListener('pointerup',    e => { e.preventDefault(); keys[k] = false; });
    btn.addEventListener('pointerleave', e => { keys[k] = false; });
  });

  // ── Helpers ───────────────────────────────────────────────
  function beamTop()    { return cY - GAP / 2; }
  function beamBottom() { return cY + GAP / 2; }

  function updateLives() {
    livesEl.querySelectorAll('.life-dot').forEach((dot, i) =>
      dot.classList.toggle('lost', i >= lives));
  }

  function reset() {
    player.x = 28;
    player.y = cY; // respawn in the middle of the corridor
  }

  function checkCollision() {
    // Hit if player is above the top beam or below the bottom beam
    // Small wall margin at left/right edges where beams don't apply
    if (player.x < 14 || player.x > W - 14) return false;
    return player.y - player.r < beamTop() + 2 ||
           player.y + player.r > beamBottom() - 2;
  }

  function checkExit() {
    return Math.hypot(player.x - exit.x, player.y - exit.y) < player.r + exit.r;
  }

  // ── Draw ──────────────────────────────────────────────────
  function draw() {
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(30,30,60,0.4)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Danger zones (above top beam, below bottom beam)
    ctx.fillStyle = 'rgba(255,30,30,0.06)';
    ctx.fillRect(0, 0, W, beamTop());
    ctx.fillRect(0, beamBottom(), W, H - beamBottom());

    // Safe corridor (subtle green tint)
    ctx.fillStyle = 'rgba(0,255,80,0.04)';
    ctx.fillRect(0, beamTop(), W, GAP);

    // Top laser beam
    ctx.save();
    ctx.shadowColor = '#ff2020'; ctx.shadowBlur = 12;
    const gTop = ctx.createLinearGradient(0, beamTop() - 10, 0, beamTop() + 10);
    gTop.addColorStop(0, 'transparent');
    gTop.addColorStop(0.5, '#ff202066');
    gTop.addColorStop(1, 'transparent');
    ctx.fillStyle = gTop;
    ctx.fillRect(0, beamTop() - 10, W, 20);
    ctx.strokeStyle = '#ff2020'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, beamTop()); ctx.lineTo(W, beamTop()); ctx.stroke();
    ctx.restore();

    // Bottom laser beam
    ctx.save();
    ctx.shadowColor = '#ff2020'; ctx.shadowBlur = 12;
    const gBot = ctx.createLinearGradient(0, beamBottom() - 10, 0, beamBottom() + 10);
    gBot.addColorStop(0, 'transparent');
    gBot.addColorStop(0.5, '#ff202066');
    gBot.addColorStop(1, 'transparent');
    ctx.fillStyle = gBot;
    ctx.fillRect(0, beamBottom() - 10, W, 20);
    ctx.strokeStyle = '#ff2020'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, beamBottom()); ctx.lineTo(W, beamBottom()); ctx.stroke();
    ctx.restore();

    // Exit
    ctx.save();
    ctx.shadowColor = '#00ff44'; ctx.shadowBlur = 18;
    ctx.fillStyle = 'rgba(0,255,68,0.25)';
    ctx.beginPath(); ctx.arc(exit.x, exit.y, exit.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#00ff44'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#00ff44';
    ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText('EXIT', exit.x, exit.y + 4);
    ctx.restore();

    // Player
    ctx.save();
    ctx.shadowColor = '#00ffe0'; ctx.shadowBlur = 14;
    const flash = deathCooldown > 0 && Math.floor(deathCooldown / 5) % 2 === 0;
    ctx.fillStyle = flash ? '#ff4040' : '#00ffe0';
    ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Walls
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0,   0,   12, H);
    ctx.fillRect(W-12,0,   12, H);
    ctx.fillRect(0,   0,   W,  12);
    ctx.fillRect(0,   H-12,W,  12);
  }

  // ── Loop ──────────────────────────────────────────────────
  let deathCooldown = 0;

  function loop() {
    if (won) return;
    _animId = requestAnimationFrame(loop);

    // Move corridor
    cY += cDY;
    if (cY <= C_MIN || cY >= C_MAX) cDY *= -1;

    // Move player
    if (deathCooldown > 0) {
      deathCooldown--;
    } else {
      if (keys['ArrowUp']    || keys['w'] || keys['W']) player.y -= player.speed;
      if (keys['ArrowDown']  || keys['s'] || keys['S']) player.y += player.speed;
      if (keys['ArrowLeft']  || keys['a'] || keys['A']) player.x -= player.speed;
      if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += player.speed;
      player.x = Math.max(14, Math.min(W - 14, player.x));
      player.y = Math.max(14, Math.min(H - 14, player.y));

      if (checkCollision()) {
        lives--;
        updateLives();
        callbacks.onFailure();
        deathCooldown = 90;
        reset();
        if (lives <= 0) {
          won = true;
          cancelAnimationFrame(_animId); _animId = null;
          cleanup(); _cleanup = () => {};
          setTimeout(() => callbacks.onClose(), 900);
          return;
        }
      }

      if (checkExit()) {
        won = true;
        cancelAnimationFrame(_animId); _animId = null;
        cleanup(); _cleanup = () => {};
        setTimeout(() => callbacks.onSuccess(), 300);
        return;
      }
    }

    draw();
  }

  function cleanup() {
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('keyup',   onKey);
  }
  _cleanup = cleanup;

  updateLives();
  loop();
}

export function destroy(container) {
  if (_animId !== null) { cancelAnimationFrame(_animId); _animId = null; }
  _cleanup(); _cleanup = () => {};
  container.innerHTML = '';
}
