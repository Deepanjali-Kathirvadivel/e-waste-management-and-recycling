(function () {
  const admin = JSON.parse(localStorage.getItem('greenera_admin') || 'null');
  if (!admin || !localStorage.getItem('greenera_admin_token')) { window.location.href = 'login.html'; return; }
  const initials = (admin.full_name || 'Admin').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('adminAvatar').textContent = initials || 'A';
  window.adminLogout = function () { localStorage.removeItem('greenera_admin_token'); localStorage.removeItem('greenera_admin'); window.location.href = 'login.html'; };
  window.toggleSidebar = function () { document.getElementById('adminSidebar').classList.toggle('show'); };

  // ─── Demo Products ───
  const allProducts = [
    { id: 1, product: 'Samsung QLED 55"', type: 'TV', region: 'North', staff: 'John Davis', score: 82, classification: 'Reusable', value: 26500, condition: 'Good', date: '2026-06-03' },
    { id: 2, product: 'Dell XPS 15 Laptop', type: 'Laptop', region: 'South', staff: 'Sarah Lee', score: 45, classification: 'Repairable', value: 15000, condition: 'Fair', date: '2026-06-03' },
    { id: 3, product: 'iPhone 14 Pro', type: 'Mobile', region: 'East', staff: 'Mike Brown', score: 78, classification: 'Reusable', value: 29000, condition: 'Good', date: '2026-06-02' },
    { id: 4, product: 'LG Double Door Fridge', type: 'Fridge', region: 'West', staff: 'Emma Wilson', score: 30, classification: 'Recyclable', value: 10000, condition: 'Poor', date: '2026-06-02' },
    { id: 5, product: 'Daikin 1.5T AC', type: 'AC', region: 'Central', staff: 'James Chen', score: 68, classification: 'Repairable', value: 20000, condition: 'Fair', date: '2026-06-01' },
    { id: 6, product: 'Whirlpool WM 7kg', type: 'Washing Machine', region: 'North', staff: 'John Davis', score: 15, classification: 'Scrap', value: 3300, condition: 'Not Working', date: '2026-06-01' },
    { id: 7, product: 'MacBook Pro M3', type: 'Laptop', region: 'South', staff: 'Sarah Lee', score: 90, classification: 'Reusable', value: 54000, condition: 'Excellent', date: '2026-05-31' },
    { id: 8, product: 'Samsung Galaxy S24', type: 'Mobile', region: 'East', staff: 'Mike Brown', score: 55, classification: 'Repairable', value: 16500, condition: 'Good', date: '2026-05-31' },
    { id: 9, product: 'Sony Bravia 43"', type: 'TV', region: 'West', staff: 'Emma Wilson', score: 72, classification: 'Reusable', value: 23200, condition: 'Good', date: '2026-05-30' },
    { id: 10, product: 'HP 27" Monitor', type: 'Monitor', region: 'Central', staff: 'James Chen', score: 88, classification: 'Reusable', value: 12500, condition: 'Excellent', date: '2026-05-30' },
    { id: 11, product: 'Lenovo ThinkPad X1', type: 'Laptop', region: 'North', staff: 'John Davis', score: 35, classification: 'Recyclable', value: 7900, condition: 'Poor', date: '2026-05-29' },
    { id: 12, product: 'Crompton Superfan', type: 'Fan', region: 'South', staff: 'Sarah Lee', score: 60, classification: 'Repairable', value: 2000, condition: 'Fair', date: '2026-05-29' },
    { id: 13, product: 'Logitech G915 Keyboard', type: 'Keyboard', region: 'East', staff: 'Mike Brown', score: 92, classification: 'Reusable', value: 10000, condition: 'Excellent', date: '2026-05-28' },
    { id: 14, product: 'Razer DeathAdder Mouse', type: 'Mouse', region: 'West', staff: 'Emma Wilson', score: 75, classification: 'Reusable', value: 2900, condition: 'Good', date: '2026-05-28' },
    { id: 15, product: 'LG OLED 65" TV', type: 'TV', region: 'Central', staff: 'James Chen', score: 20, classification: 'Scrap', value: 6600, condition: 'Not Working', date: '2026-05-27' },
    { id: 16, product: 'Google Pixel 9', type: 'Mobile', region: 'North', staff: 'John Davis', score: 65, classification: 'Repairable', value: 18200, condition: 'Fair', date: '2026-05-27' },
    { id: 17, product: 'Panasonic Fridge', type: 'Fridge', region: 'South', staff: 'Sarah Lee', score: 50, classification: 'Repairable', value: 13200, condition: 'Fair', date: '2026-05-26' },
    { id: 18, product: 'Voltas Inverter AC', type: 'AC', region: 'East', staff: 'Mike Brown', score: 40, classification: 'Recyclable', value: 9100, condition: 'Poor', date: '2026-05-26' },
    { id: 19, product: 'Dell UltraSharp 27"', type: 'Monitor', region: 'West', staff: 'Emma Wilson', score: 85, classification: 'Reusable', value: 15000, condition: 'Excellent', date: '2026-05-25' },
    { id: 20, product: 'ASUS ZenBook 14', type: 'Laptop', region: 'Central', staff: 'James Chen', score: 10, classification: 'Scrap', value: 2500, condition: 'Not Working', date: '2026-05-25' },
  ];

  let filtered = [...allProducts];

  function getClassBadge(cls) {
    const map = { 'Reusable': 'detail-tag green', 'Repairable': 'detail-tag blue', 'Recyclable': 'detail-tag yellow', 'Scrap': 'detail-tag red' };
    return `<span class="${map[cls] || 'detail-tag'}">${cls}</span>`;
  }

  function getScoreRing(score) {
    const cls = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
    return `<span class="score-ring ${cls}" style="width:50px;height:50px;font-size:0.85rem;display:inline-flex">${score}</span>`;
  }

  window.applyFilters = function () {
    const region = document.getElementById('filterRegion').value;
    const type = document.getElementById('filterType').value;
    const staff = document.getElementById('filterStaff').value;
    const condition = document.getElementById('filterCondition').value;
    const date = document.getElementById('filterDate').value;

    filtered = allProducts.filter(p => {
      if (region !== 'all' && p.region !== region) return false;
      if (type !== 'all' && p.type !== type) return false;
      if (staff !== 'all' && p.staff !== staff) return false;
      if (condition !== 'all' && p.condition !== condition) return false;
      if (date && p.date < date) return false;
      return true;
    });
    renderTable();
  };

  window.resetFilters = function () {
    document.getElementById('filterRegion').value = 'all';
    document.getElementById('filterType').value = 'all';
    document.getElementById('filterStaff').value = 'all';
    document.getElementById('filterCondition').value = 'all';
    document.getElementById('filterDate').value = '';
    filtered = [...allProducts];
    renderTable();
  };

  function renderTable() {
    document.getElementById('sumTotal').textContent = filtered.length;
    document.getElementById('sumReusable').textContent = filtered.filter(p => p.classification === 'Reusable').length;
    document.getElementById('sumRepairable').textContent = filtered.filter(p => p.classification === 'Repairable').length;
    document.getElementById('sumRecyclable').textContent = filtered.filter(p => p.classification === 'Recyclable').length;
    document.getElementById('sumScrap').textContent = filtered.filter(p => p.classification === 'Scrap').length;
    document.getElementById('sumValue').textContent = '₹' + filtered.reduce((a, p) => a + p.value, 0).toLocaleString('en-IN');

    const tbody = document.getElementById('reuseTableBody');
    if (!tbody) return;
    tbody.innerHTML = filtered.map(p => `
      <tr>
        <td><a href="product-details.html?id=${p.id}" class="fw-semibold text-dark text-decoration-none">${p.product}</a></td>
        <td><span class="detail-tag blue">${p.type}</span></td>
        <td>${p.region}</td>
        <td>${p.staff}</td>
        <td class="text-center">${getScoreRing(p.score)}</td>
        <td>${getClassBadge(p.classification)}</td>
        <td>₹${p.value.toLocaleString('en-IN')}</td>
        <td><a href="product-details.html?id=${p.id}" class="btn btn-sm btn-outline-green"><i class="bi bi-eye"></i></a></td>
      </tr>
    `).join('');
  }

  renderTable();
})();
