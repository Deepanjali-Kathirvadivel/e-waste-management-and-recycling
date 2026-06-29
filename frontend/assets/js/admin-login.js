(function () {
  const loginForm = document.getElementById('adminLoginForm');
  const errorEl = document.getElementById('adminLoginError');

  if (localStorage.getItem('greenera_admin_token')) {
    window.location.href = 'dashboard.html';
  }

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    errorEl.classList.add('d-none');
    const username = document.getElementById('adminUser').value.trim();
    const password = document.getElementById('adminPass').value;

    try {
      const res = await fetch(API_BASE + '/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Invalid credentials');
      const data = await res.json();
      const remember = document.getElementById('adminRemember')?.checked;
      const storage = remember ? localStorage : sessionStorage;

      localStorage.removeItem('greenera_admin_token');
      localStorage.removeItem('greenera_admin');
      sessionStorage.removeItem('greenera_admin_token');
      sessionStorage.removeItem('greenera_admin');

      storage.setItem('greenera_admin_token', data.token);
      storage.setItem('greenera_admin', JSON.stringify(data.user));

      localStorage.removeItem('greenera_token');
      localStorage.removeItem('greenera_user');
      sessionStorage.removeItem('greenera_token');
      sessionStorage.removeItem('greenera_user');

      window.location.href = 'dashboard.html';
    } catch (err) {
      errorEl.textContent = err.message || 'Invalid admin credentials';
      errorEl.classList.remove('d-none');
    }
  });
})();
