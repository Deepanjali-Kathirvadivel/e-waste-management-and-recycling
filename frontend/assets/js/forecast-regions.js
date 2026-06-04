document.addEventListener('DOMContentLoaded', async function () {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const token = localStorage.getItem('greenera_admin_token');
  if (!token) return;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  let regions = [];

  async function loadRegions() {
    try {
      const res = await fetch(API_BASE + '/regions', { headers });
      const data = await res.json();
      regions = data.regions || [];
      renderTable();
    } catch (e) { showToast('Error loading regions', 'error'); }
  }

  function renderTable() {
    const tbody = document.getElementById('regionTableBody');
    if (!tbody) return;
    tbody.innerHTML = regions.map(r => `
      <tr>
        <td>${r.name}</td>
        <td>${r.population || '-'}</td>
        <td>${r.growth_rate || '-'}%</td>
        <td>${r.collection_quantity || '-'}</td>
        <td>\u20B9${(r.revenue || 0).toLocaleString('en-IN')}</td>
        <td><span class="badge bg-${r.type === 'city' ? 'primary' : 'secondary'}">${r.type}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-green" onclick="editRegion(${r.id})"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteRegion(${r.id})"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');
  }

  window.editRegion = function(id) {
    const r = regions.find(x => x.id === id);
    if (!r) return;
    document.getElementById('regionModalTitle').textContent = 'Edit Region';
    document.getElementById('editRegionId').value = r.id;
    document.getElementById('rName').value = r.name;
    document.getElementById('rPopulation').value = r.population || '';
    document.getElementById('rGrowth').value = r.growth_rate || '';
    document.getElementById('rCollection').value = r.collection_quantity || '';
    document.getElementById('rRevenue').value = r.revenue || '';
    new bootstrap.Modal(document.getElementById('regionModal')).show();
  };

  window.deleteRegion = async function(id) {
    if (!confirm('Delete this region?')) return;
    try {
      await fetch(API_BASE + '/regions/' + id, { method: 'DELETE', headers });
      showToast('Region deleted');
      loadRegions();
    } catch (e) { showToast('Error deleting', 'error'); }
  };

  document.getElementById('regionForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const editId = document.getElementById('editRegionId').value;
    const body = {
      name: document.getElementById('rName').value.trim(),
      population: parseInt(document.getElementById('rPopulation').value) || null,
      growth_rate: parseFloat(document.getElementById('rGrowth').value) || null,
      collection_quantity: parseFloat(document.getElementById('rCollection').value) || null,
      revenue: parseFloat(document.getElementById('rRevenue').value) || null,
      type: 'city'
    };
    try {
      if (editId) {
        await fetch(API_BASE + '/regions/' + editId, { method: 'PUT', headers, body: JSON.stringify(body) });
        showToast('Region updated');
      } else {
        await fetch(API_BASE + '/regions', { method: 'POST', headers, body: JSON.stringify(body) });
        showToast('Region created');
      }
      bootstrap.Modal.getInstance(document.getElementById('regionModal')).hide();
      document.getElementById('regionForm').reset();
      document.getElementById('editRegionId').value = '';
      loadRegions();
    } catch (e) { showToast('Error saving', 'error'); }
  });

  document.querySelector('[data-bs-target="#regionModal"]')?.addEventListener('click', function() {
    document.getElementById('regionModalTitle').textContent = 'Add Region';
    document.getElementById('editRegionId').value = '';
    document.getElementById('regionForm').reset();
  });

  loadRegions();
});
