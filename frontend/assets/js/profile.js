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

  document.getElementById('profileForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const fullName = document.getElementById('editFullName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    try {
      await fetch(API_BASE + '/profile', {
        method: 'PUT', headers: getAuthHeaders(),
        body: JSON.stringify({ full_name: fullName, email, phone })
      });
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
      await fetch(API_BASE + '/profile/change-password', {
        method: 'PUT', headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword: current, newPassword: newPass })
      });
      showToast('Password changed successfully');
      document.getElementById('changePasswordForm').reset();
    } catch (err) {
      showToast('Current password is incorrect', 'error');
    }
  });
})();
