(function () {
  const admin = JSON.parse(localStorage.getItem('greenera_admin') || 'null');
  if (!admin || !localStorage.getItem('greenera_admin_token')) { window.location.href = 'login.html'; return; }
  const initials = (admin.full_name || 'Admin').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('adminAvatar').textContent = initials || 'A';
  window.adminLogout = function () { localStorage.removeItem('greenera_admin_token'); localStorage.removeItem('greenera_admin'); window.location.href = 'login.html'; };
  window.toggleSidebar = function () { document.getElementById('adminSidebar').classList.toggle('show'); };

  const token = localStorage.getItem('greenera_admin_token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  let allProducts = [];

  async function loadProducts() {
    try {
      const res = await fetch(API_BASE + '/admin/products', { headers });
      const data = await res.json();
      allProducts = data.products || [];
      renderTable(data.stats);
    } catch (e) {
      document.getElementById('sumTotal').textContent = 'Error';
    }
  }

  function getClassBadge(cls) {
    const map = { reusable: 'detail-tag green', repairable: 'detail-tag blue', recyclable: 'detail-tag yellow', scrap: 'detail-tag red' };
    return `<span class="${map[cls] || 'detail-tag'}">${cls || 'Unknown'}</span>`;
  }

  function getScoreRing(score) {
    const s = parseInt(score) || 0;
    const cls = s >= 70 ? 'high' : s >= 40 ? 'medium' : 'low';
    return `<span class="score-ring ${cls}" style="width:50px;height:50px;font-size:0.85rem;display:inline-flex">${s}</span>`;
  }

  window.applyFilters = async function () {
    const region = document.getElementById('filterRegion').value;
    const type = document.getElementById('filterType').value;
    const staff = document.getElementById('filterStaff').value;
    const condition = document.getElementById('filterCondition').value;
    const date = document.getElementById('filterDate').value;
    const params = new URLSearchParams();
    if (region !== 'all') params.set('region', region);
    if (type !== 'all') params.set('type', type);
    if (staff !== 'all') params.set('staff', staff);
    if (condition !== 'all') params.set('condition', condition);
    if (date) params.set('date_from', date);
    try {
      const res = await fetch(API_BASE + '/admin/products?' + params, { headers });
      const data = await res.json();
      renderTable(data.stats);
      allProducts = data.products || [];
      document.getElementById('reuseTableBody').innerHTML = (data.products || []).map(p => `
        <tr>
          <td><a href="product-details.html?id=${p.id}" class="fw-semibold text-dark text-decoration-none">${p.brand || '-'} ${p.model || ''}</a></td>
          <td><span class="detail-tag blue">${p.product_catalog?.name || '-'}</span></td>
          <td>${p.user?.region?.name || '-'}</td>
          <td>${p.user?.full_name || '-'}</td>
          <td class="text-center">${getScoreRing(p.ai_score)}</td>
          <td>${getClassBadge(p.classification)}</td>
          <td>\u20B9${(p.value_estimate || 0).toLocaleString('en-IN')}</td>
          <td><a href="product-details.html?id=${p.id}" class="btn btn-sm btn-outline-green"><i class="bi bi-eye"></i></a></td>
        </tr>
      `).join('');
    } catch (e) {}
  };

  window.resetFilters = function () {
    document.getElementById('filterRegion').value = 'all';
    document.getElementById('filterType').value = 'all';
    document.getElementById('filterStaff').value = 'all';
    document.getElementById('filterCondition').value = 'all';
    document.getElementById('filterDate').value = '';
    loadProducts();
  };

  function renderTable(stats) {
    const s = stats || {};
    document.getElementById('sumTotal').textContent = s.total || 0;
    document.getElementById('sumReusable').textContent = s.reusable || 0;
    document.getElementById('sumRepairable').textContent = s.repairable || 0;
    document.getElementById('sumRecyclable').textContent = s.recyclable || 0;
    document.getElementById('sumScrap').textContent = s.scrap || 0;
    document.getElementById('sumValue').textContent = '\u20B9' + (s.est_value || 0).toLocaleString('en-IN');

    const tbody = document.getElementById('reuseTableBody');
    if (!tbody) return;
    tbody.innerHTML = allProducts.map(p => `
      <tr>
        <td><a href="product-details.html?id=${p.id}" class="fw-semibold text-dark text-decoration-none">${p.brand || '-'} ${p.model || ''}</a></td>
        <td><span class="detail-tag blue">${p.product_catalog?.name || '-'}</span></td>
        <td>${p.user?.region?.name || '-'}</td>
        <td>${p.user?.full_name || '-'}</td>
        <td class="text-center">${getScoreRing(p.ai_score)}</td>
        <td>${getClassBadge(p.classification)}</td>
        <td>\u20B9${(p.value_estimate || 0).toLocaleString('en-IN')}</td>
        <td><a href="product-details.html?id=${p.id}" class="btn btn-sm btn-outline-green"><i class="bi bi-eye"></i></a></td>
      </tr>
    `).join('');
  }

  loadProducts();
})();
