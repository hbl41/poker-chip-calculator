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
    refreshColorDropdownOptions();
    updateInventoryCount();
    updateInventoryTotals();
    calculate();
    saveState();
  });

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

  tr.querySelector('.remove-inv-row').addEventListener('click', () => {
    tr.remove();
    if (inventoryRowCount() === 0) addInventoryRow({ name: '', value: 0, owned: 0 });
    refreshColorDropdownOptions();
    updateInventoryCount();
    updateInventoryTotals();
    calculate();
    saveState();
  });

  invRowsEl.appendChild(tr);
  updateInventoryCount();
  updateInventoryTotals();
}
