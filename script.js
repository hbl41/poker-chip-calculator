(function() {
  // Cache elements
  const playerCountInput = document.getElementById('player-count');
  const playerMinusBtn   = document.getElementById('player-minus');
  const playerPlusBtn    = document.getElementById('player-plus');

  const colorMinusBtn = document.getElementById('color-minus');
  const colorPlusBtn  = document.getElementById('color-plus');
  const colorCountEl  = document.getElementById('color-count');

  const invMinusBtn = document.getElementById('inv-minus');
  const invPlusBtn  = document.getElementById('inv-plus');
  const invCountEl  = document.getElementById('inv-count');

  const chipRowsEl = document.getElementById('chip-rows');
  const invRowsEl  = document.getElementById('inv-rows');

  const buyInEl       = document.getElementById('buy-in');
  const chipsInPlayEl = document.getElementById('chips-in-play');
  const valueInPlayEl = document.getElementById('value-in-play');

  // Default inventory data
  const DEFAULT_INVENTORY = [
    { name: 'White',  value: 0, owned: 500 },
    { name: 'Pink',   value: 0, owned: 500 },
    { name: 'Red',    value: 0, owned: 500 },
    { name: 'Green',  value: 0, owned: 500 },
    { name: 'Black',  value: 0, owned: 500 },
    { name: 'Orange', value: 0, owned: 500 }
  ];

  // Local storage keys
  const LS_PLAYERS_KEY = 'pokerChipPlayers_v4';
  const LS_ROWS_KEY    = 'pokerChipRows_v4';
  const LS_INV_KEY     = 'pokerChipInventory_v4';

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

  // No row highlighting in this version
  function applyColorClass() {}

  function getInventoryMap() {
    const map = Object.create(null);
    invRowsEl.querySelectorAll('tr').forEach(tr => {
      const colorInput = tr.querySelector('.inv-color');
      const valueInput = tr.querySelector('.inv-value');
      const ownedInput = tr.querySelector('.inv-owned');
      const key = normalizeColorName(colorInput.value);
      if (key) {
        map[key] = {
          value: parseFloat(valueInput.value) || 0,
          owned: parseFloat(ownedInput.value) || 0
        };
      }
    });
    return map;
  }

  function ensureInventoryColorExists(colorName) {
    const key = normalizeColorName(colorName);
    if (!key) return;
    const map = getInventoryMap();
    if (Object.prototype.hasOwnProperty.call(map, key)) return;
    addInventoryRow({ name: colorName, value: 0, owned: 0 });
    saveState();
  }

  function saveState() {
    // Players
    localStorage.setItem(LS_PLAYERS_KEY, String(getPlayers()));
    // Dashboard rows
    const dashboardData = [];
    chipRowsEl.querySelectorAll('tr').forEach(tr => {
      const selectEl    = tr.querySelector('.color-select');
      const perPlayerEl = tr.querySelector('.chips-per-player');
      const color       = selectEl ? selectEl.value : '';
      const perPlayer   = parseFloat(perPlayerEl.value) || 0;
      dashboardData.push({ color, perPlayer });
    });
    localStorage.setItem(LS_ROWS_KEY, JSON.stringify(dashboardData));
    // Inventory rows
    const inventoryData = [];
    invRowsEl.querySelectorAll('tr').forEach(tr => {
      const name  = tr.querySelector('.inv-color').value;
      const value = parseFloat(tr.querySelector('.inv-value').value) || 0;
      const owned = parseFloat(tr.querySelector('.inv-owned').value) || 0;
      inventoryData.push({ name, value, owned });
    });
    localStorage.setItem(LS_INV_KEY, JSON.stringify(inventoryData));
  }

  function addDashboardRow(data = {}) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <select class="color-select"></select>
      </td>
      <td><span class="chip-value">0</span></td>
      <td><input class="chips-per-player" type="number" min="0" value="${data.perPlayer != null ? data.perPlayer : ''}"></td>
      <td class="chips-needed">0</td>
      <td class="chips-left">0</td>
      <td><button class="remove-row" type="button">Remove</button></td>
    `;
    const selectEl    = tr.querySelector('.color-select');
    const valueSpan   = tr.querySelector('.chip-value');
    const perPlayerEl = tr.querySelector('.chips-per-player');

    function buildOptions(selectedColor) {
      const currentValue = selectedColor || '';
      const colorNames = [];
      invRowsEl.querySelectorAll('tr').forEach(row => {
        const name = row.querySelector('.inv-color').value.trim();
        if (name) colorNames.push(name);
      });
      selectEl.innerHTML = '';
      const emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = '-- Select --';
      selectEl.appendChild(emptyOpt);
      colorNames.forEach(name => {
        const key = normalizeColorName(name);
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = name;
        if (key === currentValue) opt.selected = true;
        selectEl.appendChild(opt);
      });
    }

    selectEl.addEventListener('change', () => {
      const invMap = getInventoryMap();
      const key    = normalizeColorName(selectEl.value);
      const invItem = key && invMap[key] ? invMap[key] : { value: 0, owned: 0 };
      valueSpan.textContent = invItem.value;
      calculate();
      saveState();
    });

    perPlayerEl.addEventListener('input', () => {
      calculate();
      saveState();
    });

    tr.querySelector('.remove-row').addEventListener('click', () => {
      tr.remove();
      if (dashboardRowCount() === 0) {
        addDashboardRow();
      }
      calculate();
      updateDashboardCount();
      saveState();
    });

    chipRowsEl.appendChild(tr);
    buildOptions(data.color ? normalizeColorName(data.color) : '');
    if (data.color) {
      selectEl.value = normalizeColorName(data.color);
      const invMap  = getInventoryMap();
      const invItem = invMap[normalizeColorName(data.color)] || { value: 0, owned: 0 };
      valueSpan.textContent = invItem.value;
    }
    calculate();
    updateDashboardCount();
  }

  function addInventoryRow(data = {}) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="inv-color" type="text" value="${data.name || ''}"></td>
      <td><input class="inv-value" type="number" step="0.01" min="0" value="${data.value != null ? data.value : ''}"></td>
      <td><input class="inv-owned" type="number" min="0" value="${data.owned != null ? data.owned : ''}"></td>
      <td><button class="remove-inv-row" type="button">Remove</button></td>
    `;
    const colorInput = tr.querySelector('.inv-color');
    const valueInput = tr.querySelector('.inv-value');
    const ownedInput = tr.querySelector('.inv-owned');

    colorInput.addEventListener('input', () => {
      applyColorClass(tr, colorInput.value);
      refreshColorDropdownOptions();
      calculate();
      updateInventoryCount();
      saveState();
    });

    valueInput.addEventListener('input', () => {
      calculate();
      saveState();
    });

    ownedInput.addEventListener('input', () => {
      calculate();
      saveState();
    });

    tr.querySelector('.remove-inv-row').addEventListener('click', () => {
      tr.remove();
      if (inventoryRowCount() === 0) {
        addInventoryRow({ name: '', value: 0, owned: 0 });
      }
      refreshColorDropdownOptions();
      calculate();
      updateInventoryCount();
      saveState();
    });

    invRowsEl.appendChild(tr);
    applyColorClass(tr, colorInput.value);
    updateInventoryCount();
  }

  function refreshColorDropdownOptions() {
    const colorNames = [];
    invRowsEl.querySelectorAll('tr').forEach(tr => {
      const name = tr.querySelector('.inv-color').value.trim();
      if (name) colorNames.push(name);
    });
    chipRowsEl.querySelectorAll('tr').forEach(tr => {
      const selectEl = tr.querySelector('.color-select');
      if (!selectEl) return;
      const previous = selectEl.value;
      selectEl.innerHTML = '';
      const emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = '-- Select --';
      selectEl.appendChild(emptyOpt);
      colorNames.forEach(name => {
        const key = normalizeColorName(name);
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = name;
        selectEl.appendChild(opt);
      });
      const normalizedPrev = normalizeColorName(previous);
      const availableKeys   = colorNames.map(name => normalizeColorName(name));
      if (previous && availableKeys.includes(normalizedPrev)) {
        selectEl.value = normalizedPrev;
      } else {
        selectEl.value = '';
      }
      const valueSpan = tr.querySelector('.chip-value');
      const invMap    = getInventoryMap();
      const invItem   = invMap[normalizeColorName(selectEl.value)] || { value: 0, owned: 0 };
      if (valueSpan) valueSpan.textContent = invItem.value;
    });
    calculate();
  }

  function clearDashboardRowInputs(tr) {
    const select = tr.querySelector('.color-select');
    if (select) select.value = '';
    const valueSpan = tr.querySelector('.chip-value');
    if (valueSpan) valueSpan.textContent = '0';
    const perPlayerInput = tr.querySelector('.chips-per-player');
    if (perPlayerInput) perPlayerInput.value = '';
  }

  function calculate() {
    const players  = getPlayers();
    const invMap   = getInventoryMap();
    let buyInPerPlayer   = 0;
    let totalChipsInPlay = 0;

    chipRowsEl.querySelectorAll('tr').forEach(tr => {
      const selectEl    = tr.querySelector('.color-select');
      const valueSpan   = tr.querySelector('.chip-value');
      const perPlayerEl = tr.querySelector('.chips-per-player');

      const colorKey   = selectEl ? normalizeColorName(selectEl.value) : '';
      const perPlayer  = parseFloat(perPlayerEl.value) || 0;
      const invItem    = (colorKey && invMap[colorKey]) ? invMap[colorKey] : { value: 0, owned: 0 };

      if (valueSpan) valueSpan.textContent = invItem.value;

      const chipsNeeded = players * perPlayer;
      const chipsLeft   = invItem.owned - chipsNeeded;

      const chipsNeededCell = tr.querySelector('.chips-needed');
      const chipsLeftCell   = tr.querySelector('.chips-left');
      if (chipsNeededCell) chipsNeededCell.textContent = chipsNeeded;
      if (chipsLeftCell) chipsLeftCell.textContent = chipsLeft;

      buyInPerPlayer   += invItem.value * perPlayer;
      totalChipsInPlay += chipsNeeded;
    });

    buyInEl.textContent       = buyInPerPlayer.toFixed(2);
    chipsInPlayEl.textContent = totalChipsInPlay;
    valueInPlayEl.textContent = (buyInPerPlayer * players).toFixed(2);
  }

  function loadState() {
    const savedPlayers = localStorage.getItem(LS_PLAYERS_KEY);
    const savedRows    = localStorage.getItem(LS_ROWS_KEY);
    const savedInv     = localStorage.getItem(LS_INV_KEY);
    if (savedPlayers) {
      playerCountInput.value = String(Math.max(1, toInt(savedPlayers, 2)));
    }
    if (savedInv) {
      try {
        const invData = JSON.parse(savedInv);
        if (Array.isArray(invData) && invData.length) {
          invData.forEach(row => addInventoryRow(row));
        } else {
          DEFAULT_INVENTORY.forEach(row => addInventoryRow(row));
        }
      } catch {
        DEFAULT_INVENTORY.forEach(row => addInventoryRow(row));
      }
    } else {
      DEFAULT_INVENTORY.forEach(row => addInventoryRow(row));
    }
    refreshColorDropdownOptions();
    if (savedRows) {
      try {
        const rowData = JSON.parse(savedRows);
        if (Array.isArray(rowData) && rowData.length) {
          rowData.forEach(row => addDashboardRow(row));
        } else {
          addDashboardRow();
        }
      } catch {
        addDashboardRow();
      }
    } else {
      addDashboardRow();
    }
    updateDashboardCount();
    updateInventoryCount();
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
      calculate();
      updateDashboardCount();
      saveState();
    });
    invPlusBtn.addEventListener('click', () => {
      addInventoryRow({ name: '', value: 0, owned: 0 });
      refreshColorDropdownOptions();
      saveState();
    });
    invMinusBtn.addEventListener('click', () => {
      const rows = invRowsEl.querySelectorAll('tr');
      if (rows.length > 1) {
        rows[rows.length - 1].remove();
      }
      refreshColorDropdownOptions();
      calculate();
      updateInventoryCount();
      saveState();
    });
  }

  setupEventListeners();
  loadState();
})();
