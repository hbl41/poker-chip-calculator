(function () {
  const chipRowsEl = document.getElementById('chip-rows');
  const invRowsEl = document.getElementById('inv-rows');

  const playerCountInput = document.getElementById('player-count');
  const bbAmountInput = document.getElementById('bb-amount');

  const buyInEl = document.getElementById('buy-in');
  const chipsInPlayEl = document.getElementById('chips-in-play');
  const valueInPlayEl = document.getElementById('value-in-play');
  const bbsPerPlayerEl = document.getElementById('bbs-per-player');
  const invTotalOwnedEl = document.getElementById('inv-total-owned');

  function normalize(name) {
    return (name || '').trim().toLowerCase();
  }

  function currency(v) {
    return '$' + (Number(v) || 0).toFixed(2);
  }

  function getInventory() {
    const map = {};
    invRowsEl.querySelectorAll('tr').forEach(r => {
      const name = r.querySelector('.inv-color').value;
      const key = normalize(name);
      if (!key) return;
      map[key] = {
        value: Number(r.querySelector('.inv-value').value) || 0,
        denom: r.querySelector('.inv-denom').value || '',
        owned: Number(r.querySelector('.inv-owned').value) || 0
      };
    });
    return map;
  }

  function recalc() {
    const players = Number(playerCountInput.value) || 1;
    const bb = Number(bbAmountInput.value) || 0;
    const inv = getInventory();

    let buyIn = 0;
    let totalChips = 0;
    let invTotal = 0;

    Object.values(inv).forEach(i => invTotal += i.owned);
    invTotalOwnedEl.textContent = invTotal;

    chipRowsEl.querySelectorAll('tr').forEach(r => {
      const color = r.querySelector('.color-select').value;
      const per = Number(r.querySelector('.chips-per-player').value) || 0;
      const item = inv[color] || { value: 0, denom: '', owned: 0 };

      const needed = players * per;
      const left = item.owned - needed;

      r.querySelector('.chip-value').textContent = currency(item.value);
      r.querySelector('.chip-denom').textContent = item.denom;
      r.querySelector('.chips-needed').textContent = needed;
      r.querySelector('.inv-left').textContent = left;
      r.querySelector('.buyins-left').textContent =
        needed > 0 ? (left / needed).toFixed(2) : '—';

      buyIn += item.value * per;
      totalChips += needed;
    });

    buyInEl.textContent = currency(buyIn);
    chipsInPlayEl.textContent = totalChips;
    valueInPlayEl.textContent = currency(buyIn * players);
    bbsPerPlayerEl.textContent = bb > 0 ? (buyIn / bb).toFixed(2) + ' BB' : '0 BB';
  }

  function addInventoryRow() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="inv-color"></td>
      <td><input class="inv-value" type="number" step="0.01"></td>
      <td><input class="inv-denom"></td>
      <td><input class="inv-owned" type="number"></td>
      <td><button>Remove</button></td>
    `;
    tr.querySelectorAll('input').forEach(i => i.oninput = recalc);
    tr.querySelector('button').onclick = () => {
      tr.remove();
      recalc();
    };
    invRowsEl.appendChild(tr);
  }

  function addDashboardRow() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><select class="color-select"></select></td>
      <td><span class="chip-value">$0.00</span></td>
      <td><span class="chip-denom"></span></td>
      <td><input class="chips-per-player" type="number"></td>
      <td class="chips-needed">0</td>
      <td class="inv-left">0</td>
      <td class="buyins-left">—</td>
      <td><button>Remove</button></td>
    `;
    tr.querySelectorAll('input,select').forEach(i => i.oninput = recalc);
    tr.querySelector('button').onclick = () => {
      tr.remove();
      recalc();
    };
    chipRowsEl.appendChild(tr);
    refreshDropdowns();
  }

  function refreshDropdowns() {
    const colors = [];
    invRowsEl.querySelectorAll('.inv-color').forEach(i => {
      if (i.value.trim()) colors.push(i.value.trim());
    });

    chipRowsEl.querySelectorAll('.color-select').forEach(s => {
      const prev = s.value;
      s.innerHTML = '<option value="">-- Select --</option>';
      colors.forEach(c => {
        const o = document.createElement('option');
        o.value = normalize(c);
        o.textContent = c;
        s.appendChild(o);
      });
      s.value = prev;
    });
    recalc();
  }

  for (let i = 0; i < 7; i++) addInventoryRow();
  for (let i = 0; i < 3; i++) addDashboardRow();

  recalc();
})();
