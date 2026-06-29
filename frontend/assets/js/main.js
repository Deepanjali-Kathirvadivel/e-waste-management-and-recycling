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
  const role = user.role;
  const rolePaths = {
    manager: '/manager/',
    supply_chain: '/supply-chain/',
    center_manager: '/hub/',
    employee: '',
  };
  const expectedPath = rolePaths[role];
  if (expectedPath !== undefined && !path.includes(expectedPath) && !path.includes('login.html') && !path.includes('admin/')) {
    const base = path.substring(0, path.lastIndexOf('/') + 1);
    const redirectMap = {
      manager: base + 'manager/dashboard.html',
      supply_chain: base + 'supply-chain/dashboard.html',
      center_manager: base + 'hub/dashboard.html',
    };
    if (redirectMap[role]) {
      window.location.href = redirectMap[role];
      return null;
    }
  }
  return user;
}

function displayUserInfo() {
  const user = JSON.parse(localStorage.getItem('greenera_user') || sessionStorage.getItem('greenera_user') || 'null');
  if (!user) return;
  const nameEl = document.getElementById('userName');
  if (nameEl) nameEl.textContent = user.full_name || user.username || 'User';
  const avatarEl = document.getElementById('userAvatar');
  if (avatarEl) {
    const initials = (user.full_name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    avatarEl.textContent = initials || 'U';
  }
  const dateEl = document.getElementById('dashboardDate');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const dateTextEl = document.getElementById('dashboardDateText');
  if (dateTextEl) dateTextEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function setupNotifications() {
  const notifBell = document.getElementById('notifBell');
  if (notifBell) {
    notifBell.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'notifications.html';
    });
  }
}

function logout() {
  const token = localStorage.getItem('greenera_token');
  const adminToken = localStorage.getItem('greenera_admin_token');
  const wasAdmin = !!adminToken;

  if (token) {
    fetch(API_BASE + '/auth/logout', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }).catch(() => {});
  }
  if (adminToken) {
    fetch(API_BASE + '/auth/logout', { method: 'POST', headers: { 'Authorization': `Bearer ${adminToken}` } }).catch(() => {});
  }

  localStorage.removeItem('greenera_token');
  localStorage.removeItem('greenera_user');
  localStorage.removeItem('greenera_admin_token');
  localStorage.removeItem('greenera_admin');
  sessionStorage.removeItem('greenera_token');
  sessionStorage.removeItem('greenera_user');
  sessionStorage.removeItem('greenera_admin_token');
  sessionStorage.removeItem('greenera_admin');
  
  const path = window.location.pathname.replace(/\\/g, '/');
  if (path.includes('/admin/') || wasAdmin) {
    if (path.includes('/admin/')) {
      const parts = path.split('/admin/');
      const afterAdmin = parts[1] || '';
      const slashCount = (afterAdmin.match(/\//g) || []).length;
      let prefix = '';
      for (let i = 0; i < slashCount; i++) {
        prefix += '../';
      }
      window.location.href = prefix + 'login.html';
    } else {
      window.location.href = 'admin/login.html';
    }
  } else if (path.includes('/manager/') || path.includes('/hr/') || path.includes('/hub/') || path.includes('/supply-chain/')) {
    window.location.href = '../login.html';
  } else {
    window.location.href = 'login.html';
  }
}

function getAuthHeaders() {
  const path = window.location.pathname.replace(/\\/g, '/');
  const isAdmin = path.includes('/admin/');
  const token = isAdmin ? localStorage.getItem('greenera_admin_token') : (localStorage.getItem('greenera_token') || localStorage.getItem('greenera_admin_token'));
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
      const path = window.location.pathname.replace(/\\/g, '/');
      if (path.includes('/admin/')) {
        localStorage.removeItem('greenera_admin_token');
        localStorage.removeItem('greenera_admin');
        window.location.href = (path.includes('/admin/') ? '' : '../admin/') + 'login.html';
      } else {
        logout();
      }
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

const notifStyles = document.createElement('style');
notifStyles.textContent = `
  .btn-outline-green { border-color: #16A34A; color: #16A34A; }
  .btn-outline-green:hover { background-color: #16A34A; color: #fff; }
`;
document.head.appendChild(notifStyles);

// ───── Admin Authorization Helpers ─────
function checkAdminAuth() {
  const path = window.location.pathname.replace(/\\/g, '/');
  const token = localStorage.getItem('greenera_admin_token');
  const admin = JSON.parse(localStorage.getItem('greenera_admin') || 'null');
  if (!token || !admin || !['admin', 'root'].includes(admin.role)) {
    if (path.includes('/admin/') && !path.includes('/admin/login.html')) {
      const parts = path.split('/admin/');
      const afterAdmin = parts[1] || '';
      const slashCount = (afterAdmin.match(/\//g) || []).length;
      let prefix = '';
      for (let i = 0; i < slashCount; i++) {
        prefix += '../';
      }
      window.location.href = prefix + 'login.html';
    }
    return null;
  }
  return admin;
}

// Self-invoking admin page protection
(function() {
  const path = window.location.pathname.replace(/\\/g, '/');
  if (path.includes('/admin/') && !path.includes('/admin/login.html')) {
    checkAdminAuth();
  }
})();

// Dynamic Admin Sidebar links rendering & active link highlighting
document.addEventListener('DOMContentLoaded', function() {
  setupNotifications();
  if (document.getElementById('notifBell')) {
    startNotificationPolling();
  }
  const adminSidebar = document.getElementById('adminSidebar');
  if (adminSidebar) {
    const path = window.location.pathname.replace(/\\/g, '/');
    const isDeeper = path.includes('/forecasting/') || path.includes('/bi/');
    const prefix = isDeeper ? '../' : '';

    const sidebarHTML = `
      <div class="admin-sidebar-brand">
        <h5><i class="bi bi-recycle"></i> Green Era Recyclers</h5>
      </div>
      <div class="nav-section">Main</div>
      <nav class="nav flex-column">
        <a class="nav-link" href="${prefix}dashboard.html"><i class="bi bi-speedometer2"></i> Dashboard</a>
        <a class="nav-link" href="${prefix}profile.html"><i class="bi bi-person-circle"></i> My Profile</a>
        <a class="nav-link" href="${prefix}employees.html"><i class="bi bi-person-workspace"></i> Employees</a>
        <a class="nav-link" href="${prefix}managers.html"><i class="bi bi-person-badge"></i> Managers</a>
        <a class="nav-link" href="${prefix}supply-chain.html"><i class="bi bi-truck"></i> Supply Chain</a>
        <a class="nav-link" href="${prefix}reusability-center.html"><i class="bi bi-arrow-repeat"></i> Reusability Center</a>
        <a class="nav-link" href="${prefix}analytics.html"><i class="bi bi-graph-up"></i> Reusability Analytics</a>
      </nav>
      <div class="sidebar-divider"></div>
      <div class="nav-section">Forecasting</div>
      <nav class="nav flex-column">
        <a class="nav-link" href="${prefix}forecasting/dashboard.html"><i class="bi bi-graph-up-arrow"></i> Forecasting Dashboard</a>
        <a class="nav-link" href="${prefix}forecasting/upload-data.html"><i class="bi bi-upload"></i> Upload Forecast Data</a>
        <a class="nav-link" href="${prefix}forecasting/forecast-results.html"><i class="bi bi-bar-chart"></i> Forecast Results</a>
        <a class="nav-link" href="${prefix}forecasting/regions.html"><i class="bi bi-geo-alt"></i> Region Management</a>
        <a class="nav-link" href="${prefix}forecasting/facilities.html"><i class="bi bi-building"></i> Facility Management</a>
        <a class="nav-link" href="${prefix}forecasting/logistics.html"><i class="bi bi-truck"></i> Logistics Management</a>
        <a class="nav-link" href="${prefix}forecasting/data-upload.html"><i class="bi bi-database"></i> Data Upload Center</a>
      </nav>
      <div class="sidebar-divider"></div>
      <div class="nav-section">Business Intelligence</div>
      <nav class="nav flex-column">
        <a class="nav-link" href="${prefix}bi/sustainability-dashboard.html"><i class="bi bi-leaf"></i> Sustainability Dashboard</a>
        <a class="nav-link" href="${prefix}bi/profit-optimization.html"><i class="bi bi-cash-stack"></i> Profit Optimization</a>
        <a class="nav-link" href="${prefix}bi/scenario-simulation.html"><i class="bi bi-diagram-3"></i> Scenario Simulation</a>
        <a class="nav-link" href="${prefix}bi/recommendation-center.html"><i class="bi bi-lightbulb"></i> Recommendation Center</a>
        <a class="nav-link" href="${prefix}bi/sustainability-reports.html"><i class="bi bi-file-earmark-text"></i> Sustainability Reports</a>
        <a class="nav-link" href="${prefix}bi/profitability-reports.html"><i class="bi bi-bar-chart"></i> Profitability Reports</a>
        <a class="nav-link" href="${prefix}bi/executive-reports.html"><i class="bi bi-clipboard-data"></i> Executive Reports</a>
      </nav>
      <div class="nav-section mt-3">Quick Links</div>
      <nav class="nav flex-column">
        <a class="nav-link" href="${prefix}../login.html" target="_blank"><i class="bi bi-person-badge"></i> Staff Portal</a>
        <a class="nav-link" href="${prefix}../index.html" target="_blank"><i class="bi bi-globe"></i> Public Site</a>
      </nav>
    `;

    adminSidebar.innerHTML = sidebarHTML;

    // Dynamically patch dropdown profile links to point to the correct admin/profile.html relative path
    const profileHref = isDeeper ? '../profile.html' : 'profile.html';
    document.querySelectorAll('.dropdown-menu .dropdown-item').forEach(el => {
      if (el.textContent.includes('Profile') || el.textContent.includes('My Profile')) {
        el.setAttribute('href', profileHref);
      }
    });

    // Highlighting active classes
    const navLinks = adminSidebar.querySelectorAll('.nav-link');
    const currentPage = path.split('/').pop().split('?')[0] || 'dashboard.html';

    navLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      const hrefPage = href.split('/').pop().split('?')[0];

      let isMatch = false;
      if (currentPage === 'employee-details.html' && hrefPage === 'employees.html') {
        isMatch = true;
      } else if (currentPage === 'manager-details.html' && hrefPage === 'managers.html') {
        isMatch = true;
      } else if (currentPage === 'supply-chain-details.html' && hrefPage === 'supply-chain.html') {
        isMatch = true;
      } else {
        // Native URL resolution handles matching absolute paths perfectly
        const resolvedHref = link.href.split('?')[0];
        const currentHref = window.location.href.split('?')[0];
        if (resolvedHref === currentHref) {
          isMatch = true;
        }
      }

      if (isMatch) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
});
