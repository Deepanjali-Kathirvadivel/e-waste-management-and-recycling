document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
});

function handleUpload(type) {
  const zoneId = 'uploadZone' + type.charAt(0).toUpperCase() + type.slice(1);
  const previewId = 'preview' + type.charAt(0).toUpperCase() + type.slice(1);
  const fileInput = document.getElementById('file' + type.charAt(0).toUpperCase() + type.slice(1));

  if (!fileInput || !fileInput.files.length) return;

  const zone = document.getElementById(zoneId);
  const preview = document.getElementById(previewId);

  zone.classList.add('success');
  zone.querySelector('h6').textContent = fileInput.files[0].name;
  zone.querySelector('small').textContent = (fileInput.files[0].size / 1024).toFixed(1) + ' KB uploaded';
  preview.classList.remove('d-none');

  updateValidation();
}

function clearUpload(type) {
  const zoneId = 'uploadZone' + type.charAt(0).toUpperCase() + type.slice(1);
  const previewId = 'preview' + type.charAt(0).toUpperCase() + type.slice(1);
  const fileInput = document.getElementById('file' + type.charAt(0).toUpperCase() + type.slice(1));

  const zone = document.getElementById(zoneId);
  const preview = document.getElementById(previewId);

  zone.classList.remove('success');
  zone.querySelector('h6').textContent = 'Click to upload Excel file';
  zone.querySelector('small').textContent = '.xlsx, .xls (max 10MB)';
  preview.classList.add('d-none');
  if (fileInput) fileInput.value = '';

  updateValidation();
}

function updateValidation() {
  const summary = document.getElementById('validationSummary');
  const items = summary.querySelectorAll('.validation-item');
  const statuses = ['collection', 'population', 'sales', 'import'].map(function (type) {
    const zone = document.getElementById('uploadZone' + type.charAt(0).toUpperCase() + type.slice(1));
    return zone && zone.classList.contains('success');
  });

  var i;
  for (i = 0; i < items.length; i++) {
    const pass = statuses[i];
    items[i].className = 'validation-item ' + (pass ? 'pass' : 'fail');
    items[i].innerHTML = pass
      ? '<i class="bi bi-check-circle-fill"></i> ' + items[i].textContent.trim().replace(/^./, function (c) { return c.toUpperCase(); })
      : '<i class="bi bi-exclamation-circle-fill"></i> ' + items[i].textContent.trim().replace(/^./, function (c) { return c.toUpperCase(); });
  }
}

function runForecast() {
  const btn = document.querySelector('.btn-success');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generating...';
  setTimeout(function () {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-lightning-fill me-2"></i>Generate Forecast';
    window.location.href = 'forecast-results.html';
  }, 2000);
}