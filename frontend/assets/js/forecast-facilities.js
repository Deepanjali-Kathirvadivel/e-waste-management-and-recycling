document.addEventListener('DOMContentLoaded', async function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const token = localStorage.getItem('greenera_admin_token');
  if (!token) return;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  let facilities = [];

  async function load() {
    try {
      const res = await fetch(API_BASE + '/facilities', { headers });
      const data = await res.json();
      facilities = data.facilities || [];
      renderTable();
    } catch (e) { showToast('Error loading facilities', 'error'); }
  }

  function renderTable() {
    const centers = facilities.filter(f => f.type === 'collection_center');
    const units = facilities.filter(f => f.type !== 'collection_center');
    document.getElementById('centerTableBody').innerHTML = centers.map(f => `
      <tr><td>${f.name}</td><td>${f.capacity || '-'}</td><td>\u20B9${(f.rent || 0).toLocaleString()}</td><td>\u20B9${(f.electricity_cost || 0).toLocaleString()}</td><td>\u20B9${(f.staff_cost || 0).toLocaleString()}</td><td><span class="badge bg-${f.status === 'active' ? 'success' : 'secondary'}">${f.status}</span></td><td><button class="btn btn-sm btn-outline-green" onclick="editFacility(${f.id})"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-outline-danger" onclick="deleteFacility(${f.id})"><i class="bi bi-trash"></i></button></td></tr>
    `).join('');
    document.getElementById('unitTableBody').innerHTML = units.map(f => `
      <tr><td>${f.name}</td><td>${f.type.replace(/_/g, ' ')}</td><td>${f.capacity || '-'}</td><td>\u20B9${(f.rent || 0).toLocaleString()}</td><td>\u20B9${(f.staff_cost || 0).toLocaleString()}</td><td><span class="badge bg-${f.status === 'active' ? 'success' : 'secondary'}">${f.status}</span></td><td><button class="btn btn-sm btn-outline-green" onclick="editFacility(${f.id})"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-outline-danger" onclick="deleteFacility(${f.id})"><i class="bi bi-trash"></i></button></td></tr>
    `).join('');
  }

  window.editFacility = function(id) {
    const f = facilities.find(x => x.id === id);
    if (!f) return;
    document.getElementById('facilityModalTitle').textContent = 'Edit Facility';
    document.getElementById('editFacilityId').value = f.id;
    document.getElementById('fName').value = f.name;
    document.getElementById('fCapacity').value = f.capacity || '';
    document.getElementById('fRent').value = f.rent || '';
    document.getElementById('fElectricity').value = f.electricity_cost || '';
    document.getElementById('fStaffCost').value = f.staff_cost || '';
    new bootstrap.Modal(document.getElementById('facilityModal')).show();
  };

  window.deleteFacility = async function(id) {
    if (!confirm('Delete?')) return;
    try { await fetch(API_BASE + '/facilities/' + id, { method: 'DELETE', headers }); showToast('Deleted'); load(); }
    catch (e) { showToast('Error', 'error'); }
  };

  document.getElementById('facilityForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const editId = document.getElementById('editFacilityId').value;
    const body = { name: document.getElementById('fName').value.trim(), capacity: parseInt(document.getElementById('fCapacity').value) || null, rent: parseFloat(document.getElementById('fRent').value) || null, electricity_cost: parseFloat(document.getElementById('fElectricity').value) || null, staff_cost: parseFloat(document.getElementById('fStaffCost').value) || null };
    try {
      if (editId) { await fetch(API_BASE + '/facilities/' + editId, { method: 'PUT', headers, body: JSON.stringify(body) }); showToast('Updated'); }
      else { await fetch(API_BASE + '/facilities', { method: 'POST', headers, body: JSON.stringify(body) }); showToast('Created'); }
      bootstrap.Modal.getInstance(document.getElementById('facilityModal')).hide();
      document.getElementById('facilityForm').reset();
      load();
    } catch (e) { showToast('Error', 'error'); }
  });

  document.querySelectorAll('[data-bs-target="#facilityModal"]').forEach(btn => btn.addEventListener('click', function() {
    document.getElementById('facilityModalTitle').textContent = 'Add Facility';
    document.getElementById('editFacilityId').value = '';
    document.getElementById('facilityForm').reset();
  }));

  load();
});
