(function() {
  const playerCountInput = document.getElementById('player-count');
  const addRowBtn = document.getElementById('add-row-btn');
  const chipRowsEl = document.getElementById('chip-rows');
  const buyInEl = document.getElementById('buy-in');
  const chipsInPlayEl = document.getElementById('chips-in-play');
  const valueInPlayEl = document.getElementById('value-in-play');

  // Load saved state from localStorage
  function loadState() {
    const savedRows = localStorage.getItem('pokerChipRows');
    const savedPlayers = localStorage.getItem('pokerChipPlayers');
    if (savedPlayers) {
      playerCountInput.value = parseInt(savedPlayers, 10);
    }
    if (savedRows) {
      const rows = JSON.parse(savedRows);
      rows.forEach(row => addRow(row));
    } else {
      // add a default row
      addRow();
    }
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
    localStorage.setItem('pokerChipPlayers', playerCountInput.value);
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
      <td><button class="remove-row">Remove</button></td>
    `;
    // Add event listeners to inputs
    tr.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        calculate();
        saveState();
      });
    });
    // Remove button
    tr.querySelector('.remove-row').addEventListener('click', () => {
      tr.remove();
      calculate();
      saveState();
    });
    chipRowsEl.appendChild(tr);
    calculate();
  }

  // Calculate totals and update cells
  function calculate() {
    const players = parseInt(playerCountInput.value, 10) || 0;
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
    chipsInPlayEl.textContent = totalChipsInPlay;
    valueInPlayEl.textContent = totalValueInPlay.toFixed(2);
  }

  // Event listeners
  addRowBtn.addEventListener('click', () => {
    addRow();
    saveState();
  });

  playerCountInput.addEventListener('input', () => {
    calculate();
    saveState();
  });

  // Initialize
  loadState();
})();
