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

  async function loadDashboard() {
    try {
      const kpi = await (await fetch(API_BASE + '/dashboard/kpi', { headers: getAuthHeaders() })).json();
      document.getElementById('kpiCollections').textContent = kpi.today_collections || 0;
      document.getElementById('kpiAssessments').textContent = (kpi.total_assessments || 0).toLocaleString();
      document.getElementById('kpiValue').textContent = '\u20B9' + (kpi.collection_value || 0).toLocaleString();
      document.getElementById('kpiPending').textContent = kpi.pending_assessments || 0;

      const trend = await (await fetch(API_BASE + '/dashboard/charts/trend', { headers: getAuthHeaders() })).json();
      renderTrendChart(trend);
      const dist = await (await fetch(API_BASE + '/dashboard/charts/distribution', { headers: getAuthHeaders() })).json();
      renderDistributionChart(dist.distribution);

      if (kpi.activities && document.getElementById('activitiesTableBody')) {
        const tbody = document.getElementById('activitiesTableBody');
        tbody.innerHTML = kpi.activities.map(a => {
          const meta = a.metadata ? JSON.stringify(a.metadata) : '';
          return `
            <tr>
              <td class="small">${new Date(a.createdAt || a.created_at).toLocaleString()}</td>
              <td>${a.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
              <td>${meta || '-'}</td>
              <td>${a.entity_type || '-'}</td>
              <td><span class="status-badge completed">Completed</span></td>
            </tr>`;
        }).join('');
      }
    } catch (err) {
      document.getElementById('kpiCollections').textContent = '0';
      document.getElementById('kpiAssessments').textContent = '0';
      document.getElementById('kpiValue').textContent = '\u20B90';
      document.getElementById('kpiPending').textContent = '0';
    }
  }

  function renderTrendChart(data) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    new Chart(ctx.getContext('2d'), {
      type: 'line',
      data: {
        labels: data.labels || ['Jan','Feb','Mar','Apr','May','Jun'],
        datasets: [{
          label: 'Assessments',
          data: data.data || [0,0,0,0,0,0],
          borderColor: '#16A34A',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          fill: true, tension: 0.4, pointBackgroundColor: '#16A34A', pointRadius: 4, borderWidth: 3
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 20 } } },
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } }
      }
    });
  }

  function renderDistributionChart(distribution) {
    const ctx = document.getElementById('distributionChart');
    if (!ctx) return;
    new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: distribution.map(d => d.label) || ['No Data'],
        datasets: [{
          data: distribution.map(d => d.value) || [1],
          backgroundColor: ['#16A34A','#22C55E','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: true, cutout: '65%',
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 12, font: { size: 11 } } } }
      }
    });
  }

  loadDashboard();
})();
