(function() {
  const user = checkAuth();
  if (!user) return;
  if (user.role !== 'hr' && user.role !== 'admin') { window.location.href = '../dashboard.html'; return; }

  document.getElementById('userName').textContent = user.full_name || user.username;
  const urlParams = new URLSearchParams(window.location.search);
  const assessmentId = urlParams.get('id');

  if (!assessmentId) {
    document.getElementById('quotationContent').innerHTML = '<div class="alert alert-danger">No quotation ID provided</div>';
    return;
  }

  let quotation = null;

  async function loadQuotation() {
    try {
      const res = await fetch(API_BASE + '/hr/quotations/' + assessmentId, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      quotation = data.quotation;
      renderQuotation();
      loadDealGroup();
    } catch (e) {
      document.getElementById('quotationContent').innerHTML = '<div class="alert alert-danger">Failed to load quotation. <a href="pending.html">Go back</a></div>';
    }
  }

  let siblingAssessments = [];

  async function loadDealGroup() {
    if (!quotation.deal_group_id) return;
    try {
      const res = await fetch(API_BASE + '/hr/deal-group/' + quotation.deal_group_id, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      siblingAssessments = (data.assessments || []).filter(a => a.id !== quotation.id);
      if (siblingAssessments.length) renderDealGroupSection();
    } catch (e) { /* ignore */ }
  }

  function productLabel(a) {
    if (a.product_catalog?.name) return a.product_catalog.name;
    if (a.brand && a.model) return `${a.brand} ${a.model}`;
    if (a.brand) return a.brand;
    if (a.product_category) return a.product_category;
    return '-';
  }

  function renderDealGroupSection() {
    const sidebar = document.getElementById('quotationContent').querySelector('.col-lg-4');
    if (!sidebar) return;
    const dealGroupHtml = document.createElement('div');
    dealGroupHtml.className = 'chart-container mt-4';
    dealGroupHtml.innerHTML = `
      <h6 class="mb-3"><i class="bi bi-layers text-green me-2"></i>Other Products in this Deal</h6>
      ${siblingAssessments.map(a => `
        <div class="d-flex justify-content-between align-items-center py-2 border-bottom small">
          <div>
            <strong>${productLabel(a)}</strong><br>
            <span class="text-muted">${a.brand || '-'} ${a.model || ''} | ${a.condition || '-'}</span>
          </div>
          <div class="text-end">
            <span class="fw-bold text-green">₹${(a.value_estimate || 0).toLocaleString('en-IN')}</span><br>
            <a href="review.html?id=${a.id}" class="btn btn-sm btn-outline-green mt-1"><i class="bi bi-eye"></i></a>
          </div>
        </div>
      `).join('')}`;
    sidebar.appendChild(dealGroupHtml);
  }

  function renderQuotation() {
    const q = quotation;
    const valMin = q.value_min || Math.round((q.value_estimate || 0) * 0.7);
    const valMax = q.value_max || Math.round((q.value_estimate || 0) * 1.3);

    const statusBadge = {
      'pending_hr_approval': '<span class="status-badge pending">Pending HR Approval</span>',
      'hr_approved': '<span class="status-badge completed">Approved</span>',
      'hr_rejected': '<span class="status-badge rejected">Rejected</span>',
    }[q.status] || `<span class="status-badge">${q.status}</span>`;

    const imagesHtml = q.assessment_images && q.assessment_images.length
      ? q.assessment_images.map(img => `<img src="/uploads/assessments/${img.filename}" class="img-thumbnail" style="height:120px;object-fit:cover" alt="Product image">`).join('')
      : '<p class="text-muted small">No images uploaded</p>';

    document.getElementById('quotationContent').innerHTML = `
      <div class="row g-4">
        <div class="col-lg-8">
          <div class="chart-container">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="mb-0"><i class="bi bi-person text-green me-2"></i>Customer Information</h6>
              ${statusBadge}
            </div>
            <div class="row g-3">
              <div class="col-sm-6"><strong>Name:</strong> ${q.customer_name || '-'}</div>
              <div class="col-sm-6"><strong>Phone:</strong> ${q.customer_phone || '-'}</div>
              <div class="col-sm-6"><strong>Email:</strong> ${q.customer_email || '-'}</div>
              <div class="col-sm-6"><strong>Address:</strong> ${q.customer_address || '-'}</div>
              <div class="col-sm-6"><strong>State:</strong> ${q.customer_state || '-'}</div>
              <div class="col-sm-6"><strong>District:</strong> ${q.customer_district || '-'}</div>
              <div class="col-sm-6"><strong>Pincode:</strong> ${q.customer_pincode || '-'}</div>
              <div class="col-sm-6"><strong>Ward:</strong> ${q.customer_ward_number || '-'}</div>
            </div>
          </div>

          <div class="chart-container mt-4">
            <h6 class="mb-3"><i class="bi bi-box text-green me-2"></i>Product Details</h6>
            <div class="row g-3">
              <div class="col-sm-4"><strong>Type:</strong> ${q.product_catalog?.name || (q.brand && q.model ? `${q.brand} ${q.model}` : q.brand || q.product_category || '-')}</div>
              <div class="col-sm-4"><strong>Brand:</strong> ${q.brand || '-'}</div>
              <div class="col-sm-4"><strong>Model:</strong> ${q.model || '-'}</div>
              <div class="col-sm-4"><strong>Year:</strong> ${q.year_of_manufacture || '-'}</div>
              <div class="col-sm-4"><strong>Condition:</strong> ${q.condition || '-'}</div>
              <div class="col-sm-4"><strong>Weight:</strong> ${q.weight_kg || 0} kg</div>
              <div class="col-sm-4"><strong>Serial #:</strong> ${q.serial_number || '-'}</div>
              <div class="col-sm-4"><strong>Warranty:</strong> ${q.warranty_status || '-'}</div>
              <div class="col-sm-4"><strong>Ownership:</strong> ${q.ownership_type || '-'}</div>
            </div>
            ${q.notes ? `<div class="mt-2"><strong>Notes:</strong> ${q.notes}</div>` : ''}
          </div>

          <div class="chart-container mt-4">
            <h6 class="mb-3"><i class="bi bi-images text-green me-2"></i>Product Images</h6>
            <div class="d-flex flex-wrap gap-2">${imagesHtml}</div>
          </div>

          ${q.assessment_detail ? `
          <div class="chart-container mt-4">
            <h6 class="mb-3"><i class="bi bi-question-circle text-green me-2"></i>Questionnaire Answers</h6>
            <div class="row g-2">
              ${Object.entries(q.assessment_detail.verification_answers || {}).map(([k,v]) =>
                `<div class="col-sm-6"><small><strong>${k}:</strong> ${v}</small></div>`
              ).join('')}
              ${q.assessment_detail.functional_status ? `
              <div class="col-12"><hr></div>
              <div class="col-12"><small><strong>Functional Status:</strong></small></div>
              ${Object.entries(q.assessment_detail.functional_status).map(([k,v]) =>
                `<div class="col-sm-6"><small>${k}: ${v ? '✓' : '✗'}</small></div>`
              ).join('')}` : ''}
            </div>
          </div>` : ''}

          ${q.ai_score ? `
          <div class="chart-container mt-4">
            <h6 class="mb-3"><i class="bi bi-robot text-green me-2"></i>AI Analysis</h6>
            <div class="row g-3">
              <div class="col-sm-4"><strong>AI Score:</strong> ${q.ai_score}/100</div>
              <div class="col-sm-4"><strong>Classification:</strong> ${q.classification || '-'}</div>
            </div>
          </div>` : ''}
        </div>

        <div class="col-lg-4">
          <div class="chart-container">
            <h6 class="mb-3"><i class="bi bi-currency-rupee text-green me-2"></i>Valuation Summary</h6>
            <div class="valuation-summary">
              <div class="d-flex justify-content-between py-2 border-bottom"><span>AI Value Range</span><span class="fw-bold">₹${valMin.toLocaleString('en-IN')} - ₹${valMax.toLocaleString('en-IN')}</span></div>
              <div class="d-flex justify-content-between py-2 border-bottom"><span>Estimated Value</span><span class="fw-bold">₹${(q.value_estimate || 0).toLocaleString('en-IN')}</span></div>
              <div class="d-flex justify-content-between py-2 border-bottom"><span>Customer Expected</span><span class="fw-bold text-info">₹${(q.customer_expected_value || 0).toLocaleString('en-IN')}</span></div>
              ${q.hr_approved_value ? `<div class="d-flex justify-content-between py-2 border-bottom"><span>HR Approved</span><span class="fw-bold text-success">₹${q.hr_approved_value.toLocaleString('en-IN')}</span></div>` : ''}
              ${q.hr_rejection_reason ? `<div class="d-flex justify-content-between py-2"><span>Rejection Reason</span><span class="fw-bold text-danger">${q.hr_rejection_reason}</span></div>` : ''}
            </div>
          </div>

          <div class="chart-container mt-4">
            <h6 class="mb-3"><i class="bi bi-person-badge text-green me-2"></i>Staff & Branch</h6>
            <div class="d-flex justify-content-between py-2 border-bottom"><span>Staff</span><span>${q.user?.full_name || '-'}</span></div>
            <div class="d-flex justify-content-between py-2"><span>Branch</span><span>${q.destination?.name || 'Not assigned'}</span></div>
          </div>

          ${q.deal_number ? `
          <div class="chart-container mt-4">
            <h6 class="mb-3"><i class="bi bi-receipt text-green me-2"></i>Deal Info</h6>
            <div class="d-flex justify-content-between py-1 border-bottom small"><span>Deal #</span><span class="fw-bold">${q.deal_number}</span></div>
            <div class="d-flex justify-content-between py-1 border-bottom small"><span>Receipt #</span><span class="fw-bold">${q.receipt_number}</span></div>
            <div class="d-flex justify-content-between py-1 small"><span>Collection #</span><span class="fw-bold">${q.collection_number}</span></div>
          </div>` : ''}

          ${q.status === 'pending_hr_approval' ? `
          <div class="chart-container mt-4">
            <h6 class="mb-3"><i class="bi bi-shield-check text-green me-2"></i>HR Actions</h6>
            <div class="d-grid gap-2">
              <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#approveModal"><i class="bi bi-check-lg me-1"></i> Approve Quotation</button>
              <button class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#rejectModal"><i class="bi bi-x-lg me-1"></i> Reject Quotation</button>
            </div>
          </div>` : ''}

          ${q.status === 'hr_approved' && !q.otp_verified ? `
          <div class="chart-container mt-4">
            <h6 class="mb-3"><i class="bi bi-shield-lock text-green me-2"></i>Customer Verification</h6>
            <button class="btn btn-primary-green w-100" data-bs-toggle="modal" data-bs-target="#otpModal"><i class="bi bi-send me-1"></i> Generate & Verify OTP</button>
          </div>` : ''}

          ${q.status === 'hr_approved' && q.otp_verified && !q.deal_number ? `
          <div class="chart-container mt-4">
            <h6 class="mb-3"><i class="bi bi-check2-all text-green me-2"></i>Deal Closure</h6>
            <button class="btn btn-success w-100" data-bs-toggle="modal" data-bs-target="#closeDealModal"><i class="bi bi-flag me-1"></i> Close Deal</button>
          </div>` : ''}
        </div>
      </div>
    `;

    setupApproveModal(q, valMin, valMax);
    setupRejectModal(q);
    setupOTPModal(q);
    setupDealModal(q);
  }

  function setupApproveModal(q, valMin, valMax) {
    document.getElementById('approveValueRange').textContent = `₹${valMin.toLocaleString('en-IN')} - ₹${valMax.toLocaleString('en-IN')}`;
    document.getElementById('approveCustomerExpected').textContent = `₹${(q.customer_expected_value || 0).toLocaleString('en-IN')}`;
    document.getElementById('approveValue').value = q.customer_expected_value || q.value_estimate || '';

    document.getElementById('confirmApproveBtn').onclick = async function() {
      const value = document.getElementById('approveValue').value;
      if (!value) { showToast('Please enter an approved value', 'error'); return; }
      try {
        const res = await fetch(API_BASE + '/hr/quotations/' + q.id + '/approve', {
          method: 'POST', headers: getAuthHeaders(),
          body: JSON.stringify({ approved_value: parseFloat(value) })
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
        showToast('Quotation approved successfully!', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } catch (e) {
        showToast(e.message, 'error');
      }
    };
  }

  function setupRejectModal(q) {
    document.getElementById('confirmRejectBtn').onclick = async function() {
      const reason = document.getElementById('rejectReason').value;
      if (!reason) { showToast('Please provide a rejection reason', 'error'); return; }
      try {
        const res = await fetch(API_BASE + '/hr/quotations/' + q.id + '/reject', {
          method: 'POST', headers: getAuthHeaders(),
          body: JSON.stringify({ reason })
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
        showToast('Quotation rejected', 'info');
        setTimeout(() => window.location.reload(), 1000);
      } catch (e) {
        showToast(e.message, 'error');
      }
    };
  }

  let currentOtp = '';

  function setupOTPModal(q) {
    document.getElementById('generateOtpBtn').onclick = async function() {
      try {
        const res = await fetch(API_BASE + '/hr/quotations/' + q.id + '/generate-otp', {
          method: 'POST', headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
        const data = await res.json();
        currentOtp = data.otp;
        document.getElementById('otpStatus').innerHTML = '<span class="text-success">OTP generated and sent!</span>';
        showToast('OTP sent to customer', 'success');
      } catch (e) {
        document.getElementById('otpStatus').innerHTML = '<span class="text-danger">' + e.message + '</span>';
      }
    };

    document.getElementById('verifyOtpBtn').onclick = async function() {
      const otp = document.getElementById('otpInput').value;
      if (!otp) { showToast('Enter the OTP', 'error'); return; }
      try {
        const res = await fetch(API_BASE + '/hr/quotations/' + q.id + '/verify-otp', {
          method: 'POST', headers: getAuthHeaders(),
          body: JSON.stringify({ otp })
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Invalid OTP');
        document.getElementById('otpStatus').innerHTML = '<span class="text-success fw-bold">OTP Verified! Customer confirmed.</span>';
        showToast('OTP verified successfully!', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } catch (e) {
        document.getElementById('otpStatus').innerHTML = '<span class="text-danger">' + e.message + '</span>';
      }
    };
  }

  function setupDealModal(q) {
    document.getElementById('confirmDealBtn').onclick = async function() {
      try {
        const res = await fetch(API_BASE + '/hr/quotations/' + q.id + '/close-deal', {
          method: 'POST', headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
        const data = await res.json();
        document.getElementById('dealNum').textContent = data.deal_number;
        document.getElementById('receiptNum').textContent = data.receipt_number;
        document.getElementById('collNum').textContent = data.collection_number;
        document.getElementById('dealResult').classList.remove('d-none');
        document.getElementById('confirmDealBtn').disabled = true;
        showToast('Deal closed! Receipt generated.', 'success');
        setTimeout(() => window.location.reload(), 2000);
      } catch (e) {
        showToast(e.message, 'error');
      }
    };
  }

  loadQuotation();
})();
