(function() {
  const user = checkAuth();
  if (!user) return;
  if (user.role !== 'employee' && user.role !== 'admin') { window.location.href = '../dashboard.html'; return; }
  document.getElementById('userName').textContent = user.full_name || user.username;

  let approvedDeals = [];
  let currentPage = 1;
  const rowsPerPage = 10;

  function buildGroupKey(a) {
    return a.deal_group_id || a.customer_phone || a.customer_name || 'unknown_' + a.id;
  }

  function groupByDeal(items) {
    const groups = {};
    items.forEach(a => {
      const key = buildGroupKey(a);
      if (!groups[key]) groups[key] = { customer: a.customer_name || '-', phone: a.customer_phone || '', dealGroupId: a.deal_group_id || '', items: [] };
      groups[key].items.push(a);
    });
    return Object.values(groups);
  }

  async function loadApprovedDeals() {
    try {
      const res = await fetch(API_BASE + '/employee/approved', { headers: getAuthHeaders() });
      const data = await res.json();
      approvedDeals = data.quotations || [];
      currentPage = 1;
      renderTable();
      renderSummary();
    } catch (e) {
      document.getElementById('approvedDealsBody').innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Error loading approved deals</td></tr>';
    }
  }

  function renderSummary() {
    const groups = groupByDeal(approvedDeals);
    const totalDeals = groups.length;
    const totalProducts = approvedDeals.length;
    const totalValue = approvedDeals.reduce((sum, a) => sum + (Number(a.hr_approved_value || a.value_estimate || 0)), 0);
    const uniqueCustomers = new Set(approvedDeals.map(a => a.customer_name)).size;
    document.getElementById('sumTotalDeals').textContent = totalDeals;
    document.getElementById('sumTotalProducts').textContent = totalProducts;
    document.getElementById('sumTotalValue').textContent = '\u20B9' + totalValue.toLocaleString('en-IN');
    document.getElementById('sumTotalCustomers').textContent = uniqueCustomers;
  }

  function renderTable() {
    const groups = groupByDeal(approvedDeals);
    const totalPages = Math.ceil(groups.length / rowsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageGroups = groups.slice(start, end);
    const tbody = document.getElementById('approvedDealsBody');

    if (!pageGroups.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No approved deals found</td></tr>';
      document.getElementById('tableInfo').textContent = 'No records';
      document.getElementById('tablePagination').innerHTML = '';
      return;
    }

    let rows = '';
    pageGroups.forEach((g, gi) => {
      const gid = 'adg_' + gi;
      const totalVal = g.items.reduce((sum, a) => sum + (Number(a.hr_approved_value || a.value_estimate || 0)), 0);
      const hasClosed = g.items.some(a => a.deal_number);
      const allClosed = g.items.every(a => a.deal_number);
      const displayId = g.dealGroupId || '#' + g.items[0].id;
      const firstDate = g.items.reduce((earliest, a) => {
        const d = new Date(a.submitted_at || a.hr_acted_at || a.createdAt || Date.now());
        return d < earliest ? d : earliest;
      }, new Date());

      rows += `
        <tr class="group-header" onclick="toggleGroup('${gid}')" style="cursor:pointer">
          <td class="fw-semibold">${displayId}</td>
          <td>${firstDate.toLocaleDateString()}</td>
          <td><strong>${g.customer}</strong></td>
          <td>${g.phone || '-'}</td>
          <td><span class="badge bg-secondary">${g.items.length} product(s)</span></td>
          <td class="fw-bold text-success">\u20B9${totalVal.toLocaleString('en-IN')}</td>
          <td><span class="status-badge ${allClosed ? 'completed' : 'approved'}">${allClosed ? 'Closed' : hasClosed ? 'Partial' : 'Approved'}</span></td>
          <td>
            <button class="btn btn-sm btn-outline-green" onclick="event.stopPropagation(); viewDetail(${g.items[0].id})"><i class="bi bi-eye me-1"></i>View</button>
          </td>
        </tr>
        <tr class="group-detail d-none" id="${gid}">
          <td colspan="8" class="p-0">
            <table class="table table-sm mb-0 bg-light">
              <thead><tr><th>#ID</th><th>Product</th><th>Brand</th><th>Value</th><th>Status</th></tr></thead>
              <tbody>${g.items.map(a => `
                <tr>
                  <td>${a.id}</td>
                  <td>${a.product_catalog?.name || a.brand || '-'}</td>
                  <td>${a.brand || '-'} ${a.model || ''}</td>
                  <td>\u20B9${(Number(a.hr_approved_value || a.value_estimate || 0)).toLocaleString('en-IN')}</td>
                  <td><span class="status-badge ${a.deal_number ? 'completed' : 'approved'}">${a.deal_number ? 'Closed' : 'Approved'}</span></td>
                </tr>
              `).join('')}</tbody>
            </table>
          </td>
        </tr>`;
    });
    tbody.innerHTML = rows;

    document.getElementById('tableInfo').textContent = 'Showing ' + (start + 1) + '-' + Math.min(end, groups.length) + ' of ' + groups.length + ' deal(s)';
    let pagHtml = '<li class="page-item ' + (currentPage === 1 ? 'disabled' : '') + '"><a class="page-link" href="#" onclick="changePage(' + (currentPage - 1) + ')">&laquo;</a></li>';
    for (let i = 1; i <= totalPages; i++) pagHtml += '<li class="page-item ' + (i === currentPage ? 'active' : '') + '"><a class="page-link" href="#" onclick="changePage(' + i + ')">' + i + '</a></li>';
    pagHtml += '<li class="page-item ' + (currentPage === totalPages ? 'disabled' : '') + '"><a class="page-link" href="#" onclick="changePage(' + (currentPage + 1) + ')">&raquo;</a></li>';
    document.getElementById('tablePagination').innerHTML = pagHtml;
  }

  window.toggleGroup = function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('d-none');
  };

  window.changePage = function(p) { currentPage = p; renderTable(); };

  window.viewDetail = async function(id) {
    const body = document.getElementById('detailModalBody');
    body.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-green"></div><p class="mt-2 text-muted">Loading...</p></div>';
    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    modal.show();

    try {
      const res = await fetch(API_BASE + '/assessments/' + id, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const a = data.assessment;
      const d = a.assessment_detail;
      const statusClass = a.status === 'approved' ? 'success' : a.status === 'completed' ? 'primary' : 'secondary';

      body.innerHTML = `
        <div class="row g-3">
          <div class="col-md-6">
            <h6 class="fw-bold text-green border-bottom pb-2"><i class="bi bi-person me-2"></i>Customer</h6>
            <p class="mb-1"><strong>${a.customer_name || '-'}</strong></p>
            <p class="mb-1 text-muted small">${a.customer_phone || ''}${a.customer_email ? ' | ' + a.customer_email : ''}</p>
            <p class="mb-0 text-muted small">${[a.customer_address, a.customer_city || a.customer_village, a.customer_district, a.customer_state].filter(Boolean).join(', ')}${a.customer_pincode ? ' - ' + a.customer_pincode : ''}</p>
          </div>
          <div class="col-md-6">
            <h6 class="fw-bold text-green border-bottom pb-2"><i class="bi bi-box me-2"></i>Product</h6>
            <p class="mb-1"><strong>${a.brand || '-'} ${a.model || ''}</strong> <span class="badge bg-secondary">${a.product_category || ''}</span></p>
            <p class="mb-0 text-muted small">${a.product_catalog?.name || a.brand || '-'} | Serial: ${a.serial_number || '-'} | Condition: <span class="badge bg-secondary">${a.condition || '-'}</span></p>
          </div>
          <div class="col-12"><hr class="my-1"></div>
          <div class="col-md-6">
            <div class="p-3 bg-light rounded text-center">
              <small class="text-muted">Approved Value</small>
              <h5 class="mb-0 fw-bold text-success">\u20B9${(a.hr_approved_value || a.value_estimate || 0).toLocaleString('en-IN')}</h5>
            </div>
          </div>
          <div class="col-md-6">
            <div class="p-3 bg-light rounded text-center">
              <small class="text-muted">Status</small>
              <h5 class="mb-0"><span class="badge bg-${statusClass} fs-6">${(a.status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span></h5>
            </div>
          </div>
          ${a.customer_expected_value ? `<div class="col-12"><hr class="my-1"><p class="mb-0"><strong>Customer Expected Value:</strong> <span class="fw-bold text-info">\u20B9${a.customer_expected_value.toLocaleString('en-IN')}</span></p></div>` : ''}
          ${a.weight_kg ? `<div class="col-6"><hr class="my-1"><p class="mb-0 small"><strong>Weight:</strong> ${a.weight_kg} kg</p></div>` : ''}
          ${a.notes ? `<div class="col-6"><hr class="my-1"><p class="mb-0 small"><strong>Notes:</strong> ${a.notes}</p></div>` : ''}
          ${a.deal_number ? `<div class="col-12"><hr class="my-1"><p class="mb-0 small text-muted">Deal: ${a.deal_number || '-'} | Receipt: ${a.receipt_number || '-'} | Collection: ${a.collection_number || '-'}</p></div>` : ''}
          ${d ? `<div class="col-12"><hr class="my-1">
            <h6 class="fw-bold text-green"><i class="bi bi-question-circle me-2"></i>Verification Answers</h6>
            <div class="row g-2 small">
              <div class="col-3">Power: <span class="fw-bold">${d.verification_answers?.power_on || '-'}</span></div>
              <div class="col-3">Damage: <span class="fw-bold">${d.verification_answers?.damage || '-'}</span></div>
              <div class="col-3">Age: <span class="fw-bold">${d.verification_answers?.age || '-'}</span></div>
              <div class="col-3">Accessories: <span class="fw-bold">${d.verification_answers?.accessories || '-'}</span></div>
            </div>
          </div>` : ''}
          <div class="col-12"><hr class="my-1">
            <small class="text-muted">Created: ${new Date(a.created_at || a.createdAt).toLocaleString()}${a.submitted_at ? ' | Submitted: ' + new Date(a.submitted_at).toLocaleString() : ''}</small>
          </div>
        </div>`;
    } catch (e) {
      body.innerHTML = '<div class="text-center py-4 text-danger"><i class="bi bi-exclamation-triangle fs-1"></i><p class="mt-2">Failed to load details</p></div>';
    }
  };

  loadApprovedDeals();
})();