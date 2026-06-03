document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  renderForecastCards('all');
  initCharts();
});

var forecastData = [
  { id: 'north-america', name: 'North America', y1: 8200, y3: 24800, y5: 43000 },
  { id: 'europe', name: 'Europe', y1: 7100, y3: 21400, y5: 37000 },
  { id: 'asia-pacific', name: 'Asia Pacific', y1: 6200, y3: 19200, y5: 34000 },
  { id: 'middle-east', name: 'Middle East', y1: 3500, y3: 10800, y5: 19500 },
  { id: 'latin-america', name: 'Latin America', y1: 2400, y3: 7400, y5: 13200 },
  { id: 'africa', name: 'Africa', y1: 1050, y3: 3400, y5: 6200 }
];

function renderForecastCards(filter) {
  var container = document.getElementById('forecastCards');
  container.innerHTML = '';
  forecastData.forEach(function (r) {
    if (filter !== 'all' && r.id !== filter) return;
    container.innerHTML +=
      '<div class="col-md-4">' +
        '<div class="card border-0 shadow-sm h-100">' +
          '<div class="card-body">' +
            '<h6 class="fw-bold mb-3"><i class="bi bi-geo-alt me-2 text-primary"></i>' + r.name + '</h6>' +
            '<div class="row g-2">' +
              '<div class="col-4"><div class="forecast-card p-2"><div class="year-badge y1">1 Year</div><h3 class="fs-5">' + (r.y1/1000).toFixed(1) + 'k</h3><p>tonnes</p></div></div>' +
              '<div class="col-4"><div class="forecast-card p-2"><div class="year-badge y3">3 Year</div><h3 class="fs-5">' + (r.y3/1000).toFixed(1) + 'k</h3><p>tonnes</p></div></div>' +
              '<div class="col-4"><div class="forecast-card p-2"><div class="year-badge y5">5 Year</div><h3 class="fs-5">' + (r.y5/1000).toFixed(1) + 'k</h3><p>tonnes</p></div></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  });
}

function filterResults() {
  renderForecastCards(document.getElementById('regionFilter').value);
}

function initCharts() {
  var growthCtx = document.getElementById('forecastGrowthChart').getContext('2d');
  new Chart(growthCtx, {
    type: 'line',
    data: {
      labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
      datasets: [
        { label: 'North America', data: [8200, 14200, 24800, 33000, 43000], borderColor: '#8B5CF6', tension: 0.3, pointRadius: 3 },
        { label: 'Europe', data: [7100, 12000, 21400, 28500, 37000], borderColor: '#16A34A', tension: 0.3, pointRadius: 3 },
        { label: 'Asia Pacific', data: [6200, 10800, 19200, 26000, 34000], borderColor: '#14B8A6', tension: 0.3, pointRadius: 3 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
  });

  var demandCtx = document.getElementById('productDemandChart').getContext('2d');
  new Chart(demandCtx, {
    type: 'bar',
    data: {
      labels: ['Phones', 'Laptops', 'Appliances', 'Batteries', 'TVs', 'Tablets'],
      datasets: [
        { label: 'Current', data: [28, 22, 20, 17, 13, 10], backgroundColor: '#94A3B8', borderRadius: 4 },
        { label: 'Forecasted', data: [35, 28, 26, 22, 18, 15], backgroundColor: '#8B5CF6', borderRadius: 4 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, ticks: { callback: function (v) { return v + '%'; } } } } }
  });
}