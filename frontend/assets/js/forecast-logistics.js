document.addEventListener('DOMContentLoaded', async function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const token = localStorage.getItem('greenera_admin_token');
  if (!token) return;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  let routes = [];

  async function load() {
    try {
      const res = await fetch(API_BASE + '/logistics', { headers });
      const data = await res.json();
      routes = data.logistics || [];
      renderTable();
    } catch (e) { showToast('Error loading routes', 'error'); }
  }

  function renderTable() {
    const tbody = document.getElementById('logisticsTableBody');
    if (!tbody) return;
    tbody.innerHTML = routes.map(r => `
      <tr>
        <td>${r.route_name}</td>
        <td>${r.origin?.name || '-'}</td>
        <td>${r.destination?.name || '-'}</td>
        <td>${r.distance_km || '-'} km</td>
        <td>\u20B9${(r.fuel_cost || 0).toLocaleString()}</td>
        <td>\u20B9${(r.driver_salary || 0).toLocaleString()}</td>
        <td>\u20B9${(r.vehicle_cost || 0).toLocaleString()}</td>
        <td>
          <button class="btn btn-sm btn-outline-green" onclick="editRoute(${r.id})"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteRoute(${r.id})"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');
  }

  window.editRoute = function(id) {
    const r = routes.find(x => x.id === id);
    if (!r) return;
    document.getElementById('logisticsModalTitle').textContent = 'Edit Route';
    document.getElementById('editRouteId').value = r.id;
    document.getElementById('lName').value = r.route_name;
    document.getElementById('lDistance').value = r.distance_km || '';
    document.getElementById('lFuel').value = r.fuel_cost || '';
    document.getElementById('lDriver').value = r.driver_salary || '';
    document.getElementById('lVehicle').value = r.vehicle_cost || '';
    document.getElementById('lMaintenance').value = r.maintenance_cost || '';
    new bootstrap.Modal(document.getElementById('logisticsModal')).show();
  };

  window.deleteRoute = async function(id) {
    if (!confirm('Delete route?')) return;
    try { await fetch(API_BASE + '/logistics/' + id, { method: 'DELETE', headers }); showToast('Deleted'); load(); }
    catch (e) { showToast('Error', 'error'); }
  };

  document.getElementById('logisticsForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const editId = document.getElementById('editRouteId').value;
    const body = { route_name: document.getElementById('lName').value.trim(), distance_km: parseFloat(document.getElementById('lDistance').value) || null, fuel_cost: parseFloat(document.getElementById('lFuel').value) || null, driver_salary: parseFloat(document.getElementById('lDriver').value) || null, vehicle_cost: parseFloat(document.getElementById('lVehicle').value) || null, maintenance_cost: parseFloat(document.getElementById('lMaintenance').value) || null };
    try {
      if (editId) { await fetch(API_BASE + '/logistics/' + editId, { method: 'PUT', headers, body: JSON.stringify(body) }); showToast('Updated'); }
      else { await fetch(API_BASE + '/logistics', { method: 'POST', headers, body: JSON.stringify(body) }); showToast('Created'); }
      bootstrap.Modal.getInstance(document.getElementById('logisticsModal')).hide();
      document.getElementById('logisticsForm').reset();
      load();
    } catch (e) { showToast('Error', 'error'); }
  });

  document.querySelector('[data-bs-target="#logisticsModal"]')?.addEventListener('click', function() {
    document.getElementById('logisticsModalTitle').textContent = 'Add Route';
    document.getElementById('editRouteId').value = '';
    document.getElementById('logisticsForm').reset();
  });

  load();
});
