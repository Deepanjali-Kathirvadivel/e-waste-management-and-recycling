document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  function animateKPI(id, target, prefix, suffix) {
    const el = document.getElementById(id);
    let current = 0;
    const step = Math.ceil(target / 30);
    const interval = setInterval(function () {
      current += step;
      if (current >= target) { current = target; clearInterval(interval); }
      el.textContent = prefix + current.toLocaleString() + suffix;
    }, 40);
  }

  animateKPI('kpiWaste', 28450, '', '');
  animateKPI('kpiGrowth', 12.4, '+', '%');
  animateKPI('kpiScore', 78, '', '/100');
  animateKPI('kpiRevenue', 350000000, '₹', '');

  const trendCtx = document.getElementById('forecastTrendsChart').getContext('2d');
  new Chart(trendCtx, {
    type: 'line',
    data: {
      labels: ['2022', '2023', '2024', '2025', '2026', '2027', '2028'],
      datasets: [
        { label: 'E-Waste (tonnes)', data: [18400, 21200, 23800, 26100, 28450, 31200, 34500], borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.1)', fill: true, tension: 0.3, pointRadius: 4 },
        { label: 'Recovered (tonnes)', data: [9200, 11600, 13500, 15700, 17600, 19800, 22400], borderColor: '#16A34A', backgroundColor: 'rgba(22,163,74,0.1)', fill: true, tension: 0.3, pointRadius: 4 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
  });

  const productCtx = document.getElementById('productForecastChart').getContext('2d');
  new Chart(productCtx, {
    type: 'doughnut',
    data: {
      labels: ['Phones', 'Laptops', 'Appliances', 'Batteries', 'TVs'],
      datasets: [{ data: [28, 22, 20, 17, 13], backgroundColor: ['#8B5CF6', '#16A34A', '#14B8A6', '#D97706', '#EF4444'], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { position: 'bottom' } } }
  });

  const regionCtx = document.getElementById('regionForecastChart').getContext('2d');
  new Chart(regionCtx, {
    type: 'bar',
    data: {
      labels: ['North America', 'Europe', 'Asia Pacific', 'Middle East', 'Latin America', 'Africa'],
      datasets: [
        { label: '2026', data: [8200, 7100, 6200, 3500, 2400, 1050], backgroundColor: '#8B5CF6', borderRadius: 4 },
        { label: '2028', data: [10200, 8800, 7900, 4600, 3200, 1600], backgroundColor: '#16A34A', borderRadius: 4 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { position: 'top' } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } }
  });
});