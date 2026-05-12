import { getState, dispatch } from '../state.js';

export function init(container, puzzleState, callbacks, puzzleId = 'lever-combo') {
  const pattern = getState().leverPattern || [1, 0, 1, 0];
  let positions = puzzleState.leverPositions?.slice() || [0, 0, 0, 0];

  container.innerHTML = `
    <div class="puzzle-title">⬡ LEVER CONTROL PANEL ⬡</div>
    <div class="puzzle-subtitle">Set the levers to match the correct sequence</div>
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
      <div style="margin-top:16px;text-align:center;font-size:11px;color:var(--text-dim);font-family:var(--font-mono);font-style:italic;">
        Where have I seen this sequence before...?
      </div>
      <button class="lever-btn" id="lever-submit" style="margin-top:14px;">ENGAGE</button>
    </div>
    <div style="margin-top:10px;font-size:11px;color:var(--text-dim);text-align:center;font-family:var(--font-mono);">
      Attempts: <span id="lever-att">${puzzleState.attempts || 0}</span>
    </div>
  `;

  const tracks = container.querySelectorAll('.lever-track');
  tracks.forEach(track => {
    track.addEventListener('click', () => {
      const i = parseInt(track.dataset.lever);
      positions[i] = positions[i] ? 0 : 1;
      track.classList.toggle('up', !!positions[i]);
      dispatch('UPDATE_LEVER_POSITIONS', { puzzleId, positions });
    });
  });

  container.querySelector('#lever-submit')?.addEventListener('click', () => {
    const attEl   = container.querySelector('#lever-att');
    const correct = pattern.every((p, i) => p === positions[i]);
    if (correct) {
      tracks.forEach(t => {
        t.style.borderColor = '#00ff88';
        t.querySelector('.lever-handle').style.background = '#00ff88';
      });
      setTimeout(() => callbacks.onSuccess(), 600);
    } else {
      attEl.textContent = parseInt(attEl.textContent) + 1;
      const row = container.querySelector('#lever-row');
      row.style.animation = 'shake 0.4s ease';
      setTimeout(() => row.style.animation = '', 400);
      callbacks.onFailure();
    }
  });
}

export function destroy(container) {
  container.innerHTML = '';
}
