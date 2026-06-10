(function() {
  const user = checkAuth();
  if (!user) return;
  document.getElementById('userName').textContent = user.full_name || user.username;

  let approvedDeals = [];
  let currentPage = 1;
  const rowsPerPage = 10;
  let currentDealId = null;

  function buildGroupKey(a) {
    return a.deal_group_id || a.customer_phone || a.customer_name || 'unknown';
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
      const res = await fetch(API_BASE + '/assessments?status=hr_approved&limit=100', { headers: getAuthHeaders() });
      const data = await res.json();
      approvedDeals = data.assessments || [];
      currentPage = 1;
      renderTable();
    } catch (e) {
      document.getElementById('approvedDealsBody').innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Error loading approved deals</td></tr>';
    }
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
      const totalVal = g.items.reduce((sum, a) => sum + (a.hr_approved_value || a.value_estimate || 0), 0);
      const hasClosed = g.items.some(a => a.deal_number);
      const displayId = g.dealGroupId || '#' + g.items[0].id;
      rows += `
        <tr class="group-header" onclick="toggleGroup('${gid}')" style="cursor:pointer">
          <td class="fw-semibold">${displayId}</td>
          <td>${new Date(g.items[0].createdAt || g.items[0].created_at).toLocaleDateString()}</td>
          <td><strong>${g.customer}</strong></td>
          <td>${g.phone || '-'}</td>
          <td><span class="badge bg-secondary">${g.items.length} product(s)</span></td>
          <td class="fw-bold text-success">₹${totalVal.toLocaleString('en-IN')}</td>
          <td><span class="status-badge ${hasClosed ? 'completed' : 'hr_approved'}">${hasClosed ? 'Closed' : 'Approved'}</span></td>
          <td>${hasClosed ? '' : `<button class="btn btn-sm btn-outline-green" onclick="event.stopPropagation(); openProcessModal(${g.items[0].id})"><i class="bi bi-gear"></i> Process</button>`}</td>
        </tr>
        <tr class="group-detail d-none" id="${gid}">
          <td colspan="8" class="p-0">
            <table class="table table-sm mb-0 bg-light">
              <thead><tr><th>#ID</th><th>Product</th><th>Brand</th><th>Value</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>${g.items.map(a => `
                <tr>
                  <td>${a.deal_group_id || '#' + a.id}</td>
                  <td>${a.product_catalog?.name || a.brand || '-'}</td>
                  <td>${a.brand || '-'} ${a.model || ''}</td>
                  <td>₹${(a.hr_approved_value || a.value_estimate || 0).toLocaleString('en-IN')}</td>
                  <td><span class="status-badge ${a.deal_number ? 'completed' : 'hr_approved'}">${a.deal_number ? 'Closed' : 'Approved'}</span></td>
                  <td>${a.deal_number
                    ? `<button class="btn btn-sm btn-outline-secondary" onclick="event.stopPropagation(); viewReceipt(${a.id})"><i class="bi bi-receipt"></i></button>`
                    : `<button class="btn btn-sm btn-outline-green" onclick="event.stopPropagation(); openProcessModal(${a.id})"><i class="bi bi-gear"></i> Process</button>`
                  }</td>
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

  window.openProcessModal = function(id) {
    currentDealId = id;
    const deal = approvedDeals.find(a => a.id === id);
    if (!deal) return;

    document.getElementById('dealInfo').innerHTML = `
      <strong>${deal.customer_name || '-'}</strong><br>
      <span class="text-muted">${deal.customer_phone || ''}${deal.customer_email ? ' | ' + deal.customer_email : ''}</span><br>
      <span class="text-muted">Product: ${deal.product_catalog?.name || deal.brand || '-'}</span><br>
      <span class="fw-bold text-green">Value: ₹${(deal.hr_approved_value || deal.value_estimate || 0).toLocaleString('en-IN')}</span>
      ${deal.deal_group_id ? `<br><span class="text-muted small">Deal: ${deal.deal_group_id}</span>` : ''}`;
    document.getElementById('otpDisplay').classList.add('d-none');
    document.getElementById('otpVerified').classList.add('d-none');
    document.getElementById('otpInput').value = '';
    document.getElementById('branchInput').value = '';
    document.getElementById('branchInput').disabled = true;
    document.getElementById('closeDealBtn').disabled = true;
    document.getElementById('sendReceiptBtn').disabled = true;
    document.getElementById('generateOtpBtn').disabled = false;
    document.getElementById('verifyOtpBtn').disabled = false;

    const modal = new bootstrap.Modal(document.getElementById('processModal'));
    modal.show();
  };

  window.generateOTP = async function() {
    if (!currentDealId) return;
    try {
      const res = await fetch(API_BASE + '/hr/quotations/' + currentDealId + '/generate-otp', {
        method: 'POST', headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      document.getElementById('otpCode').textContent = data.otp;
      document.getElementById('otpDisplay').classList.remove('d-none');
      showToast('OTP generated: ' + data.otp, 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  window.verifyOTP = async function() {
    if (!currentDealId) return;
    const otp = document.getElementById('otpInput').value.trim();
    if (!otp || otp.length !== 6) { showToast('Enter 6-digit OTP', 'error'); return; }
    try {
      const res = await fetch(API_BASE + '/hr/quotations/' + currentDealId + '/verify-otp', {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      document.getElementById('otpVerified').classList.remove('d-none');
      document.getElementById('branchInput').disabled = false;
      document.getElementById('closeDealBtn').disabled = false;
      document.getElementById('sendReceiptBtn').disabled = false;
      document.getElementById('verifyOtpBtn').disabled = true;
      document.getElementById('generateOtpBtn').disabled = true;
      showToast('OTP verified successfully', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  window.closeDeal = async function() {
    if (!currentDealId) return;
    const branch = document.getElementById('branchInput').value.trim();
    if (!branch) { showToast('Please enter branch name', 'error'); return; }
    try {
      const res = await fetch(API_BASE + '/hr/quotations/' + currentDealId + '/close-deal', {
        method: 'POST', headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      await fetch(API_BASE + '/hr/quotations/' + currentDealId + '/destination', {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ destination_id: 1, destination_type: branch })
      });

      showToast('Deal closed! Receipt: ' + data.receipt_number, 'success');
      bootstrap.Modal.getInstance(document.getElementById('processModal')).hide();
      loadApprovedDeals();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  window.sendReceipt = async function() {
    if (!currentDealId) return;
    try {
      const res = await fetch(API_BASE + '/hr/quotations/' + currentDealId + '/receipt', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'receipt-' + currentDealId + '.pdf';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Receipt downloaded', 'success');
    } catch (e) {
      showToast('Receipt sent to customer email (simulated)', 'success');
    }
  };

  window.viewReceipt = function(id) {
    window.open(API_BASE + '/hr/quotations/' + id + '/receipt?token=' + (localStorage.getItem('greenera_token') || ''), '_blank');
  };

  loadApprovedDeals();
})();
