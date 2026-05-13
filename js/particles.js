export class ParticleSystem {
  constructor() {
    this._canvas  = null;
    this._ctx     = null;
    this._particles = [];
    this._config  = null;
    this._animId  = null;
    this._W = 0; this._H = 0;
    this._time = 0;
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
    this._time = 0;
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
    const density = cfg.density || 0.2;
    const count = Math.floor(this._W * this._H * density * 0.0001);
    const type = cfg.type || 'dust';
    for (let i = 0; i < count; i++) {
      this._particles.push(this._makeParticle(type));
    }
  }

  _makeParticle(type, x, y) {
    const base = {
      x: x !== undefined ? x : Math.random() * this._W,
      y: y !== undefined ? y : Math.random() * this._H,
      life: 1.0,
    };

    switch (type) {
      case 'dust':
        return { ...base, type: 'dust',
          vx: (Math.random() - 0.5) * 0.15,
          vy: -(Math.random() * 0.25 + 0.05),
          alpha: Math.random() * 0.1 + 0.03,
          size: Math.random() * 1.8 + 0.5,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: (Math.random() - 0.5) * 0.02 };

      case 'spark':
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3.5 + 1;
        return { ...base, type: 'spark',
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          alpha: 1.0, size: Math.random() * 2.5 + 1,
          life: Math.random() * 0.5 + 0.3,
          maxLife: Math.random() * 0.5 + 0.3,
          hue: 20 + Math.random() * 30 };

      case 'smoke':
        return { ...base, type: 'smoke',
          vx: (Math.random() - 0.5) * 0.3,
          vy: -(Math.random() * 0.5 + 0.1),
          alpha: Math.random() * 0.07 + 0.02,
          size: Math.random() * 10 + 4 };

      case 'fog':
        return { ...base, type: 'fog',
          vx: (Math.random() - 0.5) * 0.08,
          vy: (Math.random() - 0.5) * 0.03,
          alpha: Math.random() * 0.04 + 0.01,
          size: Math.random() * 60 + 40,
          y: this._H * (0.5 + Math.random() * 0.5) };

      case 'ember':
        return { ...base, type: 'ember',
          vx: (Math.random() - 0.5) * 0.6,
          vy: -(Math.random() * 0.8 + 0.2),
          alpha: Math.random() * 0.6 + 0.3,
          size: Math.random() * 2 + 0.5,
          hue: Math.random() < 0.3 ? 40 : 15,
          flicker: Math.random() * Math.PI * 2 };

      case 'rain':
        return { ...base, type: 'rain',
          vx: -0.5 - Math.random() * 0.5,
          vy: 6 + Math.random() * 4,
          alpha: Math.random() * 0.12 + 0.04,
          size: Math.random() * 8 + 6,
          x: Math.random() * this._W * 1.2 };

      case 'electric':
        return { ...base, type: 'electric',
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          alpha: Math.random() * 0.4 + 0.2,
          size: Math.random() * 1.5 + 0.5,
          life: Math.random() * 0.3 + 0.1,
          maxLife: Math.random() * 0.3 + 0.1 };

      case 'snowflake':
        return { ...base, type: 'snowflake',
          vx: (Math.random() - 0.5) * 0.3,
          vy: Math.random() * 0.3 + 0.08,
          alpha: Math.random() * 0.15 + 0.05,
          size: Math.random() * 2 + 1,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: (Math.random() - 0.5) * 0.03 };

      default:
        return base;
    }
  }

  burstSparks(pctX, pctY, count = 25) {
    const x = pctX / 100 * this._W;
    const y = pctY / 100 * this._H;
    for (let i = 0; i < count; i++) {
      this._particles.push(this._makeParticle('spark', x, y));
    }
  }

  burstElectric(pctX, pctY, count = 15) {
    const x = pctX / 100 * this._W;
    const y = pctY / 100 * this._H;
    for (let i = 0; i < count; i++) {
      this._particles.push(this._makeParticle('electric', x, y));
    }
  }

  _loop() {
    this._animId = requestAnimationFrame(() => this._loop());
    if (!this._ctx || !this._config?.particles) return;
    this._time++;

    this._ctx.clearRect(0, 0, this._W, this._H);
    const type = this._config.particles.type;
    const density = this._config.particles.density || 0.2;

    // Respawn ambient particles
    const spawnRate = {
      dust: 0.2, smoke: 0.12, fog: 0.03, ember: 0.15, rain: 0.6, snowflake: 0.08, electric: 0.05,
    };
    if (spawnRate[type] && Math.random() < spawnRate[type] * density) {
      this._particles.push(this._makeParticle(type));
    }

    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i];
      p.x += p.vx;
      p.y += p.vy;

      switch (p.type) {
        case 'spark':
          p.vy += 0.08;
          p.life -= 0.04;
          if (p.life <= 0) { this._particles.splice(i, 1); continue; }
          this._ctx.save();
          this._ctx.globalAlpha = p.life;
          this._ctx.fillStyle = `hsl(${p.hue || 30},100%,${60 + p.life * 30}%)`;
          this._ctx.shadowColor = `hsl(${p.hue || 30},100%,60%)`;
          this._ctx.shadowBlur = 6;
          this._ctx.beginPath();
          this._ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          this._ctx.fill();
          this._ctx.restore();
          break;

        case 'dust':
          if (p.y < -5) { p.y = this._H + 5; p.x = Math.random() * this._W; }
          p.wobble += p.wobbleSpeed;
          p.vx += Math.sin(p.wobble) * 0.005;
          p.vx *= 0.99;
          this._ctx.save();
          this._ctx.globalAlpha = p.alpha;
          this._ctx.fillStyle = '#a0b8d8';
          this._ctx.beginPath();
          this._ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this._ctx.fill();
          this._ctx.restore();
          break;

        case 'smoke':
          p.size += 0.06;
          p.alpha -= 0.0003;
          if (p.alpha <= 0 || p.y < -60) { this._particles.splice(i, 1); continue; }
          this._ctx.save();
          this._ctx.globalAlpha = p.alpha;
          this._ctx.fillStyle = '#607070';
          this._ctx.beginPath();
          this._ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this._ctx.fill();
          this._ctx.restore();
          break;

        case 'fog':
          p.vx += (Math.random() - 0.5) * 0.005;
          if (p.x < -p.size) p.x = this._W + p.size;
          if (p.x > this._W + p.size) p.x = -p.size;
          this._ctx.save();
          this._ctx.globalAlpha = p.alpha * (0.7 + Math.sin(this._time * 0.01 + p.wobble) * 0.3);
          const fogGrad = this._ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          fogGrad.addColorStop(0, 'rgba(120,130,150,0.15)');
          fogGrad.addColorStop(1, 'rgba(120,130,150,0)');
          this._ctx.fillStyle = fogGrad;
          this._ctx.beginPath();
          this._ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this._ctx.fill();
          this._ctx.restore();
          break;

        case 'ember':
          p.vy -= 0.002;
          p.flicker += 0.15;
          p.alpha *= 0.998;
          if (p.y < -5 || p.alpha < 0.02) { this._particles.splice(i, 1); continue; }
          this._ctx.save();
          const eAlpha = p.alpha * (0.6 + Math.sin(p.flicker) * 0.4);
          this._ctx.globalAlpha = eAlpha;
          this._ctx.fillStyle = `hsl(${p.hue},100%,60%)`;
          this._ctx.shadowColor = `hsl(${p.hue},100%,50%)`;
          this._ctx.shadowBlur = 8;
          this._ctx.beginPath();
          this._ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this._ctx.fill();
          this._ctx.restore();
          break;

        case 'rain':
          if (p.y > this._H + 10 || p.x < -10) {
            p.y = -10;
            p.x = Math.random() * this._W * 1.2;
          }
          this._ctx.save();
          this._ctx.globalAlpha = p.alpha;
          this._ctx.strokeStyle = 'rgba(140,170,220,0.5)';
          this._ctx.lineWidth = 0.8;
          this._ctx.beginPath();
          this._ctx.moveTo(p.x, p.y);
          this._ctx.lineTo(p.x + p.vx * 2, p.y - p.size);
          this._ctx.stroke();
          this._ctx.restore();
          break;

        case 'electric':
          p.life -= 0.05;
          p.vx += (Math.random() - 0.5) * 3;
          p.vy += (Math.random() - 0.5) * 3;
          if (p.life <= 0) { this._particles.splice(i, 1); continue; }
          this._ctx.save();
          this._ctx.globalAlpha = p.life;
          this._ctx.fillStyle = '#80e0ff';
          this._ctx.shadowColor = '#40c0ff';
          this._ctx.shadowBlur = 10;
          this._ctx.beginPath();
          this._ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this._ctx.fill();
          this._ctx.restore();
          break;

        case 'snowflake':
          if (p.y > this._H + 5) { p.y = -5; p.x = Math.random() * this._W; }
          p.wobble += p.wobbleSpeed;
          p.vx = Math.sin(p.wobble) * 0.4;
          this._ctx.save();
          this._ctx.globalAlpha = p.alpha;
          this._ctx.fillStyle = '#c8d8f0';
          this._ctx.beginPath();
          this._ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this._ctx.fill();
          this._ctx.restore();
          break;
      }
    }

    // Cap total particle count to prevent performance issues
    if (this._particles.length > 300) {
      this._particles.splice(0, this._particles.length - 300);
    }
  }
}
