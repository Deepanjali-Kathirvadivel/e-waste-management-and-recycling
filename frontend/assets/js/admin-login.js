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
      const res = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Invalid credentials');
      const data = await res.json();
      localStorage.setItem('greenera_admin_token', data.token);
      localStorage.setItem('greenera_admin', JSON.stringify(data.admin));
      window.location.href = 'dashboard.html';
    } catch (_) {
      // Demo fallback
      if (username === 'admin' && password === 'Admin@123') {
        localStorage.setItem('greenera_admin_token', 'demo_admin_' + Date.now());
        localStorage.setItem('greenera_admin', JSON.stringify({ id: 1, username: 'admin', full_name: 'Super Admin', role: 'super_admin' }));
        window.location.href = 'dashboard.html';
      } else {
        errorEl.textContent = 'Invalid admin credentials. Try admin / Admin@123';
        errorEl.classList.remove('d-none');
      }
    }
  });
})();
