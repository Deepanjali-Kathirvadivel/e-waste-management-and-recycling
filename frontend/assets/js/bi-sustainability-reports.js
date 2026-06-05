document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
});

async function generateReport(type, format) {
  const token = localStorage.getItem('greenera_admin_token');
  if (!token) return;
  const headers = { 'Authorization': `Bearer ${token}` };

  const previewEl = document.getElementById('reportPreview');
  if (previewEl) {
    previewEl.innerHTML = `<div class="text-center py-4"><span class="spinner-border text-success" role="status"></span> Generating preview...</div>`;
  }

  try {
    // 1. Fetch JSON preview
    const res = await fetch(API_BASE + '/bi/reports/' + type + '/json', { headers });
    if (!res.ok) throw new Error('Failed to load report data');
    const data = await res.json();

    // Render Preview
    if (previewEl) {
      previewEl.innerHTML = `
        <h5 class="fw-bold mb-2 text-dark">${data.title}</h5>
        <p class="small text-muted mb-3">Generated: ${new Date().toLocaleString()}</p>
        <div class="table-responsive">
          <table class="table table-bordered table-striped align-middle mb-0">
            <thead class="table-dark">
              <tr>
                ${data.headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.rows.map(row => `
                <tr>
                  ${row.map(cell => `<td>${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // 2. Download Report
    const ext = format === 'excel' ? 'xlsx' : 'pdf';
    const downloadRes = await fetch(API_BASE + '/bi/reports/' + type + '/' + ext, { headers });
    if (!downloadRes.ok) throw new Error('Failed to download report file');
    const blob = await downloadRes.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = type + '-report.' + ext;
    a.click();
    URL.revokeObjectURL(downloadUrl);

    showToast(data.title + ' generated successfully', 'success');
  } catch (err) {
    console.error(err);
    if (previewEl) {
      previewEl.innerHTML = `<div class="alert alert-danger mb-0">Error generating report preview: ${err.message}</div>`;
    }
    showToast('Failed to generate report', 'error');
  }
}

