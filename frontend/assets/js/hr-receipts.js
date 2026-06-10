(function() {
  const user = checkAuth();
  if (!user) return;
  if (user.role !== 'hr' && user.role !== 'admin') { window.location.href = '../dashboard.html'; return; }

  document.getElementById('userName').textContent = user.full_name || user.username;

  function buildGroupKey(r) {
    return r.deal_group_id || r.customer_phone || r.customer_name || 'unknown';
  }

  function groupByDeal(items) {
    const groups = {};
    items.forEach(a => {
      const key = buildGroupKey(a);
      if (!groups[key]) groups[key] = { customer: a.customer_name || '-', dealGroupId: a.deal_group_id || '', items: [] };
      groups[key].items.push(a);
    });
    return Object.values(groups);
  }

  async function loadReceipts() {
    try {
      const res = await fetch(API_BASE + `/hr/receipts?limit=100`, { headers: getAuthHeaders() });
      const data = await res.json();
      const items = data.receipts || [];
      totalPages = data.total_pages || 1;

      const groups = groupByDeal(items);
      const tbody = document.getElementById('receiptTableBody');

      if (groups.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No receipts found</td></tr>';
        document.getElementById('tableInfo').textContent = 'No records';
        document.getElementById('tablePagination').innerHTML = '';
        return;
      }

      let rows = '';
      groups.forEach((g, gi) => {
        const gid = 'rct_' + gi;
        const totalVal = g.items.reduce((sum, a) => sum + (a.hr_approved_value || a.value_estimate || 0), 0);
        const displayId = g.dealGroupId || g.items[0].deal_number || '#';
        rows += `
          <tr class="group-header" onclick="toggleGroup('${gid}')" style="cursor:pointer">
            <td class="fw-semibold">${displayId}</td>
            <td>${g.items[0].receipt_number || '-'}</td>
            <td><strong>${g.customer}</strong></td>
            <td><span class="badge bg-secondary">${g.items.length} product(s)</span></td>
            <td class="fw-bold text-green">₹${totalVal.toLocaleString('en-IN')}</td>
            <td>${g.items[0].user?.full_name || '-'}</td>
            <td>${g.items[0].approver?.full_name || '-'}</td>
            <td>${g.items[0].deal_closed_at ? new Date(g.items[0].deal_closed_at).toLocaleDateString() : '-'}</td>
          </tr>
          <tr class="group-detail d-none" id="${gid}">
            <td colspan="8" class="p-0">
              <table class="table table-sm mb-0 bg-light">
                <thead><tr><th>Deal #</th><th>Receipt #</th><th>Product</th><th>Value</th><th>Staff</th><th>Date</th></tr></thead>
                <tbody>${g.items.map(r => `
                  <tr>
                    <td>${r.deal_number || '-'}</td>
                    <td class="small">${r.receipt_number || '-'}</td>
                    <td>${r.product_catalog?.name || (r.brand && r.model ? `${r.brand} ${r.model}` : r.brand || r.product_category || '-')}</td>
                    <td class="fw-bold text-green">₹${(r.hr_approved_value || r.value_estimate || 0).toLocaleString('en-IN')}</td>
                    <td>${r.user?.full_name || '-'}</td>
                    <td>${r.deal_closed_at ? new Date(r.deal_closed_at).toLocaleDateString() : '-'}</td>
                  </tr>
                `).join('')}</tbody>
              </table>
            </td>
          </tr>`;
      });
      tbody.innerHTML = rows;

      document.getElementById('tableInfo').textContent = `${groups.length} deal(s) found`;
      document.getElementById('tablePagination').innerHTML = '';
    } catch (e) {
      document.getElementById('receiptTableBody').innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Error loading receipts</td></tr>';
    }
  }

  window.toggleGroup = function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('d-none');
  };

  loadReceipts();
})();
