document.addEventListener('DOMContentLoaded', async function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const token = localStorage.getItem('greenera_admin_token');
  if (!token) return;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  try {
    const res = await fetch(API_BASE + '/bi/scenarios', { headers });
    const data = await res.json();
    const scenarios = data.scenarios || [];

    const container = document.getElementById('scenarioCards');
    if (container) {
      container.innerHTML = scenarios.map((s, i) => `
        <div class="col-md-4 col-lg scenario-card-wrapper">
          <div class="scenario-card ${i === 0 ? 'active' : ''}" onclick="selectScenario('${s.id}', this)">
            <h5>${s.name}</h5>
            <p class="small text-muted">${s.description}</p>
            <div class="d-flex justify-content-between mt-2">
              <span><strong>Profit:</strong> \u20B9${(s.profit || 0).toLocaleString('en-IN')}</span>
              <span><strong>Cost:</strong> \u20B9${(s.cost || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      `).join('');
    }

    new Chart(document.getElementById('scenarioChart'), {
      type: 'bar',
      data: {
        labels: scenarios.map(s => s.name.substring(0, 10) + '...'),
        datasets: [
          { label: 'Profit', data: scenarios.map(s => s.profit), backgroundColor: '#16A34A', borderRadius: 4 },
          { label: 'Cost', data: scenarios.map(s => s.cost), backgroundColor: '#EF4444', borderRadius: 4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } }
    });
  } catch (e) { console.error('Scenario load error:', e); }
});

window.selectScenario = function(id, el) {
  document.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  showToast('Scenario ' + id + ' selected', 'info');
};
