(function () {
  const admin = JSON.parse(localStorage.getItem('greenera_admin') || 'null');
  if (!admin || !localStorage.getItem('greenera_admin_token')) {
    window.location.href = 'login.html'; return;
  }

  const initials = (admin.full_name || 'Admin').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('adminAvatar').textContent = initials || 'A';
  document.getElementById('adminDate').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const token = localStorage.getItem('greenera_admin_token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  window.adminLogout = function () {
    localStorage.removeItem('greenera_admin_token');
    localStorage.removeItem('greenera_admin');
    window.location.href = 'login.html';
  };

  window.toggleSidebar = function () {
    document.getElementById('adminSidebar').classList.toggle('show');
  };

  async function loadDashboard() {
    try {
      const kpi = await (await fetch(API_BASE + '/admin/dashboard/kpi', { headers })).json();
      document.getElementById('kpiStaff').textContent = (kpi.total_staff || 0).toLocaleString();
      document.getElementById('kpiCollections').textContent = (kpi.collections || 0).toLocaleString();
      document.getElementById('kpiProducts').textContent = (kpi.total_products || 0).toLocaleString();
      document.getElementById('kpiRevenue').textContent = '\u20B9' + (kpi.revenue || 0).toLocaleString('en-IN');
      document.getElementById('kpiProfit').textContent = '\u20B9' + (kpi.profit || 0).toLocaleString('en-IN');
      document.getElementById('kpiScore').textContent = kpi.sustainability_score || 0;

      const charts = await (await fetch(API_BASE + '/admin/dashboard/charts', { headers })).json();
      renderCharts(charts);
    } catch (e) {
      console.error('Dashboard load error:', e);
    }
  }

  function renderCharts(data) {
    const ct = data.collection_trend || { labels: [], collections: [], revenue: [] };
    new Chart(document.getElementById('collectionTrendChart'), {
      type: 'line',
      data: {
        labels: ct.labels || ['Jan','Feb','Mar','Apr','May','Jun'],
        datasets: [
          { label: 'Collections', data: ct.collections || [], borderColor: '#16A34A', backgroundColor: 'rgba(22,163,74,0.08)', fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2.5 },
          { label: 'Revenue', data: ct.revenue || [], borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.08)', fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2.5 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top', labels: { usePointStyle: true, font: { size: 10 } } } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } } }
    });

    const rr = data.region_revenue || [];
    new Chart(document.getElementById('regionChart'), {
      type: 'doughnut',
      data: { labels: rr.map(r => r.label) || ['No Data'], datasets: [{ data: rr.map(r => r.value) || [1], backgroundColor: ['#16A34A','#3B82F6','#F59E0B','#8B5CF6','#EF4444','#EC4899','#14B8A6'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: true, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 8, font: { size: 10 } } } } }
    });

    const pd = data.product_distribution || [];
    new Chart(document.getElementById('productDistChart'), {
      type: 'bar',
      data: { labels: pd.map(p => p.label) || ['No Data'], datasets: [{ data: pd.map(p => p.value) || [1], backgroundColor: '#16A34A', borderRadius: 4 }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } } }
    });

    new Chart(document.getElementById('reusabilityChart'), {
      type: 'doughnut',
      data: { labels: ['Reusable', 'Repairable', 'Recyclable', 'Scrap'], datasets: [{ data: [28, 35, 25, 12], backgroundColor: ['#16A34A','#3B82F6','#F59E0B','#EF4444'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: true, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 8, font: { size: 10 } } } } }
    });
  }

  loadDashboard();
})();
