import { dispatch } from './state.js';

// Mulberry32 — fast seeded PRNG (8 lines)
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Items that can appear in alternate containers (both slots defined in the room JSONs)
const CLUE_ITEMS = [
  { id: 'wire-cutter',    validSlots: ['lab-cabinet-left', 'lab-cabinet-right'] },
  { id: 'fuse',           validSlots: ['lab-cabinet-left', 'lab-locker'] },
  { id: 'server-diagram', validSlots: ['lab-cabinet-left', 'lab-locker'] },
  { id: 'lever-diagram',  validSlots: ['lab-cabinet-right', 'lab-locker'] },
];

// Possible terminal passwords — shown on the server-diagram clue
const PASSWORDS = [
  'PROMETHEUS', 'ARGONAUT', 'MERIDIAN', 'CATALYST',
  'EXODUS',     'SENTINEL', 'PHANTOM',  'NEXUS',
  'ECLIPSE',    'HELIOS',
];

export function initClueLocations(seed) {
  const rng = mulberry32(seed);

  // --- Item spawn locations ---
  const clueLocations = {};
  for (const clue of CLUE_ITEMS) {
    const idx = Math.floor(rng() * clue.validSlots.length);
    clueLocations[clue.id] = clue.validSlots[idx];
  }
  dispatch('SET_CLUE_LOCATIONS', { clueLocations });

  // --- Keypad code (4 digits, no leading zero) ---
  const first = Math.floor(rng() * 9) + 1;
  const rest  = Array.from({ length: 3 }, () => Math.floor(rng() * 10));
  const keypadCode = [first, ...rest].join('');
  dispatch('SET_KEYPAD_CODE', { keypadCode });

  // --- Terminal password ---
  const password = PASSWORDS[Math.floor(rng() * PASSWORDS.length)];
  dispatch('SET_TERMINAL_PASSWORD', { password });

  // --- Lever pattern (4 bits, not all-same) ---
  let pattern;
  do {
    pattern = [0, 1, 2, 3].map(() => Math.floor(rng() * 2));
  } while (pattern.every(p => p === 0) || pattern.every(p => p === 1));
  dispatch('SET_LEVER_PATTERN', { pattern });
}
