(function () {
  const admin = checkAdminAuth();
  if (!admin) return;

  const initials = (admin.full_name || 'Admin').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('adminAvatar').textContent = initials || 'A';

  const token = localStorage.getItem('greenera_admin_token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  window.adminLogout = function () {
    fetch(API_BASE + '/auth/logout', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } }).catch(() => {});
    localStorage.removeItem('greenera_admin_token');
    localStorage.removeItem('greenera_admin');
    window.location.href = 'login.html';
  };
  window.toggleSidebar = function () { document.getElementById('adminSidebar').classList.toggle('show'); };

  function startNotifPoll() {
    let badge = document.getElementById('adminNotifBadge');
    async function poll() {
      try {
        const res = await fetch(API_BASE + '/notifications/unread-count', { headers });
        const data = await res.json();
        if (badge) { badge.textContent = data.count || ''; badge.style.display = data.count > 0 ? 'flex' : 'none'; }
      } catch (e) {}
    }
    poll();
    setInterval(poll, 30000);
  }
  startNotifPoll();

  let staffData = [];
  let regionData = [];
  let facilityData = [];

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
    } catch (e) {
      const sel = document.getElementById('sRegion');
      sel.innerHTML = '<option value="">Region unavailable</option>';
    }
  }

  async function loadFacilities() {
    try {
      const res = await fetch(API_BASE + '/facilities', { headers });
      const data = await res.json();
      facilityData = data.facilities || data || [];
      const sel = document.getElementById('sFacility');
      if (sel) {
        sel.innerHTML = '<option value="">Select Facility</option>';
        facilityData.forEach(f => {
          const opt = document.createElement('option');
          opt.value = f.id;
          opt.textContent = f.name;
          sel.appendChild(opt);
        });
      }
    } catch (e) {
      const sel = document.getElementById('sFacility');
      if (sel) sel.innerHTML = '<option value="">Facility unavailable</option>';
    }
  }

  async function loadStaff() {
    try {
      const res = await fetch(API_BASE + '/admin/employees', { headers });
      if (!res.ok) throw new Error('API failure');
      const data = await res.json();
      staffData = data.employees || [];
      renderStaff();
    } catch (e) {
      document.getElementById('staffCount').textContent = 'Error loading employees';
      showToast('Failed to load employee list', 'error');
    }
  }

  function renderStaff() {
    const grid = document.getElementById('staffGrid');
    const tbody = document.getElementById('staffTableBody');
    const count = document.getElementById('staffCount');
    if (count) count.textContent = `${staffData.length} total employees`;

    if (grid) {
      grid.innerHTML = staffData.map(s => `
        <div class="col-md-3 col-6">
          <div class="staff-card">
            <div class="staff-avatar">${(s.full_name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}</div>
            <h6>${s.full_name}</h6>
            <div class="staff-role">Employee</div>
            <span class="badge ${s.is_active ? 'bg-green' : 'bg-secondary'} mb-2">${s.is_active ? 'active' : 'disabled'}</span>
            <div class="mt-2"><a href="employee-details.html?id=${s.id}" class="btn btn-sm btn-outline-green w-100">View Details</a></div>
          </div>
        </div>
      `).join('');
    }

    if (tbody) {
      tbody.innerHTML = staffData.map(s => `
        <tr>
          <td><a href="employee-details.html?id=${s.id}" class="fw-semibold text-dark text-decoration-none">${s.full_name}</a></td>
          <td>${s.username}</td>
          <td>${s.email || '-'}</td>
          <td>${s.region?.name || '-'}</td>
          <td>${s.facility?.name || '-'}</td>
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
      (s.email || '').toLowerCase().includes(q) ||
      (s.region?.name || '').toLowerCase().includes(q)
    );
    const tbody = document.getElementById('staffTableBody');
    if (tbody) {
      tbody.innerHTML = filtered.length ? filtered.map(s => `
        <tr>
          <td><a href="employee-details.html?id=${s.id}" class="fw-semibold text-dark text-decoration-none">${s.full_name}</a></td>
          <td>${s.username}</td>
          <td>${s.email || '-'}</td>
          <td>${s.region?.name || '-'}</td>
          <td>${s.facility?.name || '-'}</td>
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
      `).join('') : '<tr><td colspan="7" class="text-center text-muted py-3">No employees match your search</td></tr>';
    }
  };

  window.editStaff = async function (id) {
    const s = staffData.find(x => x.id === id);
    if (!s) return;
    document.getElementById('staffModalTitle').textContent = 'Edit Employee — ' + s.full_name;
    document.getElementById('editStaffId').value = s.id;
    document.getElementById('sName').value = s.full_name;
    document.getElementById('sUsername').value = s.username;
    document.getElementById('sEmail').value = s.email || '';
    document.getElementById('sPhone').value = s.phone || '';
    document.getElementById('sRegion').value = s.region_id || '';
    document.getElementById('sFacility').value = s.facility_id || '';
    document.getElementById('passwordField').innerHTML = `<div class="form-floating"><input type="password" class="form-control" id="sPassword" placeholder="Leave blank to keep current"><label>New Password (leave blank to keep)</label></div>`;
    document.getElementById('sPassword').required = false;
    new bootstrap.Modal(document.getElementById('staffModal')).show();
  };

  window.toggleStaffStatus = async function (id) {
    try {
      const res = await fetch(API_BASE + '/admin/employees/' + id + '/status', { method: 'PATCH', headers });
      if (!res.ok) throw new Error((await res.json()).message || 'API failure');
      showToast('Employee status updated');
      loadStaff();
    } catch (e) { showToast(e.message || 'Error updating status', 'error'); }
  };

  window.openDelete = function (id) {
    document.getElementById('deleteConfirmText').textContent = `Delete employee #${id}?`;
    document.getElementById('confirmDeleteBtn').dataset.id = id;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
  };

  document.getElementById('confirmDeleteBtn').addEventListener('click', async function () {
    const id = this.dataset.id;
    try {
      const res = await fetch(API_BASE + '/admin/employees/' + id, { method: 'DELETE', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'API failure');
      showToast('Employee deleted successfully');
      bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
      loadStaff();
    } catch (e) { showToast(e.message || 'Error deleting employee', 'error'); }
  });

  window.openResetPwd = function (id) {
    document.getElementById('resetPwdStaffName').textContent = `Reset password for employee #${id}:`;
    document.getElementById('confirmResetBtn').dataset.id = id;
    document.getElementById('resetNewPwd').value = '';
    new bootstrap.Modal(document.getElementById('resetPwdModal')).show();
  };

  document.getElementById('confirmResetBtn').addEventListener('click', async function () {
    const id = this.dataset.id;
    const newPassword = document.getElementById('resetNewPwd').value.trim();
    if (!newPassword || newPassword.length < 4) { showToast('Password must be 4+ chars', 'error'); return; }
    try {
      const res = await fetch(API_BASE + '/admin/employees/' + id + '/reset-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({ password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'API failure');
      showToast('Password reset successfully', 'info');
      bootstrap.Modal.getInstance(document.getElementById('resetPwdModal')).hide();
    } catch (e) { showToast(e.message || 'Error resetting password', 'error'); }
  });

  document.getElementById('staffForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const editId = document.getElementById('editStaffId').value;
    const full_name = document.getElementById('sName').value.trim();
    const username = document.getElementById('sUsername').value.trim();
    const email = document.getElementById('sEmail').value.trim();
    const phone = document.getElementById('sPhone').value.trim();
    const region_id = parseInt(document.getElementById('sRegion').value) || null;
    const facility_id = parseInt(document.getElementById('sFacility').value) || null;
    const password = document.getElementById('sPassword')?.value;

    try {
      if (editId) {
        const body = { full_name, email, phone, region_id, facility_id };
        if (password && password.length >= 4) body.password = password;
        const res = await fetch(API_BASE + '/admin/employees/' + editId, { method: 'PUT', headers, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'API failure');
        showToast('Employee updated');
      } else {
        if (!password || password.length < 4) { showToast('Password required (4+ chars)', 'error'); return; }
        const res = await fetch(API_BASE + '/admin/employees', {
          method: 'POST',
          headers,
          body: JSON.stringify({ username, email, password, full_name, phone, region_id, facility_id })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'API failure');
        showToast('Employee created successfully');
      }
      bootstrap.Modal.getInstance(document.getElementById('staffModal')).hide();
      document.getElementById('staffForm').reset();
      document.getElementById('editStaffId').value = '';
      loadStaff();
    } catch (e) { showToast(e.message || 'Error saving employee', 'error'); }
  });

  document.querySelector('[data-bs-target="#staffModal"]')?.addEventListener('click', function () {
    document.getElementById('staffModalTitle').textContent = 'Add New Employee';
    document.getElementById('editStaffId').value = '';
    document.getElementById('staffForm').reset();
    document.getElementById('passwordField').innerHTML = `<div class="form-floating"><input type="password" class="form-control" id="sPassword" placeholder="Password" required minlength="4"><label>Password</label></div>`;
  });

  loadStaff();
  loadRegions();
  loadFacilities();
})();
