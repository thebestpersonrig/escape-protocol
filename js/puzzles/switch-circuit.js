// Switch Circuit puzzle — match the target switch pattern to unlock

export function init(container, puzzleState, callbacks) {
  const target  = puzzleState.pattern ?? [1, 0, 1, 1];
  const labels  = ['A', 'B', 'C', 'D'];
  let   state   = [0, 0, 0, 0];
  let   solved  = false;

  function check() {
    if (solved) return;
    const match = state.every((v, i) => v === target[i]);
    if (match) {
      solved = true;
      document.getElementById('sc-status').textContent = '✓ CIRCUIT COMPLETE';
      document.getElementById('sc-status').style.color = '#00ff88';
      setTimeout(() => callbacks.onSuccess(), 700);
    }
  }

  function render() {
    const switchesHTML = state.map((v, i) => `
      <div class="sc-switch" data-idx="${i}"
           style="display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;user-select:none;">
        <div style="color:rgba(160,210,255,0.45);font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.15em;">${labels[i]}</div>
        <div style="
          width:36px;height:62px;
          background:${v ? '#001a10' : '#1a0005'};
          border:2px solid ${v ? '#00cc66' : '#cc2020'};
          border-radius:6px;position:relative;
          transition:background 0.15s,border-color 0.15s;
          box-shadow:${v ? '0 0 12px rgba(0,200,100,0.25)' : '0 0 12px rgba(200,30,30,0.15)'};
        ">
          <div style="
            position:absolute;${v ? 'top:5px' : 'bottom:5px'};
            left:50%;transform:translateX(-50%);
            width:22px;height:22px;
            background:${v ? '#00ff88' : '#ff4444'};
            border-radius:3px;
            box-shadow:0 0 10px ${v ? 'rgba(0,255,136,0.8)' : 'rgba(255,68,68,0.7)'};
            transition:top 0.15s,bottom 0.15s,background 0.15s;
          "></div>
        </div>
        <div style="color:${v ? '#00ff88' : '#ff4444'};font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.12em;min-width:28px;text-align:center;">${v ? 'ON' : 'OFF'}</div>
      </div>
    `).join('');

    const targetHTML = target.map((v, i) => `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
        <div style="color:rgba(160,210,255,0.3);font-family:'Courier New',monospace;font-size:10px;">${labels[i]}</div>
        <div style="
          width:36px;height:22px;
          background:${v ? 'rgba(0,255,136,0.15)' : 'rgba(255,68,68,0.12)'};
          border:1px solid ${v ? 'rgba(0,255,136,0.5)' : 'rgba(255,68,68,0.45)'};
          border-radius:3px;
          display:flex;align-items:center;justify-content:center;
          color:${v ? '#00ff88' : '#ff4444'};
          font-family:'Courier New',monospace;font-size:13px;
        ">${v ? '█' : '○'}</div>
      </div>
    `).join('');

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:22px;padding:24px 16px;font-family:'Courier New',monospace;">

        <div style="color:rgba(0,210,160,0.8);font-size:12px;letter-spacing:0.25em;text-transform:uppercase;">
          Specimen Vault — Circuit Lock
        </div>

        <div style="
          display:flex;flex-direction:column;align-items:center;gap:8px;
          background:rgba(0,20,15,0.55);
          border:1px solid rgba(0,180,120,0.25);
          border-radius:6px;padding:12px 24px;
        ">
          <div style="color:rgba(0,170,110,0.55);font-size:10px;letter-spacing:0.18em;margin-bottom:2px;">TARGET PATTERN</div>
          <div style="display:flex;gap:16px;">${targetHTML}</div>
        </div>

        <div style="
          display:flex;flex-direction:column;align-items:center;gap:6px;
        ">
          <div style="color:rgba(130,180,200,0.4);font-size:10px;letter-spacing:0.15em;margin-bottom:4px;">CURRENT STATE</div>
          <div style="display:flex;gap:20px;" id="sc-switches">${switchesHTML}</div>
        </div>

        <div id="sc-status" style="color:rgba(0,200,150,0.4);font-size:11px;letter-spacing:0.15em;min-height:18px;"></div>

      </div>
    `;

    container.querySelectorAll('.sc-switch').forEach(el => {
      el.addEventListener('click', () => {
        if (solved) return;
        const idx = parseInt(el.dataset.idx);
        state[idx] = state[idx] ? 0 : 1;
        render();
        check();
      });
    });
  }

  render();
}

export function destroy(container) {
  container.innerHTML = '';
}
