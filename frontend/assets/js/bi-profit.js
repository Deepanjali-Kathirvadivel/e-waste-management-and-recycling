document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  function animateKPI(id, target, prefix, suffix) {
    var el = document.getElementById(id); var c = 0; var s = Math.ceil(target / 30);
    var i = setInterval(function () { c += s; if (c >= target) { c = target; clearInterval(i); } el.textContent = prefix + c.toLocaleString() + suffix; }, 40);
  }
  animateKPI('kpiCurrentProfit', 35000000, '₹', '');
  animateKPI('kpiPredictedProfit', 51000000, '₹', '');
  animateKPI('kpiSavings', 16000000, '₹', '');
  animateKPI('kpiROI', 34, '', '%');
  animateKPI('kpiPayback', 14, '', 'm');

  var ctx1 = document.getElementById('profitCostChart').getContext('2d');
  new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        { label: 'Revenue', data: [43000000, 45500000, 48000000, 50500000, 53000000, 56000000], backgroundColor: '#16A34A', borderRadius: 4 },
        { label: 'Costs', data: [31500000, 32500000, 33500000, 34500000, 36000000, 37500000], backgroundColor: '#EF4444', borderRadius: 4 }
      ]
    },
        options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { position: 'top' } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { callback: function (v) { return '₹' + (v / 10000000) + 'Cr'; } } } } }
  });

  var ctx2 = document.getElementById('costBreakdownChart').getContext('2d');
  new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: ['Transportation', 'Labor', 'Facility', 'Operational', 'Other'],
      datasets: [{ data: [28, 25, 22, 18, 7], backgroundColor: ['#4F46E5', '#16A34A', '#14B8A6', '#D97706', '#94A3B8'], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { position: 'bottom' } } }
  });
});