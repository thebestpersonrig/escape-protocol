// Laser avoidance minigame — canvas-based, WASD/arrow keys

// Module-level handles so destroy() can always cancel a running game
let _animId   = null;
let _cleanup  = () => {};

export function init(container, puzzleState, callbacks) {
  // Cancel any leftover run from a previous open
  if (_animId !== null) { cancelAnimationFrame(_animId); _animId = null; }
  _cleanup();

  const W = 360, H = 260;
  let lives = 3;
  let won   = false;

  container.innerHTML = `
    <div class="puzzle-title">⚡ LASER GRID ⚡</div>
    <div class="puzzle-subtitle">Reach the green exit without touching lasers</div>
    <div class="laser-wrap">
      <canvas id="laser-canvas" width="${W}" height="${H}"></canvas>
      <div class="laser-lives" id="laser-lives">
        ${[0,1,2].map(() => `<div class="life-dot"></div>`).join('')}
      </div>
      <div class="laser-instructions">WASD or Arrow Keys to move</div>
    </div>
  `;

  const canvas = container.querySelector('#laser-canvas');
  const ctx    = canvas.getContext('2d');
  const livesEl = container.querySelector('#laser-lives');

  // Player
  let player = { x: 30, y: H / 2, r: 8, speed: 2.5 };

  // Exit zone
  const exit = { x: W - 30, y: H / 2, r: 12 };

  // Laser beams: each moves back and forth
  const lasers = [
    { type: 'h', y: 80,  dx: 0,  dy: 0.6, minY: 40,  maxY: 120, color: '#ff2020' },
    { type: 'h', y: 180, dx: 0,  dy:-0.5, minY: 140, maxY: 220, color: '#ff2020' },
    { type: 'v', x: 150, dx: 0.7,dy: 0,   minX: 100, maxX: 200, color: '#ff5010' },
    { type: 'v', x: 260, dx:-0.6,dy: 0,   minX: 220, maxX: 300, color: '#ff5010' },
    { type: 'h', y: 130, dx: 0,  dy: 0.4, minY: 90,  maxY: 170, color: '#ff2060' },
  ];

  // Key state
  const keys = {};
  function onKey(e) {
    keys[e.key] = e.type === 'keydown';
    e.preventDefault();
  }
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup',   onKey);

  function updateLives() {
    livesEl.querySelectorAll('.life-dot').forEach((dot, i) => {
      dot.classList.toggle('lost', i >= lives);
    });
  }

  function reset() {
    player.x = 30;
    player.y = H / 2;
  }

  function checkCollision() {
    for (const laser of lasers) {
      if (laser.type === 'h') {
        const ly = laser.y;
        const dist = Math.abs(player.y - ly);
        if (dist < player.r + 3 && player.x > 10 && player.x < W - 10) return true;
      } else {
        const lx = laser.x;
        const dist = Math.abs(player.x - lx);
        if (dist < player.r + 3 && player.y > 10 && player.y < H - 10) return true;
      }
    }
    return false;
  }

  function checkExit() {
    const dx = player.x - exit.x;
    const dy = player.y - exit.y;
    return Math.sqrt(dx*dx + dy*dy) < player.r + exit.r;
  }

  function draw() {
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(30,30,60,0.5)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Lasers
    for (const laser of lasers) {
      ctx.save();
      if (laser.type === 'h') {
        // Glow
        const grad = ctx.createLinearGradient(0, laser.y - 6, 0, laser.y + 6);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.5, laser.color + '44');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, laser.y - 6, W, 12);
        // Core
        ctx.strokeStyle = laser.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = laser.color;
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.moveTo(0, laser.y); ctx.lineTo(W, laser.y); ctx.stroke();
      } else {
        const grad = ctx.createLinearGradient(laser.x - 6, 0, laser.x + 6, 0);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.5, laser.color + '44');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(laser.x - 6, 0, 12, H);
        ctx.strokeStyle = laser.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = laser.color;
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.moveTo(laser.x, 0); ctx.lineTo(laser.x, H); ctx.stroke();
      }
      ctx.restore();
    }

    // Exit
    ctx.save();
    ctx.shadowColor = '#00ff44';
    ctx.shadowBlur = 15;
    ctx.fillStyle = 'rgba(0,255,68,0.3)';
    ctx.beginPath();
    ctx.arc(exit.x, exit.y, exit.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00ff44';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#00ff44';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', exit.x, exit.y + 4);
    ctx.restore();

    // Player
    ctx.save();
    ctx.shadowColor = 'var(--accent, #00ffe0)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#00ffe0';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Walls
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, 10, H);
    ctx.fillRect(W - 10, 0, 10, H);
    ctx.fillRect(0, 0, W, 10);
    ctx.fillRect(0, H - 10, W, 10);
  }

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
    if (deathCooldown > 0) { deathCooldown--; } else {
      if (keys['ArrowUp']    || keys['w'] || keys['W']) player.y -= player.speed;
      if (keys['ArrowDown']  || keys['s'] || keys['S']) player.y += player.speed;
      if (keys['ArrowLeft']  || keys['a'] || keys['A']) player.x -= player.speed;
      if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += player.speed;
      player.x = Math.max(12, Math.min(W - 12, player.x));
      player.y = Math.max(12, Math.min(H - 12, player.y));

      if (checkCollision()) {
        lives--;
        updateLives();
        callbacks.onFailure();
        deathCooldown = 60; // brief invincibility after hit
        reset();
        if (lives <= 0) {
          won = true;
          cancelAnimationFrame(_animId); _animId = null;
          cleanup(); _cleanup = () => {};
          setTimeout(() => callbacks.onClose(), 800);
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
