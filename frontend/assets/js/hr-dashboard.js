(function() {
  const user = checkAuth();
  if (!user) return;
  if (user.role !== 'hr' && user.role !== 'admin') { window.location.href = '../dashboard.html'; return; }

  document.getElementById('userName').textContent = user.full_name || user.username;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('dashboardDate').textContent = dateStr;
  document.getElementById('dashboardDateText').textContent = dateStr;

  const chartColors = ['#16A34A', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899'];

  async function loadDashboard() {
    try {
      const res = await fetch(API_BASE + '/hr/dashboard', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load dashboard');
      const data = await res.json();

      document.getElementById('kpiPending').textContent = data.pending_quotations || 0;
      document.getElementById('kpiApproved').textContent = data.approved_today || 0;
      document.getElementById('kpiRejected').textContent = data.rejected_today || 0;
      document.getElementById('kpiTotal').textContent = (data.total_quotations || 0).toLocaleString();

      const branchBody = document.getElementById('branchTableBody');
      if (data.branch_performance && data.branch_performance.length) {
        branchBody.innerHTML = data.branch_performance.map(b =>
          `<tr><td>${b.branch}</td><td>${b.count}</td><td><span class="status-badge completed">Active</span></td></tr>`
        ).join('');
      } else {
        branchBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">No branch data yet</td></tr>';
      }

      const trendLabels = data.quotation_trends?.labels || [];
      const trendCounts = data.quotation_trends?.counts || [];
      const categories = data.category_distribution || [];
      const categoryLabels = categories.length ? categories.map(c => c.category) : ['No data'];
      const categoryCounts = categories.length ? categories.map(c => c.count) : [1];

      new Chart(document.getElementById('trendChart'), {
        type: 'line',
        data: {
          labels: trendLabels,
          datasets: [{
            label: 'Quotations',
            data: trendCounts,
            borderColor: '#16A34A',
            fill: true,
            backgroundColor: 'rgba(22,163,74,0.1)',
            tension: 0.4,
          }],
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
      });

      new Chart(document.getElementById('categoryChart'), {
        type: 'doughnut',
        data: {
          labels: categoryLabels,
          datasets: [{
            data: categoryCounts,
            backgroundColor: categoryLabels.map((_, i) => chartColors[i % chartColors.length]),
            borderWidth: 0,
          }],
        },
        options: { responsive: true, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } } },
      });
    } catch (e) {
      console.error('HR Dashboard error:', e);
      document.getElementById('branchTableBody').innerHTML =
        '<tr><td colspan="3" class="text-center text-danger py-4">Failed to load dashboard data</td></tr>';
    }
  }

  loadDashboard();
})();
