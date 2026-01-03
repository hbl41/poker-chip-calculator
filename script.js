function loadState() {
  const savedState = localStorage.getItem('pokerChipState');
  
  if (savedState) {
    // Load existing state
    const state = JSON.parse(savedState);
    state.rows.forEach(row => addRow(row));
  } else {
    // Initialize with 3 rows on first load
    addRow();
    addRow();
    addRow();
  }
}
