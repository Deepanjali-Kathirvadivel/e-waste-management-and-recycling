var logistics = [
  { id: 1, route: 'Downtown to Hub A', distance: 45, fuel: 232000, driver: 265000, vehicle: 125000, maintenance: 66000 },
  { id: 2, route: 'Suburban to Hub B', distance: 62, fuel: 290000, driver: 265000, vehicle: 125000, maintenance: 79000 },
  { id: 3, route: 'Industrial to Hub C', distance: 28, fuel: 174000, driver: 250000, vehicle: 100000, maintenance: 58000 },
  { id: 4, route: 'Airport to Recovery', distance: 78, fuel: 348000, driver: 282000, vehicle: 150000, maintenance: 91000 },
  { id: 5, route: 'Port to Processing', distance: 35, fuel: 215000, driver: 257000, vehicle: 125000, maintenance: 70000 }
];

var nextLogisticsId = 6;

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  renderLogistics();
});

function renderLogistics() {
  var tbody = document.getElementById('logisticsTableBody');
  tbody.innerHTML = '';
  logistics.forEach(function (r) {
    tbody.innerHTML +=
      '<tr>' +
        '<td><strong>' + r.route + '</strong></td>' +
        '<td>' + r.distance + '</td>' +
        '<td>₹' + r.fuel.toLocaleString('en-IN') + '</td>' +
        '<td>₹' + r.driver.toLocaleString('en-IN') + '</td>' +
        '<td>₹' + r.vehicle.toLocaleString('en-IN') + '</td>' +
        '<td>₹' + r.maintenance.toLocaleString('en-IN') + '</td>' +
        '<td class="text-end">' +
          '<button class="btn btn-sm btn-outline-primary me-1" onclick="editLogistics(' + r.id + ')"><i class="bi bi-pencil"></i></button>' +
          '<button class="btn btn-sm btn-outline-danger" onclick="deleteLogistics(' + r.id + ')"><i class="bi bi-trash"></i></button>' +
        '</td>' +
      '</tr>';
  });
}

function openLogisticsModal() {
  document.getElementById('logisticsModalTitle').textContent = 'Add Route';
  document.getElementById('logisticsId').value = '';
  document.getElementById('logisticsRoute').value = '';
  document.getElementById('logisticsDistance').value = '';
  document.getElementById('logisticsFuel').value = '';
  document.getElementById('logisticsDriver').value = '';
  document.getElementById('logisticsVehicle').value = '';
  document.getElementById('logisticsMaintenance').value = '';
}

function editLogistics(id) {
  var r = logistics.find(function (x) { return x.id === id; });
  if (!r) return;
  document.getElementById('logisticsModalTitle').textContent = 'Edit Route';
  document.getElementById('logisticsId').value = r.id;
  document.getElementById('logisticsRoute').value = r.route;
  document.getElementById('logisticsDistance').value = r.distance;
  document.getElementById('logisticsFuel').value = r.fuel;
  document.getElementById('logisticsDriver').value = r.driver;
  document.getElementById('logisticsVehicle').value = r.vehicle;
  document.getElementById('logisticsMaintenance').value = r.maintenance;
  var modal = new bootstrap.Modal(document.getElementById('logisticsModal'));
  modal.show();
}

function saveLogistics() {
  var id = document.getElementById('logisticsId').value;
  var data = {
    route: document.getElementById('logisticsRoute').value.trim(),
    distance: parseInt(document.getElementById('logisticsDistance').value) || 0,
    fuel: parseInt(document.getElementById('logisticsFuel').value) || 0,
    driver: parseInt(document.getElementById('logisticsDriver').value) || 0,
    vehicle: parseInt(document.getElementById('logisticsVehicle').value) || 0,
    maintenance: parseInt(document.getElementById('logisticsMaintenance').value) || 0
  };
  if (!data.route) { alert('Route name is required.'); return; }
  if (id) {
    var r = logistics.find(function (x) { return x.id === parseInt(id); });
    if (r) { r.route = data.route; r.distance = data.distance; r.fuel = data.fuel; r.driver = data.driver; r.vehicle = data.vehicle; r.maintenance = data.maintenance; }
  } else {
    data.id = nextLogisticsId++;
    logistics.push(data);
  }
  renderLogistics();
  bootstrap.Modal.getInstance(document.getElementById('logisticsModal')).hide();
}

function deleteLogistics(id) {
  if (!confirm('Delete this route?')) return;
  logistics = logistics.filter(function (x) { return x.id !== id; });
  renderLogistics();
}