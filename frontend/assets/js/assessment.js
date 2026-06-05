(function () {
  const user = checkAuth();
  if (user) document.getElementById('userName').textContent = user.full_name || user.username;

  let currentStep = 1;
  const totalSteps = 9;
  let uploadedFiles = [];
  let assessmentData = {
    customerName: '', customerEmail: '', customerPhone: '', customerAddress: '',
    productType: '', productBrand: '', productModel: '', productYear: '',
    productCondition: 'good', productWeight: 0, productNotes: '',
    images: [], aiResult: null, extractedBrand: '', extractedModel: '',
    verifiedCondition: 'good', verificationChecks: {}, verificationNotes: '',
    qPowerOn: 'yes', qDamage: 'none', qAge: 'new', qAccessories: 'all',
    productSpecificChecks: {}
  };
  let assessmentId = null;

  const productSpecificChecks = {
    'Fan': {
      physical: [
        { id: 'blades_intact', label: 'Blades intact and balanced' },
        { id: 'guard_present', label: 'Blade guard / cage present' },
        { id: 'base_stable', label: 'Stand / base stable' },
        { id: 'cord_undamaged', label: 'Power cord undamaged' }
      ],
      functional: [
        { id: 'motor_smooth', label: 'Motor runs smoothly' },
        { id: 'speeds_work', label: 'All speed settings work' },
        { id: 'oscillation_works', label: 'Oscillation function works' },
        { id: 'quiet_operation', label: 'Quiet operation' }
      ]
    },
    'TV': {
      physical: [
        { id: 'screen_intact', label: 'Screen intact without scratches/cracks' },
        { id: 'casing_intact', label: 'Casing / bezel undamaged' },
        { id: 'stand_stable', label: 'Stand / mount sturdy and stable' },
        { id: 'ports_clean', label: 'All ports (HDMI/USB/AV) clean and intact' }
      ],
      functional: [
        { id: 'display_clear', label: 'Display turns on with clear picture' },
        { id: 'sound_clear', label: 'Sound is clear and speakers functional' },
        { id: 'remote_works', label: 'Remote control operational' },
        { id: 'menu_responsive', label: 'Menu navigation responsive' }
      ]
    },
    'AC': {
      physical: [
        { id: 'filters_clean', label: 'Filters and grill clean' },
        { id: 'casing_intact', label: 'Casing intact and rust-free' },
        { id: 'fins_undamaged', label: 'Fins undamaged' },
        { id: 'plug_secure', label: 'Power connection / plug secure' }
      ],
      functional: [
        { id: 'compressor_cools', label: 'Compressor starts and cools effectively' },
        { id: 'speeds_work', label: 'Fan speed controls functional' },
        { id: 'remote_works', label: 'Remote control receiver operational' },
        { id: 'quiet_operation', label: 'Quiet operation (low vibration/noise)' }
      ]
    },
    'Fridge': {
      physical: [
        { id: 'door_seals', label: 'Door gaskets / seals intact and clean' },
        { id: 'shelves_complete', label: 'Shelves, drawers, and racks complete' },
        { id: 'casing_intact', label: 'Casing undamaged without major rust' },
        { id: 'coils_clean', label: 'Condenser coils clean and intact' }
      ],
      functional: [
        { id: 'fridge_cools', label: 'Fridge cooling functional' },
        { id: 'freezer_freezes', label: 'Freezer freezing functional' },
        { id: 'thermostat_works', label: 'Thermostat control responsive' },
        { id: 'light_works', label: 'Interior light operational' }
      ]
    },
    'Washing Machine': {
      physical: [
        { id: 'drum_clean', label: 'Drum clean and rotates freely' },
        { id: 'hoses_intact', label: 'Hoses (inlet & drain) undamaged' },
        { id: 'lock_intact', label: 'Door / lid lock mechanism intact' },
        { id: 'body_rustfree', label: 'Exterior body rust-free' }
      ],
      functional: [
        { id: 'wash_runs', label: 'Wash cycle runs successfully' },
        { id: 'spin_smooth', label: 'Spin cycle operates smoothly' },
        { id: 'drain_works', label: 'Drain pump functions correctly' },
        { id: 'panel_responsive', label: 'Control panel / display fully responsive' }
      ]
    },
    'Laptop': {
      physical: [
        { id: 'hinges_sturdy', label: 'Hinges sturdy and open smoothly' },
        { id: 'keyboard_intact', label: 'Keyboard intact (no missing keys)' },
        { id: 'screen_scratchfree', label: 'Screen glass scratch / crack free' },
        { id: 'chassis_undamaged', label: 'Body chassis undamaged (no cracks)' }
      ],
      functional: [
        { id: 'boots_os', label: 'Boots successfully into Operating System' },
        { id: 'inputs_work', label: 'Keyboard keys and touchpad responsive' },
        { id: 'wifi_works', label: 'Wi-Fi and Bluetooth connect normally' },
        { id: 'battery_charges', label: 'Battery charges and holds power' }
      ]
    },
    'Mobile': {
      physical: [
        { id: 'screen_intact', label: 'Screen intact (no cracks or heavy scratches)' },
        { id: 'casing_undamaged', label: 'Back glass / casing undamaged' },
        { id: 'buttons_intact', label: 'Buttons (power/volume) clicky and intact' },
        { id: 'port_clean', label: 'Charging port clean and undamaged' }
      ],
      functional: [
        { id: 'touch_responsive', label: 'Touchscreen fully responsive' },
        { id: 'cameras_work', label: 'Cameras (front/rear) work correctly' },
        { id: 'audio_works', label: 'Speakers and microphone functional' },
        { id: 'charging_normal', label: 'Charging and battery level work normally' }
      ]
    },
    'Monitor': {
      physical: [
        { id: 'panel_undamaged', label: 'Display panel undamaged (no cracks)' },
        { id: 'stand_stable', label: 'Bezel / frame and stand stable' },
        { id: 'ports_clean', label: 'Cable ports (HDMI/DP/VGA) clean' },
        { id: 'buttons_intact', label: 'Power button and controls intact' }
      ],
      functional: [
        { id: 'display_ok', label: 'Screen powers on without lines/dead pixels' },
        { id: 'controls_work', label: 'Brightness / contrast controls functional' },
        { id: 'input_works', label: 'Input detection works normally' },
        { id: 'refresh_stable', label: 'Refresh rate stable' }
      ]
    },
    'Keyboard': {
      physical: [
        { id: 'keycaps_present', label: 'All keycaps present and secure' },
        { id: 'feet_intact', label: 'Keyboard frame / feet undamaged' },
        { id: 'cable_intact', label: 'Cable / connector undamaged' },
        { id: 'clean_chassis', label: 'Chassis clean of debris' }
      ],
      functional: [
        { id: 'keys_register', label: 'All keys register correctly' },
        { id: 'backlight_works', label: 'LED backlight working (if applicable)' },
        { id: 'media_works', label: 'Hotkeys / media keys functional' },
        { id: 'detects_ok', label: 'Connected device detects it immediately' }
      ]
    },
    'Mouse': {
      physical: [
        { id: 'casing_intact', label: 'Mouse casing intact' },
        { id: 'feet_present', label: 'Teflon feet / pads present on bottom' },
        { id: 'cable_intact', label: 'Cable / wireless receiver undamaged' },
        { id: 'wheel_clean', label: 'Scroll wheel intact and clean' }
      ],
      functional: [
        { id: 'clicks_work', label: 'Left and right click buttons functional' },
        { id: 'scroll_works', label: 'Scroll wheel scrolling / clicking works' },
        { id: 'sensor_smooth', label: 'Optical sensor tracking is smooth' },
        { id: 'dpi_works', label: 'DPI / side buttons function (if applicable)' }
      ]
    }
  };

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
    if (newStep === 4) renderProductSpecificQuestions();
    if (newStep === 5) runAIAnalysis();
    if (newStep === 6) populateProductDetails();
    if (newStep === 7) renderVerificationQuestions();
    if (newStep === 8) calculateValue();
    if (newStep === 9) buildSummary();
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

  function renderProductSpecificQuestions() {
    const container = document.getElementById('productSpecificQuestions');
    if (!container) return;
    const type = assessmentData.productType || 'Fan';
    const checks = productSpecificChecks[type] || productSpecificChecks['Fan'];
    
    let html = '';
    
    html += '<div class="col-12"><h6 class="fw-bold text-dark mb-2"><i class="bi bi-box-seam me-2 text-green"></i>Physical Condition</h6></div>';
    checks.physical.forEach(item => {
      const isChecked = assessmentData.productSpecificChecks && assessmentData.productSpecificChecks[item.id] !== false;
      html += `<div class="col-12"><div class="form-check"><input class="form-check-input" type="checkbox" id="sqchk_${item.id}" ${isChecked ? 'checked' : ''}><label class="form-check-label text-muted" for="sqchk_${item.id}">${item.label}</label></div></div>`;
    });
    
    html += '<div class="col-12 mt-3"><h6 class="fw-bold text-dark mb-2"><i class="bi bi-gear me-2 text-green"></i>Functional Check</h6></div>';
    checks.functional.forEach(item => {
      const isChecked = assessmentData.productSpecificChecks && assessmentData.productSpecificChecks[item.id] !== false;
      html += `<div class="col-12"><div class="form-check"><input class="form-check-input" type="checkbox" id="sqchk_${item.id}" ${isChecked ? 'checked' : ''}><label class="form-check-label text-muted" for="sqchk_${item.id}">${item.label}</label></div></div>`;
    });
    
    container.innerHTML = html;
  }

  function saveStepData(step) {
    if (step === 1) {
      assessmentData.customerName = document.getElementById('custName').value.trim();
      assessmentData.customerEmail = document.getElementById('custEmail').value.trim();
      assessmentData.customerPhone = document.getElementById('custPhone').value.trim();
      assessmentData.customerAddress = document.getElementById('custAddress').value.trim();
    }
    if (step === 4) {
      assessmentData.qPowerOn = document.getElementById('qPowerOn').value;
      assessmentData.qDamage = document.getElementById('qDamage').value;
      assessmentData.qAge = document.getElementById('qAge').value;
      assessmentData.qAccessories = document.getElementById('qAccessories').value;
      
      const specContainer = document.getElementById('productSpecificQuestions');
      if (specContainer) {
        const specChecks = {};
        specContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          specChecks[cb.id.replace('sqchk_', '')] = cb.checked;
        });
        assessmentData.productSpecificChecks = specChecks;
      }
    }
    if (step === 6) {
      assessmentData.productBrand = document.getElementById('productBrand').value.trim();
      assessmentData.productModel = document.getElementById('productModel').value.trim();
      assessmentData.productYear = document.getElementById('productYear').value;
      assessmentData.productCondition = document.getElementById('productCondition').value;
      assessmentData.productWeight = parseFloat(document.getElementById('productWeight').value) || 0;
      assessmentData.productNotes = document.getElementById('productNotes').value.trim();
    }
    if (step === 7) {
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
    const filename = uploadedFiles[0] ? uploadedFiles[0].name : '';
    try {
      const res = await fetch(API_BASE + '/assessments/ai-analyze', {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ product_type: type, filename: filename })
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

  let categoryCatalog = [];

  async function populateProductDetails() {
    const type = assessmentData.productType || 'Unknown';
    const brandSelect = document.getElementById('productBrand');
    const modelSelect = document.getElementById('productModel');
    
    brandSelect.innerHTML = '<option value="">Select Brand</option>';
    modelSelect.innerHTML = '<option value="">Select Model</option>';

    try {
      const res = await fetch(API_BASE + '/assessments/catalog/' + type, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to load catalog');
      const data = await res.json();
      categoryCatalog = data.catalog || [];

      // Extract unique brands
      const brands = [...new Set(categoryCatalog.map(item => item.company))].sort();
      brands.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b;
        opt.textContent = b;
        brandSelect.appendChild(opt);
      });

      if (!brandSelect.dataset.bound) {
        brandSelect.addEventListener('change', function() {
          const selectedBrand = this.value;
          modelSelect.innerHTML = '<option value="">Select Model</option>';
          const models = categoryCatalog.filter(item => item.company === selectedBrand).map(item => item.model).sort();
          models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            modelSelect.appendChild(opt);
          });
        });
        brandSelect.dataset.bound = 'true';
      }

      if (assessmentData.extractedBrand && assessmentData.extractedBrand !== 'N/A') {
        brandSelect.value = assessmentData.extractedBrand;
        const bb = document.getElementById('brandBadge');
        if (bb) bb.style.display = 'inline-block';
        
        brandSelect.dispatchEvent(new Event('change'));
        
        if (assessmentData.extractedModel && assessmentData.extractedModel !== 'N/A') {
          modelSelect.value = assessmentData.extractedModel;
          const mb = document.getElementById('modelBadge');
          if (mb) mb.style.display = 'inline-block';
        }
      }
    } catch (err) {
      showToast('Error loading product catalog', 'error');
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
    
    const type = assessmentData.productType || 'Fan';
    const checks = productSpecificChecks[type] || productSpecificChecks['Fan'];
    
    let html = '';
    
    // Left column: Physical Condition
    html += '<div class="col-md-6 mb-3">';
    html += '  <h6 class="fw-bold mb-3 text-dark d-flex align-items-center gap-2">';
    html += '    <i class="bi bi-box text-green"></i> Physical Condition';
    html += '  </h6>';
    html += '  <div class="space-y-2">';
    checks.physical.forEach(item => {
      let isChecked = true;
      if (assessmentData.verificationChecks && assessmentData.verificationChecks[item.id] !== undefined) {
        isChecked = assessmentData.verificationChecks[item.id];
      } else if (assessmentData.productSpecificChecks && assessmentData.productSpecificChecks[item.id] !== undefined) {
        isChecked = assessmentData.productSpecificChecks[item.id];
      }
      html += `    <div class="form-check mb-2">`;
      html += `      <input class="form-check-input" type="checkbox" id="vchk_${item.id}" ${isChecked ? 'checked' : ''}>`;
      html += `      <label class="form-check-label text-muted" for="vchk_${item.id}">${item.label}</label>`;
      html += `    </div>`;
    });
    html += '  </div>';
    html += '</div>';
    
    // Right column: Functional Check
    html += '<div class="col-md-6 mb-3">';
    html += '  <h6 class="fw-bold mb-3 text-dark d-flex align-items-center gap-2">';
    html += '    <i class="bi bi-gear text-green"></i> Functional Check';
    html += '  </h6>';
    html += '  <div class="space-y-2">';
    checks.functional.forEach(item => {
      let isChecked = true;
      if (assessmentData.verificationChecks && assessmentData.verificationChecks[item.id] !== undefined) {
        isChecked = assessmentData.verificationChecks[item.id];
      } else if (assessmentData.productSpecificChecks && assessmentData.productSpecificChecks[item.id] !== undefined) {
        isChecked = assessmentData.productSpecificChecks[item.id];
      }
      html += `    <div class="form-check mb-2">`;
      html += `      <input class="form-check-input" type="checkbox" id="vchk_${item.id}" ${isChecked ? 'checked' : ''}>`;
      html += `      <label class="form-check-label text-muted" for="vchk_${item.id}">${item.label}</label>`;
      html += `    </div>`;
    });
    html += '  </div>';
    html += '</div>';
    
    html += '<div class="col-md-6"><div class="form-floating mb-3"><select class="form-select" id="verifiedCondition">';
    html += '<option value="excellent">Excellent</option><option value="good" selected>Good</option>';
    html += '<option value="fair">Fair</option><option value="poor">Poor</option><option value="damaged">Damaged</option>';
    html += '</select><label for="verifiedCondition">Verified Condition</label></div></div>';
    
    html += '<div class="col-12"><div class="form-floating"><textarea class="form-control" id="verificationNotes" placeholder="Notes" style="height: 80px">';
    html += (assessmentData.verificationNotes || '') + '</textarea><label for="verificationNotes">Verification Notes</label></div></div>';
    
    container.innerHTML = html;
  }

  function calculateValue() {
    const baseMap = {
      'TV': 5000, 'AC': 8000, 'Fridge': 7000, 'Washing Machine': 4500,
      'Fan': 800, 'Laptop': 12000, 'Mobile': 5000, 'Monitor': 3000,
      'Keyboard': 300, 'Mouse': 150
    };
    const baseScrapMap = {
      'TV': 300, 'AC': 500, 'Fridge': 400, 'Washing Machine': 300,
      'Fan': 50, 'Laptop': 600, 'Mobile': 200, 'Monitor': 150,
      'Keyboard': 20, 'Mouse': 10
    };

    const matched = categoryCatalog.find(item => item.company === assessmentData.productBrand && item.model === assessmentData.productModel);
    
    const base = matched ? matched.rebuyValue : (baseMap[assessmentData.productType] || 3000);
    const scrap = matched ? matched.scrapValue : (baseScrapMap[assessmentData.productType] || 100);

    const powerMult = assessmentData.qPowerOn === 'yes' ? 1.0 : (assessmentData.qPowerOn === 'intermittent' ? 0.6 : 0.2);
    const damageMult = assessmentData.qDamage === 'none' ? 1.0 : (assessmentData.qDamage === 'scratches' ? 0.85 : (assessmentData.qDamage === 'cracks' ? 0.5 : 0.2));
    const ageMult = assessmentData.qAge === 'new' ? 1.0 : (assessmentData.qAge === 'medium' ? 0.85 : (assessmentData.qAge === 'old' ? 0.65 : 0.45));
    const accMult = assessmentData.qAccessories === 'all' ? 1.0 : (assessmentData.qAccessories === 'partial' ? 0.85 : 0.7);

    const type = assessmentData.productType || 'Fan';
    const checks = productSpecificChecks[type] || productSpecificChecks['Fan'];
    let totalChecks = checks.physical.length + checks.functional.length;
    let checkedCount = 0;

    checks.physical.forEach(item => {
      let isChecked = true;
      if (assessmentData.verificationChecks && assessmentData.verificationChecks[item.id] !== undefined) {
        isChecked = assessmentData.verificationChecks[item.id];
      } else if (assessmentData.productSpecificChecks && assessmentData.productSpecificChecks[item.id] !== undefined) {
        isChecked = assessmentData.productSpecificChecks[item.id];
      }
      if (isChecked) checkedCount++;
    });
    checks.functional.forEach(item => {
      let isChecked = true;
      if (assessmentData.verificationChecks && assessmentData.verificationChecks[item.id] !== undefined) {
        isChecked = assessmentData.verificationChecks[item.id];
      } else if (assessmentData.productSpecificChecks && assessmentData.productSpecificChecks[item.id] !== undefined) {
        isChecked = assessmentData.productSpecificChecks[item.id];
      }
      if (isChecked) checkedCount++;
    });

    const checklistFactor = totalChecks > 0 ? (0.7 + 0.3 * (checkedCount / totalChecks)) : 1.0;

    const cond = assessmentData.verifiedCondition || assessmentData.productCondition || 'good';
    const condMap = {
      excellent: 1.0,
      good: 0.85,
      fair: 0.7,
      poor: 0.5,
      damaged: 0.3,
      'not-working': 0.3
    };
    const conditionFactor = condMap[cond] || 0.85;

    const conditionMultiplier = conditionFactor * powerMult * damageMult * ageMult * accMult * checklistFactor;

    const weightKg = parseFloat(assessmentData.productWeight) || 1.0;
    const weightFactor = weightKg ? Math.min(weightKg / 10, 2) : 1;

    const brandStr = assessmentData.productBrand || 'Generic';
    const marketFactor = parseFloat((0.9 + (brandStr.length % 5) * 0.05).toFixed(2));

    let estimated = base * conditionMultiplier * weightFactor * marketFactor;
    estimated = Math.max(estimated, scrap);
    estimated = Math.round(estimated);

    document.getElementById('basePrice').textContent = '₹' + base.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    document.getElementById('conditionMultiplier').textContent = conditionMultiplier.toFixed(2) + 'x';
    document.getElementById('weightAdjustment').textContent = weightFactor.toFixed(2) + 'x';
    document.getElementById('marketFactor').textContent = marketFactor.toFixed(2) + 'x';
    document.getElementById('estimatedValue').textContent = '₹' + estimated.toLocaleString('en-IN', { minimumFractionDigits: 2 });

    assessmentData.estimatedValue = estimated;
  }

  function buildSummary() {
    document.getElementById('summaryName').textContent = assessmentData.customerName || '-';
    document.getElementById('summaryPhone').textContent = assessmentData.customerPhone || '-';
    document.getElementById('summaryProduct').textContent = assessmentData.productType || '-';
    document.getElementById('summaryBrandModel').textContent = (assessmentData.productBrand || '-') + ' / ' + (assessmentData.productModel || '-');
    document.getElementById('summaryCondition').textContent = assessmentData.productCondition || '-';
    document.getElementById('summaryValue').textContent = '₹' + (assessmentData.estimatedValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

  window.resetWizard = function (silent) {
    if (!silent && !confirm('Cancel this assessment?')) return;
    currentStep = 1; assessmentId = null;
    assessmentData = { customerName: '', customerEmail: '', customerPhone: '', customerAddress: '', productType: '', productBrand: '', productModel: '', productYear: '', productCondition: 'good', productWeight: 0, productNotes: '', images: [], aiResult: null, extractedBrand: '', extractedModel: '', verifiedCondition: 'good', verificationChecks: {}, verificationNotes: '', qPowerOn: 'yes', qDamage: 'none', qAge: 'new', qAccessories: 'all', productSpecificChecks: {} };
    uploadedFiles = [];
    document.querySelectorAll('.product-type-item').forEach(i => i.classList.remove('selected'));
    document.querySelectorAll('input, textarea, select').forEach(el => { if (el.id && el.type !== 'hidden') el.value = ''; });
    const q1 = document.getElementById('qPowerOn'); if (q1) q1.value = 'yes';
    const q2 = document.getElementById('qDamage'); if (q2) q2.value = 'none';
    const q3 = document.getElementById('qAge'); if (q3) q3.value = 'new';
    const q4 = document.getElementById('qAccessories'); if (q4) q4.value = 'all';
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
        value_estimate: assessmentData.estimatedValue || 0,
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
