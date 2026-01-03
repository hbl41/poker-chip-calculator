// Poker Chip Calculator JavaScript Logic

document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const playersInput = document.getElementById('numPlayers');
  const buyInInput = document.getElementById('buyIn');
  const chipValuesInput = document.getElementById('chipValues');
  const chipCountsInput = document.getElementById('chipCounts');
  const calculateBtn = document.getElementById('calculateBtn');
  const resultDiv = document.getElementById('result');

  function parseCSV(input) {
    return input.split(',').map(Number).filter(n => !isNaN(n));
  }

  function formatChipDistribution(distribution, chipValues) {
    let html = '<table><thead><tr><th>Chip Value</th><th>Per Player</th><th>Total Needed</th></tr></thead><tbody>';
    for(let i=0; i<chipValues.length; i++) {
      html += `<tr><td>${chipValues[i]}</td><td>${distribution.perPlayer[i]}</td><td>${distribution.totalNeeded[i]}</td></tr>`;
    }
    html += '</tbody></table>';
    return html;
  }

  function calculateDistribution(numPlayers, buyIn, chipValues, chipCounts) {
    // Simple greedy distribution algorithm
    let totalChips = chipCounts.slice();
    let perPlayer = Array(chipValues.length).fill(0);
    let totalNeeded = Array(chipValues.length).fill(0);
    let remaining = buyIn;
    let tempDist = Array(chipValues.length).fill(0);

    // Attempt to give each player maximum denomination first
    for(let i=chipValues.length-1; i>=0; i--) {
      let maxChipsPerPlayer = Math.min(Math.floor(remaining/chipValues[i]), Math.floor(totalChips[i]/numPlayers));
      tempDist[i] = maxChipsPerPlayer;
      remaining -= maxChipsPerPlayer * chipValues[i];
    }

    // If remainder exists, try to use lowest denominations to fill in
    for(let i=0; i<chipValues.length; i++) {
      let needed = Math.round(remaining/chipValues[i]);
      if(needed > 0 && totalChips[i] >= needed*numPlayers) {
        tempDist[i] += needed;
        remaining -= needed*chipValues[i];
        break;
      }
    }

    // Now fill out per player and total needed arrays
    let possible = true;
    for(let i=0; i<chipValues.length; i++) {
      perPlayer[i] = tempDist[i];
      totalNeeded[i] = perPlayer[i]*numPlayers;
      if(totalNeeded[i] > totalChips[i]) {
        possible = false;
      }
    }

    return {
      possible: possible && remaining === 0,
      perPlayer,
      totalNeeded,
      buyInActual: buyIn - remaining
    };
  }

  calculateBtn.addEventListener('click', function() {
    // Read input values
    const numPlayers = Number(playersInput.value);
    const buyIn = Number(buyInInput.value);
    const chipValues = parseCSV(chipValuesInput.value);
    const chipCounts = parseCSV(chipCountsInput.value);

    resultDiv.innerHTML = '';

    if(
      !numPlayers || !buyIn || !chipValues.length || !chipCounts.length ||
      chipValues.length !== chipCounts.length || numPlayers <= 0 || buyIn <= 0
    ) {
      resultDiv.innerHTML = '<div class="error">Please enter valid input values.</div>';
      return;
    }

    const distribution = calculateDistribution(numPlayers, buyIn, chipValues, chipCounts);

    if(distribution.possible) {
      resultDiv.innerHTML = `<h3>Chip Distribution Per Player</h3>${formatChipDistribution(distribution, chipValues)}<p>Each player will start with chips worth exactly $${buyIn}.</p>`;
    } else {
      resultDiv.innerHTML = `<div class="error">It is not possible to distribute chips exactly as requested with the available chips. The closest possible per player buy-in is $${distribution.buyInActual}. Please adjust chip counts or buy-in amount.</div>`;
    }
  });
});
