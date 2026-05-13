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
    // Remove old environment overlay
    const oldEnv = document.getElementById('room-env-overlay');
    if (oldEnv) oldEnv.remove();

    if (config.background) {
      this._bgEl.style.backgroundImage = `url('${config.background}')`;
    } else {
      // CSS-drawn procedural room — layered gradients + patterns
      const gradients = {
        'lab-entry':         'linear-gradient(160deg,#1e1e38 0%,#18223a 40%,#111830 100%)',
        'main-lab':          'linear-gradient(160deg,#182820 0%,#142418 40%,#0e1a10 100%)',
        'server-room':       'linear-gradient(160deg,#281a10 0%,#301c10 40%,#1c1008 100%)',
        'final-exit':        'linear-gradient(160deg,#14142a 0%,#1a1a30 40%,#0e0e1e 100%)',
        'secret-room':       'linear-gradient(160deg,#101220 0%,#161828 40%,#0c0e18 100%)',
        'bio-lab':           'linear-gradient(160deg,#0a1e1a 0%,#081614 40%,#050e0c 100%)',
        'director-office':   'linear-gradient(160deg,#1a140a 0%,#141008 40%,#0e0c06 100%)',
        'security-hub':      'linear-gradient(160deg,#0e1420 0%,#0a1018 40%,#080c14 100%)',
        'utility-corridor':  'linear-gradient(160deg,#141210 0%,#0e0c0a 40%,#090806 100%)',
        'bw-east-foyer':        'linear-gradient(160deg,#1e1208 0%,#160e06 40%,#100a04 100%)',
        'bw-patient-corridor':  'linear-gradient(160deg,#1a1006 0%,#140c04 40%,#0e0802 100%)',
        'bw-patient-room-7':    'linear-gradient(160deg,#1c0c06 0%,#160804 40%,#100604 100%)',
        'bw-nurses-station':    'linear-gradient(160deg,#161208 0%,#120e06 40%,#0e0a04 100%)',
        'bw-treatment-room':    'linear-gradient(160deg,#200c0c 0%,#180808 40%,#120606 100%)',
        'bw-records-vault':     'linear-gradient(160deg,#141008 0%,#100c06 40%,#0c0a04 100%)',
        'bw-directors-office':  'linear-gradient(160deg,#1c1408 0%,#160e04 40%,#100a02 100%)',
        'bw-chapel':            'linear-gradient(160deg,#0e0a14 0%,#0a0810 40%,#080610 100%)',
        'bw-solitary-cell':     'linear-gradient(160deg,#0a0808 0%,#060606 40%,#040404 100%)',
        'bw-maintenance-tunnel':'linear-gradient(160deg,#0c0a06 0%,#080604 40%,#060402 100%)',
        'ms-airlock-bay':      'linear-gradient(160deg,#020810 0%,#03101a 40%,#020810 100%)',
        'ms-corridor-a':       'linear-gradient(160deg,#030c18 0%,#020a14 40%,#020810 100%)',
        'ms-crew-quarters':    'linear-gradient(160deg,#040c14 0%,#030a10 40%,#02080e 100%)',
        'ms-med-bay':          'linear-gradient(160deg,#040e18 0%,#030c14 40%,#030a12 100%)',
        'ms-engineering':      'linear-gradient(160deg,#080a04 0%,#060802 40%,#040602 100%)',
        'ms-cargo-bay':        'linear-gradient(160deg,#080a06 0%,#060804 40%,#040604 100%)',
        'ms-reactor-deck':     'linear-gradient(160deg,#180402 0%,#140302 40%,#100202 100%)',
        'ms-command-deck':     'linear-gradient(160deg,#020c1a 0%,#020a16 40%,#020810 100%)',
        'ms-comms-array':      'linear-gradient(160deg,#030a14 0%,#020810 40%,#020608 100%)',
        'ms-escape-pod-bay':   'linear-gradient(160deg,#020810 0%,#030c1a 40%,#020810 100%)',
        'ms-lower-corridor':   'linear-gradient(160deg,#040a10 0%,#030810 40%,#020610 100%)',
      };
      this._bgEl.style.backgroundImage = gradients[config.id] || gradients['lab-entry'];

      // Add environment atmosphere overlay (grid lines, noise, vignette)
      const envStyles = {
        // Arcadia — lab grid pattern
        'lab-entry':        'grid',
        'main-lab':         'grid',
        'server-room':      'grid-warm',
        'security-hub':     'grid',
        'utility-corridor': 'grid-warm',
        'bio-lab':          'grid',
        'director-office':  'noise',
        'final-exit':       'grid',
        'secret-room':      'noise',
        // Blackwood — aged texture
        'bw-east-foyer':        'noise-warm',
        'bw-patient-corridor':  'noise-warm',
        'bw-patient-room-7':    'noise-warm',
        'bw-nurses-station':    'noise-warm',
        'bw-treatment-room':    'noise-warm',
        'bw-records-vault':     'noise-warm',
        'bw-directors-office':  'noise-warm',
        'bw-chapel':            'noise',
        'bw-solitary-cell':     'noise',
        'bw-maintenance-tunnel':'noise',
        // Meridian — tech panels
        'ms-airlock-bay':      'panels',
        'ms-corridor-a':       'panels',
        'ms-crew-quarters':    'panels',
        'ms-med-bay':          'panels',
        'ms-engineering':      'panels-warm',
        'ms-cargo-bay':        'panels-warm',
        'ms-reactor-deck':     'panels-danger',
        'ms-command-deck':     'panels',
        'ms-comms-array':      'panels',
        'ms-escape-pod-bay':   'panels',
        'ms-lower-corridor':   'panels',
      };

      const envType = envStyles[config.id] || 'grid';
      const envEl = document.createElement('div');
      envEl.id = 'room-env-overlay';
      envEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;';

      const patterns = {
        grid: `background:
          repeating-linear-gradient(rgba(100,140,200,0.03),rgba(100,140,200,0.03) 1px,transparent 1px,transparent 40px),
          repeating-linear-gradient(90deg,rgba(100,140,200,0.03),rgba(100,140,200,0.03) 1px,transparent 1px,transparent 60px);`,
        'grid-warm': `background:
          repeating-linear-gradient(rgba(200,140,80,0.03),rgba(200,140,80,0.03) 1px,transparent 1px,transparent 40px),
          repeating-linear-gradient(90deg,rgba(200,140,80,0.03),rgba(200,140,80,0.03) 1px,transparent 1px,transparent 60px);`,
        noise: `background:
          radial-gradient(ellipse at 20% 80%,rgba(80,120,180,0.04) 0%,transparent 50%),
          radial-gradient(ellipse at 80% 20%,rgba(80,120,180,0.03) 0%,transparent 40%);`,
        'noise-warm': `background:
          radial-gradient(ellipse at 30% 70%,rgba(180,120,40,0.05) 0%,transparent 50%),
          radial-gradient(ellipse at 70% 30%,rgba(120,60,20,0.04) 0%,transparent 40%);`,
        panels: `background:
          repeating-linear-gradient(rgba(40,100,180,0.04),rgba(40,100,180,0.04) 1px,transparent 1px,transparent 32px),
          repeating-linear-gradient(90deg,rgba(40,100,180,0.04),rgba(40,100,180,0.04) 1px,transparent 1px,transparent 48px),
          radial-gradient(ellipse at 50% 100%,rgba(0,120,255,0.03) 0%,transparent 60%);`,
        'panels-warm': `background:
          repeating-linear-gradient(rgba(140,120,40,0.04),rgba(140,120,40,0.04) 1px,transparent 1px,transparent 32px),
          repeating-linear-gradient(90deg,rgba(140,120,40,0.04),rgba(140,120,40,0.04) 1px,transparent 1px,transparent 48px),
          radial-gradient(ellipse at 50% 100%,rgba(180,140,0,0.03) 0%,transparent 60%);`,
        'panels-danger': `background:
          repeating-linear-gradient(rgba(200,40,40,0.04),rgba(200,40,40,0.04) 1px,transparent 1px,transparent 32px),
          repeating-linear-gradient(90deg,rgba(200,40,40,0.04),rgba(200,40,40,0.04) 1px,transparent 1px,transparent 48px),
          radial-gradient(ellipse at 50% 50%,rgba(255,40,20,0.06) 0%,transparent 50%);`,
      };
      envEl.style.cssText += patterns[envType] || patterns.grid;
      document.getElementById('scene-container')?.appendChild(envEl);
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
        <div style="position:absolute;bottom:0;left:0;right:0;height:28%;background:linear-gradient(to top,#1a1a28,transparent);"></div>
        <!-- Ceiling strip light left -->
        <div style="position:absolute;top:0;left:10%;width:30%;height:4px;background:linear-gradient(90deg,transparent,rgba(160,200,255,0.9),transparent);box-shadow:0 0 20px rgba(160,200,255,0.7),0 0 40px rgba(160,200,255,0.3);"></div>
        <!-- Ceiling strip light right -->
        <div style="position:absolute;top:0;right:8%;width:25%;height:4px;background:linear-gradient(90deg,transparent,rgba(160,200,255,0.8),transparent);box-shadow:0 0 16px rgba(160,200,255,0.6),0 0 30px rgba(160,200,255,0.25);"></div>
        <!-- Light pools on floor -->
        <div style="position:absolute;bottom:28%;left:20%;width:30%;height:6%;background:radial-gradient(ellipse,rgba(160,200,255,0.08) 0%,transparent 70%);"></div>
        <!-- Warning stripe left wall -->
        <div style="position:absolute;left:0;top:20%;width:4%;height:60%;background:repeating-linear-gradient(45deg,#2a2210,#2a2210 8px,#342c10 8px,#342c10 16px);opacity:0.8;"></div>
        <!-- Biohazard sign -->
        <div style="position:absolute;top:28%;left:5%;width:3%;aspect-ratio:1;border:2px solid rgba(255,176,0,0.7);border-radius:50%;display:flex;align-items:center;justify-content:center;color:rgba(255,176,0,0.8);font-size:1.5vw;">☣</div>
        <!-- Warning text -->
        <div style="position:absolute;top:22%;left:2%;color:rgba(255,150,0,0.55);font-family:monospace;font-size:0.7vw;letter-spacing:0.1em;writing-mode:vertical-rl;text-orientation:mixed;">AUTHORIZED PERSONNEL ONLY</div>
        <!-- Security camera mount -->
        <div style="position:absolute;top:6%;right:15%;width:2%;height:3%;background:#2a2a40;border:1px solid #3a3a5a;border-radius:2px;"></div>
        <!-- Emergency light -->
        <div style="position:absolute;top:5%;left:50%;width:1.5%;height:2%;background:#500000;border:1px solid #800000;border-radius:2px;box-shadow:0 0 8px rgba(255,0,0,0.5);"></div>
        <!-- Wall texture lines -->
        <div style="position:absolute;top:10%;left:30%;width:1px;height:60%;background:linear-gradient(to bottom,transparent,rgba(255,255,255,0.06),transparent);"></div>
      `,
      'main-lab': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:30%;background:linear-gradient(to top,#142018,transparent);"></div>
        <!-- Lab bench -->
        <div style="position:absolute;bottom:22%;left:5%;right:5%;height:3%;background:linear-gradient(to bottom,#263028,#1c241e);border-top:1px solid #3a4e3a;"></div>
        <!-- Equipment on bench -->
        <div style="position:absolute;bottom:25%;left:10%;width:6%;height:8%;background:linear-gradient(to bottom,#182a1e,#101a12);border:1px solid #283e28;border-radius:3px 3px 0 0;"></div>
        <div style="position:absolute;bottom:25%;left:18%;width:3%;height:5%;background:#141e14;border:1px solid #283828;border-radius:2px;"></div>
        <!-- Green power indicators -->
        <div class="led-blink" style="position:absolute;bottom:28%;left:11%;width:0.5%;height:0.5%;background:#00ff44;border-radius:50%;box-shadow:0 0 8px #00ff44,0 0 16px rgba(0,255,68,0.4);animation-delay:0.3s;"></div>
        <div class="led-blink" style="position:absolute;bottom:28%;left:19%;width:0.5%;height:0.5%;background:#00cc33;border-radius:50%;box-shadow:0 0 6px #00cc33;animation-delay:1.1s;"></div>
        <!-- Overhead lighting bars -->
        <div style="position:absolute;top:0;left:15%;width:20%;height:3px;background:rgba(120,220,140,0.6);box-shadow:0 0 20px rgba(120,220,140,0.5),0 0 40px rgba(120,220,140,0.2);"></div>
        <div style="position:absolute;top:0;right:10%;width:25%;height:3px;background:rgba(120,220,140,0.5);box-shadow:0 0 16px rgba(120,220,140,0.4),0 0 30px rgba(120,220,140,0.15);"></div>
        <!-- Light pools on floor -->
        <div style="position:absolute;bottom:22%;left:20%;width:20%;height:8%;background:radial-gradient(ellipse,rgba(120,220,140,0.06) 0%,transparent 70%);"></div>
        <!-- Shelving unit outline right -->
        <div style="position:absolute;top:20%;right:3%;width:6%;height:50%;border:1px solid #2a3e2a;background:linear-gradient(to right,#141e14,#101810);"></div>
        <!-- Shelf dividers -->
        <div style="position:absolute;top:35%;right:3%;width:6%;height:1px;background:#2a3e2a;"></div>
        <div style="position:absolute;top:50%;right:3%;width:6%;height:1px;background:#2a3e2a;"></div>
        <!-- Symbol diagram on wall -->
        <div style="position:absolute;top:15%;left:40%;width:12%;height:20%;background:#141e14;border:1px solid #2a3e2a;display:flex;align-items:center;justify-content:center;color:rgba(0,220,100,0.45);font-size:2vw;">⬡</div>
      `,
      'server-room': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:28%;background:linear-gradient(to top,#201008,transparent);"></div>
        <!-- Server racks -->
        <div style="position:absolute;top:15%;left:8%;width:10%;height:65%;background:linear-gradient(to right,#201010,#1a0c0c);border:1px solid #3a1818;border-radius:2px;"></div>
        <div style="position:absolute;top:15%;left:20%;width:10%;height:65%;background:linear-gradient(to right,#201010,#1a0c0c);border:1px solid #3a1818;border-radius:2px;"></div>
        <!-- Server unit LEDs -->
        <div class="led-blink" style="position:absolute;top:20%;left:9%;width:8%;height:2px;background:rgba(255,80,0,0.9);box-shadow:0 0 6px rgba(255,80,0,0.7);"></div>
        <div class="led-blink" style="position:absolute;top:25%;left:9%;width:8%;height:2px;background:rgba(0,140,255,0.7);box-shadow:0 0 4px rgba(0,140,255,0.5);animation-delay:0.4s;"></div>
        <div style="position:absolute;top:30%;left:9%;width:8%;height:2px;background:rgba(255,80,0,0.6);"></div>
        <div class="led-blink" style="position:absolute;top:35%;left:9%;width:8%;height:2px;background:rgba(0,255,100,0.5);box-shadow:0 0 4px rgba(0,255,100,0.3);animation-delay:1.2s;"></div>
        <div class="led-blink" style="position:absolute;top:20%;left:21%;width:8%;height:2px;background:rgba(255,160,0,0.8);box-shadow:0 0 6px rgba(255,160,0,0.5);animation-delay:0.7s;"></div>
        <div style="position:absolute;top:28%;left:21%;width:8%;height:2px;background:rgba(255,80,0,0.6);"></div>
        <!-- Cable bundles -->
        <div style="position:absolute;top:40%;left:7%;width:25%;height:2%;background:repeating-linear-gradient(90deg,rgba(255,100,0,0.6),rgba(255,100,0,0.6) 2px,transparent 2px,transparent 6px);"></div>
        <!-- Overhead red emergency light -->
        <div style="position:absolute;top:3%;left:50%;width:2%;height:1.5%;background:#500000;border:1px solid #900000;border-radius:2px;box-shadow:0 0 14px rgba(255,0,0,0.6),0 4px 24px rgba(255,0,0,0.2);animation:alarm-flash 2s ease-in-out infinite;"></div>
        <!-- Fuse box on wall -->
        <div style="position:absolute;top:25%;right:8%;width:7%;height:12%;background:#1e1610;border:1px solid #3a2a18;border-radius:2px;"></div>
        <div style="position:absolute;top:28%;right:8.5%;width:6%;height:1px;background:#3a2a18;"></div>
        <div style="position:absolute;top:32%;right:8.5%;width:6%;height:1px;background:#3a2a18;"></div>
      `,
      'final-exit': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:25%;background:linear-gradient(to top,#141428,transparent);"></div>
        <!-- Exit corridor perspective -->
        <div style="position:absolute;top:20%;left:35%;right:35%;bottom:30%;background:linear-gradient(to bottom,#0e0e1c,#141428);border-left:1px solid #2a2a4a;border-right:1px solid #2a2a4a;"></div>
        <!-- EXIT sign -->
        <div style="position:absolute;top:22%;left:43%;width:14%;height:5%;background:#003300;border:1px solid #00ff44;border-radius:2px;display:flex;align-items:center;justify-content:center;color:rgba(0,255,68,0.95);font-family:monospace;font-size:1vw;letter-spacing:0.2em;box-shadow:0 0 16px rgba(0,255,68,0.6),0 0 40px rgba(0,255,68,0.2);">EXIT</div>
        <!-- Laser emitters (decorative) -->
        <div style="position:absolute;top:35%;left:33%;width:2%;height:1%;background:#400000;border:1px solid #900000;border-radius:1px;box-shadow:0 0 10px rgba(255,0,0,0.8);"></div>
        <div style="position:absolute;top:55%;right:31%;width:2%;height:1%;background:#400000;border:1px solid #900000;border-radius:1px;box-shadow:0 0 10px rgba(255,0,0,0.8);"></div>
        <!-- Laser beams -->
        <div style="position:absolute;top:35.4%;left:35%;width:30%;height:1px;background:linear-gradient(90deg,rgba(255,0,0,0.6),rgba(255,0,0,0.2));box-shadow:0 0 4px rgba(255,0,0,0.5);"></div>
        <div style="position:absolute;top:55.4%;right:33%;width:30%;height:1px;background:linear-gradient(270deg,rgba(255,0,0,0.6),rgba(255,0,0,0.2));box-shadow:0 0 4px rgba(255,0,0,0.5);"></div>
        <!-- Floor grid pattern -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:30%;background:repeating-linear-gradient(90deg,rgba(50,50,90,0.4),rgba(50,50,90,0.4) 1px,transparent 1px,transparent 5%),repeating-linear-gradient(rgba(50,50,90,0.3),rgba(50,50,90,0.3) 1px,transparent 1px,transparent 30px);"></div>
        <!-- Control panel left -->
        <div style="position:absolute;top:40%;left:5%;width:12%;height:30%;background:#16162a;border:1px solid #2a2a4a;border-radius:3px;"></div>
        <div style="position:absolute;top:45%;left:6%;width:10%;height:1px;background:#3a3a6a;"></div>
        <div style="position:absolute;top:50%;left:6%;width:10%;height:1px;background:#3a3a6a;"></div>
      `,
      'secret-room': `
        <!-- Floor -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:28%;background:linear-gradient(to top,#0c0c18,transparent);"></div>
        <!-- Floor grid lines -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:28%;background:repeating-linear-gradient(90deg,rgba(40,40,80,0.35),rgba(40,40,80,0.35) 1px,transparent 1px,transparent 8%),repeating-linear-gradient(rgba(40,40,80,0.25),rgba(40,40,80,0.25) 1px,transparent 1px,transparent 28px);"></div>
        <!-- Side vignettes -->
        <div style="position:absolute;top:0;left:0;width:10%;height:100%;background:linear-gradient(to right,rgba(0,0,0,0.75),transparent);"></div>
        <div style="position:absolute;top:0;right:0;width:10%;height:100%;background:linear-gradient(to left,rgba(0,0,0,0.75),transparent);"></div>
        <!-- Dim blue ceiling strip — secret room only power source -->
        <div style="position:absolute;top:0;left:20%;width:60%;height:3px;background:linear-gradient(90deg,transparent,rgba(60,100,220,0.6),transparent);box-shadow:0 0 18px rgba(60,100,220,0.4),0 0 40px rgba(60,100,220,0.15);"></div>
        <!-- Ambient pool on floor -->
        <div style="position:absolute;bottom:0;left:25%;right:25%;height:30%;background:radial-gradient(ellipse,rgba(40,60,160,0.06) 0%,transparent 70%);"></div>
        <!-- Left wall — filing cabinet bank -->
        <div style="position:absolute;bottom:28%;left:4%;width:14%;height:42%;background:#0e0e1c;border:1px solid #1c1c32;border-radius:2px;"></div>
        <div style="position:absolute;bottom:28%;left:4%;width:14%;height:1px;background:#222238;top:38%;"></div>
        <div style="position:absolute;bottom:28%;left:4%;width:14%;height:1px;background:#222238;top:48%;"></div>
        <div style="position:absolute;bottom:28%;left:4%;width:14%;height:1px;background:#222238;top:58%;"></div>
        <!-- Filing cabinet handles -->
        <div style="position:absolute;top:40%;left:9%;width:3%;height:2px;background:#2a2a44;border-radius:1px;"></div>
        <div style="position:absolute;top:50%;left:9%;width:3%;height:2px;background:#2a2a44;border-radius:1px;"></div>
        <div style="position:absolute;top:60%;left:9%;width:3%;height:2px;background:#2a2a44;border-radius:1px;"></div>
        <!-- Center back wall — large data terminal -->
        <div style="position:absolute;top:15%;left:33%;width:34%;height:55%;background:#0a0a18;border:1px solid #202040;border-radius:2px;"></div>
        <!-- Terminal screen area (dark CRT look) -->
        <div style="position:absolute;top:18%;left:35%;width:30%;height:32%;background:#050510;border:1px solid #1a1a38;border-radius:1px;box-shadow:inset 0 0 20px rgba(40,60,200,0.08);"></div>
        <!-- Scanline overlay on screen -->
        <div style="position:absolute;top:18%;left:35%;width:30%;height:32%;background:repeating-linear-gradient(rgba(0,0,40,0.18),rgba(0,0,40,0.18) 2px,transparent 2px,transparent 4px);border-radius:1px;pointer-events:none;"></div>
        <!-- Terminal text lines (decorative) -->
        <div style="position:absolute;top:21%;left:37%;width:22%;height:2px;background:rgba(40,80,200,0.25);border-radius:1px;"></div>
        <div style="position:absolute;top:25%;left:37%;width:16%;height:2px;background:rgba(40,80,200,0.2);border-radius:1px;"></div>
        <div style="position:absolute;top:29%;left:37%;width:20%;height:2px;background:rgba(40,80,200,0.2);border-radius:1px;"></div>
        <div style="position:absolute;top:33%;left:37%;width:12%;height:2px;background:rgba(40,80,200,0.15);border-radius:1px;"></div>
        <!-- Terminal blinking cursor dot -->
        <div style="position:absolute;top:37%;left:37%;width:1%;height:2px;background:rgba(80,120,255,0.5);animation:blink 1s step-end infinite;"></div>
        <!-- Terminal base controls -->
        <div style="position:absolute;top:52%;left:36%;width:28%;height:14%;background:#0c0c20;border:1px solid #1a1a38;border-radius:1px;display:flex;align-items:center;justify-content:center;gap:8px;padding:4px;">
          <div style="width:10px;height:10px;border-radius:50%;background:#002200;border:1px solid rgba(0,180,60,0.5);box-shadow:0 0 6px rgba(0,180,60,0.4);"></div>
          <div style="width:10px;height:10px;border-radius:50%;background:#200000;border:1px solid rgba(180,40,0,0.4);"></div>
          <div style="width:10px;height:10px;border-radius:50%;background:#001a1a;border:1px solid rgba(0,160,180,0.4);box-shadow:0 0 5px rgba(0,160,180,0.3);"></div>
        </div>
        <!-- Right wall — server rack with blinking LEDs -->
        <div style="position:absolute;bottom:28%;right:4%;width:13%;height:40%;background:#0c0c1a;border:1px solid #1c1c30;border-radius:2px;"></div>
        <div style="position:absolute;bottom:28%;right:4%;width:13%;height:1px;background:#1e1e34;top:36%;"></div>
        <div style="position:absolute;bottom:28%;right:4%;width:13%;height:1px;background:#1e1e34;top:46%;"></div>
        <div style="position:absolute;bottom:28%;right:4%;width:13%;height:1px;background:#1e1e34;top:56%;"></div>
        <!-- Server rack LED indicators -->
        <div style="position:absolute;top:38%;right:5%;display:flex;gap:3px;">
          <div style="width:5px;height:5px;border-radius:50%;background:rgba(0,200,80,0.8);box-shadow:0 0 5px rgba(0,200,80,0.6);animation:blink 2.1s step-end infinite;"></div>
          <div style="width:5px;height:5px;border-radius:50%;background:rgba(0,200,80,0.8);box-shadow:0 0 5px rgba(0,200,80,0.6);animation:blink 1.7s step-end infinite;"></div>
        </div>
        <div style="position:absolute;top:48%;right:5%;display:flex;gap:3px;">
          <div style="width:5px;height:5px;border-radius:50%;background:rgba(0,200,80,0.8);box-shadow:0 0 5px rgba(0,200,80,0.6);animation:blink 3s step-end infinite;"></div>
          <div style="width:5px;height:5px;border-radius:50%;background:rgba(200,60,0,0.7);box-shadow:0 0 4px rgba(200,60,0,0.5);"></div>
        </div>
        <div style="position:absolute;top:58%;right:5%;display:flex;gap:3px;">
          <div style="width:5px;height:5px;border-radius:50%;background:rgba(0,200,80,0.8);box-shadow:0 0 5px rgba(0,200,80,0.6);animation:blink 2.5s step-end infinite;"></div>
          <div style="width:5px;height:5px;border-radius:50%;background:rgba(0,200,80,0.8);box-shadow:0 0 5px rgba(0,200,80,0.6);animation:blink 1.3s step-end infinite;"></div>
        </div>
        <!-- Vent grate top right -->
        <div style="position:absolute;top:6%;right:6%;width:8%;height:6%;background:#0c0c18;border:1px solid #1a1a2e;border-radius:2px;display:grid;grid-template-columns:repeat(4,1fr);gap:2px;padding:2px;">
          <div style="background:#151528;border-radius:1px;"></div><div style="background:#151528;border-radius:1px;"></div>
          <div style="background:#151528;border-radius:1px;"></div><div style="background:#151528;border-radius:1px;"></div>
          <div style="background:#151528;border-radius:1px;"></div><div style="background:#151528;border-radius:1px;"></div>
          <div style="background:#151528;border-radius:1px;"></div><div style="background:#151528;border-radius:1px;"></div>
        </div>
        <!-- Caution tape on floor (diagonal) -->
        <div style="position:absolute;bottom:18%;left:18%;width:6%;height:6px;background:repeating-linear-gradient(45deg,rgba(255,180,0,0.5),rgba(255,180,0,0.5) 4px,rgba(20,20,40,0.5) 4px,rgba(20,20,40,0.5) 8px);transform:rotate(-8deg);"></div>
      `,

      'bio-lab': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:28%;background:linear-gradient(to top,#061210,transparent);"></div>
        <!-- Cold fluorescent ceiling strip -->
        <div style="position:absolute;top:0;left:12%;width:50%;height:3px;background:linear-gradient(90deg,transparent,rgba(120,230,200,0.85),transparent);box-shadow:0 0 24px rgba(120,230,200,0.55),0 0 50px rgba(120,230,200,0.2);"></div>
        <!-- Light pool on bench -->
        <div style="position:absolute;bottom:26%;left:5%;width:60%;height:8%;background:radial-gradient(ellipse,rgba(100,220,180,0.07) 0%,transparent 70%);"></div>
        <!-- Lab bench surface -->
        <div style="position:absolute;bottom:22%;left:5%;right:5%;height:3%;background:linear-gradient(to bottom,#1a2e28,#122218);border-top:1px solid #2a4a38;"></div>
        <!-- Sample rack outlines on bench -->
        <div style="position:absolute;bottom:25%;left:20%;width:3%;height:10%;background:linear-gradient(to bottom,#142a22,#0e1e18);border:1px solid #1e3a2a;border-radius:1px;"></div>
        <div style="position:absolute;bottom:25%;left:25%;width:3%;height:7%;background:linear-gradient(to bottom,#142a22,#0e1e18);border:1px solid #1e3a2a;border-radius:1px;"></div>
        <div style="position:absolute;bottom:25%;left:30%;width:3%;height:9%;background:linear-gradient(to bottom,#142a22,#0e1e18);border:1px solid #1e3a2a;border-radius:1px;"></div>
        <!-- Centrifuge on bench -->
        <div style="position:absolute;bottom:25%;left:38%;width:7%;height:10%;background:#0e1e18;border:1px solid #1e3828;border-radius:50% 50% 2px 2px;"></div>
        <!-- Biohazard warning -->
        <div style="position:absolute;top:12%;left:50%;color:rgba(0,220,140,0.35);font-size:3vw;">☣</div>
        <!-- Wall panel seam lines -->
        <div style="position:absolute;top:10%;left:22%;width:1px;height:70%;background:linear-gradient(to bottom,transparent,rgba(0,180,100,0.08),transparent);"></div>
        <div style="position:absolute;top:10%;left:60%;width:1px;height:70%;background:linear-gradient(to bottom,transparent,rgba(0,180,100,0.08),transparent);"></div>
        <!-- Biohazard containment stripe on floor -->
        <div style="position:absolute;bottom:20%;left:0;right:0;height:4px;background:repeating-linear-gradient(90deg,rgba(255,180,0,0.18),rgba(255,180,0,0.18) 20px,transparent 20px,transparent 40px);"></div>
      `,

      'director-office': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:30%;background:linear-gradient(to top,#0e0a06,transparent);"></div>
        <!-- Warm overhead light (intact unlike other rooms) -->
        <div style="position:absolute;top:0;left:25%;width:40%;height:4px;background:linear-gradient(90deg,transparent,rgba(255,200,120,0.75),transparent);box-shadow:0 0 28px rgba(255,200,100,0.45),0 0 60px rgba(255,180,80,0.15);"></div>
        <!-- Warm floor glow -->
        <div style="position:absolute;bottom:20%;left:20%;width:50%;height:14%;background:radial-gradient(ellipse,rgba(255,180,80,0.06) 0%,transparent 70%);"></div>
        <!-- Carpet / rug suggestion -->
        <div style="position:absolute;bottom:22%;left:20%;right:20%;height:3%;background:linear-gradient(to right,transparent,rgba(80,50,20,0.18),transparent);border-top:1px solid rgba(80,50,20,0.15);"></div>
        <!-- Wall wood paneling lines -->
        <div style="position:absolute;top:8%;left:0;right:0;height:55%;border-bottom:1px solid rgba(80,60,30,0.25);"></div>
        <div style="position:absolute;top:8%;left:22%;width:1px;height:55%;background:linear-gradient(to bottom,transparent,rgba(100,70,30,0.18),transparent);"></div>
        <div style="position:absolute;top:8%;left:44%;width:1px;height:55%;background:linear-gradient(to bottom,transparent,rgba(100,70,30,0.18),transparent);"></div>
        <div style="position:absolute;top:8%;left:66%;width:1px;height:55%;background:linear-gradient(to bottom,transparent,rgba(100,70,30,0.18),transparent);"></div>
        <!-- Desk surface centre -->
        <div style="position:absolute;bottom:26%;left:24%;width:44%;height:4%;background:linear-gradient(to bottom,#2a1e0e,#1e160a);border-top:1px solid #3a2a14;"></div>
        <!-- Name placard on desk -->
        <div style="position:absolute;bottom:30%;left:38%;width:14%;height:3%;background:#1a120a;border:1px solid #3a2a18;border-radius:1px;display:flex;align-items:center;justify-content:center;color:rgba(200,160,80,0.5);font-family:monospace;font-size:0.55vw;letter-spacing:0.1em;">DIRECTOR</div>
      `,

      'security-hub': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:28%;background:linear-gradient(to top,#080c14,transparent);"></div>
        <!-- Blue-tinted tech lighting -->
        <div style="position:absolute;top:0;left:8%;width:45%;height:3px;background:linear-gradient(90deg,transparent,rgba(80,140,255,0.7),transparent);box-shadow:0 0 20px rgba(80,140,255,0.4),0 0 40px rgba(80,140,255,0.15);"></div>
        <!-- Emergency red light pulsing -->
        <div style="position:absolute;top:4%;right:12%;width:1.5%;height:2%;background:#600000;border:1px solid #aa0000;border-radius:2px;box-shadow:0 0 14px rgba(255,0,0,0.7);animation:alarm-flash 1.5s ease-in-out infinite;"></div>
        <!-- Monitor bank frame -->
        <div style="position:absolute;top:14%;left:18%;width:38%;height:30%;background:#0a0e16;border:2px solid #1a2030;border-radius:3px;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr);gap:3px;padding:4px;">
          ${[0,1,2,3,4,5].map(i => `<div style="background:#060a10;border:1px solid #141c28;border-radius:1px;display:flex;align-items:center;justify-content:center;color:rgba(60,80,120,0.6);font-size:0.5vw;font-family:monospace;">${i===3 ? 'NO SIG' : i===5 ? 'OFFLINE' : ''}</div>`).join('')}
        </div>
        <!-- Floor cable runs -->
        <div style="position:absolute;bottom:22%;left:0;right:0;height:2px;background:repeating-linear-gradient(90deg,rgba(60,80,140,0.4),rgba(60,80,140,0.4) 4px,transparent 4px,transparent 12px);"></div>
        <!-- Wall-mounted panel bracket (right side) -->
        <div style="position:absolute;top:12%;right:5%;width:18%;height:64%;background:#0a0e18;border:1px solid #1a2230;border-radius:2px;"></div>
        <div style="position:absolute;top:14%;right:6%;width:16%;height:1px;background:#1a2230;"></div>
        <div style="position:absolute;top:30%;right:6%;width:16%;height:1px;background:#1a2230;"></div>
        <div style="position:absolute;top:50%;right:6%;width:16%;height:1px;background:#1a2230;"></div>
      `,

      'utility-corridor': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:28%;background:linear-gradient(to top,#090806,transparent);"></div>
        <div style="position:absolute;top:0;left:0;width:8%;height:100%;background:linear-gradient(to right,rgba(0,0,0,0.75),transparent);"></div>
        <div style="position:absolute;top:0;right:0;width:8%;height:100%;background:linear-gradient(to left,rgba(0,0,0,0.75),transparent);"></div>
        <div style="position:absolute;top:0;left:30%;width:30%;height:3px;background:linear-gradient(90deg,transparent,rgba(200,160,80,0.35),transparent);box-shadow:0 0 16px rgba(180,140,60,0.3);"></div>
        <div style="position:absolute;top:18%;left:5%;width:12%;height:3%;background:linear-gradient(to bottom,#2a2018,#201810);border:1px solid #3a2e20;border-radius:2px;"></div>
        <div style="position:absolute;top:28%;left:5%;width:12%;height:2%;background:linear-gradient(to bottom,#202818,#182010);border:1px solid #283a20;border-radius:2px;"></div>
        <div style="position:absolute;top:40%;left:5%;width:12%;height:3%;background:linear-gradient(to bottom,#2a2018,#201810);border:1px solid #3a2e20;border-radius:2px;"></div>
        <div style="position:absolute;top:15%;right:4%;width:2%;height:55%;background:#1a1810;border:1px solid #2a2818;border-radius:1px;"></div>
        <div style="position:absolute;top:15%;right:7%;width:2%;height:55%;background:#1a1810;border:1px solid #282818;border-radius:1px;"></div>
        <div style="position:absolute;bottom:20%;left:0;right:0;height:5px;background:repeating-linear-gradient(90deg,rgba(255,160,0,0.22),rgba(255,160,0,0.22) 24px,transparent 24px,transparent 48px);"></div>
        <div style="position:absolute;top:25%;left:28%;width:22%;height:35%;background:radial-gradient(ellipse,rgba(60,30,10,0.6) 0%,transparent 70%);border-radius:50%;"></div>
      `,

      // ── Blackwood Psychiatric Institute rooms ─────────────────
      'bw-east-foyer': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:30%;background:linear-gradient(to top,#0e0804,transparent);"></div>
        <!-- Cracked tile floor lines -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:30%;background:repeating-linear-gradient(90deg,rgba(60,30,10,0.3),rgba(60,30,10,0.3) 1px,transparent 1px,transparent 12%),repeating-linear-gradient(rgba(60,30,10,0.2),rgba(60,30,10,0.2) 1px,transparent 1px,transparent 40px);"></div>
        <!-- Amber emergency light, ceiling left -->
        <div style="position:absolute;top:0;left:15%;width:25%;height:3px;background:linear-gradient(90deg,transparent,rgba(255,160,40,0.55),transparent);box-shadow:0 0 20px rgba(255,140,20,0.35),0 0 50px rgba(255,120,0,0.12);"></div>
        <!-- Amber light pool on floor -->
        <div style="position:absolute;bottom:20%;left:18%;width:24%;height:14%;background:radial-gradient(ellipse,rgba(255,140,20,0.08) 0%,transparent 70%);"></div>
        <!-- Reception desk outline -->
        <div style="position:absolute;bottom:28%;left:22%;width:26%;height:5%;background:linear-gradient(to bottom,#2a1c0c,#1e1408);border-top:1px solid #3a2810;"></div>
        <!-- Overturned chair -->
        <div style="position:absolute;bottom:28%;left:50%;width:5%;height:8%;background:#1c1208;border:1px solid #2e1c0a;transform:rotate(-30deg);border-radius:2px;"></div>
        <!-- Iron gate bars (decorative) -->
        <div style="position:absolute;top:10%;left:53%;width:2%;height:72%;background:repeating-linear-gradient(90deg,#2a1a0a,#2a1a0a 4px,transparent 4px,transparent 14px);"></div>
        <!-- Wall damage / staining -->
        <div style="position:absolute;top:20%;right:25%;width:8%;height:20%;background:radial-gradient(ellipse,rgba(80,40,10,0.3) 0%,transparent 70%);"></div>
        <!-- Facility sign (faded) -->
        <div style="position:absolute;top:8%;left:3%;width:10%;height:6%;background:#1a1208;border:1px solid #2a1a0c;border-radius:1px;display:flex;align-items:center;justify-content:center;color:rgba(180,130,60,0.35);font-family:monospace;font-size:0.55vw;letter-spacing:0.08em;text-align:center;">BLACKWOOD</div>
      `,

      'bw-patient-corridor': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:28%;background:linear-gradient(to top,#0c0804,transparent);"></div>
        <!-- Corridor perspective vignette -->
        <div style="position:absolute;top:0;left:0;width:6%;height:100%;background:linear-gradient(to right,rgba(0,0,0,0.7),transparent);"></div>
        <div style="position:absolute;top:0;right:0;width:6%;height:100%;background:linear-gradient(to left,rgba(0,0,0,0.7),transparent);"></div>
        <!-- Corridor depth gradient (far end darker) -->
        <div style="position:absolute;top:0;right:0;width:30%;height:100%;background:linear-gradient(to right,transparent,rgba(0,0,0,0.5));"></div>
        <!-- Flickering fluorescent tubes -->
        <div style="position:absolute;top:0;left:20%;width:18%;height:3px;background:linear-gradient(90deg,transparent,rgba(220,200,160,0.6),transparent);box-shadow:0 0 18px rgba(220,200,140,0.3);animation:blink 3.5s step-end infinite;"></div>
        <div style="position:absolute;top:0;left:50%;width:18%;height:3px;background:linear-gradient(90deg,transparent,rgba(220,200,160,0.4),transparent);box-shadow:0 0 14px rgba(220,200,140,0.2);"></div>
        <!-- Left wall door frames -->
        <div style="position:absolute;top:25%;left:12%;width:8%;height:48%;background:#1a100a;border:1px solid #2a1810;border-radius:2px 2px 0 0;"></div>
        <div style="position:absolute;top:27%;left:24%;width:7%;height:44%;background:#181008;border:1px solid #281608;border-radius:2px 2px 0 0;"></div>
        <!-- Floor tile cracks -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:30%;background:repeating-linear-gradient(90deg,rgba(50,30,10,0.25),rgba(50,30,10,0.25) 1px,transparent 1px,transparent 10%),repeating-linear-gradient(rgba(50,30,10,0.15),rgba(50,30,10,0.15) 1px,transparent 1px,transparent 36px);"></div>
        <!-- Number plaques on doors -->
        <div style="position:absolute;top:28%;left:14.5%;width:3%;height:3%;background:#120c06;border:1px solid #241808;display:flex;align-items:center;justify-content:center;color:rgba(180,140,60,0.5);font-family:monospace;font-size:0.6vw;">7</div>
        <div style="position:absolute;top:30%;left:26%;width:3%;height:3%;background:#120c06;border:1px solid #241808;display:flex;align-items:center;justify-content:center;color:rgba(180,140,60,0.4);font-family:monospace;font-size:0.6vw;">S</div>
        <!-- Ward B gate bars -->
        <div style="position:absolute;top:8%;left:40%;width:22%;height:80%;background:repeating-linear-gradient(90deg,rgba(60,30,10,0.8),rgba(60,30,10,0.8) 3px,transparent 3px,transparent 12px);border:1px solid #3a1e0c;"></div>
      `,

      'bw-patient-room-7': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:30%;background:linear-gradient(to top,#0e0806,transparent);"></div>
        <!-- Side vignettes — oppressive feel -->
        <div style="position:absolute;top:0;left:0;width:12%;height:100%;background:linear-gradient(to right,rgba(0,0,0,0.8),transparent);"></div>
        <div style="position:absolute;top:0;right:0;width:12%;height:100%;background:linear-gradient(to left,rgba(0,0,0,0.8),transparent);"></div>
        <!-- Painted-over window (right wall) -->
        <div style="position:absolute;top:10%;left:52%;width:20%;height:32%;background:#141008;border:3px solid #2a1c08;"></div>
        <!-- Window bars -->
        <div style="position:absolute;top:10%;left:55%;width:1%;height:32%;background:#2a1c08;"></div>
        <div style="position:absolute;top:10%;left:61%;width:1%;height:32%;background:#2a1c08;"></div>
        <div style="position:absolute;top:10%;left:67%;width:1%;height:32%;background:#2a1c08;"></div>
        <!-- Iron bed frame outline -->
        <div style="position:absolute;bottom:28%;left:12%;width:35%;height:25%;background:#180e08;border:1px solid #2a1808;border-radius:2px;"></div>
        <!-- Wall text texture (many scratches) -->
        <div style="position:absolute;top:12%;left:12%;width:35%;height:55%;background:repeating-linear-gradient(12deg,rgba(60,30,10,0.12),rgba(60,30,10,0.12) 1px,transparent 1px,transparent 6px),repeating-linear-gradient(-8deg,rgba(60,30,10,0.1),rgba(60,30,10,0.1) 1px,transparent 1px,transparent 9px);"></div>
        <!-- Room number plate -->
        <div style="position:absolute;top:8%;left:80%;width:8%;height:8%;background:#1a1008;border:1px solid #2e1c0c;border-radius:1px;display:flex;align-items:center;justify-content:center;color:rgba(200,150,60,0.6);font-family:monospace;font-size:1.4vw;font-weight:bold;">7</div>
        <!-- Dim ceiling bulb -->
        <div style="position:absolute;top:2%;left:47%;width:3%;height:4%;background:radial-gradient(ellipse,rgba(255,200,100,0.2) 0%,transparent 70%);"></div>
      `,

      'bw-nurses-station': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:28%;background:linear-gradient(to top,#0e0a06,transparent);"></div>
        <!-- Long medical counter -->
        <div style="position:absolute;bottom:25%;left:8%;right:15%;height:4%;background:linear-gradient(to bottom,#2a1e10,#1e1608);border-top:1px solid #3a2818;"></div>
        <!-- Medicine cabinet bank (left wall) -->
        <div style="position:absolute;top:18%;left:12%;width:18%;height:52%;background:#1a1208;border:1px solid #2e1c0c;border-radius:2px;"></div>
        <div style="position:absolute;top:18%;left:12%;width:18%;height:1px;background:#2e1c0c;top:32%;"></div>
        <div style="position:absolute;top:18%;left:12%;width:18%;height:1px;background:#2e1c0c;top:46%;"></div>
        <div style="position:absolute;top:18%;left:12%;width:18%;height:1px;background:#2e1c0c;top:58%;"></div>
        <!-- Cabinet handles -->
        <div style="position:absolute;top:26%;left:18%;width:5%;height:2px;background:#3a2a18;border-radius:1px;"></div>
        <div style="position:absolute;top:40%;left:18%;width:5%;height:2px;background:#3a2a18;border-radius:1px;"></div>
        <div style="position:absolute;top:53%;left:18%;width:5%;height:2px;background:#3a2a18;border-radius:1px;"></div>
        <!-- Old terminal (right side) -->
        <div style="position:absolute;top:22%;left:52%;width:22%;height:32%;background:#120e08;border:1px solid #241a0c;border-radius:2px;"></div>
        <div style="position:absolute;top:24%;left:54%;width:18%;height:18%;background:#0c0906;border:1px solid #1c1408;border-radius:1px;display:flex;align-items:center;justify-content:center;color:rgba(255,160,40,0.4);font-family:monospace;font-size:0.5vw;">BLACKWOOD MED SYS</div>
        <!-- Amber monitor glow -->
        <div style="position:absolute;top:24%;left:54%;width:18%;height:18%;background:radial-gradient(ellipse,rgba(255,140,20,0.06) 0%,transparent 80%);"></div>
        <!-- Patient chart clipboard on counter -->
        <div style="position:absolute;bottom:29%;left:32%;width:9%;height:14%;background:#1e1408;border:1px solid #2e1c0c;border-radius:1px;"></div>
        <!-- Ceiling light (amber) -->
        <div style="position:absolute;top:0;left:25%;width:35%;height:3px;background:linear-gradient(90deg,transparent,rgba(255,160,40,0.45),transparent);box-shadow:0 0 22px rgba(255,140,20,0.3),0 0 50px rgba(255,120,0,0.1);"></div>
      `,

      'bw-treatment-room': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:30%;background:linear-gradient(to top,#0e0606,transparent);"></div>
        <!-- Reddish emergency tint -->
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,rgba(100,10,10,0.1) 0%,transparent 70%);pointer-events:none;"></div>
        <!-- Treatment table -->
        <div style="position:absolute;bottom:28%;left:18%;width:32%;height:6%;background:linear-gradient(to bottom,#2e1c1c,#201010);border-top:1px solid #4a2020;border-radius:2px;"></div>
        <!-- Table legs -->
        <div style="position:absolute;bottom:22%;left:20%;width:2%;height:7%;background:#1a0c0c;border:1px solid #2a1010;"></div>
        <div style="position:absolute;bottom:22%;left:46%;width:2%;height:7%;background:#1a0c0c;border:1px solid #2a1010;"></div>
        <!-- Restraint straps (horizontal) -->
        <div style="position:absolute;bottom:34%;left:22%;width:9%;height:1px;background:rgba(80,40,20,0.6);"></div>
        <div style="position:absolute;bottom:34%;left:36%;width:9%;height:1px;background:rgba(80,40,20,0.6);"></div>
        <!-- Fuse panel (right wall) -->
        <div style="position:absolute;top:20%;left:50%;width:22%;height:44%;background:#1a0e0e;border:1px solid #3a1010;border-radius:2px;"></div>
        <div style="position:absolute;top:25%;left:52%;width:18%;height:1px;background:#3a1010;"></div>
        <div style="position:absolute;top:35%;left:52%;width:18%;height:1px;background:#3a1010;"></div>
        <div style="position:absolute;top:45%;left:52%;width:18%;height:1px;background:#3a1010;"></div>
        <!-- Dangling wires from panel -->
        <div style="position:absolute;top:53%;left:54%;width:1%;height:8%;background:rgba(255,80,0,0.5);border-radius:1px;transform:rotate(5deg);"></div>
        <div style="position:absolute;top:53%;left:58%;width:1%;height:10%;background:rgba(0,100,200,0.5);border-radius:1px;transform:rotate(-8deg);"></div>
        <div style="position:absolute;top:53%;left:62%;width:1%;height:7%;background:rgba(0,180,60,0.5);border-radius:1px;transform:rotate(3deg);"></div>
        <!-- Dim red overhead fixture -->
        <div style="position:absolute;top:0;left:30%;width:22%;height:3px;background:linear-gradient(90deg,transparent,rgba(200,40,40,0.4),transparent);box-shadow:0 0 16px rgba(200,30,30,0.3);animation:blink 4s step-end infinite;"></div>
        <!-- Vault door outline (right) -->
        <div style="position:absolute;top:14%;left:78%;width:16%;height:70%;background:#140808;border:2px solid #2a1010;border-radius:2px;"></div>
        <div style="position:absolute;top:42%;left:79%;width:4%;height:5%;background:#1c0c0c;border:1px solid #3a1010;border-radius:50%;"></div>
      `,

      'bw-records-vault': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:28%;background:linear-gradient(to top,#0c0a06,transparent);"></div>
        <!-- Side vignettes — enclosed feeling -->
        <div style="position:absolute;top:0;left:0;width:8%;height:100%;background:linear-gradient(to right,rgba(0,0,0,0.65),transparent);"></div>
        <div style="position:absolute;top:0;right:0;width:8%;height:100%;background:linear-gradient(to left,rgba(0,0,0,0.65),transparent);"></div>
        <!-- Bare bulb ceiling fixture -->
        <div style="position:absolute;top:0;left:47%;width:4%;height:8%;background:linear-gradient(to bottom,#1a1408,transparent);border-left:1px solid #2a1e0c;border-right:1px solid #2a1e0c;"></div>
        <div style="position:absolute;top:7%;left:47.5%;width:3%;height:3%;background:radial-gradient(circle,rgba(255,200,100,0.35) 0%,transparent 70%);border-radius:50%;box-shadow:0 0 20px rgba(255,180,60,0.2);"></div>
        <!-- Filing cabinets — left bank -->
        <div style="position:absolute;top:15%;left:8%;width:14%;height:60%;background:#1a1208;border:1px solid #2e1c0c;"></div>
        <div style="position:absolute;top:15%;left:8%;width:14%;height:1px;background:#2e1c0c;top:28%;"></div>
        <div style="position:absolute;top:15%;left:8%;width:14%;height:1px;background:#2e1c0c;top:42%;"></div>
        <div style="position:absolute;top:15%;left:8%;width:14%;height:1px;background:#2e1c0c;top:56%;"></div>
        <!-- Drawer handles -->
        <div style="position:absolute;top:22%;left:12%;width:5%;height:2px;background:#3a2a18;"></div>
        <div style="position:absolute;top:36%;left:12%;width:5%;height:2px;background:#3a2a18;"></div>
        <div style="position:absolute;top:50%;left:12%;width:5%;height:2px;background:#3a2a18;"></div>
        <!-- Second cabinet bank -->
        <div style="position:absolute;top:15%;left:28%;width:12%;height:60%;background:#181008;border:1px solid #281808;"></div>
        <div style="position:absolute;top:28%;left:28%;width:12%;height:1px;background:#281808;"></div>
        <div style="position:absolute;top:42%;left:28%;width:12%;height:1px;background:#281808;"></div>
        <!-- Symbol cipher cabinet (centre-right, distinctive) -->
        <div style="position:absolute;top:13%;left:53%;width:22%;height:64%;background:#1c1208;border:2px solid #3a2010;border-radius:2px;"></div>
        <!-- Four symbol dials on the cabinet -->
        <div style="position:absolute;top:32%;left:55%;width:4%;height:5%;background:#120e06;border:1px solid #2e1c08;border-radius:50%;display:flex;align-items:center;justify-content:center;color:rgba(200,150,60,0.6);font-size:0.8vw;">✝</div>
        <div style="position:absolute;top:32%;left:61%;width:4%;height:5%;background:#120e06;border:1px solid #2e1c08;border-radius:50%;display:flex;align-items:center;justify-content:center;color:rgba(200,150,60,0.5);font-size:0.8vw;">☽</div>
        <div style="position:absolute;top:32%;left:67%;width:4%;height:5%;background:#120e06;border:1px solid #2e1c08;border-radius:50%;display:flex;align-items:center;justify-content:center;color:rgba(200,150,60,0.5);font-size:0.8vw;">★</div>
        <div style="position:absolute;top:32%;left:73%;width:4%;height:5%;background:#120e06;border:1px solid #2e1c08;border-radius:50%;display:flex;align-items:center;justify-content:center;color:rgba(200,150,60,0.4);font-size:0.8vw;">◉</div>
        <!-- Key cage on cabinet handle -->
        <div style="position:absolute;top:55%;left:62%;width:4%;height:5%;background:#0e0a06;border:1px solid rgba(200,150,60,0.3);border-radius:1px;display:flex;align-items:center;justify-content:center;color:rgba(200,150,60,0.4);font-size:0.7vw;">🔑</div>
        <!-- Dust motes (visual texture) -->
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,rgba(80,50,20,0.06) 0%,transparent 60%);pointer-events:none;"></div>
      `,

      'bw-directors-office': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:30%;background:linear-gradient(to top,#100a04,transparent);"></div>
        <!-- Warmer ceiling light — office is maintained -->
        <div style="position:absolute;top:0;left:20%;width:45%;height:4px;background:linear-gradient(90deg,transparent,rgba(255,190,100,0.65),transparent);box-shadow:0 0 28px rgba(255,170,80,0.4),0 0 60px rgba(255,150,60,0.12);"></div>
        <!-- Warm floor glow -->
        <div style="position:absolute;bottom:20%;left:18%;width:55%;height:14%;background:radial-gradient(ellipse,rgba(255,160,60,0.06) 0%,transparent 70%);"></div>
        <!-- Wood panel wall lines (warmth) -->
        <div style="position:absolute;top:8%;left:0;right:0;height:60%;border-bottom:1px solid rgba(100,70,30,0.2);"></div>
        <div style="position:absolute;top:8%;left:18%;width:1px;height:60%;background:linear-gradient(to bottom,transparent,rgba(120,80,30,0.15),transparent);"></div>
        <div style="position:absolute;top:8%;left:40%;width:1px;height:60%;background:linear-gradient(to bottom,transparent,rgba(120,80,30,0.15),transparent);"></div>
        <div style="position:absolute;top:8%;left:62%;width:1px;height:60%;background:linear-gradient(to bottom,transparent,rgba(120,80,30,0.15),transparent);"></div>
        <!-- Portrait frame above safe -->
        <div style="position:absolute;top:8%;left:52%;width:20%;height:12%;background:#1c1408;border:2px solid #3a2810;"></div>
        <!-- Safe recessed behind portrait (subtle) -->
        <div style="position:absolute;top:9%;left:53.5%;width:17%;height:10%;background:#140e06;border:1px solid #2e2010;"></div>
        <!-- Keypad dots on safe -->
        <div style="position:absolute;top:11%;left:58%;display:grid;grid-template-columns:repeat(3,1fr);gap:2px;width:5%;height:5%;">
          ${[...Array(9)].map(() => `<div style="background:#0e0a04;border:1px solid #2a1e08;border-radius:1px;"></div>`).join('')}
        </div>
        <!-- Heavy desk centre -->
        <div style="position:absolute;bottom:25%;left:18%;width:46%;height:5%;background:linear-gradient(to bottom,#2e1e0c,#201408);border-top:2px solid #3e2a14;"></div>
        <!-- Director nameplate -->
        <div style="position:absolute;bottom:30%;left:28%;width:18%;height:4%;background:#1a1008;border:1px solid #3a2010;border-radius:1px;display:flex;align-items:center;justify-content:center;color:rgba(220,170,80,0.45);font-family:monospace;font-size:0.5vw;letter-spacing:0.12em;">DR. E. HARLAN</div>
        <!-- Bookshelves (left) -->
        <div style="position:absolute;top:10%;left:2%;width:14%;height:58%;background:#180e06;border:1px solid #2a1808;border-radius:1px;"></div>
        <div style="position:absolute;top:20%;left:2%;width:14%;height:1px;background:#2a1808;"></div>
        <div style="position:absolute;top:35%;left:2%;width:14%;height:1px;background:#2a1808;"></div>
        <div style="position:absolute;top:50%;left:2%;width:14%;height:1px;background:#2a1808;"></div>
      `,

      'bw-chapel': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:30%;background:linear-gradient(to top,#08060e,transparent);"></div>
        <!-- Gothic purple-dark ceiling -->
        <div style="position:absolute;top:0;left:0;right:0;height:12%;background:linear-gradient(to bottom,rgba(20,10,30,0.7),transparent);"></div>
        <!-- Stained glass window (centre-top, dark) -->
        <div style="position:absolute;top:6%;left:34%;width:24%;height:30%;background:#0e0a14;border:2px solid #2a1830;border-radius:2px 2px 50% 50%;"></div>
        <!-- Dark glass pane colours -->
        <div style="position:absolute;top:8%;left:36%;width:6%;height:12%;background:rgba(50,20,60,0.5);border-radius:1px;"></div>
        <div style="position:absolute;top:8%;left:43%;width:8%;height:14%;background:rgba(40,30,60,0.4);border-radius:1px;"></div>
        <div style="position:absolute;top:8%;left:52%;width:5%;height:11%;background:rgba(30,20,50,0.5);border-radius:1px;"></div>
        <!-- Pews (left and right) -->
        <div style="position:absolute;bottom:28%;left:5%;width:28%;height:3%;background:linear-gradient(to bottom,#1a1008,#120c06);border-top:1px solid #2e1c0c;"></div>
        <div style="position:absolute;bottom:38%;left:5%;width:28%;height:3%;background:linear-gradient(to bottom,#1a1008,#120c06);border-top:1px solid #2e1c0c;"></div>
        <div style="position:absolute;bottom:48%;left:5%;width:28%;height:3%;background:linear-gradient(to bottom,#1a1008,#120c06);border-top:1px solid #2e1c0c;"></div>
        <!-- Stone altar (centre) -->
        <div style="position:absolute;bottom:28%;left:36%;width:22%;height:8%;background:linear-gradient(to bottom,#282028,#1c1820);border-top:2px solid #3a2838;"></div>
        <!-- Altar candle (burnt out) -->
        <div style="position:absolute;bottom:36%;left:45%;width:1.5%;height:4%;background:#2a1818;border-radius:1px;"></div>
        <!-- Bell mechanism (right) -->
        <div style="position:absolute;top:15%;right:8%;width:14%;height:55%;background:#1a1008;border:1px solid #2e1c0c;border-radius:2px;"></div>
        <div style="position:absolute;top:20%;right:9%;width:12%;height:1px;background:#2e1c0c;"></div>
        <div style="position:absolute;top:30%;right:9%;width:12%;height:1px;background:#2e1c0c;"></div>
        <div style="position:absolute;top:40%;right:9%;width:12%;height:1px;background:#2e1c0c;"></div>
        <!-- Bell handle indicators -->
        ${[0,1,2,3].map(i => `<div style="position:absolute;top:${50+i*5}%;right:${10+i*3}%;width:1%;height:6%;background:#3a2010;border-radius:1px;transform:rotate(${i%2===0?5:-5}deg);"></div>`).join('')}
        <!-- Maintenance door (far right) -->
        <div style="position:absolute;top:22%;right:1%;width:12%;height:62%;background:#140e08;border:1px solid #2a1808;border-radius:2px;"></div>
        <div style="position:absolute;top:50%;right:3%;width:2%;height:3%;background:#1e1208;border:1px solid #3a2010;border-radius:50%;"></div>
        <!-- Faint purple ambient -->
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 47% 20%,rgba(60,30,80,0.08) 0%,transparent 55%);pointer-events:none;"></div>
      `,

      'bw-solitary-cell': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:30%;background:linear-gradient(to top,#040404,transparent);"></div>
        <!-- Heavy corner vignettes — claustrophobic -->
        <div style="position:absolute;top:0;left:0;width:20%;height:100%;background:linear-gradient(to right,rgba(0,0,0,0.85),transparent);"></div>
        <div style="position:absolute;top:0;right:0;width:20%;height:100%;background:linear-gradient(to left,rgba(0,0,0,0.85),transparent);"></div>
        <div style="position:absolute;top:0;left:0;right:0;height:20%;background:linear-gradient(to bottom,rgba(0,0,0,0.7),transparent);"></div>
        <!-- Caged ceiling light bulb -->
        <div style="position:absolute;top:4%;left:45%;width:8%;height:10%;background:#0e0808;border:1px solid #1e1010;border-radius:2px;display:flex;align-items:center;justify-content:center;">
          <div style="width:30%;height:40%;background:rgba(255,140,40,0.15);border-radius:50%;box-shadow:0 0 12px rgba(255,120,20,0.1);"></div>
        </div>
        <!-- Padded wall texture (mouldering foam) -->
        <div style="position:absolute;top:15%;left:18%;right:18%;height:60%;background:repeating-linear-gradient(0deg,rgba(30,20,10,0.3),rgba(30,20,10,0.3) 1px,transparent 1px,transparent 12%),repeating-linear-gradient(90deg,rgba(30,20,10,0.25),rgba(30,20,10,0.25) 1px,transparent 1px,transparent 18%);border:1px solid #1e1208;"></div>
        <!-- Peeling pad edges -->
        <div style="position:absolute;top:22%;left:22%;width:6%;height:8%;background:#18100a;transform:rotate(-4deg);border:1px solid #281808;"></div>
        <div style="position:absolute;top:40%;right:22%;width:5%;height:10%;background:#140e08;transform:rotate(6deg);border:1px solid #221408;"></div>
        <!-- Floor drain -->
        <div style="position:absolute;bottom:20%;left:44%;width:8%;height:6%;background:#0a0808;border:1px solid #201010;border-radius:50%;"></div>
        <div style="position:absolute;bottom:21%;left:46%;width:4%;height:3%;background:repeating-linear-gradient(90deg,#180e0e,#180e0e 1px,transparent 1px,transparent 4px);"></div>
        <!-- Ceiling hook -->
        <div style="position:absolute;top:14%;left:47%;width:4%;height:6%;background:linear-gradient(to bottom,#1e1010,transparent);border-radius:0 0 50% 50%;border:1px solid #2a1010;"></div>
      `,

      'bw-maintenance-tunnel': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:28%;background:linear-gradient(to top,#0a0804,transparent);"></div>
        <!-- Tunnel vignette sides -->
        <div style="position:absolute;top:0;left:0;width:10%;height:100%;background:linear-gradient(to right,rgba(0,0,0,0.8),transparent);"></div>
        <!-- Light at end of tunnel (right) -->
        <div style="position:absolute;top:0;right:0;width:35%;height:100%;background:linear-gradient(to right,transparent,rgba(180,180,140,0.12));"></div>
        <div style="position:absolute;top:15%;right:0;width:30%;height:70%;background:radial-gradient(ellipse at 100% 50%,rgba(200,200,160,0.15) 0%,transparent 70%);"></div>
        <!-- Stone/brick wall texture left -->
        <div style="position:absolute;top:10%;left:8%;right:60%;height:80%;background:repeating-linear-gradient(rgba(50,35,20,0.3),rgba(50,35,20,0.3) 1px,transparent 1px,transparent 14px),repeating-linear-gradient(90deg,rgba(50,35,20,0.2),rgba(50,35,20,0.2) 1px,transparent 1px,transparent 22px);border:1px solid #2e1e0c;"></div>
        <!-- Ceiling pipes -->
        <div style="position:absolute;top:6%;left:8%;width:55%;height:3%;background:linear-gradient(to bottom,#2a1e10,#1e1408);border-radius:2px;border:1px solid #3a2818;"></div>
        <div style="position:absolute;top:12%;left:8%;width:50%;height:2%;background:linear-gradient(to bottom,#1e1610,#18120c);border-radius:2px;border:1px solid #2e2010;"></div>
        <!-- Cloth-wrapped pipe section -->
        <div style="position:absolute;top:6%;left:30%;width:12%;height:3%;background:repeating-linear-gradient(90deg,rgba(60,40,20,0.7),rgba(60,40,20,0.7) 3px,rgba(40,28,14,0.7) 3px,rgba(40,28,14,0.7) 6px);border-radius:2px;"></div>
        <!-- Wall text scratching (subtle) -->
        <div style="position:absolute;top:40%;left:10%;width:14%;height:14%;background:repeating-linear-gradient(15deg,rgba(60,30,10,0.2),rgba(60,30,10,0.2) 1px,transparent 1px,transparent 4px);border-radius:1px;"></div>
        <!-- Arrow carved into wall -->
        <div style="position:absolute;top:48%;left:12%;color:rgba(180,120,40,0.35);font-size:1.5vw;font-family:monospace;">→</div>
      `,

      // ── Meridian Station Alpha ────────────────────────────────
      'ms-airlock-bay': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:26%;background:linear-gradient(to top,#010508,transparent);"></div>
        <!-- Emergency blue strip lights ceiling -->
        <div style="position:absolute;top:0;left:5%;width:35%;height:3px;background:linear-gradient(90deg,transparent,rgba(0,120,200,0.8),transparent);box-shadow:0 0 16px rgba(0,120,200,0.5),0 0 32px rgba(0,120,200,0.2);"></div>
        <div style="position:absolute;top:0;right:5%;width:28%;height:3px;background:linear-gradient(90deg,transparent,rgba(0,120,200,0.7),transparent);box-shadow:0 0 12px rgba(0,120,200,0.4),0 0 24px rgba(0,120,200,0.15);"></div>
        <!-- Outer airlock hatch (left) -->
        <div style="position:absolute;top:20%;left:2%;width:7%;height:60%;background:linear-gradient(to right,#0a1828,#060e18);border:2px solid #1a3450;border-radius:3px;display:flex;align-items:center;justify-content:center;">
          <div style="width:60%;height:60%;border:2px solid #2a4060;border-radius:50%;display:flex;align-items:center;justify-content:center;">
            <div style="width:40%;height:40%;background:#0e2030;border:1px solid #2a3a50;border-radius:50%;"></div>
          </div>
        </div>
        <!-- Inner door (right) -->
        <div style="position:absolute;top:12%;right:0;width:16%;height:72%;background:linear-gradient(to right,#060e18,#0a1828);border-left:2px solid #1a3450;border-top:2px solid #1a3450;border-bottom:2px solid #1a3450;border-radius:3px 0 0 3px;"></div>
        <!-- Pressure warning lights -->
        <div style="position:absolute;top:10%;left:20%;width:1%;height:1%;background:#ff4444;border-radius:50%;box-shadow:0 0 8px rgba(255,68,68,0.9),0 0 16px rgba(255,68,68,0.4);animation:alarm-flash 1.5s ease-in-out infinite;"></div>
        <div style="position:absolute;top:12%;left:22%;width:1%;height:1%;background:#ff8800;border-radius:50%;box-shadow:0 0 6px rgba(255,136,0,0.8);animation:alarm-flash 2s ease-in-out infinite;animation-delay:0.5s;"></div>
        <!-- Floor grid pattern -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:22%;background:repeating-linear-gradient(90deg,rgba(0,60,100,0.15),rgba(0,60,100,0.15) 1px,transparent 1px,transparent 8%);"></div>
        <!-- Wall panel conduits -->
        <div style="position:absolute;top:15%;left:30%;width:2%;height:45%;background:linear-gradient(to bottom,#0e2030,#0a1828);border-left:1px solid #1a3450;border-right:1px solid #1a3450;"></div>
      `,

      'ms-corridor-a': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:25%;background:linear-gradient(to top,#020810,transparent);"></div>
        <!-- Corridor perspective -->
        <div style="position:absolute;top:30%;left:40%;right:40%;bottom:25%;background:linear-gradient(to bottom,#030c18,#020810);border-left:1px solid #0e2030;border-right:1px solid #0e2030;"></div>
        <!-- Overhead strip lights -->
        <div style="position:absolute;top:0;left:12%;width:28%;height:3px;background:rgba(0,140,220,0.7);box-shadow:0 0 18px rgba(0,140,220,0.5),0 0 36px rgba(0,140,220,0.2);"></div>
        <div style="position:absolute;top:0;right:12%;width:22%;height:3px;background:rgba(0,140,220,0.6);box-shadow:0 0 14px rgba(0,140,220,0.4),0 0 28px rgba(0,140,220,0.15);"></div>
        <!-- Door frames left side -->
        <div style="position:absolute;top:18%;left:12%;width:12%;height:56%;background:#060e18;border:1px solid #0e2030;border-radius:2px;"></div>
        <div style="position:absolute;top:20%;left:28%;width:10%;height:54%;background:#060e18;border:1px solid #0e2030;border-radius:2px;"></div>
        <!-- Engineering hatch in floor -->
        <div style="position:absolute;bottom:22%;left:48%;width:18%;height:12%;background:#060c14;border:2px solid #0e2030;border-radius:3px;display:flex;align-items:center;justify-content:center;">
          <div style="color:rgba(0,120,200,0.35);font-family:monospace;font-size:0.6vw;letter-spacing:0.1em;">ENGINEERING ↓</div>
        </div>
        <!-- Command blast door right -->
        <div style="position:absolute;top:15%;right:0;width:14%;height:60%;background:linear-gradient(to right,#060e18,#0a1828);border-left:2px solid #0e2030;border-top:1px solid #0e2030;border-bottom:1px solid #0e2030;border-radius:3px 0 0 3px;"></div>
        <!-- Emergency indicator -->
        <div class="led-blink" style="position:absolute;top:8%;left:42%;width:1%;height:1.5%;background:#ff4040;border-radius:50%;box-shadow:0 0 10px rgba(255,64,64,0.7);"></div>
      `,

      'ms-crew-quarters': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:24%;background:linear-gradient(to top,#030a10,transparent);"></div>
        <!-- Ceiling light - softer in crew quarters -->
        <div style="position:absolute;top:0;left:25%;width:50%;height:2px;background:rgba(0,120,180,0.5);box-shadow:0 0 20px rgba(0,120,180,0.3),0 0 40px rgba(0,120,180,0.1);"></div>
        <!-- Bunk bed frames -->
        <div style="position:absolute;top:18%;left:14%;width:22%;height:22%;background:linear-gradient(to bottom,#0a1620,#060e18);border:1px solid #0e2030;border-radius:2px;"></div>
        <div style="position:absolute;top:42%;left:14%;width:22%;height:22%;background:linear-gradient(to bottom,#0a1620,#060e18);border:1px solid #0e2030;border-radius:2px;"></div>
        <div style="position:absolute;top:18%;left:38%;width:22%;height:22%;background:#060e18;border:1px solid #0e2030;border-radius:2px;"></div>
        <div style="position:absolute;top:42%;left:38%;width:22%;height:22%;background:#060e18;border:1px solid #0e2030;border-radius:2px;"></div>
        <!-- Personal items on bunk -->
        <div style="position:absolute;top:22%;left:20%;width:6%;height:8%;background:#0e1e30;border:1px solid #1a3040;border-radius:1px;display:flex;align-items:center;justify-content:center;color:rgba(0,160,220,0.4);font-size:0.8vw;">📱</div>
        <!-- Locker unit right -->
        <div style="position:absolute;top:20%;right:0;width:20%;height:62%;background:linear-gradient(to right,#060e18,#0a1828);border-left:2px solid #0e2030;border-radius:3px 0 0 3px;">
          <div style="position:absolute;top:30%;left:35%;width:12%;height:18%;background:#0a1828;border:1px solid #142840;border-radius:50%;"></div>
        </div>
      `,

      'ms-med-bay': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:25%;background:linear-gradient(to top,#030c14,transparent);"></div>
        <!-- Med bay has cleaner, brighter lighting -->
        <div style="position:absolute;top:0;left:8%;width:80%;height:3px;background:rgba(0,160,240,0.65);box-shadow:0 0 24px rgba(0,160,240,0.45),0 0 48px rgba(0,160,240,0.15);"></div>
        <!-- Light pools on floor -->
        <div style="position:absolute;bottom:25%;left:20%;width:60%;height:10%;background:radial-gradient(ellipse,rgba(0,140,200,0.08) 0%,transparent 70%);"></div>
        <!-- Medical counter -->
        <div style="position:absolute;bottom:22%;left:5%;right:5%;height:4%;background:linear-gradient(to bottom,#0e2030,#0a1828);border-top:1px solid #1a3a50;"></div>
        <!-- Terminal on counter -->
        <div style="position:absolute;bottom:26%;left:50%;width:22%;height:40%;background:#080e18;border:1px solid #102030;border-radius:3px;display:flex;align-items:center;justify-content:center;">
          <div style="width:80%;height:65%;background:#040c14;border:1px solid #0e2030;border-radius:2px;display:flex;align-items:center;justify-content:center;color:rgba(0,140,200,0.5);font-family:monospace;font-size:0.9vw;">MERIDIAN</div>
        </div>
        <!-- Med cabinet left -->
        <div style="position:absolute;top:22%;left:10%;width:18%;height:54%;background:#060e18;border:1px solid #0e2030;border-radius:2px;position:relative;">
          <div style="position:absolute;top:50%;right:8%;width:6%;height:8%;background:#0e2030;border:1px solid #1a3040;border-radius:50%;transform:translateY(-50%);"></div>
        </div>
        <!-- Medical cross symbol -->
        <div style="position:absolute;top:8%;left:42%;width:12%;height:18%;display:flex;align-items:center;justify-content:center;color:rgba(0,140,200,0.25);font-size:2vw;">✚</div>
      `,

      'ms-engineering': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:26%;background:linear-gradient(to top,#050604,transparent);"></div>
        <!-- Warm industrial lighting — less blue here -->
        <div style="position:absolute;top:0;left:15%;width:40%;height:2px;background:rgba(180,160,80,0.5);box-shadow:0 0 16px rgba(180,160,80,0.3);"></div>
        <!-- Conduit bundles ceiling -->
        <div style="position:absolute;top:4%;left:8%;width:65%;height:2%;background:repeating-linear-gradient(90deg,rgba(80,100,40,0.7),rgba(80,100,40,0.7) 3px,rgba(60,70,30,0.7) 3px,rgba(60,70,30,0.7) 8px);border-radius:2px;"></div>
        <!-- Open junction panel (centre) -->
        <div style="position:absolute;top:20%;left:38%;width:24%;height:50%;background:#050808;border:2px solid #1a2010;border-radius:3px;">
          <div style="position:absolute;top:10%;left:15%;right:15%;height:80%;display:flex;flex-direction:column;justify-content:space-around;">
            <div style="height:2px;background:rgba(255,80,40,0.7);box-shadow:0 0 4px rgba(255,80,40,0.5);"></div>
            <div style="height:2px;background:rgba(40,100,255,0.6);box-shadow:0 0 4px rgba(40,100,255,0.4);"></div>
            <div style="height:2px;background:rgba(40,200,80,0.6);box-shadow:0 0 4px rgba(40,200,80,0.4);"></div>
            <div style="height:2px;background:rgba(255,200,40,0.5);box-shadow:0 0 4px rgba(255,200,40,0.3);"></div>
          </div>
        </div>
        <!-- Equipment console left -->
        <div style="position:absolute;top:25%;left:8%;width:20%;height:50%;background:#060a06;border:1px solid #141c10;border-radius:2px;"></div>
        <!-- Cargo hatch right -->
        <div style="position:absolute;top:28%;right:0;width:14%;height:56%;background:#070a06;border-left:2px solid #141c0e;border-radius:3px 0 0 3px;"></div>
        <!-- Lower corridor hatch — faint opening -->
        <div style="position:absolute;top:14%;right:14%;width:12%;height:56%;background:#050808;border-left:1px solid #0e1810;border-radius:2px 0 0 2px;"></div>
      `,

      'ms-cargo-bay': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:28%;background:linear-gradient(to top,#060806,transparent);"></div>
        <!-- Loading rail overhead -->
        <div style="position:absolute;top:8%;left:5%;right:5%;height:2%;background:linear-gradient(to bottom,#1a1e14,#121410);border-radius:2px;border-top:1px solid #2a2e20;"></div>
        <!-- Cargo containers stacked left -->
        <div style="position:absolute;top:22%;left:10%;width:22%;height:32%;background:linear-gradient(to bottom,#0e1410,#0a100c);border:1px solid #1a2016;border-radius:2px;"></div>
        <div style="position:absolute;top:56%;left:10%;width:22%;height:20%;background:linear-gradient(to bottom,#0a1008,#080c06);border:1px solid #141c10;border-radius:2px;"></div>
        <!-- Freight lock panel (centre-right) -->
        <div style="position:absolute;top:33%;left:55%;width:18%;height:30%;background:#080c08;border:2px solid #1a2010;border-radius:3px;display:flex;flex-direction:column;align-items:center;justify-content:space-around;padding:4% 8%;">
          ${[0,1,2,3].map(i=>`<div style="width:70%;height:18%;background:#0e1810;border:1px solid #1e2c18;border-radius:2px;display:flex;align-items:center;justify-content:flex-end;padding-right:12%;"><div style="width:14%;height:60%;background:#0a1408;border:1px solid #162010;border-radius:1px;"></div></div>`).join('')}
        </div>
        <!-- Magnetic clamp indicator -->
        <div class="led-blink" style="position:absolute;top:30%;left:57%;width:0.8%;height:0.8%;background:#ff4040;border-radius:50%;box-shadow:0 0 6px rgba(255,64,64,0.8);animation-delay:0.3s;"></div>
        <!-- Reactor access door right -->
        <div style="position:absolute;top:15%;right:0;width:16%;height:72%;background:#060808;border-left:2px solid #141810;border-radius:3px 0 0 3px;"></div>
      `,

      'ms-reactor-deck': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:28%;background:linear-gradient(to top,#100202,transparent);"></div>
        <!-- Red emergency light flood -->
        <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(160,20,20,0.06);pointer-events:none;"></div>
        <!-- Reactor housing (right) -->
        <div style="position:absolute;top:12%;right:4%;width:18%;height:60%;background:linear-gradient(to bottom,#200808,#180404);border:2px solid #3a1010;border-radius:3px;box-shadow:0 0 20px rgba(200,40,20,0.2);">
          <div style="position:absolute;inset:8%;background:repeating-linear-gradient(45deg,rgba(200,40,20,0.15),rgba(200,40,20,0.15) 4px,transparent 4px,transparent 12px);border-radius:2px;"></div>
          <div style="position:absolute;top:40%;left:10%;right:10%;height:2%;background:rgba(255,80,40,0.5);box-shadow:0 0 8px rgba(255,80,40,0.6);"></div>
          <div style="position:absolute;top:55%;left:10%;right:10%;height:2%;background:rgba(255,120,40,0.4);box-shadow:0 0 6px rgba(255,120,40,0.5);"></div>
        </div>
        <!-- Reactor sequence panel (centre) -->
        <div style="position:absolute;top:18%;left:42%;width:24%;height:52%;background:#100404;border:1px solid #2a0c0c;border-radius:3px;">
          <div style="position:absolute;top:12%;left:10%;right:10%;bottom:12%;display:grid;grid-template-columns:1fr 1fr;gap:6%;">
            ${['A','B','C','D'].map(l=>`<div style="background:#1a0808;border:1px solid #2e1010;border-radius:2px;display:flex;align-items:center;justify-content:center;color:rgba(200,80,60,0.4);font-family:monospace;font-size:0.9vw;">${l}</div>`).join('')}
          </div>
        </div>
        <!-- Safety manual / console left -->
        <div style="position:absolute;top:30%;left:14%;width:22%;height:40%;background:#0c0808;border:1px solid #1e1010;border-radius:2px;display:flex;align-items:center;justify-content:center;color:rgba(200,80,60,0.2);font-size:1.5vw;">📋</div>
        <!-- Slumped figure indicator (subtle) -->
        <div style="position:absolute;top:45%;right:25%;width:12%;height:28%;background:linear-gradient(to bottom,#1a0808,transparent);border-radius:8px 8px 0 0;opacity:0.4;"></div>
        <!-- Sparks from reactor -->
        <div class="led-blink" style="position:absolute;top:22%;right:6%;width:1%;height:1%;background:#ff8040;border-radius:50%;box-shadow:0 0 12px rgba(255,128,64,0.9);"></div>
        <div class="led-blink" style="position:absolute;top:40%;right:8%;width:0.8%;height:0.8%;background:#ffb040;border-radius:50%;box-shadow:0 0 8px rgba(255,176,64,0.8);animation-delay:0.4s;"></div>
      `,

      'ms-command-deck': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:24%;background:linear-gradient(to top,#020810,transparent);"></div>
        <!-- Wide viewport (left) — stars and space -->
        <div style="position:absolute;top:16%;left:14%;width:30%;height:44%;background:radial-gradient(ellipse at 60% 40%,rgba(0,40,80,0.4) 0%,rgba(0,10,20,0.95) 70%);border:1px solid #0e2030;border-radius:3px;overflow:hidden;">
          <!-- Stars -->
          <div style="position:absolute;top:15%;left:20%;width:0.5%;height:0.5%;background:#a0c8e0;border-radius:50%;box-shadow:0 0 4px rgba(160,200,224,0.8);"></div>
          <div style="position:absolute;top:60%;left:70%;width:0.5%;height:0.5%;background:#c0d8f0;border-radius:50%;box-shadow:0 0 3px rgba(192,216,240,0.7);"></div>
          <div style="position:absolute;top:30%;left:55%;width:0.3%;height:0.3%;background:#d0e8ff;border-radius:50%;"></div>
          <!-- Rescue shuttle shape (distant) -->
          <div style="position:absolute;top:35%;right:15%;width:4%;height:2%;background:rgba(100,160,200,0.4);border-radius:1px;box-shadow:0 0 8px rgba(100,160,200,0.3);"></div>
        </div>
        <!-- Command stations -->
        <div style="position:absolute;bottom:22%;left:14%;width:28%;height:18%;background:#06101a;border-top:1px solid #0e2030;border-radius:3px 3px 0 0;display:flex;align-items:center;justify-content:space-around;padding:0 5%;">
          <div style="width:18%;height:50%;background:#04080e;border:1px solid #0e1828;border-radius:2px;display:flex;align-items:center;justify-content:center;color:rgba(0,140,200,0.3);font-size:0.5vw;">NAV</div>
          <div style="width:18%;height:50%;background:#04080e;border:1px solid #0e1828;border-radius:2px;display:flex;align-items:center;justify-content:center;color:rgba(0,140,200,0.3);font-size:0.5vw;">SYS</div>
        </div>
        <!-- Captain's locker right -->
        <div style="position:absolute;top:28%;left:55%;width:18%;height:48%;background:#06101a;border:1px solid #0e2030;border-radius:2px;">
          <div style="position:absolute;top:50%;left:50%;width:8%;height:10%;background:#060e18;border:1px solid #0e1828;border-radius:50%;transform:translate(-50%,-50%);"></div>
        </div>
        <!-- Ceiling light -->
        <div style="position:absolute;top:0;left:20%;right:20%;height:2px;background:rgba(0,120,200,0.55);box-shadow:0 0 20px rgba(0,120,200,0.35);"></div>
        <!-- Comms door right -->
        <div style="position:absolute;top:20%;right:0;width:12%;height:65%;background:#060e18;border-left:1px solid #0e2030;border-radius:3px 0 0 3px;"></div>
      `,

      'ms-comms-array': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:26%;background:linear-gradient(to top,#020810,transparent);"></div>
        <!-- Equipment racks -->
        <div style="position:absolute;top:18%;left:10%;width:16%;height:60%;background:#040c14;border:1px solid #0a1e30;border-radius:2px;">
          <div class="led-blink" style="position:absolute;top:15%;left:15%;width:70%;height:3%;background:rgba(0,160,255,0.6);border-radius:1px;box-shadow:0 0 4px rgba(0,160,255,0.5);"></div>
          <div style="position:absolute;top:30%;left:15%;width:70%;height:2%;background:rgba(0,160,255,0.4);border-radius:1px;"></div>
          <div style="position:absolute;top:44%;left:15%;width:70%;height:2%;background:rgba(0,120,200,0.3);border-radius:1px;"></div>
          <div class="led-blink" style="position:absolute;top:60%;left:15%;width:70%;height:3%;background:rgba(0,200,120,0.5);border-radius:1px;box-shadow:0 0 4px rgba(0,200,120,0.4);animation-delay:0.6s;"></div>
        </div>
        <!-- Transmitter console (left-centre) -->
        <div style="position:absolute;top:28%;left:10%;width:22%;height:44%;background:#030a12;border:1px solid #0a1828;border-radius:2px;display:flex;align-items:center;justify-content:center;">
          <div style="color:rgba(0,160,255,0.25);font-size:2vw;">📡</div>
        </div>
        <!-- Comms cabinet (centre) -->
        <div style="position:absolute;top:22%;left:36%;width:22%;height:48%;background:#040c14;border:1px solid #0a1e30;border-radius:2px;">
          <div style="position:absolute;top:50%;left:50%;width:8%;height:10%;background:#060e1a;border:1px solid #0e2030;border-radius:50%;transform:translate(-50%,-50%);"></div>
        </div>
        <!-- Distress beacon — orange pulse -->
        <div class="led-blink" style="position:absolute;top:10%;left:44%;width:1.2%;height:2%;background:#ff8800;border-radius:2px;box-shadow:0 0 10px rgba(255,136,0,0.8),0 0 24px rgba(255,136,0,0.3);animation-delay:0.2s;"></div>
        <!-- External airlock door (right) — glows when reactor solved -->
        <div style="position:absolute;top:20%;right:0;width:14%;height:65%;background:#040c14;border-left:2px solid #0a1e30;border-radius:3px 0 0 3px;display:flex;align-items:center;justify-content:center;">
          <div style="width:50%;height:50%;border:2px solid #0e2030;border-radius:50%;"></div>
        </div>
        <!-- EVA status panel -->
        <div style="position:absolute;bottom:24%;right:4%;width:16%;height:18%;background:#030a10;border:1px solid #081820;border-radius:2px;display:flex;align-items:center;justify-content:center;color:rgba(255,136,0,0.4);font-family:monospace;font-size:0.5vw;letter-spacing:0.05em;text-align:center;">EVA<br/>LOCKED</div>
      `,

      'ms-escape-pod-bay': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:24%;background:linear-gradient(to top,#020810,transparent);"></div>
        <!-- Ceiling — high bay -->
        <div style="position:absolute;top:0;left:5%;right:5%;height:2px;background:rgba(0,140,220,0.6);box-shadow:0 0 20px rgba(0,140,220,0.4);"></div>
        <!-- Escape pod body (centre) -->
        <div style="position:absolute;top:18%;left:38%;width:26%;height:52%;background:linear-gradient(to bottom,#0a1828,#060e18);border:2px solid #1a3450;border-radius:40% 40% 20% 20%;overflow:hidden;box-shadow:0 0 20px rgba(0,80,140,0.3);">
          <div style="position:absolute;top:20%;left:20%;right:20%;height:30%;background:#040c14;border:1px solid #0e2030;border-radius:3px;display:flex;align-items:center;justify-content:center;color:rgba(0,120,200,0.4);font-family:monospace;font-size:0.7vw;letter-spacing:0.1em;">POD-01</div>
        </div>
        <!-- Launch panel (right of pod) -->
        <div style="position:absolute;top:20%;left:55%;width:20%;height:40%;background:#060e18;border:1px solid #0e2030;border-radius:3px;">
          <div style="position:absolute;top:20%;left:20%;right:20%;height:30%;background:#04080e;border:1px solid #0a1828;border-radius:2px;display:flex;align-items:center;justify-content:center;color:rgba(0,100,180,0.35);font-family:monospace;font-size:1.2vw;letter-spacing:0.3em;">_</div>
          <div style="position:absolute;bottom:15%;left:50%;transform:translateX(-50%);width:40%;height:15%;background:#0a1828;border:1px solid #142840;border-radius:2px;display:flex;align-items:center;justify-content:center;color:rgba(0,120,200,0.5);font-family:monospace;font-size:0.5vw;">LAUNCH</div>
        </div>
        <!-- Blast window right -->
        <div style="position:absolute;top:18%;right:4%;width:18%;height:50%;background:radial-gradient(ellipse at 40% 30%,rgba(0,30,60,0.6) 0%,rgba(0,5,15,0.95) 70%);border:1px solid #0e2030;border-radius:3px;overflow:hidden;">
          <!-- Earth glow -->
          <div style="position:absolute;bottom:-10%;right:-10%;width:60%;height:60%;background:radial-gradient(circle,rgba(20,80,160,0.4) 0%,transparent 70%);border-radius:50%;"></div>
          <!-- Stars -->
          <div style="position:absolute;top:20%;left:30%;width:0.4%;height:0.4%;background:#c0e0ff;border-radius:50%;"></div>
          <div style="position:absolute;top:50%;left:15%;width:0.3%;height:0.3%;background:#d0eeff;border-radius:50%;"></div>
        </div>
        <!-- Status indicator -->
        <div class="led-blink" style="position:absolute;top:14%;left:60%;width:1%;height:1.2%;background:#ff8800;border-radius:50%;box-shadow:0 0 8px rgba(255,136,0,0.7);"></div>
      `,

      'ms-lower-corridor': `
        <div style="position:absolute;bottom:0;left:0;right:0;height:26%;background:linear-gradient(to top,#030810,transparent);"></div>
        <!-- Darker, heavier lower deck -->
        <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,20,50,0.04);pointer-events:none;"></div>
        <!-- Overhead corridor lights — dimmer -->
        <div style="position:absolute;top:0;left:20%;width:18%;height:2px;background:rgba(0,100,160,0.5);box-shadow:0 0 12px rgba(0,100,160,0.3);"></div>
        <div style="position:absolute;top:0;right:18%;width:15%;height:2px;background:rgba(0,100,160,0.4);box-shadow:0 0 10px rgba(0,100,160,0.25);"></div>
        <!-- Wall shielding texture (reactor proximity) -->
        <div style="position:absolute;top:15%;left:48%;right:0%;height:70%;background:repeating-linear-gradient(90deg,rgba(0,20,40,0.3),rgba(0,20,40,0.3) 1px,transparent 1px,transparent 5%);"></div>
        <!-- Door frames -->
        <div style="position:absolute;top:18%;left:12%;width:14%;height:62%;background:#040c14;border:1px solid #0a1a28;border-radius:2px;"></div>
        <div style="position:absolute;top:18%;left:30%;width:14%;height:64%;background:#040c14;border:1px solid #0a1a28;border-radius:2px;"></div>
        <div style="position:absolute;top:14%;left:50%;width:22%;height:72%;background:#040c10;border:1px solid #0a1820;border-radius:2px;"></div>
        <!-- Radiation warning sign -->
        <div style="position:absolute;top:25%;right:5%;width:8%;height:12%;background:#0a0e08;border:1px solid rgba(255,136,0,0.3);border-radius:2px;display:flex;align-items:center;justify-content:center;color:rgba(255,136,0,0.45);font-size:1.5vw;">☢</div>
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
    // If item has a clueSlot, only show it in the randomiser-assigned container
    if (item.clueSlot && state.clueLocations && Object.keys(state.clueLocations).length > 0) {
      const assigned = state.clueLocations[item.id];
      if (assigned && assigned !== parentContainerId) return;
    }

    // Check visibility condition
    if (item.visibleWhen) {
      const condState = state.objects[item.visibleWhen.objectState];
      if (condState !== item.visibleWhen.equals) return;
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
        <div style="width:100%;height:100%;background:#16162a;border:1px solid #3a3a5a;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:space-around;padding:4% 6%;box-shadow:0 0 12px rgba(0,0,0,0.5);">
          <div style="width:80%;height:25%;background:#0e0e24;border:1px solid var(--accent);border-radius:2px;display:flex;align-items:center;justify-content:center;color:var(--accent);font-family:monospace;font-size:1.2vw;letter-spacing:0.2em;box-shadow:0 0 8px rgba(0,255,224,0.4);">____</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px;width:90%;">
            ${[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(n=>`<div style="aspect-ratio:1;background:#22223a;border:1px solid #3a3a5a;border-radius:2px;display:flex;align-items:center;justify-content:center;color:#aaaacc;font-family:monospace;font-size:0.9vw;">${n}</div>`).join('')}
          </div>
        </div>`,

      'entry-door-mainlab': (() => {
        const solved = state.puzzles['entry-keypad']?.solved;
        return `<div style="width:100%;height:100%;background:linear-gradient(to bottom,#1e1e38,#14142a);border:2px solid ${solved ? 'rgba(0,255,224,0.6)' : '#2a2a4a'};border-radius:3px;display:flex;align-items:center;justify-content:flex-end;padding-right:8%;transition:all 0.3s;">
          <div style="width:8%;aspect-ratio:1;background:${solved ? 'rgba(0,255,224,0.4)' : '#2a2a40'};border:1px solid ${solved ? 'var(--accent)' : '#3a3a5a'};border-radius:50%;box-shadow:${solved ? '0 0 12px rgba(0,255,224,0.7)' : 'none'};"></div>
        </div>`;
      })(),

      'entry-drawer': `
        <div style="width:100%;height:100%;background:linear-gradient(to bottom,#262634,#1c1c2c);border:1px solid #3a3a52;border-radius:3px;position:relative;cursor:pointer;">
          <div style="position:absolute;top:20%;left:10%;right:10%;height:2px;background:#3a3a52;"></div>
          ${objState === 'open' ? '<div style="position:absolute;bottom:0;left:5%;right:5%;height:40%;background:#18182a;border:1px solid #2a2a42;border-top:none;border-radius:0 0 3px 3px;"></div>' : ''}
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:15%;height:12%;background:#2e2e46;border:1px solid #3a3a5a;border-radius:2px;"></div>
        </div>`,

      'entry-vent': (() => {
        const isOpen = objState === 'open';
        return `<div style="width:100%;height:100%;background:#1c1c2c;border:1px solid #3a3a52;border-radius:2px;display:flex;align-items:center;justify-content:center;position:relative;">
          ${isOpen
            ? '<div style="width:90%;height:80%;background:#101020;border:1px solid #2a2a3a;border-radius:1px;display:flex;align-items:center;justify-content:center;color:#4a4a6a;font-size:1.5vw;">▼</div>'
            : '<div style="width:90%;height:80%;display:grid;grid-template-columns:repeat(5,1fr);gap:2px;">'
              + Array(10).fill('<div style="background:#2e2e46;border-radius:1px;"></div>').join('')
              + '</div>'
          }
        </div>`;
      })(),

      'entry-computer': `
        <div style="width:100%;height:100%;background:#10101e;border:1px solid #2a2a40;border-radius:4px;display:flex;align-items:center;justify-content:center;position:relative;">
          <div style="width:80%;height:65%;background:#0c0c1c;border:1px solid #222238;border-radius:3px;display:flex;align-items:center;justify-content:center;color:#3a3a60;font-size:1.5vw;font-family:monospace;">ERROR</div>
          <div style="position:absolute;bottom:5%;left:50%;transform:translateX(-50%);width:30%;height:8%;background:#18182e;border:1px solid #2a2a42;border-radius:2px;"></div>
        </div>`,

      'entry-note-wall': `
        <div style="width:100%;height:100%;background:#2a2216;border:1px solid #3a3020;border-radius:2px;padding:6%;display:flex;flex-direction:column;gap:8%;">
          <div style="height:3px;background:#4a4030;border-radius:1px;"></div>
          <div style="height:3px;background:#4a4030;border-radius:1px;width:80%;"></div>
          <div style="height:3px;background:#4a4030;border-radius:1px;width:90%;"></div>
          <div style="height:3px;background:#4a4030;border-radius:1px;width:60%;"></div>
        </div>`,

      // --- Main Lab ---
      'lab-cabinet-left': `
        <div style="width:100%;height:100%;background:linear-gradient(to right,#162418,#101c12);border:1px solid #2a3e2a;border-radius:2px;position:relative;">
          ${objState === 'open'
            ? '<div style="position:absolute;inset:0;border:1px solid rgba(0,220,100,0.5);border-radius:2px;background:rgba(0,220,100,0.05);"></div>'
            : ''}
          <div style="position:absolute;top:50%;right:8%;width:6%;height:8%;background:#223428;border:1px solid #3a5038;border-radius:50%;transform:translateY(-50%);"></div>
        </div>`,

      'lab-cabinet-right': `
        <div style="width:100%;height:100%;background:linear-gradient(to left,#162418,#101c12);border:1px solid #2a3e2a;border-radius:2px;position:relative;">
          ${objState === 'open'
            ? '<div style="position:absolute;inset:0;border:1px solid rgba(0,220,100,0.5);border-radius:2px;background:rgba(0,220,100,0.05);"></div>'
            : ''}
          <div style="position:absolute;top:50%;left:8%;width:6%;height:8%;background:#223428;border:1px solid #3a5038;border-radius:50%;transform:translateY(-50%);"></div>
        </div>`,

      'lab-locker': `
        <div style="width:100%;height:100%;background:linear-gradient(to bottom,#162418,#101c12);border:2px solid #2a3e2a;border-radius:3px;position:relative;">
          <div style="position:absolute;top:5%;left:50%;transform:translateX(-50%);width:20%;height:3%;background:#2a3e2a;border-radius:1px;"></div>
          ${objState === 'open' ? '<div style="position:absolute;left:2%;right:2%;top:10%;bottom:5%;background:#0c160c;border:1px solid #162416;"></div>' : ''}
          <div style="position:absolute;top:50%;left:10%;width:8%;height:5%;background:#223428;border:1px solid #3a5038;border-radius:1px;transform:translateY(-50%);"></div>
        </div>`,

      'lab-exit-corridor': (() => {
        const unlocked = state.puzzles['terminal-hack']?.solved;
        return `<div style="width:100%;height:100%;background:linear-gradient(to bottom,#161628,#0e0e1e);border:2px solid ${unlocked ? 'rgba(0,255,224,0.6)' : '#2a2a4a'};border-radius:3px;display:flex;align-items:center;justify-content:center;gap:6%;padding:0 8%;">
          <div style="color:${unlocked ? 'var(--accent)' : '#3a3a5a'};font-family:monospace;font-size:0.75vw;letter-spacing:0.15em;writing-mode:vertical-rl;opacity:${unlocked ? '1' : '0.5'};">EMERGENCY CORRIDOR</div>
          <div style="width:8%;aspect-ratio:1;background:${unlocked ? 'rgba(0,255,224,0.3)' : '#1a1a30'};border:1px solid ${unlocked ? 'var(--accent)' : '#3a3a5a'};border-radius:50%;box-shadow:${unlocked ? '0 0 12px rgba(0,255,224,0.6)' : 'none'};"></div>
        </div>`;
      })(),

      'lab-symbol-board': `
        <div style="width:100%;height:100%;background:#141e14;border:1px solid #2a3e2a;border-radius:3px;display:grid;grid-template-columns:repeat(2,1fr);gap:4%;padding:6%;align-items:center;justify-items:center;">
          <div style="color:rgba(0,220,100,0.7);font-size:1.5vw;">⬡</div>
          <div style="color:rgba(0,220,100,0.6);font-size:1.5vw;">◈</div>
          <div style="color:rgba(0,220,100,0.7);font-size:1.5vw;">⬟</div>
          <div style="color:rgba(0,220,100,0.5);font-size:1.5vw;">✦</div>
        </div>`,

      'lab-terminal': (() => {
        const solved = state.puzzles['terminal-hack']?.solved;
        return `<div class="terminal-scan" style="width:100%;height:100%;background:#0c1a0e;border:1px solid ${solved ? '#00cc55' : '#1a3a1e'};border-radius:4px;display:flex;flex-direction:column;padding:6%;gap:4%;font-family:monospace;font-size:0.8vw;color:${solved ? '#00ee66' : '#2a6030'};">
          <div>${solved ? '> ACCESS GRANTED' : '> SYSTEM OFFLINE'}</div>
          <div style="height:1px;background:${solved ? '#006633' : '#1a3a1e'};"></div>
          <div>${solved ? '> SECURITY DISABLED' : '> AWAITING POWER...'}</div>
          <div style="width:40%;height:6px;background:${solved ? '#005522' : '#0e1e10'};border-radius:2px;margin-top:4%;"></div>
        </div>`;
      })(),

      // --- Server Room ---
      'server-panel': `
        <div style="width:100%;height:100%;background:#1e1208;border:2px solid #3a2818;border-radius:3px;position:relative;padding:4%;">
          <div style="color:rgba(255,130,40,0.7);font-family:monospace;font-size:0.8vw;margin-bottom:6%;">SRV-PANEL-02</div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:4%;">
            ${['RED','BLUE','GREEN','YELLOW','WHITE'].map((c,i) => `
              <div style="display:flex;align-items:center;gap:4px;">
                <div style="width:8px;height:8px;border-radius:50%;background:${['#cc2020','#2060cc','#20cc60','#ccaa20','#aaaacc'][i]};opacity:0.9;"></div>
                <div style="height:2px;width:60%;background:${['#cc2020','#2060cc','#20cc60','#ccaa20','#aaaacc'][i]};opacity:0.5;"></div>
              </div>`).join('')}
          </div>
        </div>`,

      'fuse-box': `
        <div style="width:100%;height:100%;background:#1c160e;border:1px solid #3a2a18;border-radius:2px;position:relative;">
          ${objState === 'powered'
            ? `<div style="position:absolute;inset:0;background:#141008;border:1px solid #4a3a18;display:flex;flex-direction:column;padding:8%;gap:6%;box-shadow:inset 0 0 12px rgba(255,180,0,0.15);">
                <div style="height:3px;background:#ffb000;border-radius:1px;box-shadow:0 0 6px rgba(255,176,0,0.6);"></div>
                <div style="height:3px;background:#ffb000;border-radius:1px;box-shadow:0 0 6px rgba(255,176,0,0.6);"></div>
                <div style="height:3px;background:#ffb000;border-radius:1px;box-shadow:0 0 6px rgba(255,176,0,0.6);"></div>
              </div>`
            : objState === 'open'
            ? `<div style="position:absolute;inset:0;background:#0e0c06;border:1px solid #3a3010;display:flex;flex-direction:column;padding:8%;gap:6%;">
                <div style="height:3px;background:#4a3a10;border-radius:1px;"></div>
                <div style="height:3px;background:#2a1a00;border-radius:1px;opacity:0.6;"></div>
                <div style="height:3px;background:#4a3a10;border-radius:1px;"></div>
              </div>`
            : '<div style="position:absolute;inset:20%;border:1px solid #3a2a18;border-radius:1px;display:flex;align-items:center;justify-content:center;color:rgba(255,130,40,0.7);font-size:1.2vw;">⚡</div>'
          }
        </div>`,

      'server-wire-panel': `
        <div style="width:100%;height:100%;background:#1e1208;border:1px solid #3a2818;border-radius:3px;display:flex;align-items:center;justify-content:center;">
          <div style="color:rgba(255,130,40,0.6);font-size:2vw;">⚙</div>
        </div>`,

      // --- Final Exit ---
      'final-lever-panel': `
        <div style="width:100%;height:100%;background:#16162a;border:1px solid #2a2a4a;border-radius:3px;display:flex;align-items:center;justify-content:space-around;padding:6%;">
          ${[0,1,2,3].map(i => `
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
              <div style="width:4px;height:30px;background:#2a2a4a;border-radius:2px;position:relative;">
                <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:12px;height:12px;background:#3a3a5a;border:1px solid #5a5a7a;border-radius:50%;"></div>
              </div>
            </div>`).join('')}
        </div>`,

      'final-door': (() => {
        const open = state.puzzles['lever-combo']?.solved;
        return `<div style="width:100%;height:100%;background:linear-gradient(to bottom,#16162e,#0e0e20);border:2px solid ${open ? 'rgba(0,255,68,0.7)' : '#2a2a4a'};border-radius:3px;display:flex;align-items:center;justify-content:flex-end;padding-right:5%;">
          <div style="width:6%;aspect-ratio:1;background:${open ? 'rgba(0,255,68,0.4)' : '#161628'};border:1px solid ${open ? '#00ff44' : '#3a3a5a'};border-radius:50%;box-shadow:${open ? '0 0 16px rgba(0,255,68,0.8)' : 'none'};"></div>
        </div>`;
      })(),

      // --- Secret Room ---
      'secret-hatch-keypad': `
        <div style="width:100%;height:100%;background:#0e0e1e;border:2px solid rgba(0,180,255,0.4);border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:space-around;padding:4% 6%;box-shadow:0 0 14px rgba(0,180,255,0.15);">
          <div style="color:rgba(0,180,255,0.55);font-family:monospace;font-size:0.55vw;letter-spacing:0.12em;">HATCH OVERRIDE</div>
          <div style="width:80%;height:18%;background:#080818;border:1px solid rgba(0,180,255,0.5);border-radius:2px;display:flex;align-items:center;justify-content:center;color:rgba(0,180,255,0.7);font-family:monospace;font-size:0.9vw;letter-spacing:0.3em;box-shadow:0 0 6px rgba(0,180,255,0.3);">____</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px;width:90%;">
            ${[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(n=>`<div style="aspect-ratio:1;background:#14142a;border:1px solid #22223a;border-radius:2px;display:flex;align-items:center;justify-content:center;color:rgba(100,160,220,0.6);font-family:monospace;font-size:0.7vw;">${n}</div>`).join('')}
          </div>
        </div>`,

      'secret-exit-panel': (() => {
        const open = state.puzzles['hatch-keypad']?.solved;
        return `<div style="width:100%;height:100%;background:${open ? 'linear-gradient(to bottom,#001a10,#00100a)' : '#0c0c16'};border:2px solid ${open ? 'rgba(0,255,136,0.6)' : 'rgba(0,120,200,0.3)'};border-radius:3px;display:flex;align-items:center;justify-content:center;box-shadow:${open ? '0 0 20px rgba(0,255,136,0.3)' : '0 0 8px rgba(0,100,200,0.1)'};">
          <div style="color:${open ? 'rgba(0,255,136,0.9)' : 'rgba(0,150,220,0.4)'};font-size:2vw;">${open ? '▶' : '⊟'}</div>
        </div>`;
      })(),

      // --- Bio Lab ---
      'bio-fridge': `
        <div style="width:100%;height:100%;background:linear-gradient(to right,#0e2220,#0a1a18);border:2px solid #1e3a32;border-radius:4px;position:relative;">
          <div style="position:absolute;top:4%;left:10%;right:10%;height:3px;background:rgba(120,220,200,0.5);border-radius:2px;box-shadow:0 0 8px rgba(120,220,200,0.4);"></div>
          ${objState==='open' ? '<div style="position:absolute;inset:0;background:rgba(100,200,180,0.06);border:1px solid rgba(100,200,180,0.3);border-radius:3px;"></div>' : ''}
          <div style="position:absolute;top:50%;right:8%;width:6%;height:10%;background:#1a3028;border:1px solid #2a4a38;border-radius:50%;transform:translateY(-50%);"></div>
          <div style="position:absolute;top:8%;left:50%;transform:translateX(-50%);color:rgba(100,220,180,0.5);font-size:0.7vw;font-family:monospace;letter-spacing:0.1em;">SPECIMEN</div>
        </div>`,

      'bio-vault-lock': (() => {
        const pat = state.puzzles['bio-switch']?.pattern || [1,0,1,1];
        return `<div style="width:100%;height:100%;background:linear-gradient(to bottom,#121e1a,#0a1612);border:2px solid #1e3228;border-radius:4px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8%;padding:8%;">
          <div style="color:rgba(0,200,140,0.6);font-family:monospace;font-size:0.65vw;letter-spacing:0.15em;">CIRCUIT LOCK</div>
          <div style="display:flex;gap:5%;width:90%;">
            ${pat.map(v=>`<div style="flex:1;height:28px;background:${v?'rgba(0,220,140,0.2)':'rgba(200,40,40,0.15)'};border:1px solid ${v?'rgba(0,220,140,0.6)':'rgba(200,40,40,0.5)'};border-radius:3px;display:flex;align-items:center;justify-content:center;color:${v?'rgba(0,220,140,0.8)':'rgba(200,40,40,0.7)'};font-size:0.85vw;">${v?'█':'○'}</div>`).join('')}
          </div>
        </div>`;
      })(),

      'bio-key-box': `
        <div style="width:100%;height:100%;background:#0e1a14;border:1px solid ${state.puzzles['bio-switch']?.solved ? 'rgba(0,220,140,0.6)' : '#1a2e22'};border-radius:3px;display:flex;align-items:center;justify-content:center;gap:8%;padding:0 10%;">
          <div style="width:10%;aspect-ratio:1;background:${state.puzzles['bio-switch']?.solved ? 'rgba(0,220,140,0.4)' : '#0a1410'};border:1px solid ${state.puzzles['bio-switch']?.solved ? '#00dc8c' : '#1a2e22'};border-radius:50%;box-shadow:${state.puzzles['bio-switch']?.solved ? '0 0 10px rgba(0,220,140,0.6)' : 'none'};"></div>
          <div style="color:rgba(0,180,100,0.5);font-family:monospace;font-size:0.6vw;letter-spacing:0.1em;">MAINT. KEYS</div>
        </div>`,

      'bio-microscope': `
        <div style="width:100%;height:100%;background:#0a1612;border:1px solid #182818;border-radius:3px;display:flex;align-items:center;justify-content:center;">
          <div style="color:rgba(80,180,120,0.45);font-size:2.5vw;text-shadow:0 0 8px rgba(0,200,100,0.2);">🔬</div>
        </div>`,

      'bio-incident-board': `
        <div style="width:100%;height:100%;background:#0e1810;border:1px solid #1e2e1e;border-radius:2px;padding:6%;display:flex;flex-direction:column;gap:6%;">
          <div style="color:rgba(255,80,80,0.6);font-family:monospace;font-size:0.55vw;letter-spacing:0.1em;">INCIDENT REPORT</div>
          <div style="height:2px;background:rgba(255,60,60,0.3);"></div>
          <div style="height:2px;background:#1a2a1a;width:90%;"></div>
          <div style="height:2px;background:#1a2a1a;width:70%;"></div>
          <div style="height:2px;background:#1a2a1a;width:80%;"></div>
          <div style="height:2px;background:rgba(255,60,60,0.2);width:50%;"></div>
        </div>`,

      // --- Director's Office ---
      'director-desk': `
        <div style="width:100%;height:100%;background:linear-gradient(to bottom,#2a1e0e,#1a1208);border:1px solid #3a2a18;border-radius:3px;position:relative;">
          <div style="position:absolute;top:0;left:0;right:0;height:15%;background:linear-gradient(to bottom,#3a2a16,#2a1e0e);border-radius:3px 3px 0 0;border-bottom:1px solid #4a3a22;"></div>
          ${objState==='open' ? '<div style="position:absolute;inset:0;background:rgba(200,150,60,0.04);border:1px solid rgba(200,150,60,0.2);border-radius:3px;"></div>' : ''}
          <div style="position:absolute;top:20%;left:50%;transform:translateX(-50%);width:20%;height:4%;background:#221808;border:1px solid #3a2a14;border-radius:1px;"></div>
        </div>`,

      'director-safe-lock': `
        <div style="width:100%;height:100%;background:#161208;border:2px solid #2a2010;border-radius:3px;display:flex;flex-direction:column;align-items:center;justify-content:space-around;padding:6%;">
          <div style="color:rgba(200,160,60,0.6);font-family:monospace;font-size:0.6vw;letter-spacing:0.1em;">SAFE — KEYPAD</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4%;width:80%;">
            ${[1,2,3,4,5,6,7,8,9].map(n=>`<div style="aspect-ratio:1;background:#1a1408;border:1px solid #2e2010;border-radius:1px;display:flex;align-items:center;justify-content:center;color:rgba(180,140,60,0.6);font-family:monospace;font-size:0.7vw;">${n}</div>`).join('')}
          </div>
        </div>`,

      'director-safe-door': `
        <div style="width:100%;height:100%;background:#121008;border:2px solid ${state.puzzles['director-safe']?.solved ? 'rgba(200,160,60,0.6)' : '#1e1808'};border-radius:3px;display:flex;align-items:center;justify-content:center;box-shadow:${state.puzzles['director-safe']?.solved ? '0 0 14px rgba(200,160,60,0.3)' : 'none'};">
          <div style="color:rgba(180,140,60,${state.puzzles['director-safe']?.solved ? '0.8' : '0.25'});font-size:1.8vw;">🔒</div>
        </div>`,

      'director-bookshelf': `
        <div style="width:100%;height:100%;background:#140e06;border:1px solid #261c0e;border-radius:2px;padding:3%;display:flex;flex-direction:column;gap:3%;">
          ${[85,70,90,60,80,75].map(w=>`<div style="height:8%;width:${w}%;background:linear-gradient(to right,#1e1408,#281a0a);border:1px solid #2e2010;border-radius:1px;"></div>`).join('')}
        </div>`,

      'director-portrait': `
        <div style="width:100%;height:100%;background:#1a1208;border:3px solid #2e2010;border-radius:2px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 12px rgba(0,0,0,0.6);">
          <div style="color:rgba(180,140,60,0.35);font-size:2.5vw;">👤</div>
        </div>`,

      // --- Secret Room ---
      'secret-personal-effects': `
        <div style="width:100%;height:100%;background:#0e0e1a;border:1px solid #1e1e30;border-radius:2px;padding:6%;display:flex;flex-direction:column;gap:8%;align-items:flex-start;">
          <div style="width:40%;height:30%;background:#16161e;border:1px solid #2a2a3a;border-radius:2px;display:flex;align-items:center;justify-content:center;color:rgba(150,150,190,0.4);font-size:1vw;">☕</div>
          <div style="color:rgba(140,140,180,0.3);font-family:monospace;font-size:0.5vw;letter-spacing:0.08em;">PERSONAL EFFECTS</div>
        </div>`,

      'secret-filing-cabinet': `
        <div style="width:100%;height:100%;background:linear-gradient(to bottom,#14141e,#0e0e18);border:1px solid #222232;border-radius:2px;position:relative;">
          <div style="position:absolute;top:30%;left:5%;right:5%;height:2px;background:#222232;"></div>
          <div style="position:absolute;top:60%;left:5%;right:5%;height:2px;background:#222232;"></div>
          ${objState === 'open' ? '<div style="position:absolute;inset:0;background:rgba(140,140,200,0.04);border:1px solid rgba(140,140,200,0.2);border-radius:2px;"></div>' : ''}
          <div style="position:absolute;top:15%;left:50%;transform:translateX(-50%);width:12%;height:5%;background:#1e1e2e;border:1px solid #2e2e42;border-radius:1px;"></div>
          <div style="position:absolute;top:45%;left:50%;transform:translateX(-50%);width:12%;height:5%;background:#1e1e2e;border:1px solid #2e2e42;border-radius:1px;"></div>
        </div>`,

      'secret-wall-schematic': `
        <div style="width:100%;height:100%;background:#0e0e1a;border:1px solid #1e2030;border-radius:2px;padding:6%;position:relative;">
          <div style="position:absolute;inset:8%;border:1px solid #1e2038;border-radius:1px;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:3px;padding:4px;">
            ${Array(9).fill(0).map((_,i) => `<div style="background:${i===4?'rgba(0,200,180,0.12)':'rgba(30,30,50,0.8)'};border:1px solid #1e2038;border-radius:1px;"></div>`).join('')}
          </div>
          <div style="position:absolute;bottom:10%;right:10%;color:rgba(120,140,200,0.3);font-family:monospace;font-size:0.45vw;">SCHEMATIC</div>
        </div>`,

      // --- Security Hub ---
      'cctv-console': `
        <div class="terminal-scan" style="width:100%;height:100%;background:#0a0e18;border:2px solid #1a2030;border-radius:3px;padding:4%;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr);gap:4%;">
          ${[0,1,2,3,4,5].map(i=>`<div style="background:#060a10;border:1px solid #141c28;border-radius:1px;display:flex;align-items:center;justify-content:center;color:rgba(40,60,100,0.8);font-family:monospace;font-size:0.4vw;">${i===3?'NO SIG':i===5?'OFFLINE':''}</div>`).join('')}
        </div>`,

      'guard-logbook': `
        <div style="width:100%;height:100%;background:#121828;border:1px solid #1e2a3a;border-radius:2px;padding:8%;display:flex;flex-direction:column;gap:8%;transform:rotate(-2deg);">
          <div style="color:rgba(100,140,200,0.6);font-family:monospace;font-size:0.55vw;letter-spacing:0.08em;">GUARD LOG</div>
          <div style="height:2px;background:#1e2a3a;"></div>
          <div style="height:2px;background:#1a2430;width:80%;"></div>
          <div style="height:2px;background:#1a2430;width:60%;"></div>
          <div style="height:2px;background:#1a2430;width:75%;"></div>
        </div>`,

      'security-panel-trigger': `
        <div style="width:100%;height:100%;background:#0e1220;border:2px solid #1e2a40;border-radius:3px;display:flex;flex-direction:column;align-items:center;justify-content:space-around;padding:6%;">
          <div style="color:rgba(80,130,220,0.7);font-family:monospace;font-size:0.6vw;letter-spacing:0.12em;">ACCESS CONTROL</div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6%;width:70%;">
            ${['⬡','◈','⬟','✦'].map(s=>`<div style="aspect-ratio:1;background:#0a0e1c;border:1px solid #1a2234;border-radius:2px;display:flex;align-items:center;justify-content:center;color:rgba(80,120,220,0.6);font-size:1vw;">${s}</div>`).join('')}
          </div>
        </div>`,

      'security-locker': `
        <div style="width:100%;height:100%;background:linear-gradient(to bottom,#0e1220,#0a0e18);border:2px solid ${state.puzzles['security-panel']?.solved ? 'rgba(80,140,255,0.6)' : '#1a2030'};border-radius:3px;position:relative;">
          ${objState==='open' ? '<div style="position:absolute;inset:0;background:rgba(80,140,255,0.04);border-radius:3px;"></div>' : ''}
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:12%;height:8%;background:${state.puzzles['security-panel']?.solved ? 'rgba(80,140,255,0.4)' : '#141828'};border:1px solid ${state.puzzles['security-panel']?.solved ? '#5080ff' : '#1e2a3a'};border-radius:50%;box-shadow:${state.puzzles['security-panel']?.solved ? '0 0 10px rgba(80,140,255,0.5)' : 'none'};"></div>
        </div>`,

      // --- Utility Corridor ---
      'utility-warning': `
        <div style="width:100%;height:100%;background:#1a1408;border:2px solid rgba(255,160,0,0.5);border-radius:2px;padding:6%;display:flex;flex-direction:column;gap:6%;box-shadow:0 0 10px rgba(255,160,0,0.15);">
          <div style="color:rgba(255,160,0,0.8);font-family:monospace;font-size:0.6vw;letter-spacing:0.1em;">⚠ HIGH VOLTAGE</div>
          <div style="height:2px;background:rgba(255,140,0,0.4);"></div>
          <div style="height:2px;background:#2a2010;width:80%;"></div>
          <div style="height:2px;background:#2a2010;width:60%;"></div>
        </div>`,

      'utility-burn-mark': `
        <div style="width:100%;height:100%;background:radial-gradient(ellipse at 50% 60%,#1a0e06 0%,#0e0a06 60%,transparent 100%);border:1px solid #221808;border-radius:2px;display:flex;align-items:center;justify-content:center;">
          <div style="color:rgba(120,60,20,0.5);font-size:2vw;text-shadow:0 0 12px rgba(200,80,0,0.3);">🔥</div>
        </div>`,

      'power-junction-trigger': (() => {
        const hz = state.powerFrequency || 500;
        return `<div style="width:100%;height:100%;background:#141008;border:2px solid #2a2010;border-radius:4px;padding:4%;display:flex;flex-direction:column;gap:5%;">
          <div style="color:rgba(255,160,40,0.7);font-family:monospace;font-size:0.55vw;letter-spacing:0.1em;">PJ-7 FREQ STABILISER</div>
          <div style="background:#0a0600;border:1px solid rgba(255,140,30,0.25);border-radius:3px;padding:4%;text-align:center;">
            <div style="color:rgba(255,130,30,0.45);font-size:0.45vw;font-family:monospace;letter-spacing:0.1em;">TARGET</div>
            <div style="color:rgba(255,160,60,0.8);font-family:monospace;font-size:0.9vw;">${hz} Hz</div>
          </div>
          <div style="height:18%;background:#0a0600;border:1px solid rgba(255,120,30,0.2);border-radius:2px;overflow:hidden;position:relative;">
            <div style="position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(255,100,20,0.3);"></div>
          </div>
          <div style="height:2px;background:rgba(255,140,0,0.25);border-radius:1px;"></div>
        </div>`;
      })(),

      'chip-compartment': `
        <div style="width:100%;height:100%;background:#0e0c08;border:1px solid ${state.puzzles['power-frequency']?.solved ? 'rgba(255,160,40,0.6)' : '#1e1a10'};border-radius:2px;display:flex;align-items:center;justify-content:center;gap:8%;padding:0 8%;box-shadow:${state.puzzles['power-frequency']?.solved ? '0 0 12px rgba(255,160,40,0.25)' : 'none'};">
          <div style="width:10%;aspect-ratio:1;background:${state.puzzles['power-frequency']?.solved ? 'rgba(255,160,40,0.4)' : '#14120a'};border:1px solid ${state.puzzles['power-frequency']?.solved ? '#ffa028' : '#241e10'};border-radius:50%;box-shadow:${state.puzzles['power-frequency']?.solved ? '0 0 8px rgba(255,160,40,0.5)' : 'none'};"></div>
          <div style="color:rgba(200,140,40,${state.puzzles['power-frequency']?.solved ? '0.7' : '0.3'});font-family:monospace;font-size:0.55vw;letter-spacing:0.08em;">BYPASS CHIPS</div>
        </div>`,
    };

    return OBJECTS[hs.id] || this._getGenericHotspot(hs, objState);
  }

  _getGenericHotspot(hs, objState) {
    const type = hs.type || 'inspect';
    if (type === 'door') {
      return `<div style="width:100%;height:100%;background:linear-gradient(to bottom,#1a1a2a,#12121e);border:2px solid #2a2a44;border-radius:4px;display:flex;align-items:center;justify-content:flex-end;padding-right:6%;">
        <div style="width:7%;aspect-ratio:1;background:#1a1a30;border:1px solid #3a3a5a;border-radius:50%;"></div>
      </div>`;
    }
    if (type === 'container') {
      const isOpen = objState === 'open';
      return `<div style="width:100%;height:100%;background:linear-gradient(to bottom,#1e1e2e,#14142a);border:1px solid ${isOpen ? 'rgba(0,255,224,0.4)' : '#2a2a44'};border-radius:3px;position:relative;">
        ${isOpen ? '<div style="position:absolute;inset:0;background:rgba(0,255,224,0.03);border-radius:3px;"></div>' : ''}
        <div style="position:absolute;top:50%;right:8%;width:6%;height:8%;background:#1e1e38;border:1px solid #3a3a5a;border-radius:50%;transform:translateY(-50%);"></div>
      </div>`;
    }
    if (type === 'puzzle-trigger') {
      return `<div style="width:100%;height:100%;background:#12121e;border:1px solid #2a2a44;border-radius:3px;display:flex;align-items:center;justify-content:center;">
        <div style="color:rgba(0,200,180,0.5);font-size:1.8vw;">⚙</div>
      </div>`;
    }
    // inspect / default
    return `<div style="width:100%;height:100%;background:#141420;border:1px solid #222238;border-radius:2px;display:flex;align-items:center;justify-content:center;">
      <div style="color:rgba(180,180,220,0.2);font-size:1.2vw;">🔍</div>
    </div>`;
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
      'bio-research-note': `<div style="width:100%;height:100%;background:#0a1610;border:1px solid rgba(0,180,100,0.4);border-radius:2px;display:flex;align-items:center;justify-content:center;transform:rotate(2deg);"><span style="color:rgba(0,180,100,0.7);font-size:0.9vw;">📋</span></div>`,
      'director-memo':     `<div style="width:100%;height:100%;background:#1a1408;border:1px solid rgba(200,150,60,0.4);border-radius:2px;display:flex;align-items:center;justify-content:center;transform:rotate(-1deg);"><span style="color:rgba(200,150,60,0.7);font-size:0.9vw;">📜</span></div>`,
      'director-safe-note':`<div style="width:100%;height:100%;background:#181208;border:1px solid rgba(200,150,60,0.35);border-radius:2px;display:flex;align-items:center;justify-content:center;transform:rotate(1deg);"><span style="color:rgba(200,150,60,0.6);font-size:0.9vw;">✉</span></div>`,
      'maintenance-key':   `<div style="width:100%;height:100%;background:#0e1a14;border:1px solid rgba(0,200,120,0.5);border-radius:2px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 6px rgba(0,200,120,0.2);"><span style="font-size:1.3vw;filter:drop-shadow(0 0 4px rgba(0,200,120,0.5));">🗝️</span></div>`,
      'office-id-card':    `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a1008,#120c06);border:1px solid rgba(200,160,60,0.5);border-radius:3px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px rgba(200,150,40,0.25);"><span style="color:rgba(200,160,60,0.8);font-size:0.8vw;font-family:monospace;">ID</span></div>`,
      'security-pass':     `<div style="width:100%;height:100%;background:linear-gradient(135deg,#0e1428,#0a1020);border:1px solid rgba(80,140,255,0.55);border-radius:3px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px rgba(80,140,255,0.25);"><span style="color:rgba(80,140,255,0.8);font-size:0.7vw;font-family:monospace;">SEC</span></div>`,
      'bypass-chip':          `<div style="width:100%;height:100%;background:#12100a;border:1px solid rgba(255,160,40,0.5);border-radius:2px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 6px rgba(255,160,40,0.2);"><span style="font-size:1vw;filter:drop-shadow(0 0 3px rgba(255,160,40,0.5));">🔌</span></div>`,
      'secret-classified-doc':`<div style="width:100%;height:100%;background:#0e0e18;border:1px solid rgba(200,50,50,0.5);border-radius:2px;display:flex;align-items:center;justify-content:center;transform:rotate(-2deg);box-shadow:0 0 6px rgba(200,0,0,0.2);"><span style="color:rgba(220,80,80,0.8);font-size:0.7vw;font-family:monospace;letter-spacing:0.1em;">CLASSIFIED</span></div>`,
      // Blackwood pickupables
      'bw-service-key':  `<div style="width:100%;height:100%;background:#1a1208;border:1px solid rgba(180,140,60,0.6);border-radius:2px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 6px rgba(160,120,40,0.3);"><span style="font-size:1.3vw;filter:drop-shadow(0 0 4px rgba(180,140,60,0.5));">🗝️</span></div>`,
      'bw-director-key': `<div style="width:100%;height:100%;background:#100808;border:1px solid rgba(140,100,60,0.7);border-radius:2px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 6px rgba(140,100,60,0.3);"><span style="font-size:1.3vw;filter:drop-shadow(0 0 4px rgba(140,100,60,0.5));">🗝️</span></div>`,
      'bw-master-key':   `<div style="width:100%;height:100%;background:#200e08;border:1px solid rgba(192,57,43,0.7);border-radius:2px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px rgba(192,57,43,0.35);"><span style="font-size:1.3vw;filter:drop-shadow(0 0 6px rgba(192,57,43,0.6));">🔑</span></div>`,
      // Meridian pickupables
      'ms-crew-id':      `<div style="width:100%;height:100%;background:#020a14;border:1px solid rgba(0,150,200,0.6);border-radius:2px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 6px rgba(0,150,200,0.25);"><span style="font-size:1.3vw;filter:drop-shadow(0 0 4px rgba(0,191,255,0.5));">🪪</span></div>`,
    };
    return ITEM_SVGS[item.id] || `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><span style="font-size:1.2vw;opacity:0.7;">◆</span></div>`;
  }
}
