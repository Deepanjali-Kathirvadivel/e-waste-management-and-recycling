(function() {
  const user = checkAuth();
  if (!user) return;
  if (user.role !== 'manager' && user.role !== 'admin') { window.location.href = '../dashboard.html'; return; }

  const userNameEl = document.getElementById('userName');
  if (userNameEl) userNameEl.textContent = user.full_name || user.username;

  let currentPage = 1;
  const pageSize = 10;
  let totalPages = 1;

  function productLabel(q) {
    if (q.product_catalog?.name) return q.product_catalog.name;
    if (q.brand && q.model) return `${q.brand} ${q.model}`;
    if (q.brand) return q.brand;
    if (q.product_category) return q.product_category;
    return '-';
  }

  function buildGroupKey(item) {
    return item.customer_phone || item.customer_name || 'unknown';
  }

  function groupByPhone(items) {
    const groups = {};
    items.forEach(a => {
      const key = buildGroupKey(a);
      if (!groups[key]) groups[key] = { customer: a.customer_name || '-', phone: a.customer_phone || '', items: [] };
      groups[key].items.push(a);
    });
    return Object.values(groups);
  }

  async function fetchGrouped(url, tableBodyId, groupRenderer, subRenderer) {
    try {
      const res = await fetch(url + '?limit=100', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      const data = await res.json();
      const items = data.quotations || data.receipts || [];
      const groups = groupByPhone(items);

      const tbody = document.getElementById(tableBodyId);
      if (!tbody) return;

      if (groups.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No records found</td></tr>`;
        document.getElementById('tableInfo').textContent = 'No records';
        document.getElementById('tablePagination').innerHTML = '';
        return;
      }

      let rows = '';
      groups.forEach((g, gi) => {
        const groupId = 'grp_' + gi;
        rows += groupRenderer(g, groupId);
        rows += `<tr class="group-detail d-none" id="${groupId}"><td colspan="8" class="p-0">`;
        rows += `<table class="table table-sm mb-0 bg-light"><thead><tr><th>#ID</th><th>Date</th><th>Product</th><th>Value</th><th>Staff</th><th>Status</th><th>Action</th></tr></thead><tbody>`;
        rows += g.items.map(subRenderer).join('');
        rows += `</tbody></table></td></tr>`;
      });
      tbody.innerHTML = rows;

      document.getElementById('tableInfo').textContent = `${groups.length} deal(s) found`;
      document.getElementById('tablePagination').innerHTML = '';
    } catch (e) {
      console.error('Fetch error:', e);
      const tbody = document.getElementById(tableBodyId);
      if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">Failed to load data. Please refresh.</td></tr>`;
    }
  }

  window.toggleGroup = function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('d-none');
  };

  window.renderPendingQuotations = function() {
    fetchGrouped(API_BASE + '/hr/pending', 'pendingTableBody',
      (g, gid) => {
        const totalValRange = g.items.reduce((acc, a) => {
          const vmin = a.value_min || Math.round((a.value_estimate || 0) * 0.7);
          const vmax = a.value_max || Math.round((a.value_estimate || 0) * 1.3);
          return { min: acc.min + vmin, max: acc.max + vmax };
        }, { min: 0, max: 0 });
        const orderIds = [...new Set(g.items.map(a => a.deal_group_id || '#' + a.id))];
        return `<tr class="group-header" onclick="toggleGroup('${gid}')" style="cursor:pointer">
          <td class="fw-semibold">${orderIds[0] || '#' + g.items[0].id}</td>
          <td>${new Date(g.items[0].submitted_at || g.items[0].created_at).toLocaleDateString()}</td>
          <td><strong>${g.customer}</strong>${g.phone ? '<br><small class="text-muted">' + g.phone + '</small>' : ''}</td>
          <td><span class="badge bg-secondary">${g.items.length} product(s)</span></td>
          <td>₹${totalValRange.min.toLocaleString('en-IN')} - ₹${totalValRange.max.toLocaleString('en-IN')}</td>
          <td>${g.items[0].user?.full_name || '-'}</td>
          <td><button class="btn btn-sm btn-outline-green" onclick="event.stopPropagation(); window.location.href='review.html?id=${g.items[0].id}'"><i class="bi bi-eye"></i></button></td>
        </tr>`;
      },
      (a) => {
        const valMin = a.value_min || Math.round((a.value_estimate || 0) * 0.7);
        const valMax = a.value_max || Math.round((a.value_estimate || 0) * 1.3);
        return `<tr>
          <td>${a.deal_group_id || '#' + a.id}</td>
          <td>${new Date(a.submitted_at || a.created_at).toLocaleDateString()}</td>
          <td>${productLabel(a)}</td>
          <td>₹${Math.round(valMin).toLocaleString('en-IN')} - ₹${Math.round(valMax).toLocaleString('en-IN')}</td>
          <td>${a.user?.full_name || '-'}</td>
          <td><span class="status-badge pending">Pending</span></td>
          <td><a href="review.html?id=${a.id}" class="btn btn-sm btn-primary-green"><i class="bi bi-eye me-1"></i> Review</a></td>
        </tr>`;
      }
    );
  };

  window.renderApprovedQuotations = function() {
    fetchGrouped(API_BASE + '/hr/approved', 'approvedTableBody',
      (g, gid) => {
        const totalVal = g.items.reduce((sum, a) => sum + (a.hr_approved_value || a.value_estimate || 0), 0);
        const statusLabel = g.items.some(a => a.deal_number) ? 'Deal Closed' : (g.items.some(a => a.otp_verified) ? 'OTP Verified' : 'Approved');
        const orderIds = [...new Set(g.items.map(a => a.deal_group_id || '#' + a.id))];
        return `<tr class="group-header" onclick="toggleGroup('${gid}')" style="cursor:pointer">
          <td class="fw-semibold">${orderIds[0] || '#' + g.items[0].id}</td>
          <td>${new Date(g.items[0].hr_acted_at || g.items[0].updated_at).toLocaleDateString()}</td>
          <td><strong>${g.customer}</strong>${g.phone ? '<br><small class="text-muted">' + g.phone + '</small>' : ''}</td>
          <td><span class="badge bg-secondary">${g.items.length} product(s)</span></td>
          <td class="fw-bold text-success">₹${totalVal.toLocaleString('en-IN')}</td>
          <td>${g.items[0].approver?.full_name || '-'}</td>
          <td><span class="status-badge completed">${statusLabel}</span></td>
          <td><button class="btn btn-sm btn-outline-green" onclick="event.stopPropagation(); window.location.href='review.html?id=${g.items[0].id}'"><i class="bi bi-eye"></i></button></td>
        </tr>`;
      },
      (a) => {
        const statusLabel = a.deal_number ? 'Deal Closed' : (a.otp_verified ? 'OTP Verified' : 'Approved');
        const statusClass = a.deal_number ? 'completed' : (a.otp_verified ? 'in_progress' : 'completed');
        return `<tr>
          <td>${a.deal_group_id || '#' + a.id}</td>
          <td>${new Date(a.hr_acted_at || a.updated_at).toLocaleDateString()}</td>
          <td>${productLabel(a)}</td>
          <td class="fw-bold text-success">₹${(a.hr_approved_value || a.value_estimate || 0).toLocaleString('en-IN')}</td>
          <td>${a.approver?.full_name || '-'}</td>
          <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
          <td><a href="review.html?id=${a.id}" class="btn btn-sm btn-outline-green"><i class="bi bi-eye"></i></a></td>
        </tr>`;
      }
    );
  };

  window.renderRejectedQuotations = function() {
    fetchGrouped(API_BASE + '/hr/rejected', 'rejectedTableBody',
      (g, gid) => {
        const orderIds = [...new Set(g.items.map(a => a.deal_group_id || '#' + a.id))];
        return `<tr class="group-header" onclick="toggleGroup('${gid}')" style="cursor:pointer">
          <td class="fw-semibold">${orderIds[0] || '#' + g.items[0].id}</td>
          <td>${new Date(g.items[0].hr_acted_at || g.items[0].updated_at).toLocaleDateString()}</td>
          <td><strong>${g.customer}</strong>${g.phone ? '<br><small class="text-muted">' + g.phone + '</small>' : ''}</td>
          <td><span class="badge bg-secondary">${g.items.length} product(s)</span></td>
          <td class="text-danger">${g.items[0].hr_rejection_reason || 'No reason'}</td>
          <td>${g.items[0].approver?.full_name || '-'}</td>
          <td><button class="btn btn-sm btn-outline-green" onclick="event.stopPropagation(); window.location.href='review.html?id=${g.items[0].id}'"><i class="bi bi-eye"></i></button></td>
        </tr>`;
      },
      (a) => `<tr>
        <td>${a.deal_group_id || '#' + a.id}</td>
        <td>${new Date(a.hr_acted_at || a.updated_at).toLocaleDateString()}</td>
        <td>${productLabel(a)}</td>
        <td class="text-danger">${a.hr_rejection_reason || 'No reason'}</td>
        <td>${a.approver?.full_name || '-'}</td>
        <td><span class="status-badge rejected">Rejected</span></td>
        <td><a href="review.html?id=${a.id}" class="btn btn-sm btn-outline-green"><i class="bi bi-eye"></i></a></td>
      </tr>`
    );
  };
})();
