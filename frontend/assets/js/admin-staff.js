(function () {
  const admin = JSON.parse(localStorage.getItem('greenera_admin') || 'null');
  if (!admin || !localStorage.getItem('greenera_admin_token')) { window.location.href = 'login.html'; return; }
  const initials = (admin.full_name || 'Admin').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('adminAvatar').textContent = initials || 'A';

  const token = localStorage.getItem('greenera_admin_token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  window.adminLogout = function () { localStorage.removeItem('greenera_admin_token'); localStorage.removeItem('greenera_admin'); window.location.href = 'login.html'; };
  window.toggleSidebar = function () { document.getElementById('adminSidebar').classList.toggle('show'); };

  let staffData = [];
  let regionData = [];

  async function loadRegions() {
    try {
      const res = await fetch(API_BASE + '/regions', { headers });
      const data = await res.json();
      regionData = data.regions || data || [];
      const sel = document.getElementById('sRegion');
      sel.innerHTML = '<option value="">Select Region</option>';
      regionData.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = r.name;
        sel.appendChild(opt);
      });
      const optAll = document.createElement('option');
      optAll.value = '';
      optAll.textContent = 'All Regions';
    } catch (e) {
      const sel = document.getElementById('sRegion');
      sel.innerHTML = '<option value="">Region unavailable</option>';
    }
  }

  async function loadStaff() {
    try {
      const res = await fetch(API_BASE + '/admin/staff', { headers });
      const data = await res.json();
      staffData = data.staff || [];
      renderStaff();
    } catch (e) {
      document.getElementById('staffCount').textContent = 'Error loading staff';
    }
  }

  function renderStaff() {
    const grid = document.getElementById('staffGrid');
    const tbody = document.getElementById('staffTableBody');
    const count = document.getElementById('staffCount');
    if (count) count.textContent = `${staffData.length} total staff`;

    if (grid) {
      grid.innerHTML = staffData.map(s => `
        <div class="col-md-3 col-6">
          <div class="staff-card">
            <div class="staff-avatar">${(s.full_name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}</div>
            <h6>${s.full_name}</h6>
            <div class="staff-role">${s.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
            <span class="badge ${s.is_active ? 'bg-green' : 'bg-secondary'} mb-2">${s.is_active ? 'active' : 'disabled'}</span>
            <div class="mt-2"><a href="staff-details.html?id=${s.id}" class="btn btn-sm btn-outline-green w-100">View Details</a></div>
          </div>
        </div>
      `).join('');
    }

    if (tbody) {
      tbody.innerHTML = staffData.map(s => `
        <tr>
          <td><a href="staff-details.html?id=${s.id}" class="fw-semibold text-dark text-decoration-none">${s.full_name}</a></td>
          <td>${s.username}</td>
          <td><span class="detail-tag blue">${s.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span></td>
          <td>${s.region?.name || '-'}</td>
          <td><span class="status-badge ${s.is_active ? 'completed' : 'cancelled'}">${s.is_active ? 'Active' : 'Disabled'}</span></td>
          <td>
            <div class="d-flex gap-1">
              <button class="btn btn-sm btn-outline-green" onclick="editStaff(${s.id})" title="Edit"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm ${s.is_active ? 'btn-outline-warning' : 'btn-outline-green'}" onclick="toggleStaffStatus(${s.id})" title="${s.is_active ? 'Disable' : 'Enable'}"><i class="bi ${s.is_active ? 'bi-pause-circle' : 'bi-play-circle'}"></i></button>
              <button class="btn btn-sm btn-outline-primary" onclick="openResetPwd(${s.id})" title="Reset Password"><i class="bi bi-key"></i></button>
              <button class="btn btn-sm btn-outline-danger" onclick="openDelete(${s.id})" title="Delete"><i class="bi bi-trash"></i></button>
            </div>
          </td>
        </tr>
      `).join('');
    }
  }

  window.filterStaffTable = function () {
    const q = document.getElementById('staffSearch').value.toLowerCase();
    const filtered = staffData.filter(s =>
      s.full_name?.toLowerCase().includes(q) ||
      s.username?.toLowerCase().includes(q) ||
      s.role?.toLowerCase().includes(q) ||
      (s.region?.name || '').toLowerCase().includes(q)
    );
    const tbody = document.getElementById('staffTableBody');
    if (tbody) {
      tbody.innerHTML = filtered.length ? filtered.map(s => `
        <tr><td><a href="staff-details.html?id=${s.id}" class="fw-semibold text-dark text-decoration-none">${s.full_name}</a></td>
        <td>${s.username}</td><td><span class="detail-tag blue">${s.role.replace(/_/g, ' ')}</span></td><td>${s.region?.name || '-'}</td>
        <td><span class="status-badge ${s.is_active ? 'completed' : 'cancelled'}">${s.is_active ? 'Active' : 'Disabled'}</span></td>
        <td><div class="d-flex gap-1">...</div></td></tr>
      `).join('') : '<tr><td colspan="6" class="text-center text-muted py-3">No staff match your search</td></tr>';
    }
  };

  window.editStaff = async function (id) {
    const s = staffData.find(x => x.id === id);
    if (!s) return;
    document.getElementById('staffModalTitle').textContent = 'Edit Staff — ' + s.full_name;
    document.getElementById('editStaffId').value = s.id;
    document.getElementById('sName').value = s.full_name;
    document.getElementById('sUsername').value = s.username;
    document.getElementById('sEmail').value = s.email || '';
    document.getElementById('sPhone').value = s.phone || '';
    document.getElementById('sRole').value = s.role;
    document.getElementById('sRegion').value = s.region_id || '';
    document.getElementById('passwordField').innerHTML = `<div class="form-floating"><input type="password" class="form-control" id="sPassword" placeholder="Leave blank to keep current"><label>New Password (leave blank to keep)</label></div>`;
    document.getElementById('sPassword').required = false;
    new bootstrap.Modal(document.getElementById('staffModal')).show();
  };

  window.toggleStaffStatus = async function (id) {
    try {
      await fetch(API_BASE + '/admin/staff/' + id + '/status', { method: 'PATCH', headers });
      showToast('Status toggled');
      loadStaff();
    } catch (e) { showToast('Error toggling status', 'error'); }
  };

  window.openDelete = function (id) {
    document.getElementById('deleteConfirmText').textContent = `Delete staff #${id}?`;
    document.getElementById('confirmDeleteBtn').dataset.id = id;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
  };

  document.getElementById('confirmDeleteBtn').addEventListener('click', async function () {
    const id = this.dataset.id;
    try {
      await fetch(API_BASE + '/admin/staff/' + id, { method: 'DELETE', headers });
      showToast('Staff deleted');
      bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
      loadStaff();
    } catch (e) { showToast('Error deleting staff', 'error'); }
  });

  window.openResetPwd = function (id) {
    document.getElementById('resetPwdStaffName').textContent = `Reset password for staff #${id}:`;
    document.getElementById('confirmResetBtn').dataset.id = id;
    new bootstrap.Modal(document.getElementById('resetPwdModal')).show();
  };

  document.getElementById('confirmResetBtn').addEventListener('click', async function () {
    const id = this.dataset.id;
    try {
      const res = await fetch(API_BASE + '/admin/staff/' + id + '/reset-password', { method: 'POST', headers });
      const data = await res.json();
      showToast('Password reset to: ' + data.new_password, 'info');
      bootstrap.Modal.getInstance(document.getElementById('resetPwdModal')).hide();
    } catch (e) { showToast('Error resetting password', 'error'); }
  });

  document.getElementById('staffForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const editId = document.getElementById('editStaffId').value;
    const full_name = document.getElementById('sName').value.trim();
    const username = document.getElementById('sUsername').value.trim();
    const email = document.getElementById('sEmail').value.trim();
    const phone = document.getElementById('sPhone').value.trim();
    const role = document.getElementById('sRole').value;
    const region_id = parseInt(document.getElementById('sRegion').value) || null;
    const password = document.getElementById('sPassword')?.value;

    try {
      if (editId) {
        const body = { full_name, email, phone, role, region_id };
        if (password && password.length >= 4) body.password = password;
        await fetch(API_BASE + '/admin/staff/' + editId, { method: 'PUT', headers, body: JSON.stringify(body) });
        showToast('Staff updated');
      } else {
        if (!password || password.length < 4) { showToast('Password required (4+ chars)', 'error'); return; }
        await fetch(API_BASE + '/admin/staff', { method: 'POST', headers, body: JSON.stringify({ username, email, password, full_name, phone, role, region_id }) });
        showToast('Staff created');
      }
      bootstrap.Modal.getInstance(document.getElementById('staffModal')).hide();
      document.getElementById('staffForm').reset();
      document.getElementById('editStaffId').value = '';
      loadStaff();
    } catch (e) { showToast('Error saving staff', 'error'); }
  });

  document.querySelector('[data-bs-target="#staffModal"]')?.addEventListener('click', function () {
    document.getElementById('staffModalTitle').textContent = 'Add New Staff';
    document.getElementById('editStaffId').value = '';
    document.getElementById('staffForm').reset();
    document.getElementById('passwordField').innerHTML = `<div class="form-floating"><input type="password" class="form-control" id="sPassword" placeholder="Password" required minlength="4"><label>Password</label></div>`;
  });

  loadStaff();
  loadRegions();
})();
