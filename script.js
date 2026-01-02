(function() {
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

  const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
  const tabPanels = Array.from(document.querySelectorAll('.tab-panel'));

  const COLOR_CLASSES = [
    'chip-white',
    'chip-red',
    'chip-pink',
    'chip-blue',
    'chip-green',
    'chip-black',
    'chip-orange'
  ];

  const DEFAULT_INVENTORY = [
    { name: 'White', owned: 500 },
    { name: 'Pink', owned: 500 },
    { name: 'Red', owned: 500 },
    { name: 'Green', owned: 500 },
    { name: 'Black', owned: 500 },
    { name: 'Orange', owned: 500 }
  ];

  function toInt(v, fallback) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  }

  function getPlayers() {
    return Math.max(1, toInt(playerCountInput.value, 1));
  }

  function normalizeColorName(name) {
    return (name || '').trim().toLowerCase();
  }

  function rowCount() {
    return chipRowsEl.querySelectorAll('tr').length;
  }

  function invRowCount() {
    return invRowsEl.querySelectorAll('tr').length;
  }

  function updateDashboardCount() {
    if (colorCountEl) colorCountEl.textContent = String(rowCount());
  }

  function updateInventoryCount() {
    if (invCountEl) invCountEl.textContent = String(invRowCount());
  }

  function showTab(tabName) {
    tabButtons.forEach(btn => {
      const isActive = btn.dataset.tab === tabName;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    tabPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === 'tab-' + tabName);
    });
  }

  function applyColorClass(tr, colorName) {
    tr.classList.remove(...COLOR_CLASSES);
    const c = normalizeColorName(colorName);
    if (!c) return;
    const candidate = 'chip-' + c;
    if (COLOR_CLASSES.includes(candidate)) tr.classList.add(candidate);
  }

  function getInventoryMap() {
    const map = Object.create(null);
    invRowsEl.querySelectorAll('tr').forEach(tr => {
      const name = tr.querySelector('.inv-color').value;
      const owned = parseFloat(tr.querySelector('.inv-owned').value) || 0;
      const key = normalizeColorName(name);
      if (key) map[key] = owned;
    });
    return map;
  }

  function ensureInventoryColorExists(colorName) {
    const key = normalizeColorName(colorName);
    if (!key) return;
    const map = getInventoryMap();
    if (Object.prototype.hasOwnProperty.call(map, key)) return;
    addInventoryRow({ name: colorName, owned: 0 });
    saveState();
  }

  function saveState() {
    const rows = [];
    chipRowsEl.querySelectorAll('tr').forEach(tr => {
      const name = tr.querySelector('.color-name').value;
      const value = parseFloat(tr.querySelector('.chip-value').value) || 0;
      const perPlayer = parseFloat(tr.querySelector('.chips-per-player').value) || 0;
      rows.push({ name, value, perPlayer });
    });

    const inv = [];
    invRowsEl.querySelectorAll('tr').forEach(tr => {
      const name = tr.querySelector('.inv-color').value;
      const owned = parseFloat(tr.querySelector('.inv-owned').value) || 0;
      inv.push({ name, owned });
    });

    localStorage.setItem('pokerChipRows_v2', JSON.stringify(rows));
    localStorage.setItem('pokerChipPlayers_v2', String(getPlayers()));
    localStorage.setItem('pokerChipInventory_v2', JSON.stringify(inv));
  }

  function addDashboardRow(data = {}) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="color-name" type="text" value="${data.name || ''}"></td>
      <td><input class="chip-value" type="number" step="0.01" min="0" value="${data.value != null ? data.value : ''}"></td>
      <td><input class="chips-per-player" type="number" min="0" value="${data.perPlayer != null ? data.perPlayer : ''}"></td>
      <td class="chips-needed">0</td>
      <td class="chips-left">0</td>
      <td><button class="remove-row" type="button">Remove</button></td>
    `;

    const colorInput = tr.querySelector('.color-name');
    colorInput.addEventListener('input', () => {
      applyColorClass(tr, colorInput.value);
      ensureInventoryColorExists(colorInput.value);
      calculate();
      saveState();
    });

    tr.querySelectorAll('input:not(.color-name)').forEach(input => {
      input.addEventListener('input', () => {
        calculate();
        saveState();
      });
    });

    tr.querySelector('.remove-row').addEventListener('click', () => {
      tr.remove();
      if (rowCount() === 0) addDashboardRow();
      calculate();
      updateDashboardCount();
      saveState();
    });

    chipRowsEl.appendChild(tr);
    applyColorClass(tr, colorInput.value);
    calculate();
    updateDashboardCount();
  }

  function addInventoryRow(data = {}) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="inv-color" type="text" value="${data.name || ''}"></td>
      <td><input class="inv-owned" type="number" min="0" value="${data.owned != null ? data.owned : ''}"></td>
      <td><button class="remove-inv-row" type="button">Remove</button></td>
    `;

    const invColor = tr.querySelector('.inv-color');
    const invOwned = tr.querySelector('.inv-owned');

    invColor.addEventListener('input', () => {
      applyColorClass(tr, invColor.value);
      calculate();
      updateInventoryCount();
      saveState();
    });

    invOwned.addEventListener('input', () => {
      calculate();
      saveState();
    });

    tr.querySelector('.remove-inv-row').addEventListener('click', () => {
      tr.remove();
      if (invRowCount() === 0) addInventoryRow({ name: 'White', owned: 0 });
      calculate();
      updateInventoryCount();
      saveState();
    });

    invRowsEl.appendChild(tr);
    applyColorClass(tr, invColor.value);
    updateInventoryCount();
  }

  function clearDashboardRowInputs(tr) {
    tr.querySelector('.color-name').value = '';
    tr.querySelector('.chip-value').value = '';
    tr.querySelector('.chips-per-player').value = '';
    applyColorClass(tr, '');
  }

  function calculate() {
    const players = getPlayers();
    const invMap = getInventoryMap();

    let buyInPerPlayer = 0;
    let totalChipsInPlay = 0;

    chipRowsEl.querySelectorAll('tr').forEach(tr => {
      const name = tr.querySelector('.color-name').value;
      const value = parseFloat(tr.querySelector('.chip-value').value) || 0;
      const perPlayer = parseFloat(tr.querySelector('.chips-per-player').value) || 0;

      const chipsNeeded = players * perPlayer;

      const key = normalizeColorName(name);
      const owned = key && Object.prototype.hasOwnProperty.call(invMap, key) ? invMap[key] : 0;

      const chipsLeft = owned - chipsNeeded;

      tr.querySelector('.chips-needed').textContent = chipsNeeded;
      tr.querySelector('.chips-left').textContent = chipsLeft;

      buyInPerPlayer += value * perPlayer;
      totalChipsInPlay += chipsNeeded;

      applyColorClass(tr, name);
    });

    buyInEl.textContent = buyInPerPlayer.toFixed(2);
    chipsInPlayEl.textContent = totalChipsInPlay;
    valueInPlayEl.textContent = (buyInPerPlayer * players).toFixed(2);
  }

  function loadState() {
    const savedPlayers = localStorage.getItem('pokerChipPlayers_v2');
    const savedRows = localStorage.getItem('pokerChipRows_v2');
    const savedInv = localStorage.getItem('pokerChipInventory_v2');

    if (savedPlayers) playerCountInput.value = String(Math.max(1, toInt(savedPlayers, 2)));

    if (savedInv) {
      const inv = JSON.parse(savedInv);
      if (Array.isArray(inv) && inv.length) inv.forEach(r => addInventoryRow(r));
      else DEFAULT_INVENTORY.forEach(r => addInventoryRow(r));
    } else {
      DEFAULT_INVENTORY.forEach(r => addInventoryRow(r));
    }

    if (savedRows) {
      const rows = JSON.parse(savedRows);
      if (Array.isArray(rows) && rows.length) rows.forEach(r => addDashboardRow(r));
      else addDashboardRow();
    } else {
      addDashboardRow();
    }

    updateDashboardCount();
    updateInventoryCount();
    calculate();
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      showTab(btn.dataset.tab);
    });
  });

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
    addInventoryRow({ name: '', owned: 0 });
    saveState();
  });

  invMinusBtn.addEventListener('click', () => {
    const rows = invRowsEl.querySelectorAll('tr');
    if (rows.length > 1) {
      rows[rows.length - 1].remove();
    }
    calculate();
    updateInventoryCount();
    saveState();
  });

  showTab('dashboard');
  loadState();
})();
