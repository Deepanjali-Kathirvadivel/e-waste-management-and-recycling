(function () {
  const admin = JSON.parse(localStorage.getItem('greenera_admin') || 'null');
  if (!admin || !localStorage.getItem('greenera_admin_token')) { window.location.href = 'login.html'; return; }
  const initials = (admin.full_name || 'Admin').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('adminAvatar').textContent = initials || 'A';
  window.adminLogout = function () { localStorage.removeItem('greenera_admin_token'); localStorage.removeItem('greenera_admin'); window.location.href = 'login.html'; };
  window.toggleSidebar = function () { document.getElementById('adminSidebar').classList.toggle('show'); };

  // ─── Staff Data (synced with localStorage) ───
  function loadStaffData() {
    return JSON.parse(localStorage.getItem('greenEra_staff') || 'null') || [
      { id: 1, name: 'Admin User', username: 'admin', email: 'admin@greenera.com', phone: '+1-555-0100', role: 'Manager', region: 'Central', status: 'active', assessments: 1247, collections: 89, rating: 4.9, joined: '2020-06-15', value: 248600 },
      { id: 2, name: 'John Davis', username: 'jdavis', email: 'john@greenera.com', phone: '+1-555-0101', role: 'Collector', region: 'North', status: 'active', assessments: 340, collections: 210, rating: 4.7, joined: '2021-03-10', value: 45200 },
      { id: 3, name: 'Sarah Lee', username: 'slee', email: 'sarah@greenera.com', phone: '+1-555-0102', role: 'Assessor', region: 'South', status: 'active', assessments: 560, collections: 45, rating: 4.8, joined: '2021-08-22', value: 68500 },
      { id: 4, name: 'Mike Brown', username: 'mbrown', email: 'mike@greenera.com', phone: '+1-555-0103', role: 'Verifier', region: 'East', status: 'active', assessments: 420, collections: 12, rating: 4.5, joined: '2022-01-05', value: 52400 },
      { id: 5, name: 'Emma Wilson', username: 'ewilson', email: 'emma@greenera.com', phone: '+1-555-0104', role: 'Collector', region: 'West', status: 'active', assessments: 280, collections: 175, rating: 4.6, joined: '2022-04-18', value: 38100 },
      { id: 6, name: 'James Chen', username: 'jchen', email: 'james@greenera.com', phone: '+1-555-0105', role: 'Assessor', region: 'Central', status: 'active', assessments: 390, collections: 32, rating: 4.4, joined: '2022-07-12', value: 47100 },
      { id: 7, name: 'Lisa Park', username: 'lpark', email: 'lisa@greenera.com', phone: '+1-555-0106', role: 'Collector', region: 'North', status: 'disabled', assessments: 150, collections: 98, rating: 4.2, joined: '2022-09-30', value: 18900 },
      { id: 8, name: 'Robert Kim', username: 'rkim', email: 'robert@greenera.com', phone: '+1-555-0107', role: 'Manager', region: 'South', status: 'active', assessments: 680, collections: 56, rating: 4.3, joined: '2021-11-14', value: 81500 },
    ];
  }
  function syncStaffData() { localStorage.setItem('greenEra_staff', JSON.stringify(staffData)); }
  let staffData = loadStaffData();
  let deleteTargetId = null;
  let resetTargetId = null;

  function renderStaff() {
    const grid = document.getElementById('staffGrid');
    const tbody = document.getElementById('staffTableBody');
    const count = document.getElementById('staffCount');

    if (count) count.textContent = `${staffData.length} total staff`;

    if (grid) {
      grid.innerHTML = staffData.map(s => `
        <div class="col-md-3 col-6">
          <div class="staff-card">
            <div class="staff-avatar">${s.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}</div>
            <h6>${s.name}</h6>
            <div class="staff-role">${s.role}</div>
            <span class="badge ${s.status === 'active' ? 'bg-green' : 'bg-secondary'} mb-2">${s.status}</span>
            <div class="d-flex justify-content-around">
              <div class="staff-metric"><strong>${s.assessments}</strong><br>Assessments</div>
              <div class="staff-metric"><strong>${s.collections}</strong><br>Collections</div>
              <div class="staff-metric"><strong>${s.rating}</strong><br>Rating</div>
            </div>
            <div class="mt-2"><a href="staff-details.html?id=${s.id}" class="btn btn-sm btn-outline-green w-100">View Details</a></div>
          </div>
        </div>
      `).join('');
    }

    if (tbody) {
      tbody.innerHTML = staffData.map(s => `
        <tr>
          <td><a href="staff-details.html?id=${s.id}" class="fw-semibold text-dark text-decoration-none">${s.name}</a></td>
          <td>${s.username}</td>
          <td><span class="detail-tag blue">${s.role}</span></td>
          <td>${s.region}</td>
          <td><span class="status-badge ${s.status}">${s.status.charAt(0).toUpperCase() + s.status.slice(1)}</span></td>
          <td>
            <div class="d-flex gap-1">
              <button class="btn btn-sm btn-outline-green" onclick="editStaff(${s.id})" title="Edit"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm ${s.status === 'active' ? 'btn-outline-warning' : 'btn-outline-green'}" onclick="toggleStaffStatus(${s.id})" title="${s.status === 'active' ? 'Disable' : 'Enable'}">
                <i class="bi ${s.status === 'active' ? 'bi-pause-circle' : 'bi-play-circle'}"></i>
              </button>
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
    // Simple filter for table - just re-render filtered
    const filtered = staffData.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.username.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q) ||
      s.region.toLowerCase().includes(q)
    );
    const tbody = document.getElementById('staffTableBody');
    if (tbody) {
      tbody.innerHTML = filtered.length ? filtered.map(s => `
        <tr><td><a href="staff-details.html?id=${s.id}" class="fw-semibold text-dark text-decoration-none">${s.name}</a></td>
        <td>${s.username}</td><td><span class="detail-tag blue">${s.role}</span></td><td>${s.region}</td>
        <td><span class="status-badge ${s.status}">${s.status.charAt(0).toUpperCase() + s.status.slice(1)}</span></td>
        <td><div class="d-flex gap-1">
          <button class="btn btn-sm btn-outline-green" onclick="editStaff(${s.id})" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm ${s.status === 'active' ? 'btn-outline-warning' : 'btn-outline-green'}" onclick="toggleStaffStatus(${s.id})" title="${s.status === 'active' ? 'Disable' : 'Enable'}"><i class="bi ${s.status === 'active' ? 'bi-pause-circle' : 'bi-play-circle'}"></i></button>
          <button class="btn btn-sm btn-outline-primary" onclick="openResetPwd(${s.id})" title="Reset Password"><i class="bi bi-key"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="openDelete(${s.id})" title="Delete"><i class="bi bi-trash"></i></button>
        </div></td></tr>
      `).join('') : '<tr><td colspan="6" class="text-center text-muted py-3">No staff members match your search</td></tr>';
    }
  };

  // ─── CRUD Operations ───
  window.editStaff = function (id) {
    const s = staffData.find(x => x.id === id);
    if (!s) return;
    document.getElementById('staffModalTitle').textContent = 'Edit Staff — ' + s.name;
    document.getElementById('editStaffId').value = s.id;
    document.getElementById('sName').value = s.name;
    document.getElementById('sUsername').value = s.username;
    document.getElementById('sEmail').value = s.email || '';
    document.getElementById('sPhone').value = s.phone || '';
    document.getElementById('sRole').value = s.role;
    document.getElementById('sRegion').value = s.region;
    document.getElementById('passwordField').innerHTML = `<div class="form-floating"><input type="password" class="form-control" id="sPassword" placeholder="Leave blank to keep current"><label for="sPassword">New Password (optional)</label></div>`;
    new bootstrap.Modal(document.getElementById('staffModal')).show();
  };

  window.toggleStaffStatus = function (id) {
    const s = staffData.find(x => x.id === id);
    if (!s) return;
    s.status = s.status === 'active' ? 'disabled' : 'active';
    renderStaff();
    syncStaffData();
    showToast(`${s.name} ${s.status === 'active' ? 'enabled' : 'disabled'} successfully`);
  };

  window.openDelete = function (id) {
    const s = staffData.find(x => x.id === id);
    if (!s) return;
    deleteTargetId = id;
    document.getElementById('deleteConfirmText').textContent = `Delete "${s.name}"? This action cannot be undone.`;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
  };

  document.getElementById('confirmDeleteBtn').addEventListener('click', function () {
    if (!deleteTargetId) return;
    staffData = staffData.filter(s => s.id !== deleteTargetId);
    renderStaff();
    syncStaffData();
    showToast('Staff member deleted');
    bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
    deleteTargetId = null;
  });

  window.openResetPwd = function (id) {
    const s = staffData.find(x => x.id === id);
    if (!s) return;
    resetTargetId = id;
    document.getElementById('resetPwdStaffName').textContent = `Reset password for ${s.name}:`;
    document.getElementById('resetNewPwd').value = '';
    new bootstrap.Modal(document.getElementById('resetPwdModal')).show();
  };

  document.getElementById('confirmResetBtn').addEventListener('click', function () {
    const newPwd = document.getElementById('resetNewPwd').value;
    if (!newPwd || newPwd.length < 6) { showToast('Password must be 6+ characters', 'error'); return; }
    showToast('Password reset successful');
    bootstrap.Modal.getInstance(document.getElementById('resetPwdModal')).hide();
    resetTargetId = null;
  });

  // ─── Create / Update Form ───
  document.getElementById('staffForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const editId = document.getElementById('editStaffId').value;
    const name = document.getElementById('sName').value.trim();
    const username = document.getElementById('sUsername').value.trim();
    const email = document.getElementById('sEmail').value.trim();
    const phone = document.getElementById('sPhone').value.trim();
    const role = document.getElementById('sRole').value;
    const region = document.getElementById('sRegion').value;
    const password = document.getElementById('sPassword').value;

    if (editId) {
      const s = staffData.find(x => x.id === parseInt(editId));
      if (s) { s.name = name; s.username = username; s.email = email; s.phone = phone; s.role = role; s.region = region; }
      syncStaffData();
      showToast('Staff updated successfully');
    } else {
      if (!password || password.length < 6) { showToast('Password required (6+ characters)', 'error'); return; }
      const newId = Math.max(...staffData.map(s => s.id), 0) + 1;
      staffData.push({ id: newId, name, username, email, phone, role, region, status: 'active', assessments: 0, collections: 0, rating: 0, joined: new Date().toISOString().slice(0, 10), value: 0 });
      syncStaffData();
      showToast('Staff created successfully');
    }

    renderStaff();
    bootstrap.Modal.getInstance(document.getElementById('staffModal')).hide();
    document.getElementById('staffForm').reset();
    document.getElementById('editStaffId').value = '';
  });

  // Reset modal to create mode when "Add Staff" button is clicked
  document.querySelector('[data-bs-target="#staffModal"]')?.addEventListener('click', function () {
    document.getElementById('staffModalTitle').textContent = 'Add New Staff';
    document.getElementById('editStaffId').value = '';
    document.getElementById('staffForm').reset();
    document.getElementById('passwordField').innerHTML = `<div class="form-floating"><input type="password" class="form-control" id="sPassword" placeholder="Password" required minlength="6"><label for="sPassword">Password</label></div>`;
  });

  renderStaff();
})();
