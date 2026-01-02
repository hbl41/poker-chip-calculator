(function() {
  const playerCountInput = document.getElementById('player-count');

  const playerMinusBtn = document.getElementById('player-minus');
  const playerPlusBtn = document.getElementById('player-plus');

  const colorMinusBtn = document.getElementById('color-minus');
  const colorPlusBtn = document.getElementById('color-plus');
  const colorCountEl = document.getElementById('color-count');

  const chipRowsEl = document.getElementById('chip-rows');
  const buyInEl = document.getElementById('buy-in');
  const chipsInPlayEl = document.getElementById('chips-in-play');
  const valueInPlayEl = document.getElementById('value-in-play');

  function toInt(v, fallback) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  }

  function getPlayers() {
    return Math.max(1, toInt(playerCountInput.value, 1));
  }

  function rowCount() {
    return chipRowsEl.querySelectorAll('tr').length;
  }

  function updateColorCount() {
    if (colorCountEl) colorCountEl.textContent = String(rowCount());
  }

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
    localStorage.setItem('pokerChipPlayers', String(getPlayers()));
  }

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

    tr.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        calculate();
        saveState();
      });
    });

    tr.querySelector('.remove-row').addEventListener('click', () => {
      tr.remove();
      if (rowCount() === 0) addRow();
      calculate();
      updateColorCount();
      saveState();
    });

    chipRowsEl.appendChild(tr);
    calculate();
    updateColorCount();
  }

  function clearRowInputs(tr) {
    tr.querySelector('.color-name').value = '';
    tr.querySelector('.chip-value').value = '';
    tr.querySelector('.chips-per-player').value = '';
    tr.querySelector('.chips-owned').value = '';
  }

  function calculate() {
    const players = getPlayers();
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

      if (chipsLeft < 0) chipsLeftEl.classList.add('color-negative');
      else chipsLeftEl.classList.remove('color-negative');

      buyInPerPlayer += value * perPlayer;
      totalChipsInPlay += chipsNeeded;
    });

    buyInEl.textContent = buyInPerPlayer.toFixed(2);
    chipsInPlayEl.textContent = totalChipsInPlay;
    valueInPlayEl.textContent = (buyInPerPlayer * players).toFixed(2);
  }

  function loadState() {
    const savedPlayers = localStorage.getItem('pokerChipPlayers');
    const savedRows = localStorage.getItem('pokerChipRows');

    if (savedPlayers) playerCountInput.value = String(Math.max(1, toInt(savedPlayers, 2)));

    if (savedRows) {
      const rows = JSON.parse(savedRows);
      if (Array.isArray(rows) && rows.length) rows.forEach(r => addRow(r));
      else addRow();
    } else {
      addRow();
    }

    updateColorCount();
    calculate();
  }

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
    playerCountInput.value = String(getPlayers()));
    calculate();
    saveState();
  });

  colorPlusBtn.addEventListener('click', () => {
    addRow();
    saveState();
  });

  colorMinusBtn.addEventListener('click', () => {
    const rows = chipRowsEl.querySelectorAll('tr');
    if (rows.length > 1) {
      rows[rows.length - 1].remove();
    } else if (rows.length === 1) {
      clearRowInputs(rows[0]);
    } else {
      addRow();
    }
    calculate();
    updateColorCount();
    saveState();
  });

  loadState();
})();
