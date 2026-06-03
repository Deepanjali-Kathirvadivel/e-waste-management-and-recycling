var uploadedFile = null;
var previewData = null;

var samplePreviews = {
  collection: { headers: ['Date', 'Region', 'Quantity (t)', 'Type'], rows: [['2025-Q1', 'North America', '2,100', 'Mixed'], ['2025-Q1', 'Europe', '1,850', 'Mixed'], ['2025-Q2', 'North America', '2,450', 'Mixed'], ['2025-Q2', 'Asia Pacific', '1,620', 'Mixed']] },
  population: { headers: ['Region', 'Population', 'Year', 'Urban %'], rows: [['North America', '372M', '2025', '82%'], ['Europe', '447M', '2025', '75%'], ['Asia Pacific', '1.2B', '2025', '68%'], ['Middle East', '258M', '2025', '72%']] },
  sales: { headers: ['Product', 'Region', 'Units Sold', 'Year'], rows: [['Smartphones', 'Global', '1.42B', '2025'], ['Laptops', 'Global', '275M', '2025'], ['TVs', 'Global', '195M', '2025'], ['Tablets', 'Global', '165M', '2025']] },
  import: { headers: ['Region', 'Import (t)', 'Export (t)', 'Year'], rows: [['North America', '1,200', '850', '2025'], ['Europe', '980', '1,450', '2025'], ['Asia Pacific', '2,100', '680', '2025'], ['Middle East', '520', '370', '2025']] },
  revenue: { headers: ['Region', 'Revenue (₹)', 'Cost (₹)', 'Year'], rows: [['North America', '10,40,00,000', '7,25,00,000', '2025'], ['Europe', '8,15,00,000', '5,90,00,000', '2025'], ['Asia Pacific', '9,30,00,000', '6,70,00,000', '2025'], ['Middle East', '4,50,00,000', '3,40,00,000', '2025']] },
  cost: { headers: ['Category', 'Amount (₹)', 'Region', 'Year'], rows: [['Transport', '3,50,00,000', 'North America', '2025'], ['Processing', '3,15,00,000', 'Europe', '2025'], ['Labor', '4,30,00,000', 'Asia Pacific', '2025'], ['Utilities', '1,55,00,000', 'Middle East', '2025']] }
};

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  clearAll();
});

function handleDataUpload(input) {
  if (!input.files || !input.files.length) return;
  uploadedFile = input.files[0];
  var zone = document.getElementById('dataUploadZone');
  zone.classList.add('success');
  zone.querySelector('h6').textContent = uploadedFile.name;
  zone.querySelector('small').textContent = (uploadedFile.size / 1024).toFixed(1) + ' KB uploaded';
  document.getElementById('processBtn').disabled = false;
}

function processUpload() {
  if (!uploadedFile) return;

  var type = document.getElementById('dataType').value;
  var sample = samplePreviews[type] || samplePreviews.collection;
  var hasHeader = document.getElementById('hasHeader').checked;

  var head = document.getElementById('previewHead');
  var body = document.getElementById('previewBody');
  head.innerHTML = '';
  body.innerHTML = '';

  if (hasHeader) {
    var headerRow = '<tr>';
    sample.headers.forEach(function (h) { headerRow += '<th>' + h + '</th>'; });
    headerRow += '</tr>';
    head.innerHTML = headerRow;
  }

  sample.rows.forEach(function (row) {
    var html = '<tr>';
    row.forEach(function (cell) { html += '<td>' + cell + '</td>'; });
    html += '</tr>';
    body.innerHTML += html;
  });

  document.getElementById('rowCount').textContent = sample.rows.length + ' rows';
  document.getElementById('importBtn').disabled = false;

  var validDiv = document.getElementById('validationResults');
  validDiv.innerHTML =
    '<div class="validation-item pass"><i class="bi bi-check-circle-fill"></i> File format: ' + uploadedFile.name.split('.').pop().toUpperCase() + '</div>' +
    '<div class="validation-item pass"><i class="bi bi-check-circle-fill"></i> ' + sample.headers.length + ' columns detected</div>' +
    '<div class="validation-item pass"><i class="bi bi-check-circle-fill"></i> ' + sample.rows.length + ' rows parsed successfully</div>' +
    '<div class="validation-item pass"><i class="bi bi-check-circle-fill"></i> Data type: ' + document.getElementById('dataType').options[document.getElementById('dataType').selectedIndex].text + '</div>';
}

function bulkImport() {
  var btn = document.getElementById('importBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Importing...';
  setTimeout(function () {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-database-fill-add me-1"></i> Bulk Import';
    document.getElementById('validationResults').innerHTML =
      '<div class="validation-item pass"><i class="bi bi-check-circle-fill"></i> Import successful — ' + document.getElementById('rowCount').textContent + ' inserted</div>';
    clearAll();
  }, 1500);
}

function clearAll() {
  uploadedFile = null;
  previewData = null;
  document.getElementById('dataUploadZone').classList.remove('success');
  document.getElementById('dataUploadZone').querySelector('h6').textContent = 'Click to upload or drag & drop';
  document.getElementById('dataUploadZone').querySelector('small').textContent = 'Excel (.xlsx, .xls) or CSV (.csv) — max 20MB';
  document.getElementById('dataFileInput').value = '';
  document.getElementById('previewHead').innerHTML = '';
  document.getElementById('previewBody').innerHTML = '';
  document.getElementById('rowCount').textContent = '0 rows';
  document.getElementById('processBtn').disabled = true;
  document.getElementById('importBtn').disabled = true;
  document.getElementById('validationResults').innerHTML = '<div class="text-muted small">Upload a file to see validation results</div>';
}