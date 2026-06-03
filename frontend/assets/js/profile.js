(function() {
  const user = checkAuth();
  if (!user) return;

  // ───── Populate Profile ─────
  document.getElementById('userName').textContent = user.full_name || user.username;
  document.getElementById('profileName').textContent = user.full_name || user.username;
  document.getElementById('profileRole').textContent = user.role ? user.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Staff Member';
  document.getElementById('editFullName').value = user.full_name || '';
  document.getElementById('editEmail').value = user.email || '';
  document.getElementById('editUsername').value = user.username || '';
  document.getElementById('editPhone').value = user.phone || '';

  // ───── Activity Summary ─────
  document.getElementById('actAssessments').textContent = '127';
  document.getElementById('actCollections').textContent = '89';
  document.getElementById('actDaysActive').textContent = '342';

  // ───── Save Profile ─────
  document.getElementById('profileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const fullName = document.getElementById('editFullName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const phone = document.getElementById('editPhone').value.trim();

    // Update local storage
    const updatedUser = { ...user, full_name: fullName, email, phone };
    localStorage.setItem('greenera_user', JSON.stringify(updatedUser));
    document.getElementById('profileName').textContent = fullName;
    document.getElementById('userName').textContent = fullName;

    // API call
    apiRequest('http://localhost:5000/api/profile', 'PUT', { full_name: fullName, email, phone })
      .then(() => showToast('Profile updated successfully'))
      .catch(() => showToast('Profile updated locally', 'info'));
  });

  // ───── Change Password ─────
  document.getElementById('changePasswordForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (newPass !== confirm) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (newPass.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    apiRequest('http://localhost:5000/api/profile/change-password', 'PUT', {
      currentPassword: current,
      newPassword: newPass
    })
      .then(() => {
        showToast('Password changed successfully');
        document.getElementById('changePasswordForm').reset();
      })
      .catch((err) => {
        // Demo fallback
        if (current === 'password') {
          showToast('Password changed successfully (demo mode)');
          document.getElementById('changePasswordForm').reset();
        } else {
          showToast(err.message || 'Current password is incorrect', 'error');
        }
      });
  });
})();
