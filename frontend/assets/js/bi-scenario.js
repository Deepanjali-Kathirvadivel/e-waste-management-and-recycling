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
      const styles = {
        'A': { icon: 'bi-building', bg: '#E0E7FF', color: '#4F46E5' },
        'B': { icon: 'bi-plus-circle', bg: '#DCFCE7', color: '#16A34A' },
        'C': { icon: 'bi-gear', bg: '#CCFBF1', color: '#14B8A6' },
        'D': { icon: 'bi-arrows-expand', bg: '#FEF3C7', color: '#D97706' },
        'E': { icon: 'bi-signpost-2', bg: '#EDE9FE', color: '#8B5CF6' }
      };

      container.innerHTML = scenarios.map((s, i) => {
        const style = styles[s.id] || { icon: 'bi-info-circle', bg: '#F3F4F6', color: '#4B5563' };
        return `
          <div class="col-md-4 col-lg">
            <div class="scenario-card ${i === 0 ? 'active' : ''}" onclick="selectScenario('${s.id}', this)" id="sc${s.id}">
              <div class="scenario-icon" style="background:${style.bg};color:${style.color}"><i class="bi ${style.icon}"></i></div>
              <h6>${s.name}</h6>
              <p class="small text-muted mb-2">${s.description.length > 55 ? s.description.substring(0, 52) + '...' : s.description}</p>
              <div class="d-flex justify-content-between mt-2 pt-2 border-top">
                <span class="small text-success"><strong>Profit:</strong> \u20B9${(s.profit || 0).toLocaleString('en-IN')}</span>
                <span class="small text-danger"><strong>Cost:</strong> \u20B9${(s.cost || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Save global scenarios list
    window.scenariosData = scenarios;

    // Trigger details rendering for first scenario
    if (scenarios.length > 0) {
      window.selectScenario(scenarios[0].id, document.getElementById('sc' + scenarios[0].id));
    }

    const ctx = document.getElementById('scenarioChart').getContext('2d');
    
    const profitGradient = ctx.createLinearGradient(0, 0, 0, 300);
    profitGradient.addColorStop(0, 'rgba(16, 185, 129, 0.95)'); // Emerald Green
    profitGradient.addColorStop(1, 'rgba(5, 150, 105, 0.35)');

    const costGradient = ctx.createLinearGradient(0, 0, 0, 300);
    costGradient.addColorStop(0, 'rgba(239, 68, 68, 0.95)'); // Vivid Red
    costGradient.addColorStop(1, 'rgba(220, 38, 38, 0.35)');

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: scenarios.map(s => s.name.replace('Scenario ', '')),
        datasets: [
          {
            label: 'Projected Profit',
            data: scenarios.map(s => s.profit),
            backgroundColor: profitGradient,
            borderColor: '#10B981',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
            hoverBackgroundColor: 'rgba(16, 185, 129, 1)',
            hoverBorderWidth: 3
          },
          {
            label: 'Estimated Cost',
            data: scenarios.map(s => s.cost),
            backgroundColor: costGradient,
            borderColor: '#EF4444',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
            hoverBackgroundColor: 'rgba(239, 68, 68, 1)',
            hoverBorderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { family: 'Inter', size: 12, weight: 'bold' },
              color: '#4B5563',
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleFont: { family: 'Sora', size: 13, weight: 'bold' },
            bodyFont: { family: 'Inter', size: 12 },
            padding: 12,
            borderRadius: 10,
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'Inter', size: 10, weight: '500' },
              color: '#4B5563'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(229, 231, 235, 0.5)',
              drawBorder: false
            },
            ticks: {
              font: { family: 'Inter', size: 10 },
              color: '#4B5563',
              callback: function(value) {
                if (Math.abs(value) >= 100000) {
                  return '₹' + (value / 100000).toFixed(1) + ' L';
                }
                return '₹' + value.toLocaleString('en-IN');
              }
            }
          }
        }
      }
    });
  } catch (e) { console.error('Scenario load error:', e); }
});

window.selectScenario = function(id, el) {
  document.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');

  const detailEl = document.getElementById('scenarioDetailContent');
  if (detailEl && window.scenariosData) {
    const scenario = window.scenariosData.find(s => s.id === id);
    if (scenario) {
      detailEl.innerHTML = `
        <div class="p-2">
          <h5 class="text-primary fw-bold mb-2">${scenario.name}</h5>
          <p class="text-muted small mb-3">${scenario.description}</p>
          <div class="d-flex justify-content-between py-2 border-bottom">
            <span class="fw-semibold">Estimated Cost:</span>
            <span class="text-danger fw-bold">₹${(scenario.cost || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="d-flex justify-content-between py-2 border-bottom">
            <span class="fw-semibold">Projected Profit:</span>
            <span class="text-success fw-bold">₹${(scenario.profit || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="d-flex justify-content-between py-2 mb-3">
            <span class="fw-semibold">Feasibility:</span>
            <span class="badge bg-success px-2 py-1">Highly Feasible</span>
          </div>
          <button class="btn btn-primary btn-sm w-100 mt-2" onclick="showToast('Scenario implementation initiated!', 'success')">
            <i class="bi bi-play-circle me-1"></i> Apply Scenario
          </button>
        </div>
      `;
    }
  }
};

