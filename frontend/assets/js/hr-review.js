(function() {
  const user = checkAuth();
  if (!user) return;
  if (user.role !== 'manager' && user.role !== 'admin') { window.location.href = '../dashboard.html'; return; }

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
    } catch (e) {
      document.getElementById('quotationContent').innerHTML = '<div class="alert alert-danger">Failed to load quotation. <a href="pending.html">Go back</a></div>';
    }
  }

  let siblingAssessments = [];

  function renderQuotation() {
    const q = quotation;
    const valMin = q.value_min || Math.round((q.value_estimate || 0) * 0.7);
    const valMax = q.value_max || Math.round((q.value_estimate || 0) * 1.3);

    const statusBadge = {
      'pending_manager_review': '<span class="status-badge pending">Pending Manager Review</span>',
      'approved': '<span class="status-badge completed">Approved</span>',
      'rejected': '<span class="status-badge rejected">Rejected</span>',
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
              ${q.hr_approved_value ? `<div class="d-flex justify-content-between py-2 border-bottom"><span>Manager Approved</span><span class="fw-bold text-success">₹${q.hr_approved_value.toLocaleString('en-IN')}</span></div>` : ''}
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

          ${q.status === 'pending_manager_review' ? `
          <div class="chart-container mt-4">
            <h6 class="mb-3"><i class="bi bi-shield-check text-green me-2"></i>Manager Actions</h6>
            <div class="d-grid gap-2">
              <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#approveModal"><i class="bi bi-check-lg me-1"></i> Approve Quotation</button>
              <button class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#rejectModal"><i class="bi bi-x-lg me-1"></i> Reject Quotation</button>
            </div>
          </div>` : ''}

          ${q.status === 'approved' ? `
          <div class="chart-container mt-4">
            <h6 class="mb-3"><i class="bi bi-info-circle text-green me-2"></i>Status</h6>
            <p class="text-muted small mb-0">This quotation has been approved. OTP verification and deal closing will be handled by the employee.</p>
          </div>` : ''}
        </div>
      </div>
    `;

    setupApproveModal(q, valMin, valMax);
    setupRejectModal(q);
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

  loadQuotation();
})();
