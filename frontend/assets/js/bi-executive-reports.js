document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
});

function generateExecutive(type) {
  const reports = {
    collection: { title: 'Collection Report', headers: ['Month', 'Items', 'Weight (kg)', 'Value'], rows: [['Jan', 320, 4800, 125000], ['Feb', 450, 6200, 180000], ['Mar', 380, 5100, 142000], ['Apr', 520, 7800, 210000], ['May', 490, 7200, 195000], ['Jun', 610, 9100, 248000]] },
    forecast: { title: 'Forecast Report', headers: ['Year', 'Waste (t)', 'Growth', 'Revenue'], rows: [['2024', 23800, '8.2%', '18.5Cr'], ['2025', 26100, '9.7%', '21.2Cr'], ['2026', 28450, '9.0%', '23.8Cr'], ['2027', 31200, '9.7%', '26.5Cr']] },
    reusability: { title: 'Reusability Report', headers: ['Category', 'Count', 'Percentage', 'Avg Value'], rows: [['Reusable', 3486, '28%', 20000], ['Repairable', 4358, '35%', 10000], ['Recyclable', 3112, '25%', 3500], ['Scrap', 1494, '12%', 1000]] },
    staff: { title: 'Staff Performance Report', headers: ['Name', 'Role', 'Assessments', 'Rating'], rows: [['John Davis', 'Collector', 340, 4.7], ['Sarah Lee', 'Assessor', 560, 4.8], ['Mike Brown', 'Verifier', 420, 4.5], ['Emma Wilson', 'Collector', 280, 4.6]] },
    sustainability: { title: 'Sustainability Report', headers: ['Metric', 'Score', 'Target', 'Status'], rows: [['Overall Score', 72, 80, 'On Track'], ['Collection Eff.', '84%', '85%', 'Near Target'], ['Recovery Rate', '68%', '75%', 'Needs Focus']] },
    profitability: { title: 'Profitability Report', headers: ['Month', 'Revenue', 'Cost', 'Profit'], rows: [['Apr', '18.2L', '10.9L', '7.3L'], ['May', '19.5L', '11.7L', '7.8L'], ['Jun', '21.0L', '12.6L', '8.4L']] },
  };
  const report = reports[type] || reports.collection;
  const headers = report.headers.join('\t');
  const rows = report.rows.map(r => r.join('\t')).join('\n');
  const text = report.title + '\nGenerated: ' + new Date().toLocaleDateString() + '\n\n' + headers + '\n' + rows;
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = type + '-report.txt';
  a.click();
  showToast(report.title + ' generated');
}
