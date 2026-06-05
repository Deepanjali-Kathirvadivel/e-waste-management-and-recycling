document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  runRecommendations();
});

async function runRecommendations() {
  const transport = parseFloat(document.getElementById('transportCost').value) || 0;
  const facility = parseFloat(document.getElementById('facilityCost').value) || 0;
  const labor = parseFloat(document.getElementById('laborCost').value) || 0;
  const operational = parseFloat(document.getElementById('operationalCost').value) || 0;
  const token = localStorage.getItem('greenera_admin_token');
  if (!token) return;

  try {
    const res = await fetch(API_BASE + '/bi/recommendations', {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ transportation: transport, facility: facility, labor: labor, operational: operational })
    });
    const data = await res.json();
    document.getElementById('currentProfit').textContent = '\u20B9' + (data.current_profit || 0).toLocaleString('en-IN');
    document.getElementById('predictedProfit').textContent = '\u20B9' + (data.predicted_profit || 0).toLocaleString('en-IN');
    document.getElementById('feasibilityBadge').textContent = data.feasibility === 'high' ? 'Feasible' : 'Low Feasibility';
    document.getElementById('feasibilityBadge').className = 'badge ' + (data.feasibility === 'high' ? 'bg-green' : 'bg-warning text-dark') + ' fs-6';

    const list = document.getElementById('recommendationList');
    list.innerHTML = '';
    (data.recommendations || []).forEach(r => {
      const div = document.createElement('div');
      div.className = 'list-group-item';
      div.innerHTML = `<h6 class="mb-1"><span class="badge bg-${r.feasibility === 'high' ? 'success' : r.feasibility === 'medium' ? 'warning' : 'danger'} me-2">${r.feasibility}</span>${r.title}</h6><p class="mb-1 small text-muted">${r.description}</p><small>Cost: \u20B9${(r.estimated_cost || 0).toLocaleString()} | Benefit: \u20B9${(r.estimated_benefit || 0).toLocaleString()}</small>`;
      list.appendChild(div);
    });
  } catch (e) {
    showToast('Error generating recommendations', 'error');
  }
}
