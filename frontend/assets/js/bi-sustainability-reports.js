document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
});

function generateReport(type, format) {
  const token = localStorage.getItem('greenera_admin_token');
  if (!token) return;
  const a = document.createElement('a');
  a.href = API_BASE + '/bi/reports/' + type + '/' + format;
  a.download = type + '.' + format;
  a.click();
  showToast(type + ' report (' + format + ') downloaded');
}
