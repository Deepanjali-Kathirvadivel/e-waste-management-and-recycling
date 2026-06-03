document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
});

function generateReport(type, format) {
  var preview = document.getElementById('reportPreview');
  var title = type === 'sustainability' ? 'Sustainability Report' : 'Environmental Impact Report';

  var content = '';
  if (type === 'sustainability') {
    content =
      '<div class="d-flex justify-content-between align-items-center mb-3">' +
        '<h6 class="fw-bold mb-0">' + title + '</h6>' +
        '<span class="badge bg-success">Generated: ' + new Date().toLocaleDateString() + '</span>' +
      '</div>' +
      '<table class="table table-sm table-bordered">' +
        '<tr><td><strong>Sustainability Score</strong></td><td>72 / 100</td><td class="text-success">+8 pts YoY</td></tr>' +
        '<tr><td><strong>Collection Efficiency</strong></td><td>84%</td><td class="text-success">+5% YoY</td></tr>' +
        '<tr><td><strong>Recovery Rate</strong></td><td>68%</td><td class="text-success">+12% YoY</td></tr>' +
        '<tr><td><strong>Transportation Efficiency</strong></td><td>79%</td><td class="text-success">+3% YoY</td></tr>' +
        '<tr><td><strong>Facility Utilization</strong></td><td>81%</td><td class="text-success">+7% YoY</td></tr>' +
        '<tr><td><strong>Total Waste Collected</strong></td><td colspan="2">12,300 tonnes (YTD)</td></tr>' +
        '<tr><td><strong>Total Material Recovered</strong></td><td colspan="2">8,400 tonnes (YTD)</td></tr>' +
      '</table>' +
      '<div class="small text-muted">' + generateFooter() + '</div>';
  } else {
    content =
      '<div class="d-flex justify-content-between align-items-center mb-3">' +
        '<h6 class="fw-bold mb-0">' + title + '</h6>' +
        '<span class="badge bg-success">Generated: ' + new Date().toLocaleDateString() + '</span>' +
      '</div>' +
      '<table class="table table-sm table-bordered">' +
        '<tr><td><strong>CO₂ Emissions Reduced</strong></td><td>4,250 tonnes</td><td class="text-success">-18% YoY</td></tr>' +
        '<tr><td><strong>Energy Saved</strong></td><td>8.2 MWh</td><td class="text-success">+22% YoY</td></tr>' +
        '<tr><td><strong>Landfill Diversion Rate</strong></td><td>74%</td><td class="text-success">+9% YoY</td></tr>' +
        '<tr><td><strong>Water Saved</strong></td><td>1.8M litres</td><td class="text-success">+15% YoY</td></tr>' +
        '<tr><td><strong>Trees Equivalent Saved</strong></td><td colspan="2">12,500 trees</td></tr>' +
        '<tr><td><strong>Hazardous Waste Safely Processed</strong></td><td colspan="2">1,850 tonnes</td></tr>' +
      '</table>' +
      '<div class="small text-muted">' + generateFooter() + '</div>';
  }

  preview.innerHTML = content;
  showToast(format.toUpperCase() + ' export simulated — file downloaded.', 'success');
}

function generateFooter() {
  return 'GreenEra E-Waste Management — ' + new Date().getFullYear() + ' | Confidential';
}