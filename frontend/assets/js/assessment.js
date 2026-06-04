(function () {
  const user = checkAuth();
  if (user) document.getElementById('userName').textContent = user.full_name || user.username;

  let currentStep = 1;
  const totalSteps = 8;
  let uploadedFiles = [];
  let assessmentData = {
    customerName: '', customerEmail: '', customerPhone: '', customerAddress: '',
    productType: '', productBrand: '', productModel: '', productYear: '',
    productCondition: 'good', productWeight: 0, productNotes: '',
    images: [], aiResult: null, extractedBrand: '', extractedModel: '',
    verifiedCondition: 'good', verificationChecks: {}, verificationNotes: ''
  };
  let assessmentId = null;

  const yearSelect = document.getElementById('productYear');
  if (yearSelect) {
    for (let y = 2026; y >= 1990; y--) {
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      yearSelect.appendChild(opt);
    }
  }

  window.navigateStep = function (dir) {
    if (dir === 1 && !validateStep(currentStep)) return;
    const newStep = currentStep + dir;
    if (newStep < 1 || newStep > totalSteps) return;
    saveStepData(currentStep);
    if (newStep === 4) runAIAnalysis();
    if (newStep === 5) populateProductDetails();
    if (newStep === 6) renderVerificationQuestions();
    if (newStep === 7) calculateValue();
    if (newStep === 8) buildSummary();
    currentStep = newStep;
    updateUI();
  };

  function validateStep(step) {
    switch (step) {
      case 1:
        if (!document.getElementById('custName').value.trim()) { showToast('Please enter customer name', 'error'); return false; }
        return true;
      case 2:
        if (!assessmentData.productType) { showToast('Please select a product type', 'error'); return false; }
        return true;
      default: return true;
    }
  }

  function saveStepData(step) {
    if (step === 1) {
      assessmentData.customerName = document.getElementById('custName').value.trim();
      assessmentData.customerEmail = document.getElementById('custEmail').value.trim();
      assessmentData.customerPhone = document.getElementById('custPhone').value.trim();
      assessmentData.customerAddress = document.getElementById('custAddress').value.trim();
    }
    if (step === 5) {
      assessmentData.productBrand = document.getElementById('productBrand').value.trim();
      assessmentData.productModel = document.getElementById('productModel').value.trim();
      assessmentData.productYear = document.getElementById('productYear').value;
      assessmentData.productCondition = document.getElementById('productCondition').value;
      assessmentData.productWeight = parseFloat(document.getElementById('productWeight').value) || 0;
      assessmentData.productNotes = document.getElementById('productNotes').value.trim();
    }
    if (step === 6) {
      const container = document.getElementById('verificationQuestions');
      if (container) {
        const checks = {};
        container.querySelectorAll('input[type="checkbox"]').forEach(cb => { checks[cb.id.replace('vchk_', '')] = cb.checked; });
        assessmentData.verificationChecks = checks;
        const notes = container.querySelector('#verificationNotes');
        assessmentData.verificationNotes = notes ? notes.value.trim() : '';
      }
    }
  }

  function updateUI() {
    document.querySelectorAll('.wizard-step').forEach(el => {
      const step = parseInt(el.dataset.step);
      el.classList.remove('active', 'completed');
      if (step === currentStep) el.classList.add('active');
      else if (step < currentStep) el.classList.add('completed');
    });
    document.querySelectorAll('.wizard-step-content').forEach(el => {
      el.classList.toggle('d-none', parseInt(el.dataset.step) !== currentStep);
    });
    document.getElementById('stepIndicator').textContent = `Step ${currentStep} of ${totalSteps}`;
    document.getElementById('prevBtn').disabled = currentStep === 1;
    const isLastStep = currentStep === totalSteps;
    document.getElementById('nextBtn').classList.toggle('d-none', isLastStep);
    document.getElementById('submitBtn').classList.toggle('d-none', !isLastStep);
  }

  document.querySelectorAll('.product-type-item').forEach(el => {
    el.addEventListener('click', function () {
      document.querySelectorAll('.product-type-item').forEach(i => i.classList.remove('selected'));
      this.classList.add('selected');
      assessmentData.productType = this.dataset.type;
    });
  });

  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const previewContainer = document.getElementById('uploadPreview');

  if (uploadArea && fileInput) {
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.style.borderColor = '#16A34A'; uploadArea.style.background = '#F0FFF4'; });
    uploadArea.addEventListener('dragleave', () => { uploadArea.style.borderColor = '#D1D5DB'; uploadArea.style.background = 'transparent'; });
    uploadArea.addEventListener('drop', (e) => { e.preventDefault(); uploadArea.style.borderColor = '#D1D5DB'; uploadArea.style.background = 'transparent'; handleFiles(e.dataTransfer.files); });
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));
  }

  function handleFiles(files) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) { showToast('File too large (max 5MB)', 'error'); continue; }
      uploadedFiles.push(file);
      assessmentData.images.push(file);
      const reader = new FileReader();
      reader.onload = function (e) {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.innerHTML = `<img src="${e.target.result}"><button class="remove-btn" onclick="removeImage(${uploadedFiles.length - 1})">&times;</button>`;
        if (previewContainer) previewContainer.appendChild(previewItem);
      };
      reader.readAsDataURL(file);
    }
    if (files.length > 0) {
      const el = document.querySelector('.upload-area small');
      if (el) el.textContent = `${uploadedFiles.length} file(s) selected`;
    }
  }

  window.removeImage = function (index) {
    uploadedFiles.splice(index, 1);
    assessmentData.images.splice(index, 1);
    if (previewContainer) previewContainer.innerHTML = '';
    uploadedFiles.forEach((f, i) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `<img src="${e.target.result}"><button class="remove-btn" onclick="removeImage(${i})">&times;</button>`;
        if (previewContainer) previewContainer.appendChild(div);
      };
      reader.readAsDataURL(f);
    });
    const small = document.querySelector('.upload-area small');
    if (small) small.textContent = uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s) selected` : 'Supported: JPG, PNG, WebP (Max 5MB each)';
  };

  async function runAIAnalysis() {
    const type = assessmentData.productType || 'Unknown';
    try {
      const res = await fetch(API_BASE + '/assessments/ai-analyze', {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ product_type: type })
      });
      const data = await res.json();
      if (data.analysis) {
        assessmentData.aiResult = data.analysis;
        assessmentData.extractedBrand = data.analysis.brand || '';
        assessmentData.extractedModel = data.analysis.model || '';
        document.getElementById('aiExtractedBrand').textContent = data.analysis.brand || 'Not detected';
        document.getElementById('aiExtractedModel').textContent = data.analysis.model || 'Not detected';
        document.getElementById('aiProductType').textContent = data.analysis.product_type || type;
        document.getElementById('aiConditionScore').textContent = (data.analysis.condition_score || 'N/A') + '/100';
        document.getElementById('aiCategory').textContent = data.analysis.category || 'N/A';
        document.getElementById('aiRecyclability').textContent = data.analysis.recyclability || 'N/A';
        document.getElementById('aiDataRisk').textContent = data.analysis.data_risk || 'N/A';
        if (data.analysis.brand) showToast('AI analysis complete', 'success');
        return;
      }
    } catch (e) {}
    document.getElementById('aiExtractedBrand').textContent = 'AI unavailable';
    document.getElementById('aiExtractedModel').textContent = 'AI unavailable';
    document.getElementById('aiProductType').textContent = type;
    document.getElementById('aiConditionScore').textContent = 'N/A';
    document.getElementById('aiCategory').textContent = 'N/A';
    document.getElementById('aiRecyclability').textContent = 'N/A';
    document.getElementById('aiDataRisk').textContent = 'N/A';
  }

  function populateProductDetails() {
    if (assessmentData.extractedBrand && !document.getElementById('productBrand').value) {
      document.getElementById('productBrand').value = assessmentData.extractedBrand;
      const bb = document.getElementById('brandBadge');
      if (bb) bb.style.display = 'inline-block';
    }
    if (assessmentData.extractedModel && !document.getElementById('productModel').value) {
      document.getElementById('productModel').value = assessmentData.extractedModel;
      const mb = document.getElementById('modelBadge');
      if (mb) mb.style.display = 'inline-block';
    }
  }

  document.addEventListener('input', function (e) {
    if (e.target.id === 'productBrand' || e.target.id === 'productModel') {
      e.target.dataset.userEdited = 'true';
    }
  });

  function renderVerificationQuestions() {
    const container = document.getElementById('verificationQuestions');
    if (!container) return;
    const html = '<div class="col-12"><p class="text-muted">Verify the product condition manually</p></div>' +
      '<div class="col-md-6"><div class="form-floating mb-3"><select class="form-select" id="verifiedCondition">' +
      '<option value="excellent">Excellent</option><option value="good" selected>Good</option>' +
      '<option value="fair">Fair</option><option value="poor">Poor</option><option value="damaged">Damaged</option>' +
      '</select><label for="verifiedCondition">Verified Condition</label></div></div>' +
      '<div class="col-12"><div class="form-floating"><textarea class="form-control" id="verificationNotes" placeholder="Notes" style="height: 80px">' +
      (assessmentData.verificationNotes || '') +
      '</textarea><label for="verificationNotes">Verification Notes</label></div></div>';
    container.innerHTML = html;
  }

  function calculateValue() {
    document.getElementById('basePrice').textContent = 'Calculating...';
    document.getElementById('conditionMultiplier').textContent = '-';
    document.getElementById('weightAdjustment').textContent = '-';
    document.getElementById('marketFactor').textContent = '-';
    document.getElementById('estimatedValue').textContent = 'Pending';
    showToast('Value will be calculated on submission', 'info');
    assessmentData.estimatedValue = 0;
  }

  function buildSummary() {
    document.getElementById('summaryName').textContent = assessmentData.customerName || '-';
    document.getElementById('summaryPhone').textContent = assessmentData.customerPhone || '-';
    document.getElementById('summaryProduct').textContent = assessmentData.productType || '-';
    document.getElementById('summaryBrandModel').textContent = (assessmentData.productBrand || '-') + ' / ' + (assessmentData.productModel || '-');
    document.getElementById('summaryCondition').textContent = assessmentData.productCondition || '-';
    document.getElementById('summaryValue').textContent = 'Pending submission';
  }

  window.resetWizard = function (silent) {
    if (!silent && !confirm('Cancel this assessment?')) return;
    currentStep = 1; assessmentId = null;
    assessmentData = { customerName: '', customerEmail: '', customerPhone: '', customerAddress: '', productType: '', productBrand: '', productModel: '', productYear: '', productCondition: 'good', productWeight: 0, productNotes: '', images: [], aiResult: null, extractedBrand: '', extractedModel: '', verifiedCondition: 'good', verificationChecks: {}, verificationNotes: '' };
    uploadedFiles = [];
    document.querySelectorAll('.product-type-item').forEach(i => i.classList.remove('selected'));
    document.querySelectorAll('input, textarea, select').forEach(el => { if (el.id && el.type !== 'hidden') el.value = ''; });
    const bb = document.getElementById('brandBadge'), mb = document.getElementById('modelBadge');
    if (bb) bb.style.display = 'none'; if (mb) mb.style.display = 'none';
    if (previewContainer) previewContainer.innerHTML = '';
    const small = document.querySelector('.upload-area small');
    if (small) small.textContent = 'Supported: JPG, PNG, WebP (Max 5MB each)';
    if (yearSelect) yearSelect.value = '';
    updateUI();
    window.scrollTo(0, 0);
  };

  window.submitAssessment = async function () {
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Submitting...';

    try {
      const body = {
        customer_name: assessmentData.customerName,
        customer_email: assessmentData.customerEmail,
        customer_phone: assessmentData.customerPhone,
        customer_address: assessmentData.customerAddress,
        brand: assessmentData.productBrand,
        model: assessmentData.productModel,
        condition: assessmentData.productCondition || 'good',
        weight_kg: assessmentData.productWeight || 1,
        notes: assessmentData.productNotes,
        status: 'completed',
      };

      const prodMap = { 'TV':1,'AC':2,'Fridge':3,'Washing Machine':4,'Fan':5,'Laptop':6,'Mobile':7,'Monitor':8,'Keyboard':9,'Mouse':10 };
      body.product_type_id = prodMap[assessmentData.productType] || null;

      const res = await fetch(API_BASE + '/assessments', {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Submission failed');
      const data = await res.json();
      assessmentId = data.assessment.id;

      const submitRes = await fetch(API_BASE + '/assessments/' + assessmentId + '/submit', {
        method: 'POST', headers: getAuthHeaders()
      });
      const submitData = await submitRes.json();

      showToast('Assessment submitted! Value: \u20B9' + (submitData.valuation?.estimated_value || data.assessment.value_estimate || 0), 'success');
      setTimeout(function () { window.location.href = 'assessment-history.html'; }, 1000);
    } catch (err) {
      showToast(err.message || 'Submission failed', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>Submit Assessment';
    }
  };

  updateUI();
})();
