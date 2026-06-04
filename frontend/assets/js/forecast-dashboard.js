document.addEventListener('DOMContentLoaded', async function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const token = localStorage.getItem('greenera_admin_token');
  if (!token) return;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  try {
    const res = await fetch(API_BASE + '/forecast/dashboard', { headers });
    const data = await res.json();
    document.getElementById('kpiWaste').textContent = (data.forecasted_waste || 0).toLocaleString();
    document.getElementById('kpiGrowth').textContent = '+' + (data.growth_rate || 0) + '%';
    document.getElementById('kpiScore').textContent = (data.opportunity_score || 0) + '/100';
    document.getElementById('kpiRevenue').textContent = '\u20B9' + (data.predicted_revenue || 0).toLocaleString('en-IN');

    const trend = data.trend || {};
    new Chart(document.getElementById('forecastTrendsChart'), {
      type: 'line',
      data: { labels: trend.labels || ['Y1','Y2','Y3','Y4','Y5'], datasets: [{ label: 'E-Waste (tonnes)', data: trend.data || [], borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.1)', fill: true, tension: 0.3, pointRadius: 4 }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
    });

    const pd = data.product_demand || [];
    new Chart(document.getElementById('productForecastChart'), {
      type: 'doughnut',
      data: { labels: pd.map(p => p.product) || ['No Data'], datasets: [{ data: pd.map(p => p.demand) || [1], backgroundColor: ['#8B5CF6','#16A34A','#14B8A6','#D97706','#EF4444','#3B82F6'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
    });

    const rd = data.region_data || [];
    new Chart(document.getElementById('regionForecastChart'), {
      type: 'bar',
      data: { labels: rd.map(r => r.region) || ['No Data'], datasets: [{ label: 'Forecast', data: rd.map(r => r.forecast) || [0], backgroundColor: '#8B5CF6', borderRadius: 4 }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } }
    });
  } catch (e) { console.error('Forecast dashboard error:', e); }
});
