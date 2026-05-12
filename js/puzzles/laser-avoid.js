// Laser avoidance minigame — canvas-based, WASD/arrows + on-screen D-pad

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
    <div class="puzzle-subtitle">Reach the green exit — stay in the centre corridor</div>
    <div class="laser-wrap">
      <canvas id="laser-canvas" width="${W}" height="${H}" style="display:block;margin:0 auto;touch-action:none;"></canvas>
      <div class="laser-lives" id="laser-lives">
        ${[0,1,2].map(() => `<div class="life-dot"></div>`).join('')}
      </div>
      <div class="laser-dpad" id="laser-dpad">
        <div class="dpad-row">
          <button class="dpad-btn" data-dir="up">▲</button>
        </div>
        <div class="dpad-row">
          <button class="dpad-btn" data-dir="left">◀</button>
          <div class="dpad-center"></div>
          <button class="dpad-btn" data-dir="right">▶</button>
        </div>
        <div class="dpad-row">
          <button class="dpad-btn" data-dir="down">▼</button>
        </div>
      </div>
      <div class="laser-instructions">WASD / Arrow keys — or use the D-pad</div>
    </div>
  `;

  const canvas  = container.querySelector('#laser-canvas');
  const ctx     = canvas.getContext('2d');
  const livesEl = container.querySelector('#laser-lives');

  // ── Player ────────────────────────────────────────────────
  let player = { x: 28, y: H / 2, r: 7, speed: 2.8 };

  // ── Exit ──────────────────────────────────────────────────
  const exit = { x: W - 28, y: H / 2, r: 14 };

  // ── Lasers ────────────────────────────────────────────────
  // Only 2 horizontal lasers — each stays clear of the centre band (y ≈ 107-153).
  // 2 vertical lasers cross at different x zones, creating timing windows.
  const lasers = [
    { type: 'h', y: 68,  dy: 0.65, minY: 44,  maxY: 92,  color: '#ff2020' },
    { type: 'h', y: 192, dy:-0.55, minY: 168, maxY: 216, color: '#ff2020' },
    { type: 'v', x: 148, dx: 0.9,  minX: 90,  maxX: 206, color: '#ff5010' },
    { type: 'v', x: 272, dx:-0.75, minX: 214, maxX: 318, color: '#ff5010' },
  ];

  // ── Key state (keyboard + D-pad share this) ───────────────
  const keys = {};

  function onKey(e) {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key)) {
      keys[e.key] = e.type === 'keydown';
      e.preventDefault();
    }
  }
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup',   onKey);

  // D-pad buttons — map direction to key names
  const DIR_KEYS = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  container.querySelectorAll('.dpad-btn').forEach(btn => {
    const k = DIR_KEYS[btn.dataset.dir];
    btn.addEventListener('pointerdown', e => { e.preventDefault(); keys[k] = true;  });
    btn.addEventListener('pointerup',   e => { e.preventDefault(); keys[k] = false; });
    btn.addEventListener('pointerleave',e => { keys[k] = false; });
  });

  // ── Helpers ───────────────────────────────────────────────
  function updateLives() {
    livesEl.querySelectorAll('.life-dot').forEach((dot, i) => {
      dot.classList.toggle('lost', i >= lives);
    });
  }

  function reset() {
    player.x = 28;
    player.y = H / 2;
  }

  function checkCollision() {
    for (const laser of lasers) {
      const MARGIN = 12; // wall margin where lasers don't kill (entry/exit zones)
      if (laser.type === 'h') {
        if (Math.abs(player.y - laser.y) < player.r + 2 &&
            player.x > MARGIN && player.x < W - MARGIN) return true;
      } else {
        if (Math.abs(player.x - laser.x) < player.r + 2 &&
            player.y > MARGIN && player.y < H - MARGIN) return true;
      }
    }
    return false;
  }

  function checkExit() {
    return Math.hypot(player.x - exit.x, player.y - exit.y) < player.r + exit.r;
  }

  // ── Draw ──────────────────────────────────────────────────
  function draw() {
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(30,30,60,0.4)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Safe-corridor hint (subtle green band)
    ctx.fillStyle = 'rgba(0,255,80,0.03)';
    ctx.fillRect(0, 104, W, 52);

    // Lasers
    for (const laser of lasers) {
      ctx.save();
      ctx.shadowColor = laser.color;
      ctx.shadowBlur  = 10;
      if (laser.type === 'h') {
        const g = ctx.createLinearGradient(0, laser.y - 8, 0, laser.y + 8);
        g.addColorStop(0, 'transparent');
        g.addColorStop(0.5, laser.color + '55');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, laser.y - 8, W, 16);
        ctx.strokeStyle = laser.color;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, laser.y); ctx.lineTo(W, laser.y); ctx.stroke();
      } else {
        const g = ctx.createLinearGradient(laser.x - 8, 0, laser.x + 8, 0);
        g.addColorStop(0, 'transparent');
        g.addColorStop(0.5, laser.color + '55');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(laser.x - 8, 0, 16, H);
        ctx.strokeStyle = laser.color;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(laser.x, 0); ctx.lineTo(laser.x, H); ctx.stroke();
      }
      ctx.restore();
    }

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
    ctx.fillStyle = deathCooldown > 0
      ? (Math.floor(deathCooldown / 4) % 2 === 0 ? '#00ffe0' : '#ff4040')
      : '#00ffe0';
    ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Walls
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, 12, H); ctx.fillRect(W-12, 0, 12, H);
    ctx.fillRect(0, 0, W, 12); ctx.fillRect(0, H-12, W, 12);
  }

  // ── Game loop ─────────────────────────────────────────────
  let deathCooldown = 0;

  function loop() {
    if (won) return;
    _animId = requestAnimationFrame(loop);

    // Move lasers
    for (const laser of lasers) {
      if (laser.type === 'h') {
        laser.y += laser.dy;
        if (laser.y <= laser.minY || laser.y >= laser.maxY) laser.dy *= -1;
      } else {
        laser.x += laser.dx;
        if (laser.x <= laser.minX || laser.x >= laser.maxX) laser.dx *= -1;
      }
    }

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
        deathCooldown = 80;
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
