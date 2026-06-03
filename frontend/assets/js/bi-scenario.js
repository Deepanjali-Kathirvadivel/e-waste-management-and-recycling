var scenarioData = {
  A: { name: 'Current Infrastructure', profit: 35000000, revenue: 56000000, cost: 37500000, collection: 3200, recovery: 2400, score: 72, roi: '-', payback: '-', investment: 0 },
  B: { name: 'New Collection Center (Madurai)', profit: 42000000, revenue: 64000000, cost: 22000000, collection: 4100, recovery: 3100, score: 78, roi: '28%', payback: '18', investment: 100000000 },
  C: { name: 'New Preprocessing Unit', profit: 45000000, revenue: 68000000, cost: 23000000, collection: 3200, recovery: 3800, score: 81, roi: '32%', payback: '15', investment: 125000000 },
  D: { name: 'Facility Expansion', profit: 50000000, revenue: 78000000, cost: 28000000, collection: 5600, recovery: 4400, score: 85, roi: '42%', payback: '12', investment: 200000000 },
  E: { name: 'Route Optimization', profit: 40000000, revenue: 56000000, cost: 16500000, collection: 3200, recovery: 2400, score: 76, roi: '45%', payback: '8', investment: 37500000 }
};

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  renderScenarioChart();
  showScenarioDetails('A');
});

function selectScenario(id, el) {
  document.querySelectorAll('.scenario-card').forEach(function (c) { c.classList.remove('active'); });
  el.classList.add('active');
  renderScenarioChart(id);
  showScenarioDetails(id);
}

function showScenarioDetails(id) {
  var s = scenarioData[id];
  document.getElementById('scenarioDetailContent').innerHTML =
    '<div class="mb-3"><strong style="font-size:1.1rem">' + s.name + '</strong></div>' +
    '<div class="compare-bar"><span class="bar-label">Profit</span><div class="bar-track"><div class="bar-fill" style="width:' + (s.profit / 55000000 * 100) + '%;background:#16A34A"></div></div><span class="bar-value">₹' + (s.profit / 10000000).toFixed(1) + 'Cr</span></div>' +
    '<div class="compare-bar"><span class="bar-label">Revenue</span><div class="bar-track"><div class="bar-fill" style="width:' + (s.revenue / 85000000 * 100) + '%;background:#4F46E5"></div></div><span class="bar-value">₹' + (s.revenue / 10000000).toFixed(1) + 'Cr</span></div>' +
    '<div class="compare-bar"><span class="bar-label">Collection</span><div class="bar-track"><div class="bar-fill" style="width:' + (s.collection / 6000 * 100) + '%;background:#D97706"></div></div><span class="bar-value">' + s.collection + 't</span></div>' +
    '<div class="compare-bar"><span class="bar-label">Recovery</span><div class="bar-track"><div class="bar-fill" style="width:' + (s.recovery / 5000 * 100) + '%;background:#14B8A6"></div></div><span class="bar-value">' + s.recovery + 't</span></div>' +
    '<hr>' +
    '<div class="row g-2 mt-2">' +
      '<div class="col-6"><small class="text-muted">ROI</small><br><strong>' + s.roi + '</strong></div>' +
      '<div class="col-6"><small class="text-muted">Payback</small><br><strong>' + (s.payback !== '-' ? s.payback + ' months' : s.payback) + '</strong></div>' +
      '<div class="col-6"><small class="text-muted">Investment</small><br><strong>' + (s.investment ? '₹' + (s.investment / 10000000).toFixed(1) + 'Cr' : 'None') + '</strong></div>' +
      '<div class="col-6"><small class="text-muted">Score</small><br><strong>' + s.score + '/100</strong></div>' +
    '</div>';
}

function renderScenarioChart(highlightId) {
  var idx = { A: 0, B: 1, C: 2, D: 3, E: 4 }[highlightId || 'A'];
  var labels = ['A: Current', 'B: New Center', 'C: Preprocess', 'D: Expansion', 'E: Routes'];
  var profitData = [35000000, 42000000, 45000000, 50000000, 40000000];
  var costData = [37500000, 22000000, 23000000, 28000000, 16500000];
  var maxVal = 80000000;

  var html = '';
  for (var i = 0; i < labels.length; i++) {
    var hl = i === idx;
    html +=
      '<div class="scenario-bar-row">' +
        '<div class="sbr-label">' + labels[i] + '</div>' +
        '<div class="sbr-group">' +
          '<div class="sbr-bar">' +
            '<div class="sbr-track"><div class="sbr-fill" style="width:' + (profitData[i] / maxVal * 100) + '%;background:' + (hl ? '#16A34A' : '#D1D5DB') + '"></div></div>' +
            '<div class="sbr-val" style="color:' + (hl ? '#16A34A' : '#9CA3AF') + '">₹' + (profitData[i] / 10000000).toFixed(1) + 'Cr</div>' +
          '</div>' +
          '<div class="sbr-bar">' +
            '<div class="sbr-track"><div class="sbr-fill" style="width:' + (costData[i] / maxVal * 100) + '%;background:' + (hl ? '#EF4444' : '#D1D5DB') + '"></div></div>' +
            '<div class="sbr-val" style="color:' + (hl ? '#EF4444' : '#9CA3AF') + '">₹' + (costData[i] / 10000000).toFixed(1) + 'Cr</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }
  document.getElementById('scenarioChart').innerHTML = html;
}