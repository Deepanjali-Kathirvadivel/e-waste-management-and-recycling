(function () {
  const admin = JSON.parse(localStorage.getItem('greenera_admin') || 'null');
  if (!admin || !localStorage.getItem('greenera_admin_token')) {
    window.location.href = 'login.html'; return;
  }

  const initials = (admin.full_name || 'Admin').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('adminAvatar').textContent = initials || 'A';
  document.getElementById('adminDate').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  window.adminLogout = function () {
    localStorage.removeItem('greenera_admin_token');
    localStorage.removeItem('greenera_admin');
    window.location.href = 'login.html';
  };

  window.toggleSidebar = function () {
    document.getElementById('adminSidebar').classList.toggle('show');
  };

  // ─── KPI Data ───
  document.getElementById('kpiStaff').textContent = '24';
  document.getElementById('kpiCollections').textContent = '3,847';
  document.getElementById('kpiProducts').textContent = '12,450';
  document.getElementById('kpiRevenue').textContent = '₹2,05,00,000';
  document.getElementById('kpiProfit').textContent = '₹62,00,000';
  document.getElementById('kpiScore').textContent = '94';

  // ─── Collection Trend Chart ───
  new Chart(document.getElementById('collectionTrendChart'), {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        label: 'Collections',
        data: [210, 280, 340, 290, 380, 420, 390, 450, 510, 480, 540, 610],
        borderColor: '#16A34A',
        backgroundColor: 'rgba(22,163,74,0.08)',
        fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2.5
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } } }
  });

  // ─── Revenue by Region ───
  new Chart(document.getElementById('regionChart'), {
    type: 'doughnut',
    data: {
      labels: ['North', 'South', 'East', 'West', 'Central'],
      datasets: [{ data: [35, 25, 18, 14, 8], backgroundColor: ['#16A34A', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444'], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, animation: false, cutout: '60%',
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 8, font: { size: 10 } } } } }
  });

  // ─── Product Distribution ───
  new Chart(document.getElementById('productDistChart'), {
    type: 'bar',
    data: {
      labels: ['TV', 'Laptop', 'Mobile', 'Fridge', 'AC', 'WM', 'Monitor', 'Other'],
      datasets: [{ data: [2800, 2400, 2100, 1500, 1200, 950, 850, 650], backgroundColor: '#16A34A', borderRadius: 4 }]
    },
    options: { responsive: true, maintainAspectRatio: false, animation: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } } }
  });

  // ─── Reusability Distribution ───
  new Chart(document.getElementById('reusabilityChart'), {
    type: 'doughnut',
    data: {
      labels: ['Reusable', 'Repairable', 'Recyclable', 'Scrap'],
      datasets: [{ data: [28, 35, 25, 12], backgroundColor: ['#16A34A', '#3B82F6', '#F59E0B', '#EF4444'], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, animation: false, cutout: '60%',
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 8, font: { size: 10 } } } } }
  });

  // ─── Activity Feed ───
  const activities = [
    { text: 'New staff account created — John Davis (Collector)', time: '5 min ago', color: 'green' },
    { text: 'Assessment #AST-1042 completed — ₹37,000 estimated', time: '12 min ago', color: 'green' },
    { text: 'Collection in North region — 24 items picked up', time: '28 min ago', color: 'blue' },
    { text: 'Staff password reset — Sarah Lee (Assessor)', time: '1 hr ago', color: 'orange' },
    { text: 'Bulk e-waste shipment arrived — 320kg from Eco Corp', time: '2 hrs ago', color: 'blue' },
    { text: 'Monthly revenue target reached 82%', time: '3 hrs ago', color: 'green' },
    { text: 'Low reusability alert — 5 items tagged as scrap', time: '4 hrs ago', color: 'red' },
    { text: 'New product type added — Smart Watch category', time: '5 hrs ago', color: 'green' },
  ];
  const feed = document.getElementById('adminActivityFeed');
  if (feed) {
    feed.innerHTML = activities.map(a => `
      <li><span class="act-dot ${a.color}"></span><span class="act-text">${a.text}</span><span class="act-time">${a.time}</span></li>
    `).join('');
  }
})();
