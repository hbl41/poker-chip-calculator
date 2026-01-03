function loadState() {
  const savedRows = localStorage.getItem('dashboardRows');
  if (savedRows) {
    try {
      const rows = JSON.parse(savedRows);
      if (Array.isArray(rows) && rows.length) {
        rows.forEach(r => addDashboardRow(r));
      } else {
        for (let i = 0; i < 3; i++) addDashboardRow();
      }
    } catch {
      for (let i = 0; i < 3; i++) addDashboardRow();
    }
  } else {
    for (let i = 0; i < 3; i++) addDashboardRow();
  }
}
