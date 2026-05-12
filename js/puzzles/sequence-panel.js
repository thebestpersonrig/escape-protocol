// Simon-says sequence puzzle — Access Control Panel
import { AudioSystem } from '../audio.js';

const SYMBOLS = [
  { sym: '⬡', name: 'ALPHA', color: '#4080ff', glow: 'rgba(64,128,255,0.6)'  },
  { sym: '◈', name: 'BETA',  color: '#ff4060', glow: 'rgba(255,64,96,0.6)'   },
  { sym: '⬟', name: 'GAMMA', color: '#40d890', glow: 'rgba(64,216,144,0.6)'  },
  { sym: '✦', name: 'DELTA', color: '#ffb040', glow: 'rgba(255,176,64,0.6)'  },
];

const delay = ms => new Promise(r => setTimeout(r, ms));

export function init(container, puzzleState, callbacks) {
  const sequence = puzzleState.sequence?.length ? puzzleState.sequence : [2, 0, 3, 1, 2];

  let phase     = 'watch';  // 'watch' | 'repeat'
  let playerIdx = 0;
  let locked    = false;

  container.innerHTML = `
    <div class="puzzle-title">◈ ACCESS CONTROL PANEL ◈</div>
    <div class="puzzle-subtitle" id="seq-status">Watch the sequence…</div>
    <div class="seq-grid" id="seq-grid"></div>
    <div class="seq-track" id="seq-track"></div>
  `;

  const grid    = container.querySelector('#seq-grid');
  const status  = container.querySelector('#seq-status');
  const track   = container.querySelector('#seq-track');

  // ── Build buttons ──────────────────────────────────────────────
  SYMBOLS.forEach((s, idx) => {
    const btn = document.createElement('button');
    btn.className  = 'seq-btn';
    btn.dataset.idx = idx;
    btn.style.cssText = `--seq-color:${s.color};--seq-glow:${s.glow};`;
    btn.innerHTML = `<span class="seq-sym">${s.sym}</span><span class="seq-label">${s.name}</span>`;
    btn.addEventListener('click', () => {
      if (phase !== 'repeat' || locked) return;
      handlePress(idx);
    });
    grid.appendChild(btn);
  });

  // ── Progress track ─────────────────────────────────────────────
  function renderTrack() {
    track.innerHTML = sequence.map((_, i) => {
      const cls = i < playerIdx ? 'seq-pip filled' : 'seq-pip';
      return `<span class="${cls}"></span>`;
    }).join('');
  }

  // ── Flash one button ───────────────────────────────────────────
  function flashBtn(idx, ms = 450) {
    return new Promise(resolve => {
      const btn = grid.querySelector(`[data-idx="${idx}"]`);
      btn?.classList.add('lit');
      setTimeout(() => {
        btn?.classList.remove('lit');
        setTimeout(resolve, 80);
      }, ms);
    });
  }

  // ── Playback phase ─────────────────────────────────────────────
  async function playSequence() {
    phase     = 'watch';
    playerIdx = 0;
    locked    = true;
    grid.classList.add('seq-watching');
    status.textContent = 'Watch the sequence…';
    renderTrack();

    await delay(700);
    for (const idx of sequence) {
      AudioSystem.play('keypad-click');
      await flashBtn(idx, 480);
      await delay(130);
    }
    await delay(350);

    phase  = 'repeat';
    locked = false;
    grid.classList.remove('seq-watching');
    status.textContent = 'Repeat the sequence!';
  }

  // ── Player input ───────────────────────────────────────────────
  function handlePress(idx) {
    if (locked) return;
    const expected = sequence[playerIdx];

    if (idx !== expected) {
      locked = true;
      flashBtn(idx, 280);
      status.textContent = '✗ Incorrect — watch again…';
      callbacks.onFailure();
      setTimeout(() => playSequence(), 1400);
    } else {
      flashBtn(idx, 280);
      playerIdx++;
      renderTrack();

      if (playerIdx >= sequence.length) {
        locked = true;
        status.textContent = '✓ Access granted';
        setTimeout(() => callbacks.onSuccess(), 600);
      }
    }
  }

  renderTrack();
  playSequence();
}

export function destroy(container) {
  container.innerHTML = '';
}
