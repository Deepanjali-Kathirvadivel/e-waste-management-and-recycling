document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  function animateKPI(id, target, suffix) {
    var el = document.getElementById(id); var c = 0; var s = Math.ceil(target / 30);
    var i = setInterval(function () { c += s; if (c >= target) { c = target; clearInterval(i); } el.textContent = c + suffix; }, 40);
  }
  animateKPI('kpiScore', 72, '');
  animateKPI('kpiCollection', 84, '%');
  animateKPI('kpiRecovery', 68, '%');
  animateKPI('kpiTransport', 79, '%');
  animateKPI('kpiFacility', 81, '%');

  var ctx1 = document.getElementById('regionPerfChart').getContext('2d');
  new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: ['Coimbatore', 'Chennai', 'Trichy', 'Salem', 'Cochin'],
      datasets: [
        { label: 'Collection (t)', data: [3200, 2800, 2100, 1800, 2400], backgroundColor: '#4F46E5', borderRadius: 4 },
        { label: 'Recovery (t)', data: [2400, 2100, 1500, 1200, 1800], backgroundColor: '#16A34A', borderRadius: 4 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { position: 'top' } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } }
  });

  var ctx2 = document.getElementById('sustainabilityTrendsChart').getContext('2d');
  new Chart(ctx2, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        { label: 'Score', data: [62, 65, 68, 70, 71, 72], borderColor: '#16A34A', backgroundColor: 'rgba(22,163,74,0.1)', fill: true, tension: 0.3, pointRadius: 4 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } }, scales: { y: { min: 50, max: 80 } } }
  });
});