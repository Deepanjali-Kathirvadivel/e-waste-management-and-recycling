document.addEventListener('DOMContentLoaded', async function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const token = localStorage.getItem('greenera_admin_token');
  if (!token) return;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  try {
    const res = await fetch(API_BASE + '/bi/profitability', { headers });
    const data = await res.json();
    document.getElementById('kpiProfit').textContent = '\u20B9' + (data.current_profit || 0).toLocaleString('en-IN');
    document.getElementById('kpiPredicted').textContent = '\u20B9' + (data.predicted_profit || 0).toLocaleString('en-IN');
    document.getElementById('kpiSavings').textContent = '\u20B9' + (data.savings || 0).toLocaleString('en-IN');
    document.getElementById('kpiROI').textContent = (data.roi || 0) + '%';
    document.getElementById('kpiPayback').textContent = (data.payback_period || 0) + ' mo';

    const pt = data.profit_trend || {};
    new Chart(document.getElementById('profitChart'), {
      type: 'line',
      data: {
        labels: pt.labels || ['Jan','Feb','Mar','Apr','May','Jun'],
        datasets: [
          { label: 'Revenue', data: pt.revenue || [], borderColor: '#16A34A', backgroundColor: 'rgba(22,163,74,0.1)', fill: true, tension: 0.3 },
          { label: 'Cost', data: pt.cost || [], borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.3 },
          { label: 'Profit', data: pt.profit || [], borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.3 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
    });

    new Chart(document.getElementById('costChart'), {
      type: 'doughnut',
      data: { labels: ['Transport', 'Facility', 'Labor', 'Operations'], datasets: [{ data: [25, 30, 25, 20], backgroundColor: ['#3B82F6','#16A34A','#F59E0B','#EF4444'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
    });
  } catch (e) { console.error('BI profit load error:', e); }
});
