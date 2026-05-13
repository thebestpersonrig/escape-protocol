// Web Audio API sound system — graceful fallback if context blocked
export const AudioSystem = {
  ctx: null,
  buffers: {},
  masterGain: null,
  ambientNode: null,
  ambientGain: null,
  alarmNode: null,
  _volume: { master: 0.7, sfx: 1.0, ambient: 0.4 },
  _initialized: false,

  async init() {
    if (this._initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._volume.master;
      this.masterGain.connect(this.ctx.destination);
      this._initialized = true;
      // Resume context (browser autoplay policy)
      if (this.ctx.state === 'suspended') {
        document.addEventListener('click', () => this.ctx.resume(), { once: true });
      }
    } catch (e) {
      console.warn('[Audio] Web Audio not available:', e);
    }
  },

  // Generate procedural sounds with oscillators (no asset files needed)
  _makeTone(frequency, type, duration, gainVal, attack = 0.01, release = 0.1) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(gainVal, this.ctx.currentTime + attack);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime + duration - release);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  },

  _makeNoise(duration, gainVal, filterFreq = 2000) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const bufSize = this.ctx.sampleRate * duration;
      const buf  = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
      const src    = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const gain   = this.ctx.createGain();
      src.buffer = buf;
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq;
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      src.start();
    } catch (e) {}
  },

  play(soundId) {
    if (!this.ctx) return;
    const sfx = this._volume.sfx;
    switch (soundId) {
      case 'click-interact': this._makeTone(800, 'sine', 0.06, 0.08 * sfx, 0.005, 0.05); break;
      case 'pick-up':
        this._makeTone(600, 'sine', 0.08, 0.12 * sfx, 0.01, 0.06);
        setTimeout(() => this._makeTone(900, 'sine', 0.1, 0.1 * sfx, 0.01, 0.08), 80);
        break;
      case 'door-unlock':
        this._makeNoise(0.12, 0.15 * sfx, 400);
        setTimeout(() => this._makeTone(300, 'sawtooth', 0.15, 0.1 * sfx, 0.01, 0.12), 100);
        break;
      case 'door-locked':
        this._makeTone(150, 'square', 0.2, 0.12 * sfx, 0.005, 0.15);
        setTimeout(() => this._makeTone(120, 'square', 0.15, 0.08 * sfx, 0.005, 0.12), 200);
        break;
      case 'puzzle-success':
        [0, 80, 160, 240].forEach((delay, i) => {
          setTimeout(() => this._makeTone([523, 659, 784, 1047][i], 'sine', 0.25, 0.15 * sfx, 0.01, 0.2), delay);
        });
        break;
      case 'puzzle-fail':
        this._makeTone(180, 'sawtooth', 0.3, 0.2 * sfx, 0.005, 0.25);
        setTimeout(() => this._makeTone(140, 'sawtooth', 0.3, 0.15 * sfx, 0.005, 0.25), 150);
        break;
      case 'paper-rustle':
        this._makeNoise(0.15, 0.05 * sfx, 800);
        break;
      case 'keypad-beep':
        this._makeTone(1200, 'sine', 0.08, 0.1 * sfx, 0.005, 0.06);
        break;
      case 'spark':
        this._makeNoise(0.1, 0.3 * sfx, 3000);
        break;
      case 'lever-click':
        // Mechanical thunk: noise burst + low sawtooth thud
        this._makeNoise(0.04, 0.18 * sfx, 280);
        setTimeout(() => this._makeTone(65, 'sawtooth', 0.1, 0.14 * sfx, 0.002, 0.09), 8);
        break;
    }
  },

  setAmbient(soundId) {
    if (!this.ctx) return;
    // Stop old
    try { this.ambientNode?.stop(); } catch (e) {}
    try {
      // Simple procedural ambient: low drone
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const lfo  = this.ctx.createOscillator();
      const lfoG = this.ctx.createGain();
      const gain = this.ctx.createGain();

      const freqMap = {
        'ambient-hum':    [60, 120],
        'ambient-server': [80, 160],
        'ambient-final':  [40, 80],
        'ambient-creep':  [32, 48],
      };
      const [f1, f2] = freqMap[soundId] || [60, 120];
      const isCreep = soundId === 'ambient-creep';

      osc1.type = 'sine';     osc1.frequency.value = f1;
      osc2.type = isCreep ? 'triangle' : 'sine'; osc2.frequency.value = f2;
      lfo.type  = 'sine';     lfo.frequency.value  = isCreep ? 0.04 : 0.08;
      lfoG.gain.value = isCreep ? 0.025 : 0.008;

      lfo.connect(lfoG);
      lfoG.connect(osc1.frequency);

      // Creep mode: slow volume tremolo makes the drone "breathe" unsettlingly
      let volLfo = null;
      if (isCreep) {
        volLfo = this.ctx.createOscillator();
        const volLfoG = this.ctx.createGain();
        volLfo.type = 'sine';
        volLfo.frequency.value = 0.11;
        volLfoG.gain.value = 0.06;
        volLfo.connect(volLfoG);
        volLfoG.connect(gain.gain);
        volLfo.start();
      }

      gain.gain.value = this._volume.ambient;
      this.ambientGain = gain; // expose for live volume adjustment
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(); osc2.start(); lfo.start();
      this.ambientNode = { stop: () => {
        try { osc1.stop(); osc2.stop(); lfo.stop(); } catch(e){}
        try { if (volLfo) volLfo.stop(); } catch(e){}
      }};
    } catch (e) {}
  },

  playAlarm() {
    if (!this.ctx) return;
    this.stopAlarm();
    const loop = () => {
      if (!this._alarmActive) return;
      this._makeTone(880, 'square', 0.4, 0.25, 0.01, 0.1);
      setTimeout(() => { if (this._alarmActive) { this._makeTone(660, 'square', 0.4, 0.2, 0.01, 0.1); setTimeout(loop, 900); } }, 450);
    };
    this._alarmActive = true;
    loop();
  },

  stopAlarm() {
    this._alarmActive = false;
  },
};
