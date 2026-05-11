export class ParticleSystem {
  constructor() {
    this._canvas  = null;
    this._ctx     = null;
    this._particles = [];
    this._config  = null;
    this._animId  = null;
    this._W = 0; this._H = 0;
  }

  init(canvas) {
    if (!canvas) return;
    this._canvas = canvas;
    this._ctx    = canvas.getContext('2d');
    this._resize();
    window.addEventListener('resize', () => this._resize());
    this._loop();
  }

  setRoom(config) {
    this._config = config;
    this._particles = [];
    if (config.particles) this._seed(config.particles);
  }

  _resize() {
    if (!this._canvas) return;
    const scene = document.getElementById('scene-container');
    if (!scene) return;
    this._W = this._canvas.width  = scene.clientWidth;
    this._H = this._canvas.height = scene.clientHeight;
  }

  _seed(cfg) {
    const count = Math.floor(this._W * this._H * (cfg.density || 0.2) * 0.00008);
    for (let i = 0; i < count; i++) {
      this._particles.push(this._makeParticle(cfg.type));
    }
  }

  _makeParticle(type, x, y) {
    const base = {
      x: x !== undefined ? x : Math.random() * this._W,
      y: y !== undefined ? y : Math.random() * this._H,
      life: 1.0,
    };
    if (type === 'dust') {
      return { ...base, type: 'dust',
        vx: (Math.random() - 0.5) * 0.15,
        vy: -(Math.random() * 0.2 + 0.05),
        alpha: Math.random() * 0.08 + 0.02,
        size: Math.random() * 1.5 + 0.5 };
    }
    if (type === 'spark') {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      return { ...base, type: 'spark',
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        alpha: 1.0, size: Math.random() * 2 + 1,
        life: Math.random() * 0.5 + 0.2,
        maxLife: Math.random() * 0.5 + 0.2 };
    }
    if (type === 'smoke') {
      return { ...base, type: 'smoke',
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.4 + 0.1),
        alpha: Math.random() * 0.06 + 0.01,
        size: Math.random() * 8 + 4 };
    }
    return base;
  }

  burstSparks(pctX, pctY, count = 20) {
    const x = pctX / 100 * this._W;
    const y = pctY / 100 * this._H;
    for (let i = 0; i < count; i++) {
      this._particles.push(this._makeParticle('spark', x, y));
    }
  }

  _loop() {
    this._animId = requestAnimationFrame(() => this._loop());
    if (!this._ctx || !this._config?.particles) return;

    this._ctx.clearRect(0, 0, this._W, this._H);
    const type = this._config.particles.type;

    // Respawn dust / smoke
    if ((type === 'dust' || type === 'smoke') && Math.random() < 0.15) {
      this._particles.push(this._makeParticle(type));
    }

    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.type === 'spark') {
        p.vy += 0.08; // gravity
        p.life -= 0.04;
        if (p.life <= 0) { this._particles.splice(i, 1); continue; }
        this._ctx.save();
        this._ctx.globalAlpha = p.life;
        this._ctx.fillStyle = `hsl(${30 + Math.random() * 30},100%,70%)`;
        this._ctx.beginPath();
        this._ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        this._ctx.fill();
        this._ctx.restore();
      } else if (p.type === 'dust') {
        // Respawn at bottom if drifts off top
        if (p.y < -5) { p.y = this._H + 5; p.x = Math.random() * this._W; }
        // Add gentle wobble
        p.vx += (Math.random() - 0.5) * 0.02;
        p.vx *= 0.99;
        this._ctx.save();
        this._ctx.globalAlpha = p.alpha;
        this._ctx.fillStyle = '#a0b0d0';
        this._ctx.beginPath();
        this._ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this._ctx.fill();
        this._ctx.restore();
      } else if (p.type === 'smoke') {
        p.size += 0.05;
        p.alpha -= 0.0003;
        if (p.alpha <= 0 || p.y < -50) { this._particles.splice(i, 1); continue; }
        this._ctx.save();
        this._ctx.globalAlpha = p.alpha;
        this._ctx.fillStyle = '#506060';
        this._ctx.beginPath();
        this._ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this._ctx.fill();
        this._ctx.restore();
      }
    }
  }
}
