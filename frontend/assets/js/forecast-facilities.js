var facilities = {
  centers: [
    { id: 1, name: 'Downtown Collection Hub', capacity: 500, rent: 1000000, electricity: 290000, staffCost: 1500000 },
    { id: 2, name: 'Suburban Recycling Hub', capacity: 350, rent: 700000, electricity: 232000, staffCost: 1160000 },
    { id: 3, name: 'Industrial District Center', capacity: 750, rent: 1500000, electricity: 430000, staffCost: 1800000 }
  ],
  units: [
    { id: 1, name: 'Material Separation Unit A', capacity: 300, rent: 790000, electricity: 340000, staffCost: 1250000 },
    { id: 2, name: 'Shredding & Sorting Unit B', capacity: 450, rent: 1160000, electricity: 480000, staffCost: 1580000 }
  ]
};

var nextFacilityId = { center: 4, unit: 3 };

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  renderFacilities();
});

function renderFacilities() {
  var centersBody = document.getElementById('centersTableBody');
  var unitsBody = document.getElementById('unitsTableBody');
  centersBody.innerHTML = '';
  unitsBody.innerHTML = '';

  facilities.centers.forEach(function (f) {
    centersBody.innerHTML += rowHTML(f, 'center');
  });
  facilities.units.forEach(function (f) {
    unitsBody.innerHTML += rowHTML(f, 'unit');
  });
}

function rowHTML(f, type) {
  return '<tr>' +
    '<td><strong>' + f.name + '</strong></td>' +
    '<td>' + f.capacity.toLocaleString() + '</td>' +
    '<td>₹' + f.rent.toLocaleString('en-IN') + '</td>' +
    '<td>₹' + f.electricity.toLocaleString('en-IN') + '</td>' +
    '<td>₹' + f.staffCost.toLocaleString('en-IN') + '</td>' +
    '<td class="text-end">' +
      '<button class="btn btn-sm btn-outline-primary me-1" onclick="editFacility(' + f.id + ',\'' + type + '\')"><i class="bi bi-pencil"></i></button>' +
      '<button class="btn btn-sm btn-outline-danger" onclick="deleteFacility(' + f.id + ',\'' + type + '\')"><i class="bi bi-trash"></i></button>' +
    '</td>' +
  '</tr>';
}

function openFacilityModal(type) {
  document.getElementById('facilityModalTitle').textContent = type === 'center' ? 'Add Collection Center' : 'Add Preprocessing Unit';
  document.getElementById('facilityType').value = type;
  document.getElementById('facilityId').value = '';
  document.getElementById('facilityName').value = '';
  document.getElementById('facilityCapacity').value = '';
  document.getElementById('facilityRent').value = '';
  document.getElementById('facilityElectricity').value = '';
  document.getElementById('facilityStaffCost').value = '';
  var modal = new bootstrap.Modal(document.getElementById('facilityModal'));
  modal.show();
}

function editFacility(id, type) {
  var list = type === 'center' ? facilities.centers : facilities.units;
  var f = list.find(function (x) { return x.id === id; });
  if (!f) return;
  document.getElementById('facilityModalTitle').textContent = type === 'center' ? 'Edit Collection Center' : 'Edit Preprocessing Unit';
  document.getElementById('facilityType').value = type;
  document.getElementById('facilityId').value = f.id;
  document.getElementById('facilityName').value = f.name;
  document.getElementById('facilityCapacity').value = f.capacity;
  document.getElementById('facilityRent').value = f.rent;
  document.getElementById('facilityElectricity').value = f.electricity;
  document.getElementById('facilityStaffCost').value = f.staffCost;
  var modal = new bootstrap.Modal(document.getElementById('facilityModal'));
  modal.show();
}

function saveFacility() {
  var type = document.getElementById('facilityType').value;
  var list = type === 'center' ? facilities.centers : facilities.units;
  var id = document.getElementById('facilityId').value;
  var data = {
    name: document.getElementById('facilityName').value.trim(),
    capacity: parseInt(document.getElementById('facilityCapacity').value) || 0,
    rent: parseInt(document.getElementById('facilityRent').value) || 0,
    electricity: parseInt(document.getElementById('facilityElectricity').value) || 0,
    staffCost: parseInt(document.getElementById('facilityStaffCost').value) || 0
  };
  if (!data.name) { alert('Facility name is required.'); return; }
  if (id) {
    var f = list.find(function (x) { return x.id === parseInt(id); });
    if (f) { f.name = data.name; f.capacity = data.capacity; f.rent = data.rent; f.electricity = data.electricity; f.staffCost = data.staffCost; }
  } else {
    data.id = nextFacilityId[type]++;
    list.push(data);
  }
  renderFacilities();
  bootstrap.Modal.getInstance(document.getElementById('facilityModal')).hide();
}

function deleteFacility(id, type) {
  if (!confirm('Delete this facility?')) return;
  if (type === 'center') {
    facilities.centers = facilities.centers.filter(function (x) { return x.id !== id; });
  } else {
    facilities.units = facilities.units.filter(function (x) { return x.id !== id; });
  }
  renderFacilities();
}