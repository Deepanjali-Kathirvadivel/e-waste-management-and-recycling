const token = localStorage.getItem('greenera_admin_token');
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
});

function handleDataUpload(input) {
  if (!input || !input.files.length) return;
  const formData = new FormData();
  formData.append('file', input.files[0]);
  formData.append('data_type', document.getElementById('dataType')?.value || 'historical_collection');
  fetch(API_BASE + '/forecast/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData })
    .then(r => r.json()).then(d => {
      showToast('File uploaded: ' + (d.data?.original_name || ''), 'success');
      document.getElementById('fileInfo').textContent = (d.data?.original_name || '') + ' (' + (d.data?.row_count || 'processing') + ' rows)';
    })
    .catch(e => showToast('Upload failed', 'error'));
}

function processUpload() {
  fetch(API_BASE + '/forecast/data/validate', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } })
    .then(r => r.json()).then(d => {
      document.getElementById('rowCount').textContent = d.row_count || 0;
      showToast('Validated: ' + d.row_count + ' rows', 'success');
    }).catch(e => showToast('Validation failed', 'error'));
}

function bulkImport() {
  fetch(API_BASE + '/forecast/data/import', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } })
    .then(r => r.json()).then(d => { showToast(d.rows_imported + ' rows imported', 'success'); })
    .catch(e => showToast('Import failed', 'error'));
}
