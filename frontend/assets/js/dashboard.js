(function() {
  const user = checkAuth();
  if (!user) return;

  const userName = document.getElementById('userName');
  const dashboardUserName = document.getElementById('dashboardUserName');
  const dashboardDate = document.getElementById('dashboardDate');
  const dashboardDateText = document.getElementById('dashboardDateText');

  if (userName) userName.textContent = user.full_name || user.username;
  if (dashboardUserName) dashboardUserName.textContent = user.full_name || user.username;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  if (dashboardDate) dashboardDate.textContent = dateStr;
  if (dashboardDateText) dashboardDateText.textContent = dateStr;

  // ───── KPI Data (demo) ─────
  document.getElementById('kpiCollections').textContent = '24';
  document.getElementById('kpiAssessments').textContent = '1,247';
  document.getElementById('kpiValue').textContent = '₹10,35,000';
  document.getElementById('kpiPending').textContent = '8';

  // ───── Collection Trends Chart ─────
  const trendCtx = document.getElementById('trendChart').getContext('2d');
  new Chart(trendCtx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Collections',
        data: [320, 450, 380, 520, 490, 610],
        borderColor: '#16A34A',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#16A34A',
        pointRadius: 4,
        borderWidth: 3
      }, {
        label: 'Assessments',
        data: [280, 390, 340, 460, 430, 550],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3B82F6',
        pointRadius: 4,
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      resize: { delay: 0 },
      plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 20 } } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { grid: { display: false } }
      }
    }
  });

  // ───── Product Distribution Chart ─────
  const distCtx = document.getElementById('distributionChart').getContext('2d');
  new Chart(distCtx, {
    type: 'doughnut',
    data: {
      labels: ['TV', 'Laptop', 'Mobile', 'Fridge', 'AC', 'Others'],
      datasets: [{
        data: [25, 20, 30, 10, 8, 7],
        backgroundColor: ['#16A34A', '#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      resize: { delay: 0 },
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, padding: 12, font: { size: 11 } } }
      }
    }
  });

  // ───── Recent Activities Table ─────
  const activities = [
    { time: '2026-06-03 09:45 AM', action: 'New Assessment Created', customer: 'John Smith', product: 'Laptop - Dell', status: 'completed' },
    { time: '2026-06-03 09:30 AM', action: 'Collection Completed', customer: 'Sarah Lee', product: 'Mobile - Samsung', status: 'completed' },
    { time: '2026-06-03 08:15 AM', action: 'Assessment Verified', customer: 'Mike Brown', product: 'TV - LG', status: 'pending' },
    { time: '2026-06-02 04:20 PM', action: 'Value Updated', customer: 'Emma Wilson', product: 'AC - Daikin', status: 'in-progress' },
    { time: '2026-06-02 02:00 PM', action: 'New Assessment Created', customer: 'James Chen', product: 'Fridge - Whirlpool', status: 'completed' },
    { time: '2026-06-02 11:30 AM', action: 'Image Uploaded', customer: 'Lisa Park', product: 'Monitor - HP', status: 'completed' },
    { time: '2026-06-01 03:45 PM', action: 'Payment Processed', customer: 'Robert Kim', product: 'Washing Machine - Samsung', status: 'pending' },
    { time: '2026-06-01 01:15 PM', action: 'Assessment Verified', customer: 'Anna Davis', product: 'Laptop - Apple', status: 'completed' },
    { time: '2026-06-01 10:00 AM', action: 'Collection Scheduled', customer: 'David Clark', product: 'Mobile - Google', status: 'cancelled' },
    { time: '2026-05-31 04:30 PM', action: 'New Assessment Created', customer: 'Maria Garcia', product: 'Fan - Crompton', status: 'completed' }
  ];

  const tbody = document.getElementById('activitiesTableBody');
  if (tbody) {
    tbody.innerHTML = activities.map(a => `
      <tr>
        <td class="small">${a.time}</td>
        <td>${a.action}</td>
        <td>${a.customer}</td>
        <td>${a.product}</td>
        <td><span class="status-badge ${a.status}">${a.status.charAt(0).toUpperCase() + a.status.slice(1)}</span></td>
      </tr>
    `).join('');
  }

})();
