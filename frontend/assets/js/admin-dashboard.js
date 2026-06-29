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
    const token = localStorage.getItem('greenera_admin_token');
    if (token) {
      fetch(API_BASE + '/auth/logout', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }).catch(() => {});
    }
    localStorage.removeItem('greenera_admin_token');
    localStorage.removeItem('greenera_admin');
    sessionStorage.removeItem('greenera_admin_token');
    sessionStorage.removeItem('greenera_admin');
    window.location.href = 'login.html';
  };

  window.toggleSidebar = function () {
    document.getElementById('adminSidebar').classList.toggle('show');
  };

  function startAdminNotificationPolling() {
    let badge = document.getElementById('adminNotifBadge');
    async function poll() {
      try {
        const res = await fetch(API_BASE + '/notifications/unread-count', { headers });
        const data = await res.json();
        if (badge) {
          badge.textContent = data.count || '';
          badge.style.display = data.count > 0 ? 'flex' : 'none';
        }
      } catch (e) {}
    }
    poll();
    setInterval(poll, 30000);
  }

  async function loadDashboard() {
    try {
      const kpi = await (await fetch(API_BASE + '/admin/dashboard/kpi', { headers })).json();
      document.getElementById('kpiEmployees').textContent = (kpi.total_employees || 0).toLocaleString();
      document.getElementById('kpiManagers').textContent = (kpi.total_managers || 0).toLocaleString();
      document.getElementById('kpiSupplyChain').textContent = (kpi.total_supply_chain || 0).toLocaleString();
      document.getElementById('kpiAssessments').textContent = (kpi.total_assessments || 0).toLocaleString();
      document.getElementById('kpiRevenue').textContent = '\u20B9' + (kpi.revenue || 0).toLocaleString('en-IN');
      document.getElementById('kpiProfit').textContent = '\u20B9' + (kpi.profit || 0).toLocaleString('en-IN');
      document.getElementById('kpiScore').textContent = kpi.sustainability_score || 0;
      const forecastEl = document.getElementById('kpiForecast');
      if (forecastEl) forecastEl.textContent = (kpi.forecast_accuracy || 85) + '%';
      const pendingEl = document.getElementById('kpiPending');
      if (pendingEl) pendingEl.textContent = (kpi.pending_approvals || 0).toLocaleString();
      const hubsEl = document.getElementById('kpiHubs');
      if (hubsEl) hubsEl.textContent = (kpi.hub_count || 0).toLocaleString();
      const collectedEl = document.getElementById('kpiCollected');
      if (collectedEl) collectedEl.textContent = (kpi.collected || 0).toLocaleString();

      const charts = await (await fetch(API_BASE + '/admin/dashboard/charts', { headers })).json();
      renderCharts(charts);
      loadHeatmap();
    } catch (e) {
      console.error('Dashboard load error:', e);
    }
  }

  async function loadHeatmap() {
    try {
      const data = await (await fetch(API_BASE + '/admin/dashboard/heatmap', { headers })).json();
      const countEl = document.getElementById('heatmapCount');
      if (countEl) countEl.textContent = (data.total_points || 0) + ' points';
      const body = document.getElementById('heatmapBody');
      if (!body) return;
      if (data.regions && data.regions.length > 0) {
        let html = '<div class="table-responsive"><table class="table table-sm table-borderless mb-0"><thead><tr><th>Region</th><th>Collections</th><th>Total Value</th></tr></thead><tbody>';
        data.regions.forEach(r => {
          html += `<tr><td>${r.region}</td><td>${r.count}</td><td>\u20B9${(r.total_value || 0).toLocaleString('en-IN')}</td></tr>`;
        });
        html += '</tbody></table></div>';
        body.innerHTML = html;
      } else {
        body.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-map fs-1 d-block mb-2"></i> No collection data with GPS coordinates available.</div>';
      }
    } catch (e) {
      console.error('Heatmap load error:', e);
    }
  }

  function renderCharts(data) {
    const ct = data.collection_trend || { labels: [], collections: [], revenue: [] };
    const chartEl = document.getElementById('collectionTrendChart');
    if (chartEl) {
      const ctx = chartEl.getContext('2d');
      const collectionsGradient = ctx.createLinearGradient(0, 0, 0, 300);
      collectionsGradient.addColorStop(0, 'rgba(22, 163, 74, 0.35)');
      collectionsGradient.addColorStop(1, 'rgba(22, 163, 74, 0.02)');

      const revenueGradient = ctx.createLinearGradient(0, 0, 0, 300);
      revenueGradient.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
      revenueGradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');

      new Chart(chartEl, {
        type: 'line',
        data: {
          labels: ct.labels || ['Jan','Feb','Mar','Apr','May','Jun'],
          datasets: [
            { 
              label: 'Collections', 
              data: ct.collections || [], 
              borderColor: '#16A34A', 
              backgroundColor: collectionsGradient, 
              fill: true, 
              tension: 0.4, 
              pointRadius: 4, 
              pointHoverRadius: 6,
              pointBackgroundColor: '#16A34A',
              borderWidth: 3,
              yAxisID: 'y'
            },
            { 
              label: 'Revenue (\u20B9)', 
              data: ct.revenue || [], 
              borderColor: '#3B82F6', 
              backgroundColor: revenueGradient, 
              fill: true, 
              tension: 0.4, 
              pointRadius: 4, 
              pointHoverRadius: 6,
              pointBackgroundColor: '#3B82F6',
              borderWidth: 3,
              yAxisID: 'y1'
            }
          ]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: true, 
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: { 
            legend: { 
              position: 'top', 
              labels: { usePointStyle: true, font: { size: 11, weight: 'bold' } } 
            },
            tooltip: {
              padding: 10,
              cornerRadius: 8,
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              titleFont: { size: 12, weight: 'bold' },
              bodyFont: { size: 12 },
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.dataset.yAxisID === 'y1') {
                    label += '\u20B9' + context.raw.toLocaleString('en-IN');
                  } else {
                    label += context.raw.toLocaleString();
                  }
                  return label;
                }
              }
            }
          }, 
          scales: { 
            y: { 
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Collections Count',
                color: '#16A34A',
                font: { weight: 'bold', size: 11 }
              },
              beginAtZero: true, 
              grid: { color: 'rgba(0,0,0,0.04)' } 
            }, 
            y1: { 
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Revenue (\u20B9)',
                color: '#3B82F6',
                font: { weight: 'bold', size: 11 }
              },
              beginAtZero: true, 
              grid: { drawOnChartArea: false } 
            },
            x: { 
              grid: { display: false } 
            } 
          } 
        }
      });
    }

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

    const rd = data.reusability_distribution || [];
    new Chart(document.getElementById('reusabilityChart'), {
      type: 'doughnut',
      data: { labels: rd.map(r => r.label) || ['No Data'], datasets: [{ data: rd.map(r => r.value) || [1], backgroundColor: ['#16A34A','#3B82F6','#F59E0B','#EF4444','#8B5CF6'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: true, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 8, font: { size: 10 } } } } }
    });

    const hu = data.hub_utilization || [];
    if (hu.length > 0) {
      new Chart(document.getElementById('hubUtilChart'), {
        type: 'bar',
        data: {
          labels: hu.map(h => h.label),
          datasets: [
            { label: 'Facilities', data: hu.map(h => h.facilities), backgroundColor: '#3B82F6', borderRadius: 4 },
            { label: 'Inventory Items', data: hu.map(h => h.inventory), backgroundColor: '#16A34A', borderRadius: 4 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top', labels: { usePointStyle: true, font: { size: 10 } } } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } } }
      });
    }
  }

  loadDashboard();
  startAdminNotificationPolling();
})();
