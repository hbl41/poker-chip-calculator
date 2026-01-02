(function() {
  const playerCountInput = document.getElementById('player-count');
  const playerMinusBtn = document.getElementById('player-minus');
  const playerPlusBtn = document.getElementById('player-plus');

  const colorMinusBtn = document.getElementById('color-minus');
  const colorPlusBtn = document.getElementById('color-plus');
  const colorCountOut = document.getElementById('color-count');

  const chipRowsEl = document.getElementById('chip-rows');
  const buyInEl = document.getElementById('buy-in');
  const chipsInPlayEl = document.getElementById('chips-in-play');
  const valueInPlayEl = document.getElementById('value-in-play');

  const MIN_PLAYERS = 1;
  const MIN_ROWS = 1;

  function getPlayerCount() {
    const v = parseInt(playerCountInput.value, 10);
    return Number.isFinite(v) ? v : 0;
  }

  function setPlayerCount(next) {
    const clamped = Math.max(MIN_PLAYERS, parseInt(next, 10) || MIN_PLAYERS);
    playerCountInput.value = clamped;
    calculate();
    saveState();
  }

  function rowCount() {
    return chipRowsEl.querySelectorAll('tr').length;
  }

  function updateColorCount() {
    if (!colorCountOut) return;
    colorCountOut.textContent = String(rowCount());
  }

  // Load saved state from localStorage
  function loadState() {
    const savedRows = localStorage.getItem('pokerChipRows');
    const savedPlayers = localStorage.getItem('pokerChipPlayers');

    if (savedPlayers) {
      const parsed = parseInt(savedPlayers, 10);
      playerCountInput.value = Number.isFinite(parsed) ? parsed : MIN_PLAYERS;
    }

    if (savedRows) {
      try {
        const rows = JSON.parse(savedRows);
        if (Array.isArray(rows) && rows.length) {
          rows.forEach(row => addRow(row));
        } else {
          addRow();
        }
      } catch (e) {
        addRow();
      }
    } else {
      addRow();
    }

    if (getPlayerCount() < MIN_PLAYERS) playerCountInput.value = MIN_PLAYERS;
    updateColorCount();
    calculate();
  }

  // Save current state to localStorage
  function saveState() {
    const rows = [];
    chipRowsEl.querySelectorAll('tr').forEach(tr => {
      const name = tr.querySelector('.color-name').value;
      const value = parseFloat(tr.querySelector('.chip-value').value) || 0;
      const perPlayer = parseFloat(tr.querySelector('.chips-per-player').value) || 0;
      const owned = parseFloat(tr.querySelector('.chips-owned').value) || 0;
      rows.push({ name, value, perPlayer, owned });
    });
    localStorage.setItem('pokerChipRows', JSON.stringify(rows));
    localStorage.setItem('pokerChipPlayers', String(getPlayerCount()));
    updateColorCount();
  }

  // Add a new row to the table
  function addRow(data = {}) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="color-name" type="text" value="${data.name || ''}"></td>
      <td><input class="chip-value" type="number" step="0.01" min="0" value="${data.value != null ? data.value : ''}"></td>
      <td><input class="chips-per-player" type="number" min="0" value="${data.perPlayer != null ? data.perPlayer : ''}"></td>
      <td><input class="chips-owned" type="number" min="0" value="${data.owned != null ? data.owned : ''}"></td>
      <td class="chips-needed">0</td>
      <td class="chips-left">0</td>
      <td><button class="remove-row" type="button">Remove</button></td>
    `;

    // Input listeners
    tr.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        calculate();
        saveState();
      });
    });

    // Per-row remove button
    tr.querySelector('.remove-row').addEventListener('click', () => {
      const countBefore = rowCount();
      if (countBefore <= MIN_ROWS) return;
      tr.remove();
      calculate();
      saveState();
    });

    chipRowsEl.appendChild(tr);
    updateColorCount();
    calculate();
  }

  function removeLastRow() {
    const rows = chipRowsEl.querySelectorAll('tr');
    if (rows.length <= MIN_ROWS) return;
    rows[rows.length - 1].remove();
    calculate();
    saveState();
  }

  // Calculate totals and update cells
  function calculate() {
    const players = getPlayerCount();
    let buyInPerPlayer = 0;
    let totalChipsInPlay = 0;

    chipRowsEl.querySelectorAll('tr').forEach(tr => {
      const value = parseFloat(tr.querySelector('.chip-value').value) || 0;
      const perPlayer = parseFloat(tr.querySelector('.chips-per-player').value) || 0;
      const owned = parseFloat(tr.querySelector('.chips-owned').value) || 0;

      const chipsNeeded = players * perPlayer;
      const chipsLeft = owned - chipsNeeded;

      tr.querySelector('.chips-needed').textContent = chipsNeeded;

      const chipsLeftEl = tr.querySelector('.chips-left');
      chipsLeftEl.textContent = chipsLeft;
      if (chipsLeft < 0) {
        chipsLeftEl.classList.add('color-negative');
      } else {
        chipsLeftEl.classList.remove('color-negative');
      }

      buyInPerPlayer += value * perPlayer;
      totalChipsInPlay += chipsNeeded;
    });

    const totalValueInPlay = buyInPerPlayer * players;
    buyInEl.textContent = buyInPerPlayer.toFixed(2);
    chipsInPlayEl.textContent = String(totalChipsInPlay);
    valueInPlayEl.textContent = totalValueInPlay.toFixed(2);
    updateColorCount();
  }

  // Top controls
  playerMinusBtn.addEventListener('click', () => setPlayerCount(getPlayerCount() - 1));
  playerPlusBtn.addEventListener('click', () => setPlayerCount(getPlayerCount() + 1));

  playerCountInput.addEventListener('input', () => {
    if (getPlayerCount() < MIN_PLAYERS) playerCountInput.value = MIN_PLAYERS;
    calculate();
    saveState();
  });

  colorPlusBtn.addEventListener('click', () => {
    addRow();
    saveState();
  });

  colorMinusBtn.addEventListener('click', () => {
    removeLastRow();
  });

  // Initialize
  loadState();
})();
