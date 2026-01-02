(function () {
  const playerCountInput = document.getElementById('player-count');
  const playerMinusBtn = document.getElementById('player-minus');
  const playerPlusBtn = document.getElementById('player-plus');

  const colorMinusBtn = document.getElementById('color-minus');
  const colorPlusBtn = document.getElementById('color-plus');
  const colorCountEl = document.getElementById('color-count');

  const chipRowsEl = document.getElementById('chip-rows');

  const invRowsEl = document.getElementById('inv-rows');
  const invTotalOwnedEl = document.getElementById('inv-total-owned');

  const buyInEl = document.getElementById('buy-in');
  const chipsInPlayEl = document.getElementById('chips-in-play');
  const valueInPlayEl = document.getElementById('value-in-play');

  const bbAmountInput = document.getElementById('bb-amount');
  const bbsPerPlayerEl = document.getElementById('bbs-per-player');

  // Fixed inventory color set
  const DEFAULT_INVENTORY = [
    { name: 'White', value: 0, denom: '', owned: 0 },
    { name: 'Pink', value: 0, denom: '', owned: 0 },
    { name: 'Red', value: 0, denom: '', owned: 0 },
    { name: 'Green', value: 0, denom: '', owned: 0 },
    { name: 'Black', value: 0, denom: '', owned: 0 },
    { name: 'Orange', value: 0, denom: '', owned: 0 },
    { name: 'Blue', value: 0, denom: '', owned: 0 }
  ];

  const LS_PLAYERS_KEY = 'pokerChipPlayers_v7';
  const LS_ROWS_KEY = 'pokerChipRows_v7';
  const LS_INV_KEY = 'pokerChipInventory_v7';
  const LS_BB_KEY = 'pokerChipBB_v7';

  function toInt(v, fallback) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  }

  function toFloat(v, fallback) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function normalizeColorName(name) {
    return (name || '').trim().toLowerCase();
  }

  function getPlayers() {
    return Math.max(1, toInt(playerCountInput.value, 1));
  }

  function getBB() {
    return Math.max(0, toFloat(bbAmountInput.value, 0));
  }

  function formatCurrency(n) {
    const num = Number.isFinite(n) ? n : 0;
    return '$' + num.toFixed(2);
  }

  function dashboardRowCount() {
    return chipRowsEl.querySelectorAll('tr').length;
  }

  function updateDashboardCount() {
    if (colorCountEl) colorCountEl.textContent = String(dashboardRowCount());
  }

  function getInventoryMap() {
    const map = Object.create(null);
    invRowsEl.querySelectorAll('tr').forEach(tr => {
      const name = tr.querySelector('.inv-color').value;
      const value = toFloat(tr.querySelector('.inv-value').value, 0);
      const denom = (tr.querySelector('.inv-denom').value || '').trim();
      const owned = toFloat(tr.querySelector('.inv-owned').value, 0);
      const key = normalizeColorName(name);
      if (key) map[key] = { value, denom, owned };
    });
    return map;
  }

  function updateInventoryTotals() {
    let totalOwned = 0;
    invRowsEl.querySelectorAll('tr').forEach(tr => {
      totalOwned += toFloat(tr.querySelector('.inv-owned').value, 0);
    });
    if (invTotalOwnedEl) invTotalOwnedEl.textContent = String(totalOwned);
  }

  function saveState() {
    localStorage.setItem(LS_PLAYERS_KEY, String(getPlayers()));
    localStorage.setItem(LS_BB_KEY, String(getBB()));

    const dashboardData = [];
    chipRowsEl.querySelectorAll('tr').forEach(tr => {
      const color = tr.querySelector('.color-select').value || '';
      const perPlayer = toFloat(tr.querySelector('.chips-per-player').value, 0);
      dashboardData.push({ color, perPlayer });
    });
    localStorage.setItem(LS_ROWS_KEY, JSON.stringify(dashboardData));

    const invData = [];
    invRowsEl.querySelectorAll('tr').forEach(tr => {
      invData.push({
        name: tr.querySelector('.inv-color').value,
        value: toFloat(tr.querySelector('.inv-value').value, 0),
        denom: (tr.querySelector('.inv-denom').value || '').trim(),
        owned: toFloat(tr.querySelector('.inv-owned').value, 0)
      });
    });
    localStorage.setItem(LS_INV_KEY, JSON.stringify(invData));
  }

  function refreshColorDropdownOptions() {
    const colorNames = [];
    invRowsEl.querySelectorAll('tr').forEach(tr => {
      const name = tr.querySelector('.inv-color').value.trim();
      if (name) colorNames.push(name);
    });

    const invMap = getInventoryMap();

    chipRowsEl.querySelectorAll('tr').forEach(tr => {
      const selectEl = tr.querySelector('.color-select');
      const valueSpan = tr.querySelector('.chip-value');
      const denomSpan = tr.querySelector('.chip-denom');

      const previous = selectEl.value;

      selectEl.innerHTML = '';
      const emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = '-- Select --';
      selectEl.appendChild(emptyOpt);

      colorNames.forEach(name => {
        const opt = document.createElement('option');
        opt.value = normalizeColorName(name);
        opt.textContent = name;
        selectEl.appendChild(opt);
      });

      const prevKey = normalizeColorName(previous);
      const available = colorNames.map(n => normalizeColorName(n));
      selectEl.value = (previous && available.includes(prevKey)) ? prevKey : '';

      const key = normalizeColorName(selectEl.value);
      const item = (key && invMap[key]) ? invMap[key] : { value: 0, denom: '', owned: 0 };

      valueSpan.textContent = formatCurrency(item.value);
      denomSpan.textContent = item.denom || '';
    });

    calculate();
  }

  function addDashboardRow(data = {}) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><select class="color-select"></select></td>
      <td><span class="chip-value value-display">$0.00</span></td>
      <td><span class="chip-denom value-display"></span></td>
      <td><input class="chips-per-player" type="number" min="0" value="${data.perPlayer != null ? data.perPlayer : ''}"></td>
      <td class="chips-needed">0</td>
      <td class="chips-left">0</td>
      <td><button class="remove-row" type="button">Remove</button></td>
    `;

    const selectEl = tr.querySelector('.color-select');
    const valueSpan = tr.querySelector('.chip-value');
    const denomSpan = tr.querySelector('.chip-denom');
    const perPlayerEl = tr.querySelector('.chips-per-player');

    selectEl.addEventListener('change', () => {
      const invMap = getInventoryMap();
      const key = normalizeColorName(selectEl.value);
      const item = (key && invMap[key]) ? invMap[key] : { value: 0, denom: '', owned: 0 };
      valueSpan.textContent = formatCurrency(item.value);
      denomSpan.textContent = item.denom || '';
      calculate();
      saveState();
    });

    perPlayerEl.addEventListener('input', () => {
      calculate();
      saveState();
    });

    tr.querySelector('.remove-row').addEventListener('click', () => {
      tr.remove();
      if (dashboardRowCount() === 0) addDashboardRow();
      updateDashboardCount();
      calculate();
      saveState();
    });

    chipRowsEl.appendChild(tr);

    refreshColorDropdownOptions();

    if (data.color) {
      selectEl.value = normalizeColorName(data.color);
      const invMap = getInventoryMap();
      const key = normalizeColorName(selectEl.value);
      const item = (key && invMap[key]) ? invMap[key] : { value: 0, denom: '', owned: 0 };
      valueSpan.textContent = formatCurrency(item.value);
      denomSpan.textContent = item.denom || '';
    }

    updateDashboardCount();
    calculate();
  }

  function addInventoryRow(data = {}) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="inv-color" type="text" value="${data.name || ''}" readonly></td>
      <td><input class="inv-value" type="number" step="0.01" min="0" value="${data.value != null ? data.value : ''}"></td>
      <td><input class="inv-denom" type="text" value="${data.denom != null ? data.denom : ''}"></td>
      <td><input class="inv-owned" type="number" min="0" value="${data.owned != null ? data.owned : ''}"></td>
      <td><button class="remove-inv-row" type="button" disabled>Remove</button></td>
    `;

    const valueInput = tr.querySelector('.inv-value');
    const denomInput = tr.querySelector('.inv-denom');
    const ownedInput = tr.querySelector('.inv-owned');

    valueInput.addEventListener('input', () => {
      refreshColorDropdownOptions();
      calculate();
      saveState();
    });

    denomInput.addEventListener('input', () => {
      refreshColorDropdownOptions();
      calculate();
      saveState();
    });

    ownedInput.addEventListener('input', () => {
      updateInventoryTotals();
      calculate();
      saveState();
    });

    invRowsEl.appendChild(tr);
    updateInventoryTotals();
  }

  function clearDashboardRowInputs(tr) {
    tr.querySelector('.color-select').value = '';
    tr.querySelector('.chip-value').textContent = '$0.00';
    tr.querySelector('.chip-denom').textContent = '';
    tr.querySelector('.chips-per-player').value = '';
  }

  function calculate() {
    const players = getPlayers();
    const invMap = getInventoryMap();

    let buyInPerPlayer = 0;
    let totalChipsInPlay = 0;

    chipRowsEl.querySelectorAll('tr').forEach(tr => {
      const selectEl = tr.querySelector('.color-select');
      const valueSpan = tr.querySelector('.chip-value');
      const denomSpan = tr.querySelector('.chip-denom');
      const perPlayer = toFloat(tr.querySelector('.chips-per-player').value, 0);

      const key = normalizeColorName(selectEl.value);
      const item = (key && invMap[key]) ? invMap[key] : { value: 0, denom: '', owned: 0 };

      valueSpan.textContent = formatCurrency(item.value);
      denomSpan.textContent = item.denom || '';

      const needed = players * perPlayer;
      const left = item.owned - needed;

      tr.querySelector('.chips-needed').textContent = String(needed);
      tr.querySelector('.chips-left').textContent = String(left);

      buyInPerPlayer += item.value * perPlayer;
      totalChipsInPlay += needed;
    });

    buyInEl.textContent = formatCurrency(buyInPerPlayer);
    chipsInPlayEl.textContent = String(totalChipsInPlay);
    valueInPlayEl.textContent = formatCurrency(buyInPerPlayer * players);

    const bb = getBB();
    const bbsPerPlayer = bb > 0 ? (buyInPerPlayer / bb) : 0;
    if (bbsPerPlayerEl) bbsPerPlayerEl.textContent = bbsPerPlayer.toFixed(2) + ' BB';

    updateInventoryTotals();
  }

  function loadState() {
    const savedPlayers = localStorage.getItem(LS_PLAYERS_KEY);
    const savedRows = localStorage.getItem(LS_ROWS_KEY);
    const savedInv = localStorage.getItem(LS_INV_KEY);
    const savedBB = localStorage.getItem(LS_BB_KEY);

    if (savedPlayers) playerCountInput.value = String(Math.max(1, toInt(savedPlayers, 2)));
    if (savedBB != null) bbAmountInput.value = String(Math.max(0, toFloat(savedBB, 1)));

    const savedMap = Object.create(null);
    if (savedInv) {
      try {
        const invData = JSON.parse(savedInv);
        if (Array.isArray(invData)) {
          invData.forEach(r => {
            const k = normalizeColorName(r.name);
            if (!k) return;
            savedMap[k] = {
              value: toFloat(r.value, 0),
              denom: (r.denom || '').trim(),
              owned: toFloat(r.owned, 0)
            };
          });
        }
      } catch {}
    }

    DEFAULT_INVENTORY.forEach(row => {
      const k = normalizeColorName(row.name);
      const s = savedMap[k];
      addInventoryRow({
        name: row.name,
        value: s ? s.value : row.value,
        denom: s ? s.denom : row.denom,
        owned: s ? s.owned : row.owned
      });
    });

    refreshColorDropdownOptions();

    if (savedRows) {
      try {
        const rows = JSON.parse(savedRows);
        if (Array.isArray(rows) && rows.length) rows.forEach(r => addDashboardRow(r));
        else addDashboardRow();
      } catch {
        addDashboardRow();
      }
    } else {
      addDashboardRow();
    }

    updateDashboardCount();
    calculate();
  }

  function setupEventListeners() {
    playerMinusBtn.addEventListener('click', () => {
      playerCountInput.value = String(Math.max(1, getPlayers() - 1));
      calculate();
      saveState();
    });

    playerPlusBtn.addEventListener('click', () => {
      playerCountInput.value = String(getPlayers() + 1);
      calculate();
      saveState();
    });

    playerCountInput.addEventListener('input', () => {
      playerCountInput.value = String(getPlayers());
      calculate();
      saveState();
    });

    colorPlusBtn.addEventListener('click', () => {
      addDashboardRow();
      saveState();
    });

    colorMinusBtn.addEventListener('click', () => {
      const rows = chipRowsEl.querySelectorAll('tr');
      if (rows.length > 1) {
        rows[rows.length - 1].remove();
      } else if (rows.length === 1) {
        clearDashboardRowInputs(rows[0]);
      } else {
        addDashboardRow();
      }
      updateDashboardCount();
      calculate();
      saveState();
    });

    bbAmountInput.addEventListener('input', () => {
      calculate();
      saveState();
    });
  }

  setupEventListeners();
  loadState();
})();
