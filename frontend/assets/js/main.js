const API_BASE = 'http://localhost:5400/api';

// Support Session Storage fallback when "Remember Me" is not checked
(function() {
  const originalGet = localStorage.getItem;
  localStorage.getItem = function(key) {
    const val = originalGet.call(localStorage, key);
    if (val !== null) return val;
    return sessionStorage.getItem(key);
  };

  const originalRemove = localStorage.removeItem;
  localStorage.removeItem = function(key) {
    originalRemove.call(localStorage, key);
    sessionStorage.removeItem(key);
  };
})();

function checkAuth() {
  const token = localStorage.getItem('greenera_token');
  const user = JSON.parse(localStorage.getItem('greenera_user') || 'null');
  if (!token || !user) {
    window.location.href = 'login.html';
    return null;
  }
  const path = window.location.pathname.replace(/\\/g, '/');
  if (user.role === 'manager' && !path.includes('/manager/') && !path.includes('login.html') && !path.includes('admin/')) {
    const base = path.substring(0, path.lastIndexOf('/') + 1);
    window.location.href = base + 'manager/dashboard.html';
    return null;
  }
  if (user.role === 'supply_chain' && !path.includes('/supply-chain/') && !path.includes('login.html') && !path.includes('admin/')) {
    const base = path.substring(0, path.lastIndexOf('/') + 1);
    window.location.href = base + 'supply-chain/dashboard.html';
    return null;
  }
  if (user.role === 'center_manager' && !path.includes('/hub/') && !path.includes('login.html') && !path.includes('admin/')) {
    const base = path.substring(0, path.lastIndexOf('/') + 1);
    window.location.href = base + 'hub/dashboard.html';
    return null;
  }
  return user;
}

function logout() {
  localStorage.removeItem('greenera_token');
  localStorage.removeItem('greenera_user');
  localStorage.removeItem('greenera_admin_token');
  localStorage.removeItem('greenera_admin');
  sessionStorage.removeItem('greenera_admin_token');
  sessionStorage.removeItem('greenera_admin');
  
  const path = window.location.pathname.replace(/\\/g, '/');
  if (path.includes('/admin/')) {
    const parts = path.split('/admin/');
    const afterAdmin = parts[1] || '';
    const slashCount = (afterAdmin.match(/\//g) || []).length;
    let prefix = '';
    for (let i = 0; i < slashCount; i++) {
      prefix += '../';
    }
    window.location.href = prefix + 'login.html';
  } else if (path.includes('/manager/') || path.includes('/hr/') || path.includes('/hub/') || path.includes('/supply-chain/')) {
    window.location.href = '../login.html';
  } else {
    window.location.href = 'login.html';
  }
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

// ───── Notification polling ─────
function startNotificationPolling(intervalMs = 30000) {
  let badge = document.getElementById('notifBadge');
  let bell = document.getElementById('notifBell');
  if (!badge) {
    badge = document.createElement('span');
    badge.id = 'notifBadge';
    badge.style.cssText = 'position:absolute;top:-4px;right:-6px;background:#EF4444;color:#fff;font-size:10px;font-weight:700;border-radius:50%;min-width:18px;height:18px;display:flex;align-items:center;justify-content:center;padding:0 4px;box-shadow:0 2px 4px rgba(0,0,0,0.2)';
    if (bell) {
      bell.style.position = 'relative';
      bell.appendChild(badge);
    }
  }
  async function poll() {
    try {
      const res = await fetch(API_BASE + '/notifications/unread-count', { headers: getAuthHeaders() });
      const data = await res.json();
      if (badge) {
        badge.textContent = data.count || '';
        badge.style.display = data.count > 0 ? 'flex' : 'none';
      }
    } catch (e) { /* ignore */ }
  }
  poll();
  setInterval(poll, intervalMs);
}

const style = document.createElement('style');
style.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
document.head.appendChild(style);
