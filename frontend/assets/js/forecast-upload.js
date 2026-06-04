const token = localStorage.getItem('greenera_admin_token');
const headers = { 'Authorization': `Bearer ${token}` };

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
});

function handleUpload(type, inputId) {
  const input = document.getElementById(inputId);
  if (!input || !input.files.length) return;
  const formData = new FormData();
  formData.append('file', input.files[0]);
  formData.append('data_type', type);
  fetch(API_BASE + '/forecast/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData })
    .then(r => r.json()).then(d => { showToast(type + ' uploaded', 'success'); })
    .catch(e => showToast('Upload failed', 'error'));
}

function runForecast() {
  const btn = document.querySelector('.btn-generate-forecast');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Generating...'; }
  fetch(API_BASE + '/forecast/generate', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } })
    .then(r => r.json()).then(d => {
      showToast('Forecast generated', 'success');
      setTimeout(() => { window.location.href = 'forecast-results.html'; }, 1000);
    }).catch(e => showToast('Generation failed', 'error'))
    .finally(() => { if (btn) { btn.disabled = false; btn.textContent = 'Generate Forecast'; } });
}
