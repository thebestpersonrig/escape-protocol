import { dispatch } from './state.js';

/**
 * Remix puzzle solutions for New Game+.
 * Uses a seeded RNG so clue items still match their remixed codes.
 * The seed is stored in state so saves preserve the remix.
 */

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

function randCode(rng, digits) {
  let code = '';
  for (let i = 0; i < digits; i++) code += randInt(rng, 0, 9);
  return code;
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randPattern(rng, length) {
  return Array.from({ length }, () => rng() > 0.5 ? 1 : 0);
}

const PASSWORDS = [
  'PROMETHEUS', 'DAEDALUS', 'ATHENA', 'ICARUS', 'ORPHEUS',
  'BLACKWOOD', 'MERIDIAN', 'GENESIS', 'REACTOR', 'OVERRIDE',
  'CONTAINMENT', 'PROTOCOL', 'LOCKDOWN', 'SPECTRE', 'NEMESIS',
];

export function remixPuzzles(seed) {
  const rng = mulberry32(seed);

  // Arcadia remixes
  const keypadCode = randCode(rng, 4);
  const leverPattern = randPattern(rng, 4);
  const terminalPassword = PASSWORDS[randInt(rng, 0, PASSWORDS.length - 1)];
  const directorSafeCode = randCode(rng, 4);
  const bioSwitchPattern = randPattern(rng, 4);
  const powerFrequency = randInt(rng, 200, 800);

  dispatch('SET_KEYPAD_CODE', { keypadCode });
  dispatch('SET_LEVER_PATTERN', { pattern: leverPattern });
  dispatch('SET_TERMINAL_PASSWORD', { password: terminalPassword });
  dispatch('SET_DIRECTOR_SAFE_CODE', { code: directorSafeCode });
  dispatch('SET_BIO_SWITCH_PATTERN', { pattern: bioSwitchPattern });
  dispatch('SET_POWER_FREQUENCY', { frequency: powerFrequency });

  // For Blackwood/Meridian, remix their keypad codes too
  // These use the same dispatch actions since state stores them generically
  // The mission config puzzle codes get overwritten by these dispatches

  return {
    keypadCode,
    leverPattern,
    terminalPassword,
    directorSafeCode,
    bioSwitchPattern,
    powerFrequency,
  };
}
