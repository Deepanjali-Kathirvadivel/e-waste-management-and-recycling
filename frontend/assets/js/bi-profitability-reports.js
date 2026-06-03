document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
});

function generateProfitReport(type, format) {
  var preview = document.getElementById('profitReportPreview');
  var titles = { revenue: 'Revenue Report', cost: 'Cost Analysis', profit: 'Profit Report' };
  var title = titles[type] || 'Report';

  var tables = {
    revenue:
      '<table class="table table-sm table-bordered">' +
        '<tr><th>Region</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th>Total</th></tr>' +
        '<tr><td>Coimbatore</td><td>₹3.52Cr</td><td>₹3.74Cr</td><td>₹3.98Cr</td><td>₹4.23Cr</td><td>₹15.47Cr</td></tr>' +
        '<tr><td>Chennai</td><td>₹3.15Cr</td><td>₹3.28Cr</td><td>₹3.49Cr</td><td>₹3.69Cr</td><td>₹13.61Cr</td></tr>' +
        '<tr><td>Trichy</td><td>₹1.74Cr</td><td>₹1.91Cr</td><td>₹2.08Cr</td><td>₹2.24Cr</td><td>₹7.97Cr</td></tr>' +
        '<tr><td>Salem</td><td>₹1.45Cr</td><td>₹1.58Cr</td><td>₹1.74Cr</td><td>₹1.91Cr</td><td>₹6.68Cr</td></tr>' +
        '<tr><td>Cochin</td><td>₹2.45Cr</td><td>₹2.61Cr</td><td>₹2.82Cr</td><td>₹3.03Cr</td><td>₹10.91Cr</td></tr>' +
        '<tr class="table-success"><td><strong>Total</strong></td><td><strong>₹12.31Cr</strong></td><td><strong>₹13.12Cr</strong></td><td><strong>₹14.11Cr</strong></td><td><strong>₹15.10Cr</strong></td><td><strong>₹54.64Cr</strong></td></tr>' +
      '</table>',
    cost:
      '<table class="table table-sm table-bordered">' +
        '<tr><th>Category</th><th>Monthly</th><th>% of Total</th><th>YoY Change</th></tr>' +
        '<tr><td>Transportation</td><td>₹1,05,00,000</td><td>28%</td><td class="text-success">-5%</td></tr>' +
        '<tr><td>Facility</td><td>₹81,00,000</td><td>22%</td><td class="text-danger">+3%</td></tr>' +
        '<tr><td>Labor</td><td>₹93,00,000</td><td>25%</td><td class="text-danger">+4%</td></tr>' +
        '<tr><td>Operational</td><td>₹68,00,000</td><td>18%</td><td class="text-success">-2%</td></tr>' +
        '<tr><td>Other</td><td>₹30,00,000</td><td>7%</td><td class="text-success">-1%</td></tr>' +
        '<tr class="table-success"><td><strong>Total</strong></td><td><strong>₹3,77,00,000</strong></td><td><strong>100%</strong></td><td></td></tr>' +
      '</table>',
    profit:
      '<table class="table table-sm table-bordered">' +
        '<tr><th>Metric</th><th>Current</th><th>Predicted</th><th>Change</th></tr>' +
        '<tr><td>Gross Revenue</td><td>₹5,60,00,000</td><td>₹7,05,00,000</td><td class="text-success">+26%</td></tr>' +
        '<tr><td>Total Costs</td><td>₹3,77,00,000</td><td>₹1,95,00,000</td><td class="text-success">-48%</td></tr>' +
        '<tr><td>Net Profit</td><td>₹3,53,00,000</td><td>₹5,10,00,000</td><td class="text-success">+44%</td></tr>' +
        '<tr><td>Profit Margin</td><td>62.5%</td><td>72.4%</td><td class="text-success">+9.9pp</td></tr>' +
        '<tr><td>ROI</td><td>—</td><td>34%</td><td class="text-success">New</td></tr>' +
        '<tr><td>Payback Period</td><td>—</td><td>14 months</td><td class="text-success">New</td></tr>' +
      '</table>'
  };

  preview.innerHTML =
    '<div class="d-flex justify-content-between align-items-center mb-3">' +
      '<h6 class="fw-bold mb-0">' + title + '</h6>' +
      '<span class="badge bg-success">Generated: ' + new Date().toLocaleDateString() + '</span>' +
    '</div>' +
    (tables[type] || '') +
    '<div class="small text-muted mt-2">GreenEra E-Waste Management — Confidential</div>';

  showToast(format.toUpperCase() + ' export simulated — file downloaded.', 'success');
}