const API_BASE = 'http://localhost:5400/api';

function checkAuth() {
  const token = localStorage.getItem('greenera_token');
  const user = JSON.parse(localStorage.getItem('greenera_user') || 'null');
  if (!token || !user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

function logout() {
  localStorage.removeItem('greenera_token');
  localStorage.removeItem('greenera_user');
  window.location.href = 'login.html';
}

function getAuthHeaders() {
  const token = localStorage.getItem('greenera_token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

// ───── Navbar Active Link ─────
document.addEventListener('DOMContentLoaded', function () {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });

  // Update nav based on auth status
  const token = localStorage.getItem('greenera_token');
  const loginBtn = document.querySelector('.btn-login-nav');
  if (loginBtn) {
    if (token) {
      loginBtn.textContent = 'Dashboard';
      loginBtn.href = 'dashboard.html';
    } else {
      loginBtn.textContent = 'Staff Login';
      loginBtn.href = 'login.html';
    }
  }

  // Animated counters
  const counters = document.querySelectorAll('.counter');
  counters.forEach(counter => {
    const raw = counter.getAttribute('data-target');
    const target = parseInt(raw);
    if (isNaN(target)) return;
    const duration = 2000;
    const step = Math.max(1, Math.ceil(target / (duration / 16)));
    let current = 0;

    const updateCounter = () => {
      current += step;
      if (current >= target) {
        counter.textContent = target.toLocaleString();
        return;
      }
      counter.textContent = current.toLocaleString();
      requestAnimationFrame(updateCounter);
    };
    updateCounter();
  });

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
});

// ───── API helper ─────
async function apiRequest(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: getAuthHeaders()
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  try {
    const res = await fetch(url, options);
    if (res.status === 401) {
      logout();
      throw new Error('Session expired');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
}

// ───── Toast notification ─────
function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999';
    document.body.appendChild(container);
  }
  const colors = { success: '#16A34A', error: '#EF4444', warning: '#F59E0B', info: '#3B82F6' };
  const bg = colors[type] || colors.info;
  const toast = document.createElement('div');
  toast.style.cssText = `background:${bg};color:#fff;padding:12px 20px;border-radius:8px;margin-bottom:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-size:14px;font-weight:500;animation:slideIn 0.3s ease;max-width:400px`;
  toast.textContent = message;
  document.getElementById('toastContainer').appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

const style = document.createElement('style');
style.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
document.head.appendChild(style);
