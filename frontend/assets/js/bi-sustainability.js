document.addEventListener('DOMContentLoaded', async function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const token = localStorage.getItem('greenera_admin_token');
  if (!token) return;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  try {
    const res = await fetch(API_BASE + '/bi/sustainability', { headers });
    const data = await res.json();
    document.getElementById('kpiScore').textContent = data.score || 0;
    document.getElementById('kpiCollection').textContent = (data.collection_efficiency || 0) + '%';
    document.getElementById('kpiRecovery').textContent = (data.recovery_rate || 0) + '%';
    document.getElementById('kpiTransport').textContent = (data.transportation_efficiency || 0) + '%';
    document.getElementById('kpiFacility').textContent = (data.facility_utilization || 0) + '%';

    const rp = data.region_performance || [];
    new Chart(document.getElementById('regionPerfChart'), {
      type: 'bar',
      data: {
        labels: rp.map(r => r.region) || ['No Data'],
        datasets: [
          { label: 'Products', data: rp.map(r => r.value) || [0], backgroundColor: '#16A34A', borderRadius: 4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } }
    });

    const st = data.sustainability_trend || {};
    new Chart(document.getElementById('sustainabilityTrendsChart'), {
      type: 'line',
      data: { labels: st.labels || ['Jan','Feb','Mar','Apr','May','Jun'], datasets: [{ label: 'Score', data: st.data || [], borderColor: '#16A34A', backgroundColor: 'rgba(22,163,74,0.1)', fill: true, tension: 0.3, pointRadius: 4 }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { min: 50, max: 100 } } }
    });
  } catch (e) { console.error('BI load error:', e); }
});
