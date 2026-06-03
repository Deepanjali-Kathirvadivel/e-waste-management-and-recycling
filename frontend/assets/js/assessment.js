(function () {
  const user = checkAuth();
  if (user) document.getElementById('userName').textContent = user.full_name || user.username;

  // ─── Wizard State ───
  let currentStep = 1;
  const totalSteps = 8;
  let uploadedFiles = [];
  let assessmentData = {
    customerName: '', customerEmail: '', customerPhone: '', customerAddress: '',
    productType: '', productBrand: '', productModel: '', productYear: '',
    productCondition: 'good', productWeight: 0, productNotes: '',
    images: [],
    aiResult: null,
    extractedBrand: '',
    extractedModel: '',
    verifiedCondition: 'good',
    verificationChecks: {},
    verificationNotes: ''
  };

  const basePrices = {
    'TV': 25000, 'AC': 41500, 'Fridge': 33000, 'Washing Machine': 29000,
    'Fan': 4100, 'Laptop': 20000, 'Mobile': 12500, 'Monitor': 8300,
    'Keyboard': 1700, 'Mouse': 1200
  };
  const conditionMultipliers = {
    'excellent': 1.5, 'good': 1.0, 'fair': 0.6, 'poor': 0.3, 'not-working': 0.1
  };

  // ─── Product-specific verification questions ───
  const verificationQuestions = {
    'TV': [
      { id: 'v_tv_screen', label: 'Screen intact — no cracks or dead pixels', phys: true },
      { id: 'v_tv_bezel', label: 'Bezel / frame undamaged', phys: true },
      { id: 'v_tv_stand', label: 'Stand / mount present and stable', phys: true },
      { id: 'v_tv_remote', label: 'Remote control included' },
      { id: 'v_tv_ports', label: 'All ports (HDMI, USB, AV) functional' },
      { id: 'v_tv_power', label: 'Powers on and displays image', func: true },
      { id: 'v_tv_speakers', label: 'Built-in speakers work', func: true },
      { id: 'v_tv_smart', label: 'Smart features / OS responsive', func: true }
    ],
    'AC': [
      { id: 'v_ac_casing', label: 'Outer casing intact', phys: true },
      { id: 'v_ac_filter', label: 'Air filter clean and present', phys: true },
      { id: 'v_ac_fan', label: 'Fan blades undamaged', phys: true },
      { id: 'v_ac_remote', label: 'Remote control included' },
      { id: 'v_ac_power', label: 'Powers on and starts cooling', func: true },
      { id: 'v_ac_compressor', label: 'Compressor runs without unusual noise', func: true },
      { id: 'v_ac_ventilation', label: 'Ventilation / airflow strong', func: true },
      { id: 'v_ac_timer', label: 'Timer / mode settings work', func: true }
    ],
    'Fridge': [
      { id: 'v_fr_casing', label: 'Outer body and door intact', phys: true },
      { id: 'v_fr_seal', label: 'Door seal / gasket airtight', phys: true },
      { id: 'v_fr_shelves', label: 'Shelves and drawers present', phys: true },
      { id: 'v_fr_handles', label: 'Door handles intact', phys: true },
      { id: 'v_fr_cooling', label: 'Cools to set temperature', func: true },
      { id: 'v_fr_freezer', label: 'Freezer compartment freezes', func: true },
      { id: 'v_fr_noise', label: 'Compressor runs quietly', func: true },
      { id: 'v_fr_light', label: 'Interior light works', func: true }
    ],
    'Washing Machine': [
      { id: 'v_wm_drum', label: 'Drum free of dents / damage', phys: true },
      { id: 'v_wm_door', label: 'Door / lid seal intact', phys: true },
      { id: 'v_wm_hose', label: 'Inlet / drain hose present', phys: true },
      { id: 'v_wm_controls', label: 'Control panel / knobs intact', phys: true },
      { id: 'v_wm_spin', label: 'Spin cycle works', func: true },
      { id: 'v_wm_fill', label: 'Fills and drains water', func: true },
      { id: 'v_wm_balance', label: 'No excessive vibration during cycle', func: true },
      { id: 'v_wm_programs', label: 'All wash programs selectable', func: true }
    ],
    'Fan': [
      { id: 'v_fn_blades', label: 'Blades intact and balanced', phys: true },
      { id: 'v_fn_guard', label: 'Blade guard / cage present', phys: true },
      { id: 'v_fn_stand', label: 'Stand / base stable', phys: true },
      { id: 'v_fn_cord', label: 'Power cord undamaged', phys: true },
      { id: 'v_fn_motor', label: 'Motor runs smoothly', func: true },
      { id: 'v_fn_speed', label: 'All speed settings work', func: true },
      { id: 'v_fn_oscillation', label: 'Oscillation function works', func: true },
      { id: 'v_fn_noise', label: 'Quiet operation', func: true }
    ],
    'Laptop': [
      { id: 'v_lp_lid', label: 'Lid / hinge intact', phys: true },
      { id: 'v_lp_keyboard', label: 'Keyboard — all keys present', phys: true },
      { id: 'v_lp_trackpad', label: 'Trackpad undamaged', phys: true },
      { id: 'v_lp_ports', label: 'Ports (USB, HDMI, charging) intact', phys: true },
      { id: 'v_lp_screen', label: 'Display — no cracks / dead pixels', func: true },
      { id: 'v_lp_battery', label: 'Battery charges and holds charge', func: true },
      { id: 'v_lp_boot', label: 'Boots to OS', func: true },
      { id: 'v_lp_wifi', label: 'Wi-Fi / Bluetooth functional', func: true }
    ],
    'Mobile': [
      { id: 'v_mb_screen', label: 'Screen — no cracks / deep scratches', phys: true },
      { id: 'v_mb_back', label: 'Back casing / glass intact', phys: true },
      { id: 'v_mb_buttons', label: 'Buttons (power, volume) click', phys: true },
      { id: 'v_mb_port', label: 'Charging port clean and intact', phys: true },
      { id: 'v_mb_display', label: 'Display touch and colors accurate', func: true },
      { id: 'v_mb_battery', label: 'Battery ≥ 80% capacity', func: true },
      { id: 'v_mb_camera', label: 'Camera lens clear, photos sharp', func: true },
      { id: 'v_mb_sensors', label: 'Fingerprint / face unlock works', func: true }
    ],
    'Monitor': [
      { id: 'v_mn_panel', label: 'Panel — no cracks or scratches', phys: true },
      { id: 'v_mn_bezel', label: 'Bezel intact', phys: true },
      { id: 'v_mn_stand', label: 'Stand present and adjustable', phys: true },
      { id: 'v_mn_ports', label: 'Ports (DisplayPort, HDMI, VGA) intact', phys: true },
      { id: 'v_mn_display', label: 'Displays image with no artifacts', func: true },
      { id: 'v_mn_brightness', label: 'Brightness / contrast adjustable', func: true },
      { id: 'v_mn_pixels', label: 'No stuck / dead pixels', func: true },
      { id: 'v_mn_speakers', label: 'Built-in speakers work (if present)', func: true }
    ],
    'Keyboard': [
      { id: 'v_kb_keys', label: 'All keycaps present', phys: true },
      { id: 'v_kb_frame', label: 'Frame / casing undamaged', phys: true },
      { id: 'v_kb_cable', label: 'Cable / wireless dongle present', phys: true },
      { id: 'v_kb_legs', label: 'Flip-out legs intact', phys: true },
      { id: 'v_kb_typing', label: 'All keys register on press', func: true },
      { id: 'v_kb_backlight', label: 'Backlight works (if applicable)', func: true },
      { id: 'v_kb_connection', label: 'Wired / wireless connection stable', func: true },
      { id: 'v_kb_media', label: 'Media / function keys work', func: true }
    ],
    'Mouse': [
      { id: 'v_ms_casing', label: 'Casing intact — no cracks', phys: true },
      { id: 'v_ms_buttons', label: 'All buttons click', phys: true },
      { id: 'v_ms_scroll', label: 'Scroll wheel spins freely', phys: true },
      { id: 'v_ms_cable', label: 'Cable / receiver present', phys: true },
      { id: 'v_ms_cursor', label: 'Cursor moves smoothly', func: true },
      { id: 'v_ms_click', label: 'Left / right click register', func: true },
      { id: 'v_ms_dpi', label: 'DPI adjustment works', func: true },
      { id: 'v_ms_battery', label: 'Battery compartment clean (wireless)', func: true }
    ]
  };

  // ─── Simulated OCR brand/model lookup ───
  const brandHints = {
    'TV': ['Samsung', 'LG', 'Sony', 'TCL', 'Hisense', 'Panasonic', 'Vizio'],
    'AC': ['Daikin', 'LG', 'Samsung', 'Voltas', 'Carrier', 'Hitachi', 'Blue Star'],
    'Fridge': ['Whirlpool', 'LG', 'Samsung', 'Godrej', 'Bosch', 'Haier', 'Panasonic'],
    'Washing Machine': ['Samsung', 'LG', 'Whirlpool', 'Bosch', 'IFB', 'Panasonic', 'Haier'],
    'Fan': ['Crompton', 'Havells', 'Usha', 'Orient', 'Bajaj', 'Atomberg'],
    'Laptop': ['Dell', 'HP', 'Lenovo', 'Apple', 'ASUS', 'Acer', 'Microsoft'],
    'Mobile': ['Samsung', 'Apple', 'OnePlus', 'Xiaomi', 'Google', 'Vivo', 'Oppo'],
    'Monitor': ['Dell', 'HP', 'LG', 'Samsung', 'ASUS', 'Acer', 'BenQ'],
    'Keyboard': ['Logitech', 'Razer', 'Corsair', 'HP', 'Dell', 'Cooler Master'],
    'Mouse': ['Logitech', 'Razer', 'HP', 'Dell', 'Corsair', 'SteelSeries']
  };
  const modelExamples = {
    'TV': ['QLED Q60', 'OLED C3', 'X90L', 'U6H', '4-Series'],
    'AC': ['FTKM Series', 'Split 1.5T', 'Wind-Free', 'Inverter 1.5T'],
    'Fridge': ['Double Door', 'Side-by-Side', 'French Door', 'Single Door'],
    'Washing Machine': ['Front Load 7kg', 'Top Load 6.5kg', 'Semi-Auto 8kg'],
    'Fan': ['Superfan', 'Neo Series', 'Aeris', 'High-Speed'],
    'Laptop': ['ThinkPad X1', 'Spectre x360', 'MacBook Pro', 'ZenBook 14'],
    'Mobile': ['Galaxy S24', 'iPhone 16', '12R', 'Pixel 9'],
    'Monitor': ['UltraSharp 27', 'ProArt 27', '27GL850', 'ROG Swift'],
    'Keyboard': ['G915', 'Huntsman', 'K120', 'K70'],
    'Mouse': ['G502', 'DeathAdder', 'MS116', 'M720']
  };

  // ─── Populate Year Dropdown ───
  const yearSelect = document.getElementById('productYear');
  if (yearSelect) {
    for (let y = 2026; y >= 1990; y--) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      yearSelect.appendChild(opt);
    }
  }

  // ─── Navigate Steps ───
  window.navigateStep = function (dir) {
    if (dir === 1 && !validateStep(currentStep)) return;
    const newStep = currentStep + dir;
    if (newStep < 1 || newStep > totalSteps) return;

    saveStepData(currentStep);

    if (newStep === 4) runAIAnalysis();       // AI step — extract brand/model + analyze
    if (newStep === 5) populateProductDetails(); // Details step — pre-fill from AI
    if (newStep === 6) renderVerificationQuestions();
    if (newStep === 7) calculateValue();
    if (newStep === 8) buildSummary();

    currentStep = newStep;
    updateUI();
  };

  // ─── Validation ───
  function validateStep(step) {
    switch (step) {
      case 1: {
        const name = document.getElementById('custName').value.trim();
        const phone = document.getElementById('custPhone').value.trim();
        if (!name) { showToast('Please enter customer name', 'error'); return false; }
        if (!phone) { showToast('Please enter phone number', 'error'); return false; }
        return true;
      }
      case 2: {
        if (!assessmentData.productType) { showToast('Please select a product type', 'error'); return false; }
        return true;
      }
      case 4: return true; // AI Analysis auto-validates
      case 6: {
        saveVerificationChecks();
        return true;
      }
      default: return true;
    }
  }

  // ─── Save Step Data ───
  function saveStepData(step) {
    switch (step) {
      case 1:
        assessmentData.customerName = document.getElementById('custName').value.trim();
        assessmentData.customerEmail = document.getElementById('custEmail').value.trim();
        assessmentData.customerPhone = document.getElementById('custPhone').value.trim();
        assessmentData.customerAddress = document.getElementById('custAddress').value.trim();
        break;
      case 5:
        assessmentData.productBrand = document.getElementById('productBrand').value.trim();
        assessmentData.productModel = document.getElementById('productModel').value.trim();
        assessmentData.productYear = document.getElementById('productYear').value;
        assessmentData.productCondition = document.getElementById('productCondition').value;
        assessmentData.productWeight = parseFloat(document.getElementById('productWeight').value) || 0;
        assessmentData.productNotes = document.getElementById('productNotes').value.trim();
        break;
      case 6:
        saveVerificationChecks();
        assessmentData.verifiedCondition = document.getElementById('verifiedCondition').value;
        break;
    }
  }

  function saveVerificationChecks() {
    const container = document.getElementById('verificationQuestions');
    if (!container) return;
    const checks = {};
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      checks[cb.id.replace('vchk_', '')] = cb.checked;
    });
    const notes = container.querySelector('#verificationNotes');
    assessmentData.verificationChecks = checks;
    assessmentData.verificationNotes = notes ? notes.value.trim() : '';
  }

  // ─── Update UI ───
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

  // ─── Product Type Selection ───
  document.querySelectorAll('.product-type-item').forEach(el => {
    el.addEventListener('click', function () {
      document.querySelectorAll('.product-type-item').forEach(i => i.classList.remove('selected'));
      this.classList.add('selected');
      assessmentData.productType = this.dataset.type;
    });
  });

  // ─── Image Upload ───
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const previewContainer = document.getElementById('uploadPreview');

  if (uploadArea && fileInput) {
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#16A34A';
      uploadArea.style.background = '#F0FFF4';
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = '#D1D5DB';
      uploadArea.style.background = 'transparent';
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#D1D5DB';
      uploadArea.style.background = 'transparent';
      handleFiles(e.dataTransfer.files);
    });
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
        previewItem.innerHTML = `
          <img src="${e.target.result}" alt="Preview">
          <button class="remove-btn" onclick="removeImage(${uploadedFiles.length - 1})">&times;</button>
        `;
        if (previewContainer) previewContainer.appendChild(previewItem);
      };
      reader.readAsDataURL(file);
    }
    if (files.length > 0) {
      document.querySelector('.upload-area small').textContent = `${uploadedFiles.length} file(s) selected`;
    }
  }

  window.removeImage = function (index) {
    uploadedFiles.splice(index, 1);
    assessmentData.images.splice(index, 1);
    rebuildPreviews();
    const small = document.querySelector('.upload-area small');
    if (small) small.textContent = uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s) selected` : 'Supported: JPG, PNG, WebP (Max 5MB each)';
  };

  function rebuildPreviews() {
    if (!previewContainer) return;
    previewContainer.innerHTML = '';
    uploadedFiles.forEach((f, i) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `<img src="${e.target.result}"><button class="remove-btn" onclick="removeImage(${i})">&times;</button>`;
        previewContainer.appendChild(div);
      };
      reader.readAsDataURL(f);
    });
  }

  // ─── OCR-like extraction: runs when entering Step 4 ───
  function extractBrandModelFromImages() {
    const type = assessmentData.productType;
    if (!type) { return null; }

    const brands = brandHints[type] || [];
    const models = modelExamples[type] || [];
    let detectedBrand = '';
    let detectedModel = '';

    for (const file of uploadedFiles) {
      const name = file.name.toLowerCase();
      for (const brand of brands) {
        if (name.includes(brand.toLowerCase())) {
          detectedBrand = brand;
          break;
        }
      }
      if (detectedBrand) break;
    }

    if (detectedBrand && models.length > 0) {
      detectedModel = models[Math.floor(Math.random() * models.length)];
    } else if (models.length > 0 && uploadedFiles.length > 0) {
      detectedModel = models[0];
    }

    assessmentData.extractedBrand = detectedBrand;
    assessmentData.extractedModel = detectedModel;
    return { brand: detectedBrand, model: detectedModel };
  }

  // ─── AI Analysis (runs when entering Step 4) ───
  function runAIAnalysis() {
    const type = assessmentData.productType || 'Unknown';
    const condition = assessmentData.productCondition || 'good';
    const conditionScores = { excellent: 92, good: 78, fair: 55, poor: 32, 'not-working': 10 };
    const score = conditionScores[condition] || 70;
    const recyclabilityMap = { excellent: 'High', good: 'High', fair: 'Medium', poor: 'Medium', 'not-working': 'Low' };
    const dataRiskMap = { excellent: 'Low', good: 'Low', fair: 'Medium', poor: 'High', 'not-working': 'High' };

    // Extract brand/model from images
    const extracted = extractBrandModelFromImages();

    assessmentData.aiResult = {
      productType: type,
      conditionScore: `${score}/100`,
      category: ['Mobile', 'Laptop'].includes(type) ? 'Consumer Electronics' : 'Home Appliance',
      recyclability: recyclabilityMap[condition] || 'Medium',
      dataRisk: dataRiskMap[condition] || 'Medium'
    };

    // Populate AI analysis step display
    const brand = extracted && extracted.brand ? extracted.brand : 'Not detected';
    const model = extracted && extracted.model ? extracted.model : 'Not detected';
    document.getElementById('aiExtractedBrand').textContent = brand;
    document.getElementById('aiExtractedModel').textContent = model;
    document.getElementById('aiProductType').textContent = assessmentData.aiResult.productType;
    document.getElementById('aiConditionScore').textContent = assessmentData.aiResult.conditionScore;
    document.getElementById('aiCategory').textContent = assessmentData.aiResult.category;
    document.getElementById('aiRecyclability').textContent = assessmentData.aiResult.recyclability;
    document.getElementById('aiDataRisk').textContent = assessmentData.aiResult.dataRisk;

    if (extracted && (extracted.brand || extracted.model)) {
      showToast(`AI extracted: ${extracted.brand || '?'} / ${extracted.model || '?'}`, 'info');
    } else if (uploadedFiles.length > 0) {
      showToast('Could not detect brand/model from images. Edit manually in the next step.', 'warning');
    }
  }

  // ─── Populate Step 5 details from AI extraction ───
  function populateProductDetails() {
    const brandInput = document.getElementById('productBrand');
    const modelInput = document.getElementById('productModel');
    const brandBadge = document.getElementById('brandBadge');
    const modelBadge = document.getElementById('modelBadge');

    // Only pre-fill if user hasn't manually edited
    if (!brandInput.dataset.userEdited && assessmentData.extractedBrand && !brandInput.value) {
      brandInput.value = assessmentData.extractedBrand;
      brandInput.dataset.extracted = 'true';
      if (brandBadge) brandBadge.style.display = 'inline-block';
    }
    if (!modelInput.dataset.userEdited && assessmentData.extractedModel && !modelInput.value) {
      modelInput.value = assessmentData.extractedModel;
      modelInput.dataset.extracted = 'true';
      if (modelBadge) modelBadge.style.display = 'inline-block';
    }

    // Show badges if values were extracted
    if (brandBadge && brandInput.value && brandInput.dataset.extracted) {
      brandBadge.style.display = 'inline-block';
    }
    if (modelBadge && modelInput.value && modelInput.dataset.extracted) {
      modelBadge.style.display = 'inline-block';
    }
  }

  // Track manual edits on brand/model
  document.addEventListener('input', function (e) {
    if (e.target.id === 'productBrand' || e.target.id === 'productModel') {
      e.target.dataset.userEdited = 'true';
    }
  });

  // ─── Render Dynamic Verification Questions (Step 6) ───
  function renderVerificationQuestions() {
    const container = document.getElementById('verificationQuestions');
    if (!container) return;
    const type = assessmentData.productType;
    const questions = verificationQuestions[type] || verificationQuestions['Laptop'];
    container.innerHTML = '';

    const physQs = questions.filter(q => q.phys);
    const funcQs = questions.filter(q => q.func);
    const otherQs = questions.filter(q => !q.phys && !q.func);

    let html = '<div class="col-md-6"><label class="fw-semibold mb-2"><i class="bi bi-box me-1 text-green"></i> Physical Condition</label>';
    physQs.concat(otherQs).forEach(q => {
      const checked = assessmentData.verificationChecks[q.id] !== false ? 'checked' : '';
      html += `<div class="form-check mb-2"><input class="form-check-input" type="checkbox" id="vchk_${q.id}" ${checked}><label class="form-check-label" for="vchk_${q.id}">${q.label}</label></div>`;
    });
    html += '</div><div class="col-md-6"><label class="fw-semibold mb-2"><i class="bi bi-gear me-1 text-green"></i> Functional Check</label>';
    funcQs.forEach(q => {
      const checked = assessmentData.verificationChecks[q.id] !== false ? 'checked' : '';
      html += `<div class="form-check mb-2"><input class="form-check-input" type="checkbox" id="vchk_${q.id}" ${checked}><label class="form-check-label" for="vchk_${q.id}">${q.label}</label></div>`;
    });
    html += `</div>
      <div class="col-12 mt-3"><div class="form-floating"><select class="form-select" id="verifiedCondition">
        <option value="excellent" ${assessmentData.verifiedCondition === 'excellent' ? 'selected' : ''}>Excellent</option>
        <option value="good" ${assessmentData.verifiedCondition === 'good' ? 'selected' : ''}>Good</option>
        <option value="fair" ${assessmentData.verifiedCondition === 'fair' ? 'selected' : ''}>Fair</option>
        <option value="poor" ${assessmentData.verifiedCondition === 'poor' ? 'selected' : ''}>Poor</option>
        <option value="not-working" ${assessmentData.verifiedCondition === 'not-working' ? 'selected' : ''}>Not Working</option>
      </select><label for="verifiedCondition">Verified Condition</label></div></div>
      <div class="col-12"><div class="form-floating">
        <textarea class="form-control" id="verificationNotes" placeholder="Notes" style="height: 80px">${assessmentData.verificationNotes || ''}</textarea>
        <label for="verificationNotes">Verification Notes</label>
      </div></div>`;
    container.innerHTML = html;
  }

  // ─── Value Calculation (Step 7) ───
  function calculateValue() {
    const type = assessmentData.productType;
    const condition = document.getElementById('verifiedCondition') ? document.getElementById('verifiedCondition').value : assessmentData.productCondition;
    const weight = assessmentData.productWeight || 1;
    const basePrice = basePrices[type] || 8300;
    const multiplier = conditionMultipliers[condition] || 1.0;
    const weightAdj = Math.round(weight * 415);
    const marketFactor = 1.0;
    const estimatedValue = Math.round((basePrice * multiplier + weightAdj) * marketFactor);
    document.getElementById('basePrice').textContent = `₹${basePrice.toFixed(2)}`;
    document.getElementById('conditionMultiplier').textContent = `${multiplier}x`;
    document.getElementById('weightAdjustment').textContent = `₹${weightAdj.toFixed(2)}`;
    document.getElementById('marketFactor').textContent = `${marketFactor}x`;
    document.getElementById('estimatedValue').textContent = `₹${estimatedValue.toFixed(2)}`;
    assessmentData.estimatedValue = estimatedValue;
  }

  // ─── Build Summary (Step 8) ───
  function buildSummary() {
    const v = assessmentData.estimatedValue || 0;
    document.getElementById('summaryName').textContent = assessmentData.customerName || '-';
    document.getElementById('summaryPhone').textContent = assessmentData.customerPhone || '-';
    document.getElementById('summaryProduct').textContent = assessmentData.productType || '-';
    document.getElementById('summaryBrandModel').textContent = `${assessmentData.productBrand || '-'} / ${assessmentData.productModel || '-'}`;
    document.getElementById('summaryCondition').textContent = (assessmentData.verifiedCondition || assessmentData.productCondition || '-').replace('-', ' ');
    const summary = document.getElementById('summaryValue');
    summary.textContent = `₹${v.toFixed(2)}`;
  }

  // ─── Reset Wizard ───
  window.resetWizard = function (silent) {
    if (!silent && !confirm('Cancel this assessment? All data will be lost.')) return;
    currentStep = 1;
    assessmentData = {
      customerName: '', customerEmail: '', customerPhone: '', customerAddress: '',
      productType: '', productBrand: '', productModel: '', productYear: '',
      productCondition: 'good', productWeight: 0, productNotes: '',
      images: [], aiResult: null,
      extractedBrand: '', extractedModel: '',
      verifiedCondition: 'good', verificationChecks: {}, verificationNotes: ''
    };
    uploadedFiles = [];
    document.querySelectorAll('.product-type-item').forEach(i => i.classList.remove('selected'));
    document.querySelectorAll('input, textarea, select').forEach(el => {
      if (el.id && el.type !== 'hidden') el.value = '';
    });
    // Hide AI badges
    const bb = document.getElementById('brandBadge');
    const mb = document.getElementById('modelBadge');
    if (bb) bb.style.display = 'none';
    if (mb) mb.style.display = 'none';
    if (previewContainer) previewContainer.innerHTML = '';
    const small = document.querySelector('.upload-area small');
    if (small) small.textContent = 'Supported: JPG, PNG, WebP (Max 5MB each)';
    if (yearSelect) yearSelect.value = '';
    updateUI();
    window.scrollTo(0, 0);
  };

  // ─── Submit Assessment ───
  window.submitAssessment = function () {
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Submitting...';

    const payload = {
      customer: {
        name: assessmentData.customerName,
        email: assessmentData.customerEmail,
        phone: assessmentData.customerPhone,
        address: assessmentData.customerAddress
      },
      product: {
        type: assessmentData.productType,
        brand: assessmentData.productBrand,
        model: assessmentData.productModel,
        year: assessmentData.productYear,
        condition: assessmentData.productCondition,
        weight: assessmentData.productWeight,
        notes: assessmentData.productNotes
      },
      images: uploadedFiles.length,
      aiExtraction: { brand: assessmentData.extractedBrand, model: assessmentData.extractedModel },
      aiAnalysis: assessmentData.aiResult,
      verification: {
        checks: assessmentData.verificationChecks,
        verifiedCondition: assessmentData.verifiedCondition,
        notes: assessmentData.verificationNotes
      },
      estimatedValue: assessmentData.estimatedValue
    };

    console.log('Assessment Payload:', payload);

    // Save to localStorage so assessment-history.html can see it
    const stored = JSON.parse(localStorage.getItem('greenEra_assessments') || '[]');
    payload.id = 'AST-' + (1000 + stored.length + 1);
    payload.date = new Date().toISOString().slice(0, 10);
    payload.customerName = payload.customer.name;
    payload.productName = payload.product.type;
    payload.brand = payload.product.brand;
    payload.condition = payload.product.condition;
    payload.status = 'completed';
    stored.unshift(payload);
    localStorage.setItem('greenEra_assessments', JSON.stringify(stored));

    setTimeout(() => {
      showToast(`Assessment submitted! Value: ₹${assessmentData.estimatedValue}`, 'success');
      setTimeout(function () { window.location.href = 'assessment-history.html'; }, 800);
    }, 1200);
  };

  // ─── Init ───
  updateUI();
})();
