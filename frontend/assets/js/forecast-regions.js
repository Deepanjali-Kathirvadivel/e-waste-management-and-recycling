var regions = [
  { id: 1, name: 'North America', population: 372000000, growth: 2.8, collection: 8200, revenue: 104000000 },
  { id: 2, name: 'Europe', population: 447000000, growth: 1.5, collection: 7100, revenue: 81500000 },
  { id: 3, name: 'Asia Pacific', population: 1200000000, growth: 4.2, collection: 6200, revenue: 93000000 },
  { id: 4, name: 'Middle East', population: 258000000, growth: 3.1, collection: 3500, revenue: 45000000 },
  { id: 5, name: 'Latin America', population: 652000000, growth: 2.9, collection: 2400, revenue: 32000000 },
  { id: 6, name: 'Africa', population: 1386000000, growth: 3.8, collection: 1050, revenue: 14500000 }
];

var nextRegionId = 7;

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  renderRegions();
});

function renderRegions() {
  var tbody = document.getElementById('regionTableBody');
  tbody.innerHTML = '';
  regions.forEach(function (r) {
    tbody.innerHTML +=
      '<tr>' +
        '<td><strong>' + r.name + '</strong></td>' +
        '<td>' + (r.population / 1000000).toFixed(1) + 'M</td>' +
        '<td>' + r.growth + '%</td>' +
        '<td>' + r.collection.toLocaleString() + '</td>' +
        '<td>₹' + r.revenue.toLocaleString('en-IN') + '</td>' +
        '<td class="text-end">' +
          '<button class="btn btn-sm btn-outline-primary me-1" onclick="editRegion(' + r.id + ')"><i class="bi bi-pencil"></i></button>' +
          '<button class="btn btn-sm btn-outline-danger" onclick="deleteRegion(' + r.id + ')"><i class="bi bi-trash"></i></button>' +
        '</td>' +
      '</tr>';
  });
}

function openRegionModal() {
  document.getElementById('regionModalTitle').textContent = 'Add Region';
  document.getElementById('regionId').value = '';
  document.getElementById('regionName').value = '';
  document.getElementById('regionPopulation').value = '';
  document.getElementById('regionGrowth').value = '';
  document.getElementById('regionCollection').value = '';
  document.getElementById('regionRevenue').value = '';
}

function editRegion(id) {
  var r = regions.find(function (x) { return x.id === id; });
  if (!r) return;
  document.getElementById('regionModalTitle').textContent = 'Edit Region';
  document.getElementById('regionId').value = r.id;
  document.getElementById('regionName').value = r.name;
  document.getElementById('regionPopulation').value = r.population;
  document.getElementById('regionGrowth').value = r.growth;
  document.getElementById('regionCollection').value = r.collection;
  document.getElementById('regionRevenue').value = r.revenue;
  var modal = new bootstrap.Modal(document.getElementById('regionModal'));
  modal.show();
}

function saveRegion() {
  var id = document.getElementById('regionId').value;
  var data = {
    name: document.getElementById('regionName').value.trim(),
    population: parseInt(document.getElementById('regionPopulation').value) || 0,
    growth: parseFloat(document.getElementById('regionGrowth').value) || 0,
    collection: parseInt(document.getElementById('regionCollection').value) || 0,
    revenue: parseInt(document.getElementById('regionRevenue').value) || 0
  };
  if (!data.name) { alert('Region name is required.'); return; }
  if (id) {
    var r = regions.find(function (x) { return x.id === parseInt(id); });
    if (r) { r.name = data.name; r.population = data.population; r.growth = data.growth; r.collection = data.collection; r.revenue = data.revenue; }
  } else {
    data.id = nextRegionId++;
    regions.push(data);
  }
  renderRegions();
  bootstrap.Modal.getInstance(document.getElementById('regionModal')).hide();
}

function deleteRegion(id) {
  if (!confirm('Delete this region?')) return;
  regions = regions.filter(function (x) { return x.id !== id; });
  renderRegions();
}