// Lever combination puzzle — set 4 levers to the correct UP/DOWN pattern
// Pattern: 1=UP, 0=DOWN.  Matches the diagram clue: [ ↑ ][ ↓ ][ ↑ ][ ↓ ]
const PATTERN = [1, 0, 1, 0];

export function init(container, puzzleState, callbacks) {
  const pattern = PATTERN;
  let positions = puzzleState.leverPositions?.slice() || [0, 0, 0, 0];

  container.innerHTML = `
    <div class="puzzle-title">⬡ LEVER CONTROL PANEL ⬡</div>
    <div class="puzzle-subtitle">Set the levers to match the diagram</div>
    <div class="lever-wrap">
      <div class="lever-row" id="lever-row">
        ${[0,1,2,3].map(i => `
          <div class="lever-unit">
            <div class="lever-track ${positions[i] ? 'up' : ''}" data-lever="${i}">
              <div class="lever-handle"></div>
            </div>
            <div class="lever-label">L${i+1}</div>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:16px;display:flex;gap:8px;align-items:center;justify-content:center;">
        <div style="font-size:11px;color:var(--text-dim);font-family:var(--font-mono);">Pattern from diagram:</div>
        <div style="display:flex;gap:6px;" id="pattern-hint"></div>
      </div>
      <button class="lever-btn" id="lever-submit" style="margin-top:14px;">ENGAGE</button>
    </div>
    <div style="margin-top:10px;font-size:11px;color:var(--text-dim);text-align:center;font-family:var(--font-mono);">
      Attempts: <span id="lever-att">${puzzleState.attempts || 0}</span>
    </div>
  `;

  // Show pattern hint (only visible if player has lever-diagram in inventory)
  const hintEl = container.querySelector('#pattern-hint');
  const hasClue = getState ? true : false; // always show the mini hint
  pattern.forEach(p => {
    const dot = document.createElement('div');
    dot.style.cssText = `width:14px;height:14px;border-radius:2px;background:${p ? 'var(--accent)' : '#2a2a3a'};border:1px solid ${p ? 'var(--accent)' : '#3a3a4a'};`;
    hintEl.appendChild(dot);
  });

  const tracks = container.querySelectorAll('.lever-track');
  tracks.forEach(track => {
    track.addEventListener('click', () => {
      const i = parseInt(track.dataset.lever);
      positions[i] = positions[i] ? 0 : 1;
      track.classList.toggle('up', !!positions[i]);
      import('../state.js').then(m => m.dispatch('UPDATE_LEVER_POSITIONS', { puzzleId: 'lever-combo', positions }));
    });
  });

  container.querySelector('#lever-submit')?.addEventListener('click', () => {
    const attEl = container.querySelector('#lever-att');
    const correct = pattern.every((p, i) => p === positions[i]);
    if (correct) {
      // Flash all green
      tracks.forEach(t => { t.style.borderColor = '#00ff88'; t.querySelector('.lever-handle').style.background = '#00ff88'; });
      setTimeout(() => callbacks.onSuccess(), 600);
    } else {
      attEl.textContent = parseInt(attEl.textContent) + 1;
      // Shake
      const row = container.querySelector('#lever-row');
      row.style.animation = 'shake 0.4s ease';
      setTimeout(() => row.style.animation = '', 400);
      callbacks.onFailure();
    }
  });
}

function getState() { return null; }

export function destroy(container) {
  container.innerHTML = '';
}
