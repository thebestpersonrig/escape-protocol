import { getState, dispatch } from './state.js';

// Mulberry32 — fast seeded PRNG (8 lines)
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Each clue: { id, validSlots[] }
// validSlots are container hotspot IDs where this clue can appear
const CLUE_ITEMS = [
  {
    id: 'sticky-note',
    validSlots: ['entry-drawer', 'entry-note-wall'],  // The keypad code note
  },
  {
    id: 'screwdriver',
    validSlots: ['lab-cabinet-left', 'lab-cabinet-right'],
  },
  {
    id: 'keycard-a',
    validSlots: ['entry-vent', 'entry-drawer'],
  },
  {
    id: 'wire-cutter',
    validSlots: ['lab-cabinet-right', 'lab-locker'],
  },
  {
    id: 'fuse',
    validSlots: ['lab-locker', 'lab-cabinet-left'],
  },
  {
    id: 'server-diagram',
    validSlots: ['lab-cabinet-left', 'lab-locker'],
  },
  {
    id: 'lever-diagram',
    validSlots: ['server-panel', 'server-wire-panel'],
  },
];

export function initClueLocations(seed) {
  const rng = mulberry32(seed);
  const clueLocations = {};

  for (const clue of CLUE_ITEMS) {
    const idx = Math.floor(rng() * clue.validSlots.length);
    clueLocations[clue.id] = clue.validSlots[idx];
  }

  dispatch('SET_CLUE_LOCATIONS', { clueLocations });
}
