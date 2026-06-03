document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
});

var execData = {
  collection: {
    title: 'Collection Report',
    table: '<table class="table table-sm table-bordered"><tr><th>Region</th><th>Monthly (t)</th><th>YTD (t)</th><th>Centers</th><th>Efficiency</th></tr><tr><td>Coimbatore</td><td>3,200</td><td>19,200</td><td>1 Hub</td><td>78%</td></tr><tr><td>Chennai</td><td>2,800</td><td>16,800</td><td>1 Center</td><td>82%</td></tr><tr><td>Trichy</td><td>2,100</td><td>12,600</td><td>1 Center</td><td>74%</td></tr><tr><td>Salem</td><td>1,800</td><td>10,800</td><td>1 Center</td><td>71%</td></tr><tr><td>Cochin</td><td>2,400</td><td>14,400</td><td>1 Center</td><td>79%</td></tr><tr class="table-success"><td><strong>Total</strong></td><td><strong>12,300</strong></td><td><strong>73,800</strong></td><td><strong>5</strong></td><td><strong>76.8%</strong></td></tr></table>'
  },
  forecast: {
    title: 'Forecast Report',
    table: '<table class="table table-sm table-bordered"><tr><th>Region</th><th>2025</th><th>2026</th><th>2027</th><th>2028</th><th>Growth</th></tr><tr><td>Coimbatore</td><td>28,500</td><td>31,200</td><td>34,500</td><td>38,800</td><td class="text-success">+36%</td></tr><tr><td>Chennai</td><td>22,400</td><td>24,800</td><td>27,600</td><td>31,000</td><td class="text-success">+38%</td></tr><tr><td>Trichy</td><td>16,800</td><td>18,500</td><td>20,400</td><td>22,800</td><td class="text-success">+36%</td></tr><tr><td>Salem</td><td>13,200</td><td>14,800</td><td>16,500</td><td>18,600</td><td class="text-success">+41%</td></tr><tr><td>Cochin</td><td>18,600</td><td>20,400</td><td>22,800</td><td>25,600</td><td class="text-success">+38%</td></tr></table>'
  },
  reusability: {
    title: 'Reusability Report',
    table: '<table class="table table-sm table-bordered"><tr><th>Category</th><th>Total</th><th>Reusable</th><th>Repairable</th><th>Recyclable</th><th>Scrap</th></tr><tr><td>Phones</td><td>3,420</td><td>1,850</td><td>820</td><td>520</td><td>230</td></tr><tr><td>Laptops</td><td>2,680</td><td>1,240</td><td>710</td><td>480</td><td>250</td></tr><tr><td>Appliances</td><td>1,950</td><td>620</td><td>540</td><td>510</td><td>280</td></tr><tr><td>Batteries</td><td>1,720</td><td>320</td><td>410</td><td>760</td><td>230</td></tr><tr><td>TVs</td><td>1,350</td><td>480</td><td>390</td><td>310</td><td>170</td></tr></table>'
  },
  staff: {
    title: 'Staff Performance Report',
    table: '<table class="table table-sm table-bordered"><tr><th>Staff</th><th>Role</th><th>Collections (t)</th><th>Assessments</th><th>Productivity</th><th>Rating</th></tr><tr><td>John Davis</td><td>Collector</td><td>185</td><td>42</td><td>92%</td><td class="text-success">A+</td></tr><tr><td>Sarah Lee</td><td>Technician</td><td>—</td><td>78</td><td>88%</td><td class="text-success">A</td></tr><tr><td>Mike Brown</td><td>Collector</td><td>162</td><td>35</td><td>81%</td><td class="text-success">B+</td></tr><tr><td>Emma Wilson</td><td>Analyst</td><td>—</td><td>64</td><td>85%</td><td class="text-success">A</td></tr><tr><td>James Chen</td><td>Operator</td><td>148</td><td>28</td><td>79%</td><td class="text-warning">B</td></tr></table>'
  },
  sustainability: {
    title: 'Sustainability Report',
    table: '<table class="table table-sm table-bordered"><tr><td><strong>Sustainability Score</strong></td><td>72 / 100</td><td class="text-success">+8 pts YoY</td></tr><tr><td><strong>Collection Efficiency</strong></td><td>84%</td><td class="text-success">+5% YoY</td></tr><tr><td><strong>Recovery Rate</strong></td><td>68%</td><td class="text-success">+12% YoY</td></tr><tr><td><strong>Transportation Efficiency</strong></td><td>79%</td><td class="text-success">+3% YoY</td></tr><tr><td><strong>Facility Utilization</strong></td><td>81%</td><td class="text-success">+7% YoY</td></tr><tr><td><strong>CO₂ Reduced</strong></td><td colspan="2">4,250 tonnes</td></tr><tr><td><strong>Landfill Diversion</strong></td><td colspan="2">74%</td></tr></table>'
  },
  profitability: {
    title: 'Profitability Report',
    table: '<table class="table table-sm table-bordered"><tr><th>Metric</th><th>Current</th><th>Predicted</th><th>Change</th></tr><tr><td>Gross Revenue</td><td>₹5,60,00,000</td><td>₹7,05,00,000</td><td class="text-success">+26%</td></tr><tr><td>Total Costs</td><td>₹3,77,00,000</td><td>₹1,95,00,000</td><td class="text-success">-48%</td></tr><tr><td>Net Profit</td><td>₹3,53,00,000</td><td>₹5,10,00,000</td><td class="text-success">+44%</td></tr><tr><td>Profit Margin</td><td>62.5%</td><td>72.4%</td><td class="text-success">+9.9pp</td></tr><tr><td>ROI</td><td>—</td><td>34%</td><td class="text-success">New</td></tr><tr><td>Payback Period</td><td>—</td><td>14 months</td><td class="text-success">New</td></tr></table>'
  }
};

function generateExecutive(type) {
  var data = execData[type];
  if (!data) return;
  var preview = document.getElementById('executivePreview');
  preview.innerHTML =
    '<div class="d-flex justify-content-between align-items-center mb-3">' +
      '<h6 class="fw-bold mb-0">' + data.title + '</h6>' +
      '<span class="badge bg-success">Generated: ' + new Date().toLocaleDateString() + '</span>' +
    '</div>' +
    data.table +
    '<div class="d-flex gap-2 mt-3">' +
      '<button class="btn btn-sm btn-success" onclick="showToast(\'PDF exported\',\'success\')"><i class="bi bi-filetype-pdf me-1"></i> Export PDF</button>' +
      '<button class="btn btn-sm btn-outline-success" onclick="showToast(\'Excel exported\',\'success\')"><i class="bi bi-file-earmark-excel me-1"></i> Export Excel</button>' +
    '</div>' +
    '<div class="small text-muted mt-2">GreenEra E-Waste Management — Confidential</div>';
}