document.addEventListener('DOMContentLoaded', async function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const token = localStorage.getItem('greenera_admin_token');
  if (!token) return;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  try {
    const res = await fetch(API_BASE + '/forecast/results', { headers });
    const data = await res.json();
    const results = data.results || [];

    const container = document.getElementById('forecastCards');
    if (container) {
      container.innerHTML = results.slice(0, 6).map(r => `
        <div class="col-md-4">
          <div class="forecast-card">
            <h6>${r.region?.name || 'Unknown'}</h6>
            <div class="d-flex justify-content-between mt-2">
              <span>Waste: ${(r.forecasted_waste || 0).toLocaleString()} t</span>
              <span>Growth: ${r.growth_rate || 0}%</span>
            </div>
          </div>
        </div>
      `).join('');
    }

    const regions = [...new Set(results.map(r => r.region?.name || 'Unknown'))];
    const years = [...new Set(results.map(r => r.forecast_year))].sort();
    const regionData = regions.map(reg => {
      const vals = years.map(y => {
        const f = results.find(r => r.region?.name === reg && r.forecast_year === y);
        return f ? f.forecasted_waste : 0;
      });
      return { label: reg, data: vals };
    });

    new Chart(document.getElementById('forecastGrowthChart'), {
      type: 'bar',
      data: { labels: years.map(String), datasets: regionData.slice(0, 5).map((rd, i) => ({
        label: rd.label, data: rd.data, backgroundColor: ['#8B5CF6','#16A34A','#14B8A6','#D97706','#EF4444'][i], borderRadius: 3
      })) },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } }
    });

    new Chart(document.getElementById('productDemandChart'), {
      type: 'bar',
      data: { labels: regions.slice(0, 6), datasets: [{ label: 'Waste (t)', data: regions.slice(0, 6).map(reg => { const f = results.find(r => r.region?.name === reg); return f ? f.forecasted_waste : 0; }), backgroundColor: '#16A34A', borderRadius: 4 }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } }
    });
  } catch (e) { console.error('Forecast results error:', e); }
});

function filterResults() {
  const region = document.getElementById('regionFilter')?.value;
  showToast('Filtered by: ' + (region || 'all'), 'info');
}
