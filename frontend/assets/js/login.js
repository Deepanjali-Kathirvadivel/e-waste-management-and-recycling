(function () {
  const loginForm = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');
  const btnText = document.getElementById('loginBtnText');
  const loginError = document.getElementById('loginError');

  if (!loginForm) {
    console.error('Login form not found');
    return;
  }

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

    if (username === 'admin') {
      window.location.href = 'admin/login.html';
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Invalid credentials');
      const data = await res.json();
      localStorage.setItem('greenera_token', data.token);
      localStorage.setItem('greenera_user', JSON.stringify(data.staff));
      window.location.href = 'dashboard.html';
    } catch (err) {
      if (username === 'staff' && password === 'Admin@123') {
        localStorage.setItem('greenera_token', 'demo_' + Date.now());
        localStorage.setItem('greenera_user', JSON.stringify({
          id: 1, username: 'staff', full_name: 'Staff User',
          email: 'staff@greenera.com', role: 'assessor', region_id: 1
        }));
        window.location.href = 'dashboard.html';
        return;
      }
      loginError.textContent = err.message || 'Invalid credentials. Try staff / Admin@123';
      loginError.classList.remove('d-none');
      btnText.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Sign In';
      loginBtn.disabled = false;
    }
  });
})();
