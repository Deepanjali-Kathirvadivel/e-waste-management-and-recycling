(function() {
  const user = checkAuth();
  if (!user) return;
  const isEmployee = user.role === 'employee';
  const isCenterManager = user.role === 'center_manager';

  if (isEmployee || isCenterManager) {
    const bc = document.getElementById('branchChart');
    if (bc) bc.closest('.col-lg-4').style.display = 'none';
  }

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

  const chartColors = ['#16A34A', '#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  function statusLabel(action) {
    const map = {
      assessment_created: 'Draft',
      assessment_submitted: 'Pending',
      assessment_resubmitted: 'Pending',
      quotation_approved: 'Approved',
      quotation_rejected: 'Rejected',
      deal_closed: 'Completed',
    };
    for (const [key, label] of Object.entries(map)) {
      if (action.includes(key.replace('assessment_', '').replace('quotation_', '')) || action === key) return label;
    }
    if (action.includes('reject')) return 'Rejected';
    if (action.includes('approv')) return 'Approved';
    if (action.includes('submit')) return 'Pending';
    return 'Completed';
  }

  function statusClass(label) {
    if (label === 'Pending') return 'pending';
    if (label === 'Approved') return 'completed';
    if (label === 'Rejected') return 'rejected';
    if (label === 'Draft') return 'in_progress';
    return 'completed';
  }

  async function loadDashboard() {
    try {
      const kpi = await (await fetch(API_BASE + '/dashboard/kpi', { headers: getAuthHeaders() })).json();
      document.getElementById('kpiToday').textContent = kpi.today_assessments || kpi.today_collections || 0;
      document.getElementById('kpiPending').textContent = kpi.pending_approvals || kpi.pending_quotations || 0;
      document.getElementById('kpiApproved').textContent = kpi.approved_deals || kpi.approved_quotations || 0;
      document.getElementById('kpiRejected').textContent = kpi.rejected_deals || kpi.rejected_quotations || 0;
      document.getElementById('kpiValue').textContent = '\u20B9' + (kpi.collection_value || 0).toLocaleString('en-IN');

      const promises = [
        fetch(API_BASE + '/dashboard/charts/daily-trend', { headers: getAuthHeaders() }),
        fetch(API_BASE + '/dashboard/charts/category', { headers: getAuthHeaders() }),
      ];
      if (!isEmployee && !isCenterManager) {
        promises.push(fetch(API_BASE + '/dashboard/charts/branch', { headers: getAuthHeaders() }));
      }
      const [dailyRes, catRes, branchRes] = await Promise.all(promises);
      if (dailyRes.ok) renderLineChart('dailyTrendChart', await dailyRes.json());
      if (catRes.ok) renderDoughnutChart('categoryChart', (await catRes.json()).distribution);
      if (!isEmployee && !isCenterManager && branchRes && branchRes.ok) renderDoughnutChart('branchChart', (await branchRes.json()).distribution);

      if (kpi.activities && document.getElementById('activitiesTableBody')) {
        const tbody = document.getElementById('activitiesTableBody');
        if (!kpi.activities.length) {
          tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No recent activity</td></tr>';
        } else {
          tbody.innerHTML = kpi.activities.map(a => {
            const meta = a.metadata || {};
            const customer = meta.customer || meta.name || '-';
            const product = meta.product || meta.product_name || '-';
            const actionLabel = a.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const dateLabel = new Date(a.createdAt || a.created_at).toLocaleString();
            const st = statusLabel(a.action);
            return `<tr>
              <td class="small">${dateLabel}</td>
              <td>${actionLabel}</td>
              <td>${customer}</td>
              <td>${product}</td>
              <td><span class="status-badge ${statusClass(st)}">${st}</span></td>
            </tr>`;
          }).join('');
        }
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    }
  }

  function renderLineChart(canvasId, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || typeof Chart === 'undefined') return;
    new Chart(ctx.getContext('2d'), {
      type: 'line',
      data: {
        labels: data.labels || [],
        datasets: [{
          label: 'Assessments',
          data: data.data || [],
          borderColor: '#16A34A',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          fill: true, tension: 0.4, pointBackgroundColor: '#16A34A', pointRadius: 4, borderWidth: 3
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } }
      }
    });
  }

  function renderDoughnutChart(canvasId, distribution) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || typeof Chart === 'undefined') return;
    const items = (distribution && distribution.length) ? distribution : [{ label: 'No data', value: 1 }];
    new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: items.map(d => d.label),
        datasets: [{
          data: items.map(d => d.value),
          backgroundColor: items.map((_, i) => chartColors[i % chartColors.length]),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: true, cutout: '60%',
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 8, font: { size: 10 } } } }
      }
    });
  }

  loadDashboard();
})();
