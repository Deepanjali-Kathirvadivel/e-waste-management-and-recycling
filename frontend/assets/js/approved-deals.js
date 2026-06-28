(function() {
  const user = checkAuth();
  if (!user) return;
  if (user.role !== 'employee' && user.role !== 'admin') { window.location.href = '../dashboard.html'; return; }
  document.getElementById('userName').textContent = user.full_name || user.username;

  let approvedDeals = [];
  let currentPage = 1;
  const rowsPerPage = 10;
  let currentGroupKey = null;
  let currentGroupItems = [];
  let facilities = [];

  async function loadFacilities() {
    try {
      const res = await fetch(API_BASE + '/employee/facilities', { headers: getAuthHeaders() });
      const data = await res.json();
      facilities = data.facilities || [];
      const sel = document.getElementById('facilitySelect');
      sel.innerHTML = '<option value="" selected disabled>Select branch / facility</option>';
      facilities.forEach(f => {
        sel.innerHTML += `<option value="${f.id}">${f.name}${f.location ? ' - ' + f.location : ''}</option>`;
      });
    } catch (e) { console.warn('Failed to load facilities'); }
  }

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
          <td>${allClosed ? '<span class="text-muted small">Closed</span>' : `<button class="btn btn-sm btn-outline-green" onclick="event.stopPropagation(); openProcessModal('${g.dealGroupId || ''}',${g.items[0].id})"><i class="bi bi-gear"></i> Process</button>`}</td>
        </tr>
        <tr class="group-detail d-none" id="${gid}">
          <td colspan="8" class="p-0">
            <table class="table table-sm mb-0 bg-light">
              <thead><tr><th>#ID</th><th>Product</th><th>Brand</th><th>Value</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>${g.items.map(a => `
                <tr>
                  <td>${a.id}</td>
                  <td>${a.product_catalog?.name || a.brand || '-'}</td>
                  <td>${a.brand || '-'} ${a.model || ''}</td>
                  <td>\u20B9${(Number(a.hr_approved_value || a.value_estimate || 0)).toLocaleString('en-IN')}</td>
                  <td><span class="status-badge ${a.deal_number ? 'completed' : 'approved'}">${a.deal_number ? 'Closed' : 'Approved'}</span></td>
                  <td>${a.deal_number
                    ? `<button class="btn btn-sm btn-outline-secondary" onclick="event.stopPropagation(); viewReceipt(${a.id})" title="View Receipt"><i class="bi bi-receipt"></i></button>`
                    : `<button class="btn btn-sm btn-outline-green" onclick="event.stopPropagation(); openProcessModal('${g.dealGroupId || ''}',${a.id})"><i class="bi bi-gear"></i></button>`
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

  function renderGroupProducts() {
    const tbody = document.getElementById('groupProductsBody');
    if (!currentGroupItems.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-muted text-center py-2">No products</td></tr>';
      return;
    }
    tbody.innerHTML = currentGroupItems.map((a, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${a.product_catalog?.name || a.brand || '-'}</td>
        <td>${a.brand || '-'} ${a.model || ''}</td>
        <td>\u20B9${(Number(a.hr_approved_value || a.value_estimate || 0)).toLocaleString('en-IN')}</td>
        <td><span class="badge ${a.otp_verified ? 'bg-success' : a.otp_code ? 'bg-warning text-dark' : 'bg-secondary'}">${a.otp_verified ? 'Verified' : a.otp_code ? 'OTP Sent' : 'Pending'}</span></td>
        <td><span class="status-badge ${a.deal_number ? 'completed' : 'approved'}">${a.deal_number ? 'Closed' : 'Open'}</span></td>
      </tr>
    `).join('');
  }

  async function loadGroupProducts() {
    if (!currentGroupKey) return;
    try {
      const res = await fetch(API_BASE + '/employee/deal-group/' + encodeURIComponent(currentGroupKey), { headers: getAuthHeaders() });
      const data = await res.json();
      currentGroupItems = data.assessments || [];
    } catch (e) {
      currentGroupItems = [];
    }
    if (!currentGroupItems.length) {
      currentGroupItems = approvedDeals.filter(a => buildGroupKey(a) === currentGroupKey);
    }
    renderGroupProducts();
    updateModalButtons();
  }

  function updateModalButtons() {
    const hasUnclosed = currentGroupItems.some(a => !a.deal_number);
    const allVerified = currentGroupItems.filter(a => !a.deal_number).every(a => a.otp_verified);
    const hasOtpSent = currentGroupItems.filter(a => !a.deal_number).some(a => a.otp_code && !a.otp_verified);
    const facility = document.getElementById('facilitySelect').value;

    document.getElementById('generateOtpBtn').disabled = !hasUnclosed || (currentGroupItems.filter(a => !a.deal_number).every(a => a.otp_verified));
    document.getElementById('verifyOtpBtn').disabled = !hasUnclosed || !hasOtpSent;
    document.getElementById('facilitySelect').disabled = !hasUnclosed || !allVerified;
    document.getElementById('closeDealBtn').disabled = !hasUnclosed || !allVerified || !facility;

    if (allVerified && hasUnclosed) {
      document.getElementById('otpVerified').classList.remove('d-none');
    } else {
      document.getElementById('otpVerified').classList.add('d-none');
    }
  }

  window.openProcessModal = async function(dealGroupId, firstId) {
    const deal = approvedDeals.find(a => a.id === firstId);
    if (!deal) return;
    currentGroupKey = dealGroupId || buildGroupKey(deal);

    document.getElementById('dealInfo').innerHTML = `
      <strong>${deal.customer_name || '-'}</strong><br>
      <span class="text-muted">${deal.customer_phone || ''}${deal.customer_email ? ' | ' + deal.customer_email : ''}</span>
      ${deal.deal_group_id ? `<br><span class="text-muted small">Group: ${deal.deal_group_id}</span>` : ''}`;

    document.getElementById('otpDisplay').classList.add('d-none');
    document.getElementById('otpVerified').classList.add('d-none');
    document.getElementById('otpCode').textContent = '';
    document.getElementById('otpInput').value = '';
    document.getElementById('facilitySelect').value = '';

    document.getElementById('generateOtpBtn').disabled = true;
    document.getElementById('verifyOtpBtn').disabled = true;
    document.getElementById('facilitySelect').disabled = true;
    document.getElementById('closeDealBtn').disabled = true;

    await loadGroupProducts();
    await loadFacilities();

    const modal = new bootstrap.Modal(document.getElementById('processModal'));
    modal.show();
  };

  window.generateGroupOTP = async function() {
    const unverified = currentGroupItems.filter(a => !a.deal_number && !a.otp_verified);
    if (!unverified.length) { showToast('All products already verified', 'info'); return; }

    try {
      const ids = unverified.map(a => a.id);
      const res = await fetch(API_BASE + '/employee/batch-generate-otp', {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ ids })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      unverified.forEach(a => { a.otp_code = data.otp; });

      document.getElementById('otpCode').textContent = data.otp;
      document.getElementById('otpDisplay').classList.remove('d-none');
      renderGroupProducts();
      updateModalButtons();
      showToast('OTP generated for ' + unverified.length + ' product(s)', 'success');
    } catch (e) {
      showToast('Failed to generate OTP: ' + e.message, 'error');
    }
  };

  window.verifyGroupOTP = async function() {
    const otp = document.getElementById('otpInput').value.trim();
    if (!otp || otp.length !== 6) { showToast('Enter 6-digit OTP', 'error'); return; }

    const pending = currentGroupItems.filter(a => !a.deal_number && a.otp_code && !a.otp_verified);
    if (!pending.length) { showToast('No pending OTP verifications', 'info'); return; }

    let verified = 0;
    for (const item of pending) {
      try {
        const res = await fetch(API_BASE + '/employee/quotations/' + item.id + '/verify-otp', {
          method: 'POST', headers: getAuthHeaders(),
          body: JSON.stringify({ otp })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid');
        item.otp_verified = true;
        verified++;
      } catch (e) {
        // try next
      }
    }

    if (verified > 0) {
      document.getElementById('otpVerified').classList.remove('d-none');
      renderGroupProducts();
      updateModalButtons();
      showToast(verified + ' product(s) verified', 'success');
    } else {
      showToast('OTP verification failed for all products', 'error');
    }
  };

  window.closeGroupDeal = async function() {
    const facilityId = document.getElementById('facilitySelect').value;
    if (!facilityId) { showToast('Please select a branch', 'error'); return; }

    const pending = currentGroupItems.filter(a => !a.deal_number);
    if (!pending.length) { showToast('All products already closed', 'info'); return; }

    const notVerified = pending.filter(a => !a.otp_verified);
    if (notVerified.length) { showToast(notVerified.length + ' product(s) not verified', 'error'); return; }

    try {
      let result;
      const hasRealGroupId = currentGroupItems.some(a => a.deal_group_id === currentGroupKey);
      if (hasRealGroupId) {
        const res = await fetch(API_BASE + '/employee/batch-close-deal', {
          method: 'POST', headers: getAuthHeaders(),
          body: JSON.stringify({ deal_group_id: currentGroupKey })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        result = data;
      } else {
        let closed = [];
        for (const item of pending) {
          const res = await fetch(API_BASE + '/employee/quotations/' + item.id + '/close-deal', {
            method: 'POST', headers: getAuthHeaders()
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed');
          closed.push(data);
        }
        result = { message: closed.length + ' product(s) closed', deals: closed };
      }

      if (facilityId) {
        for (const item of pending) {
          try {
            await fetch(API_BASE + '/employee/quotations/' + item.id + '/destination', {
              method: 'POST', headers: getAuthHeaders(),
              body: JSON.stringify({ facility_id: parseInt(facilityId) })
            });
          } catch (e) { /* non-critical */ }
        }
      }

      showToast(result.message, 'success');
      bootstrap.Modal.getInstance(document.getElementById('processModal')).hide();
      loadApprovedDeals();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  window.viewReceipt = function(id) {
    window.open(API_BASE + '/employee/quotations/' + id + '/receipt?token=' + (localStorage.getItem('greenera_token') || ''), '_blank');
  };

  loadFacilities();
  loadApprovedDeals();
})();
