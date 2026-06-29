(async function() {
  const user = checkAuth();
  if (!user) return;

  document.getElementById('userName').textContent = user.full_name || user.username;
  document.getElementById('profileName').textContent = user.full_name || user.username;
  document.getElementById('profileRole').textContent = user.role ? user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Staff Member';
  document.getElementById('editFullName').value = user.full_name || '';
  document.getElementById('editEmail').value = user.email || '';
  document.getElementById('editUsername').value = user.username || '';
  document.getElementById('editPhone').value = user.phone || '';

  // Sidebar Build
  const sidebar = document.getElementById('sidebarMenu');
  if (sidebar) {
    let sidebarHtml = '';
    if (user.role === 'manager') {
      sidebarHtml = `
        <a href="manager/dashboard.html" class="list-group-item list-group-item-action d-flex align-items-center gap-3"><i class="bi bi-speedometer2 text-green"></i> Dashboard</a>
        <a href="manager/pending.html" class="list-group-item list-group-item-action d-flex align-items-center gap-3"><i class="bi bi-clock text-green"></i> Pending Reviews</a>
        <a href="manager/approved.html" class="list-group-item list-group-item-action d-flex align-items-center gap-3"><i class="bi bi-check-circle text-green"></i> Approved</a>
        <a href="manager/rejected.html" class="list-group-item list-group-item-action d-flex align-items-center gap-3"><i class="bi bi-x-circle text-green"></i> Rejected</a>
        <a href="manager/receipt-history.html" class="list-group-item list-group-item-action d-flex align-items-center gap-3"><i class="bi bi-receipt text-green"></i> Receipts</a>
        <a href="profile.html" class="list-group-item list-group-item-action active bg-green border-green d-flex align-items-center gap-3"><i class="bi bi-person"></i> My Profile</a>
      `;
    } else if (user.role === 'supply_chain') {
      sidebarHtml = `
        <a href="supply-chain/dashboard.html" class="list-group-item list-group-item-action d-flex align-items-center gap-3"><i class="bi bi-speedometer2 text-green"></i> Dashboard</a>
        <a href="supply-chain/approved-deals.html" class="list-group-item list-group-item-action d-flex align-items-center gap-3"><i class="bi bi-check2-all text-green"></i> Approved Deals</a>
        <a href="supply-chain/closed-deals.html" class="list-group-item list-group-item-action d-flex align-items-center gap-3"><i class="bi bi-lock text-green"></i> Closed Deals</a>
        <a href="supply-chain/history.html" class="list-group-item list-group-item-action d-flex align-items-center gap-3"><i class="bi bi-clock-history text-green"></i> History</a>
        <a href="profile.html" class="list-group-item list-group-item-action active bg-green border-green d-flex align-items-center gap-3"><i class="bi bi-person"></i> My Profile</a>
      `;
    } else {
      // Default Employee
      sidebarHtml = `
        <a href="dashboard.html" class="list-group-item list-group-item-action d-flex align-items-center gap-3"><i class="bi bi-speedometer2 text-green"></i> Dashboard</a>
        <a href="assessment-new.html" class="list-group-item list-group-item-action d-flex align-items-center gap-3"><i class="bi bi-plus-circle text-green"></i> New Assessment</a>
        <a href="assessment-history.html" class="list-group-item list-group-item-action d-flex align-items-center gap-3"><i class="bi bi-clock-history text-green"></i> Assessment History</a>
        <a href="profile.html" class="list-group-item list-group-item-action active bg-green border-green d-flex align-items-center gap-3"><i class="bi bi-person"></i> My Profile</a>
        <a href="approved-deals.html" class="list-group-item list-group-item-action d-flex align-items-center gap-3"><i class="bi bi-check2-all text-green"></i> Approved Deals</a>
      `;
    }
    sidebar.innerHTML = sidebarHtml;
  }

  // Load KPI Stats
  try {
    const kpi = await (await fetch(API_BASE + '/dashboard/kpi', { headers: getAuthHeaders() })).json();
    document.getElementById('actAssessments').textContent = kpi.total_assessments || 0;
    document.getElementById('actCollections').textContent = kpi.today_collections || 0;
    document.getElementById('actDaysActive').textContent = 'Active';
  } catch (e) {
    document.getElementById('actAssessments').textContent = '0';
    document.getElementById('actCollections').textContent = '0';
    document.getElementById('actDaysActive').textContent = 'Active';
  }

  // Load Activity Logs
  try {
    const actRes = await fetch(API_BASE + '/profile/activity', { headers: getAuthHeaders() });
    const actData = await actRes.json();
    const feed = document.getElementById('activityFeed');
    if (actData.activity && actData.activity.length) {
      feed.innerHTML = actData.activity.map(a => {
        const dateStr = new Date(a.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        let icon = 'bi-info-circle';
        if (a.action.includes('approved')) icon = 'bi-check-circle text-success';
        else if (a.action.includes('rejected')) icon = 'bi-x-circle text-danger';
        else if (a.action.includes('assigned')) icon = 'bi-truck text-primary';
        else if (a.action.includes('password')) icon = 'bi-key text-warning';
        return `<li><div class="activity-icon"><i class="bi ${icon}"></i></div><span class="activity-text">${a.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ${a.metadata?.customer ? '- ' + a.metadata.customer : ''}</span><span class="activity-time">${dateStr}</span></li>`;
      }).join('');
    } else {
      feed.innerHTML = '<li class="text-muted small py-2 text-center">No recent activity</li>';
    }
  } catch (e) {
    document.getElementById('activityFeed').innerHTML = '<li class="text-danger small py-2 text-center">Failed to load activity logs</li>';
  }

  document.getElementById('profileForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const fullName = document.getElementById('editFullName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    try {
      const res = await fetch(API_BASE + '/profile', {
        method: 'PUT', headers: getAuthHeaders(),
        body: JSON.stringify({ full_name: fullName, email, phone })
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const updatedUser = { ...user, full_name: fullName, email, phone };
      localStorage.setItem('greenera_user', JSON.stringify(updatedUser));
      document.getElementById('profileName').textContent = fullName;
      document.getElementById('userName').textContent = fullName;
      showToast('Profile updated successfully');
    } catch (err) {
      showToast('Failed to update profile', 'error');
    }
  });

  document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    if (newPass !== confirm) { showToast('Passwords do not match', 'error'); return; }
    if (newPass.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    try {
      const res = await fetch(API_BASE + '/profile/change-password', {
        method: 'PUT', headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword: current, newPassword: newPass })
      });
      if (!res.ok) throw new Error('Current password is incorrect');
      showToast('Password changed successfully');
      document.getElementById('changePasswordForm').reset();
    } catch (err) {
      showToast('Current password is incorrect', 'error');
    }
  });
})();
