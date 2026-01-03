// Load saved state from localStorage
function loadState() {
    const savedRows = localStorage.getItem('dashboardRows');
    if (savedRows) {
        dashboardRows = JSON.parse(savedRows);
        dashboardRows.forEach(row => {
            addDashboardRow(row);
        });
    } else {
        // Initialize 3 rows by default on first load
        for (let i = 0; i < 3; i++) {
            addDashboardRow();
        }
    }
}