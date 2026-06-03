document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  runRecommendations();
});

var baseRecommendations = [
  { title: 'Optimize Collection Routes', invest: 15000000, roi: 28, payback: 8, confidence: 92, desc: 'AI-driven route optimization across all 4 collection centers to reduce fuel and transit time.' },
  { title: 'Add Preprocessing at Coimbatore', invest: 37500000, roi: 22, payback: 14, confidence: 85, desc: 'Install automated sorting and shredding at the central hub to increase recovery yield.' },
  { title: 'Expand Chennai Center Capacity', invest: 26500000, roi: 18, payback: 16, confidence: 78, desc: 'Double the collection and processing capacity at Chennai to handle growing volume.' },
  { title: 'Deploy Smart Bins City-Wide', invest: 8000000, roi: 35, payback: 6, confidence: 88, desc: 'IoT-enabled smart bins for real-time fill monitoring and dynamic collection scheduling.' },
  { title: 'Staff Training Program', invest: 3750000, roi: 15, payback: 4, confidence: 72, desc: 'Train staff on advanced sorting techniques to improve recovery rates by 8-12%.' }
];

function runRecommendations() {
  var transport = parseInt(document.getElementById('costTransport').value) || 0;
  var facility = parseInt(document.getElementById('costFacility').value) || 0;
  var labor = parseInt(document.getElementById('costLabor').value) || 0;
  var operational = parseInt(document.getElementById('costOperational').value) || 0;

  var totalCost = transport + facility + labor + operational;
  var revenue = 56000000;
  var currentProfit = revenue - totalCost;
  var predictedProfit = currentProfit + Math.round(currentProfit * 0.45);

  var currentRevEl = document.getElementById('currentProfitView');
  var predictedRevEl = document.getElementById('predictedProfitView');
  var feasibleEl = document.getElementById('feasibleBadge');

  currentRevEl.textContent = '₹' + currentProfit.toLocaleString('en-IN');
  predictedRevEl.textContent = '₹' + predictedProfit.toLocaleString('en-IN');

  var feasible = predictedProfit > currentProfit;
  feasibleEl.className = 'badge bg-' + (feasible ? 'success' : 'danger');
  feasibleEl.textContent = feasible ? 'Yes' : 'No';

  var list = document.getElementById('recommendationList');
  list.innerHTML = '';

  if (!feasible) {
    list.innerHTML = '<div class="alert alert-warning">Predicted profit does not exceed current profit. Adjust costs or revenue assumptions.</div>';
    return;
  }

  baseRecommendations.forEach(function (rec) {
    var adjustedRoi = rec.roi + Math.round((predictedProfit - currentProfit) / 10000);
    list.innerHTML +=
      '<div class="card border-0 shadow-sm mb-3">' +
        '<div class="card-body">' +
          '<div class="d-flex justify-content-between align-items-start">' +
            '<div>' +
              '<h6 class="fw-bold mb-1"><i class="bi bi-check-circle-fill text-success me-2"></i>' + rec.title + '</h6>' +
              '<p class="small text-muted mb-2">' + rec.desc + '</p>' +
              '<div class="d-flex gap-3 flex-wrap small">' +
                '<span><strong>Investment:</strong> ₹' + rec.invest.toLocaleString('en-IN') + '</span>' +
                '<span><strong>ROI:</strong> ' + adjustedRoi + '%</span>' +
                '<span><strong>Payback:</strong> ' + rec.payback + ' months</span>' +
                '<span><span class="badge-score ' + (rec.confidence >= 85 ? 'high' : rec.confidence >= 75 ? 'medium' : 'low') + '"><i class="bi bi-star-fill"></i> ' + rec.confidence + '% confidence</span></span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  });
}