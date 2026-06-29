(async function() {
  const admin = checkAdminAuth();
  if (!admin) return;

  const initials = (admin.full_name || 'Admin').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const avatarEl = document.getElementById('adminAvatar');
  if (avatarEl) avatarEl.textContent = initials || 'A';

  document.getElementById('profileName').textContent = admin.full_name || admin.username;
  document.getElementById('profileRole').textContent = admin.role ? admin.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Administrator';
  document.getElementById('editFullName').value = admin.full_name || '';
  document.getElementById('editEmail').value = admin.email || '';
  document.getElementById('editUsername').value = admin.username || '';
  document.getElementById('editPhone').value = admin.phone || '';

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
      const updatedUser = { ...admin, full_name: fullName, email, phone };
      localStorage.setItem('greenera_admin', JSON.stringify(updatedUser));
      document.getElementById('profileName').textContent = fullName;
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
