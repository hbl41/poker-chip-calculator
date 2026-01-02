(function () {
  const playerCountInput = document.getElementById('player-count');
  const playerMinusBtn = document.getElementById('player-minus');
  const playerPlusBtn = document.getElementById('player-plus');

  const colorMinusBtn = document.getElementById('color-minus');
  const colorPlusBtn = document.getElementById('color-plus');
  const colorCountEl = document.getElementById('color-count');

  const invMinusBtn = document.getElementById('inv-minus');
  const invPlusBtn = document.getElementById('inv-plus');
  const invCountEl = document.getElementById('inv-count');

  const chipRowsEl = document.getElementById('chip-rows');
  const invRowsEl = document.getElementById('inv-rows');

  const buyInEl = document.getElementById('buy-in');
  const chipsInPlayEl = document.getElementById('chips-in-play');
  const valueInPlayEl = document.getElementById('value-in-play');

  const invTotalOwnedEl = document.getElementById('inv-total-owned');

  // Fixed inventory color set (you fill in value + owned)
  const DEFAULT_INVENTORY = [
    { name: 'White', value: 0, owned: 0 },
    { name: 'Pink', value: 0, owned: 0 },
    { name: 'Red', value: 0, owned: 0 },
    { name: 'Green', value: 0, owned: 0 },
    { name: 'Black', value: 0, owned: 0 },
    { name: 'Orange', value: 0, owned: 0 },
    { name: 'Blue', value: 0, owned: 0 }
  ];

  const LS_PLAYERS_KEY = 'pokerChipPlayers_v6';
  const LS_ROWS_KEY = 'pokerChipRows_v6';
  const LS_INV_KEY = 'pokerChipInventory_v6';

  function toInt(v, fallback) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  }

  function normalizeColorName(name) {
    return (name || '').trim().toLowerCase();
  }

  function getPlayers() {
    return Math.max(1, toInt(playerCountInput.value, 1));
  }

  function formatCurrency(n) {
    const num = Number.isFinite(n) ? n : 0;
    return '$' + num.toFixed(2);
  }

  function dashboardRowCount() {
    return chipRowsEl.querySelectorAll('tr').length;
  }

  function inventoryRowCount() {
    return invRowsEl.querySelectorAll('tr').length;
  }

  function updateDashboardCount() {
    if (colorCountEl) colorCountEl.textContent = String(dashboardRowCount());
  }

  function updateInventoryCount() {
    if (invCountEl) invCountEl.textContent = String(inventoryRowCount());
  }

  function getInventoryMap() {
    const map = Object.create(null);
    invRowsEl.querySelectorAll('tr').forEach(tr => {
      const name = tr.querySelector('.inv-color').value;
      const value = parseFloat(tr.querySelector('.inv-value').value) || 0;
      const owned = parseFloat(tr.querySelector('.inv-owned').value) || 0;
      const key = normalizeColorName(name);
      if (key) map[key] = { value, owned };
    });
    return map;
  }

  function updateInventoryTotals() {
    let totalOwned = 0;
    invRowsEl.querySelectorAll('tr').forEach(tr => {
      totalOwned += parseFloat(tr.querySelector('.inv-owned').value) || 0;
    });
    if (invTotalOwnedEl) invTotalOwnedEl.textContent = String(totalOwned);
  }

  function saveState() {
    localStorage.setItem(LS_PLAYERS_KEY, String(getPlayers()));

    const dashboardData = [];
    chipRowsEl.querySelectorAll('tr').forEach(tr => {
      const color = tr.querySelector('.color-select').value || '';
      const perPlayer = parseFloat(tr.querySelector('.chips-per-player').value) || 0;
      dashboardData.push({ color, perPlayer });
    });
    localStorage.setItem(LS_ROWS_KEY, JSON.stringify(dashboardData));

    const invData = [];
    invRowsEl.querySelectorAll('tr').forEach(tr => {
      invData.push({
        name: tr.querySelector('.inv-color').value,
        value: parseFloat(tr.querySelector('.inv-value').value) || 0,
        owned: parseFloat(tr.querySelector('.inv-owned').value) || 0
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

    chipRowsEl.querySelectorAll('tr').forEach(tr => {
      const selectEl = tr.querySelector('.color-select');
      const valueSpan = tr.querySelector('.chip-value');

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

      const invMap = getInventoryMap();
      const key = normalizeColorName(selectEl.value);
      const item = (key && invMap[key]) ? invMap[key] : { value: 0, owned: 0 };
      valueSpan.textContent = formatCurrency(item.value);
    });

    calculate();
  }

  function addDashboardRow(data = {}) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><select class="color-select"></select></td>
      <td><span class="chip-value">$0.00</span></td>
      <td><input class="chips-per-player" type="number" min="0" value="${data.perPlayer != null ? data.perPlayer : ''}"></td>
      <td class="chips-needed">0</td>
      <td class="chips-left">0</td>
      <td><button class="remove-row" type="button">Remove</button></td>
    `;

    const selectEl = tr.querySelector('.color-select');
    const valueSpan = tr.querySelector('.chip-value');
    const perPlayerEl = tr.querySelector('.chips-per-player');

    selectEl.addEventListener('change', () => {
      const invMap = getInventoryMap();
      const key = normalizeColorName(selectEl.value);
      const item = (key && invMap[key]) ? invMap[key] : { value: 0, owned: 0 };
      valueSpan.textContent = formatCurrency(item.value);
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
      const item = (key && invMap[key]) ? invMap[key] : { value: 0, owned: 0 };
      valueSpan.textContent = formatCurrency(item.value);
    }

    updateDashboardCount();
    calculate();
  }

  function addInventoryRow(data = {}) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="inv-color" type="text" value="${data.name || ''}" readonly></td>
      <td><input class="inv-value" type="number" step="0.01" min="0" value="${data.value != null ? data.value : ''}"></td>
      <td><input class="inv-owned" type="number" min="0" value="${data.owned != null ? data.owned : ''}"></td>
      <td><button class="remove-inv-row" type="button" disabled>Remove</button></td>
    `;

    const valueInput = tr.querySelector('.inv-value');
    const ownedInput = tr.querySelector('.inv-owned');

    valueInput.addEventListener('input', () => {
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
    updateInventoryCount();
    updateInventoryTotals();
  }

  function clearDashboardRowInputs(tr) {
    tr.querySelector('.color-select').value = '';
    tr.querySelector('.chip-value').textContent = '$0.00';
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
      const perPlayer = parseFloat(tr.querySelector('.chips-per-player').value) || 0;

      const key = normalizeColorName(selectEl.value);
      const item = (key && invMap[key]) ? invMap[key] : { value: 0, owned: 0 };

      valueSpan.textContent = formatCurrency(item.value);

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

    updateInventoryTotals();
  }

  function loadState() {
    const savedPlayers = localStorage.getItem(LS_PLAYERS_KEY);
    const savedRows = localStorage.getItem(LS_ROWS_KEY);
    const savedInv = localStorage.getItem(LS_INV_KEY);

    if (savedPlayers) playerCountInput.value = String(Math.max(1, toInt(savedPlayers, 2)));

    // Build saved inventory map (if any)
    const savedMap = Object.create(null);
    if (savedInv) {
      try {
        const invData = JSON.parse(savedInv);
        if (Array.isArray(invData)) {
          invData.forEach(r => {
            const k = normalizeColorName(r.name);
            if (!k) return;
            savedMap[k] = {
              value: parseFloat(r.value) || 0,
              owned: parseFloat(r.owned) || 0
            };
          });
        }
      } catch {}
    }

    // Always render fixed inventory colors in fixed order
    DEFAULT_INVENTORY.forEach(row => {
      const k = normalizeColorName(row.name);
      const s = savedMap[k];
      addInventoryRow({
        name: row.name,
        value: s ? s.value : row.value,
        owned: s ? s.owned : row.owned
      });
    });

    refreshColorDropdownOptions();

    // Load dashboard rows
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
    updateInventoryCount();
    updateInventoryTotals();
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

    // Inventory is fixed: disable +/-
    if (invPlusBtn) invPlusBtn.disabled = true;
    if (invMinusBtn) invMinusBtn.disabled = true;
  }

  setupEventListeners();
  loadState();
})();
