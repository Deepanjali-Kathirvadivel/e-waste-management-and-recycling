(function () {
  const loginForm = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');
  const btnText = document.getElementById('loginBtnText');
  const loginError = document.getElementById('loginError');

  if (!loginForm) return;

  if (localStorage.getItem('greenera_token')) {
    window.location.href = 'dashboard.html';
    return;
  }

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    loginError.classList.add('d-none');
    btnText.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Signing in...';
    loginBtn.disabled = true;

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (username === 'admin' || username === 'root') {
      window.location.href = 'admin/login.html';
      return;
    }

    try {
      const res = await fetch(API_BASE + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Invalid credentials');
      const data = await res.json();
      const remember = document.getElementById('remember')?.checked;
      const storage = remember ? localStorage : sessionStorage;

      // Clear both storages first to ensure no stale data remains
      localStorage.removeItem('greenera_token');
      localStorage.removeItem('greenera_user');
      sessionStorage.removeItem('greenera_token');
      sessionStorage.removeItem('greenera_user');

      storage.setItem('greenera_token', data.token);
      storage.setItem('greenera_user', JSON.stringify(data.user));

      localStorage.removeItem('greenera_admin_token');
      localStorage.removeItem('greenera_admin');
      sessionStorage.removeItem('greenera_admin_token');
      sessionStorage.removeItem('greenera_admin');

      window.location.href = 'dashboard.html';
    } catch (err) {
      loginError.textContent = err.message || 'Login failed';
      loginError.classList.remove('d-none');
      btnText.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Sign In';
      loginBtn.disabled = false;
    }
  });
})();
