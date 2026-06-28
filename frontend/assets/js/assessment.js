(function () {
  const user = checkAuth();
  if (user) document.getElementById('userName').textContent = user.full_name || user.username;
  const isStaff = user && user.role === 'employee';

  let currentStep = 1;
  const totalSteps = 9;
  let categoryCatalog = [];

  let data = {
    customer: { name: '', phone: '', email: '', address: '', state: '', district: '', pincode: '', areaCategory: '', localBodyName: '', village: '', ward: '', gpsLat: '', gpsLng: '' },
    products: [],
  };
  let activeIdx = 0;

  function makeProduct() {
    return {
      category: '', type: '', brand: '', model: '',
      serial: '', year: '', purchaseYear: '', condition: 'good',
      warranty: '', ownership: '', accessories: '', weight: 0,
      specs: '', notes: '', files: [],
      aiResult: null, extractedBrand: '', extractedModel: '',
      qPowerOn: 'yes', qDamage: 'none', qAge: 'new', qAccessories: 'all',
      productSpecificChecks: {},
      estimatedValue: 0, valueMin: 0, valueMax: 0, customerExpectedValue: 0,
      isCustom: false, customProductName: '',
    };
  }

  function resetData() {
    data = { customer: { name: '', phone: '', email: '', address: '', state: '', district: '', pincode: '', areaCategory: '', localBodyName: '', village: '', ward: '', gpsLat: '', gpsLng: '' }, products: [] };
    activeIdx = 0;
    currentStep = 1;
    categoryCatalog = [];
    document.querySelectorAll('input, textarea, select').forEach(el => { if (el.id && el.type !== 'hidden') el.value = ''; });
    const q1 = document.getElementById('qPowerOn'); if (q1) q1.value = 'yes';
    const q2 = document.getElementById('qDamage'); if (q2) q2.value = 'none';
    const q3 = document.getElementById('qAge'); if (q3) q3.value = 'new';
    const q4 = document.getElementById('qAccessories'); if (q4) q4.value = 'all';
    const bb = document.getElementById('brandBadge'), mb = document.getElementById('modelBadge');
    if (bb) bb.style.display = 'none'; if (mb) mb.style.display = 'none';
    const pc = document.getElementById('uploadPreview'); if (pc) pc.innerHTML = '';
    const sm = document.querySelector('.upload-area small');
    if (sm) sm.textContent = 'Supported: JPG, PNG, WebP (Max 5MB each)';
    initYearSelects();
    renderProductList();
    updateProductTabs();
    updateUI();
    window.scrollTo(0, 0);
  }

  const catDefs = {
    IT: { label: 'Information Technology', desc: 'Computers & Accessories', products: ['Laptop', 'Desktop', 'Server', 'Mobile Phone', 'Tablet', 'Monitor', 'Printer', 'Router', 'Others'] },
    CE: { label: 'Consumer Electronics', desc: 'Home Entertainment & Appliances', products: ['Television', 'Air Conditioner', 'Refrigerator', 'Washing Machine', 'Fan', 'Microwave Oven', 'Music System', 'Others'] },
    LS: { label: 'Large / Small Household Appliances', desc: 'Kitchen & Home Care', products: ['Rice Cooker', 'Induction Stove', 'Mixer Grinder', 'Vacuum Cleaner', 'Iron Box', 'Water Purifier', 'Geyser', 'Others'] },
    EE: { label: 'Electrical & Electronic Tools', desc: 'Power & Testing Equipment', products: ['Drilling Machine', 'Welding Machine', 'Power Tools', 'Testing Equipment', 'Others'] },
    TLS: { label: 'Toys, Leisure & Sports Equipment', desc: 'Entertainment & Fitness', products: ['Gaming Console', 'Drone', 'Electronic Toys', 'Treadmill', 'Exercise Equipment', 'Others'] },
    LI: { label: 'Lighting Instruments', desc: 'Indoor & Outdoor Lighting', products: ['LED Bulb', 'Tube Light', 'Emergency Light', 'Street Light', 'Decorative Lighting', 'Others'] },
    MD: { label: 'Medical Devices', desc: 'Healthcare & Diagnostic Equipment', products: ['Blood Pressure Monitor', 'Thermometer', 'Pulse Oximeter', 'Nebulizer', 'Glucose Meter', 'ECG Device', 'Others'] },
  };

  const prodAccessories = {
    'Laptop': ['Charger / Power Adapter', 'Laptop Bag / Sleeve', 'Mouse', 'External Hard Drive', 'Docking Station', 'USB Hub', 'Warranty Card'],
    'Desktop': ['Keyboard', 'Mouse', 'Monitor', 'Power Cable', 'Speaker', 'Wi-Fi Dongle', 'Warranty Card'],
    'Mobile Phone': ['Charger', 'USB Cable', 'Wired Earphones', 'Protective Case', 'Screen Protector', 'SIM Ejector Tool', 'Box / Packaging'],
    'Tablet': ['Charger / Adapter', 'USB Cable', 'Protective Case / Cover', 'Screen Protector', 'Stylus Pen', 'Keyboard Folio'],
    'Monitor': ['Power Cable', 'HDMI / DP / VGA Cable', 'USB Cable', 'Stand Base', 'VESA Mount Screws', 'Calibration Report'],
    'Printer': ['Power Cable', 'USB Cable', 'Ink / Toner Cartridge', 'Starter Cartridges', 'Driver CD', 'User Manual', 'Network Cable'],
    'Server': ['Power Cable', 'Rack Mount Kit / Rails', 'Ethernet Cable', 'Bezel', 'PSU Modules', 'Drive Caddies', 'Documentation'],
    'Router': ['Power Adapter', 'Ethernet Cable', 'Stand / Wall Mount', 'Quick Setup Guide', 'Antennas'],
    'TV': ['Remote Control', 'Stand Base / Feet', 'Power Cable', 'HDMI Cable', 'User Manual', 'Wall Mount Bracket', 'Batteries'],
    'Television': ['Remote Control', 'Stand Base / Feet', 'Power Cable', 'HDMI Cable', 'User Manual', 'Wall Mount Bracket'],
    'Air Conditioner': ['Remote Control', 'Installation Kit', 'Power Cable', 'Drain Pipe', 'Mounting Bracket', 'Warranty Card'],
    'Refrigerator': ['Egg Tray', 'Ice Tray / Ice Maker', 'Water Filter', 'Key / Lock', 'Warranty Card', 'User Manual'],
    'Washing Machine': ['Inlet Hose', 'Drain Hose', 'User Manual', 'Warranty Card', 'Installation Template'],
    'Fan': ['Remote Control', 'Pull Chain', 'Mounting Bracket', 'Screws / Hardware Kit', 'Warranty Card'],
    'Microwave Oven': ['Turntable Glass Plate', 'Turntable Roller Ring', 'User Manual', 'Warranty Card'],
    'Music System': ['Remote Control', 'Speaker Cables', 'FM Antenna', 'AUX Cable', 'User Manual', 'Microphone'],
    'Rice Cooker': ['Inner Pot', 'Measuring Cup', 'Rice Paddle / Spatula', 'Steam Tray', 'Power Cable'],
    'Induction Stove': ['Power Cable', 'User Manual', 'Warranty Card'],
    'Mixer Grinder': ['All Jars (Wet/Dry/Chutney)', 'Lids & Gaskets', 'Harness / Connector', 'User Manual'],
    'Vacuum Cleaner': ['Hose', 'Wand / Extension Tube', 'Crevice Tool', 'Brush Tool', 'HEPA Filter', 'Dust Bags'],
    'Iron Box': ['Water Measuring Cup', 'User Manual', 'Warranty Card'],
    'Water Purifier': ['All Filter Cartridges', 'Installation Kit', 'Tubing / Connectors', 'User Manual', 'Warranty Card'],
    'Geyser': ['Pressure Relief Valve', 'Installation Kit', 'User Manual', 'Warranty Card'],
    'Laptop': ['Charger / Power Adapter', 'Laptop Bag / Sleeve', 'Mouse', 'External Hard Drive', 'Docking Station'],
    'Gaming Console': ['Controller', 'HDMI Cable', 'Power Adapter', 'Charging Dock', 'Games / Discs', 'Stand'],
    'Drone': ['Remote Controller', 'Battery', 'Charger', 'Spare Propellers', 'Carrying Case', 'USB Cable'],
    'Treadmill': ['Safety Key / Lanyard', 'Lubricant', 'User Manual', 'Warranty Card', 'Heart Rate Monitor'],
    'LED Bulb': ['Box / Packaging', 'Warranty Card'],
    'Tube Light': ['Starter', 'Mounting Clips', 'Warranty Card'],
    'Emergency Light': ['Charger / Adapter', 'Mounting Screws', 'User Manual'],
    'Street Light': ['Mounting Bracket', 'Sensor Adjustment Tool', 'Warranty Card'],
    'Decorative Lighting': ['Controller / Transformer', 'Mounting Clips', 'Connector Cables', 'User Manual'],
    'Blood Pressure Monitor': ['Cuff (Standard Size)', 'Storage Pouch', 'Batteries', 'User Manual', 'Warranty Card'],
    'Thermometer': ['Battery', 'Storage Case', 'User Manual', 'Warranty Card'],
    'Pulse Oximeter': ['Lanyard / Strap', 'Batteries', 'Storage Case', 'User Manual'],
    'Nebulizer': ['Medication Cup', 'Air Tubing', 'Adult Mask', 'Child Mask', 'Mouthpiece', 'Air Filter'],
    'Glucose Meter': ['Test Strip Vial / Drum', 'Lancing Device', 'Lancets', 'Control Solution', 'Carrying Case'],
    'ECG Device': ['Lead Wires', 'Electrode Pads', 'USB Cable', 'Batteries', 'User Manual'],
    'Drilling Machine': ['Drill Bits Set', 'Chuck Key', 'Auxiliary Handle', 'Depth Stop', 'Carrying Case'],
    'Welding Machine': ['Welding Cable & Holder', 'Ground Cable & Clamp', 'Face Shield / Helmet', 'Chipping Hammer', 'Wire Brush'],
    'Power Tools': ['Auxiliary Handle', 'Carrying Case', 'Battery (Cordless)', 'Charger (Cordless)', 'Accessory Set'],
    'Testing Equipment': ['Test Probes / Leads', 'Alligator Clips', 'Batteries', 'Carrying Case', 'User Manual'],
    'Electronic Toys': ['Batteries', 'Remote Control', 'USB Charging Cable', 'User Manual'],
    'Exercise Equipment': ['Assembly Tools', 'User Manual', 'Warranty Card', 'Heart Rate Monitor'],
  };

  const prodSpecs = {
    'Laptop': [
      { key: 'processor', label: 'Processor', type: 'select', options: ['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9', 'Apple M1', 'Apple M2', 'Apple M3', 'Other'] },
      { key: 'ram', label: 'RAM', type: 'select', options: ['2 GB', '4 GB', '8 GB', '16 GB', '32 GB', '64 GB', '128 GB'] },
      { key: 'storage', label: 'Storage Capacity', type: 'select', options: ['32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB', '2 TB', '4 TB'] },
      { key: 'storage_type', label: 'Storage Type', type: 'select', options: ['SSD', 'HDD', 'SSD + HDD', 'eMMC', 'NVMe'] },
      { key: 'screen_size', label: 'Screen Size', type: 'select', options: ['11.6"', '12"', '13.3"', '14"', '15.6"', '16"', '17.3"', 'Other'] },
      { key: 'os', label: 'Operating System', type: 'select', options: ['Windows 10', 'Windows 11', 'macOS', 'Linux', 'Chrome OS', 'None / Not Installed', 'Other'] },
      { key: 'gpu', label: 'Graphics', type: 'select', options: ['Integrated', 'NVIDIA GeForce', 'AMD Radeon', 'Intel Arc', 'Apple GPU', 'Other'] },
    ],
    'Desktop': [
      { key: 'processor', label: 'Processor', type: 'select', options: ['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9', 'Other'] },
      { key: 'ram', label: 'RAM', type: 'select', options: ['4 GB', '8 GB', '16 GB', '32 GB', '64 GB', '128 GB', '256 GB'] },
      { key: 'storage', label: 'Storage Capacity', type: 'select', options: ['128 GB', '256 GB', '512 GB', '1 TB', '2 TB', '4 TB', '8 TB'] },
      { key: 'storage_type', label: 'Storage Type', type: 'select', options: ['SSD', 'HDD', 'SSD + HDD', 'NVMe'] },
      { key: 'os', label: 'Operating System', type: 'select', options: ['Windows 10', 'Windows 11', 'Linux', 'None / Not Installed', 'Other'] },
      { key: 'gpu', label: 'Graphics Card', type: 'select', options: ['Integrated', 'NVIDIA GeForce', 'AMD Radeon', 'Intel Arc', 'No GPU', 'Other'] },
      { key: 'form_factor', label: 'Form Factor', type: 'select', options: ['Tower', 'Mini Tower', 'SFF', 'All-in-One', 'Mini PC', 'Other'] },
    ],
    'Mobile Phone': [
      { key: 'storage', label: 'Storage Capacity', type: 'select', options: ['8 GB', '16 GB', '32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB'] },
      { key: 'ram', label: 'RAM', type: 'select', options: ['2 GB', '3 GB', '4 GB', '6 GB', '8 GB', '12 GB', '16 GB'] },
      { key: 'screen_size', label: 'Screen Size', type: 'select', options: ['4.7"', '5.5"', '6.1"', '6.3"', '6.5"', '6.7"', '6.9"', 'Other'] },
      { key: 'os', label: 'Operating System', type: 'select', options: ['Android', 'iOS', 'Other'] },
      { key: 'network', label: 'Network', type: 'select', options: ['4G LTE', '5G', 'Wi-Fi Only'] },
    ],
    'Tablet': [
      { key: 'storage', label: 'Storage Capacity', type: 'select', options: ['16 GB', '32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB'] },
      { key: 'ram', label: 'RAM', type: 'select', options: ['2 GB', '3 GB', '4 GB', '6 GB', '8 GB', '12 GB', '16 GB'] },
      { key: 'screen_size', label: 'Screen Size', type: 'select', options: ['7"', '8"', '9.7"', '10.1"', '10.5"', '11"', '12.4"', '12.9"', 'Other'] },
      { key: 'os', label: 'Operating System', type: 'select', options: ['iPadOS', 'Android', 'Windows', 'Other'] },
      { key: 'connectivity', label: 'Connectivity', type: 'select', options: ['Wi-Fi Only', 'Wi-Fi + Cellular'] },
    ],
    'Television': [
      { key: 'screen_size', label: 'Screen Size', type: 'select', options: ['24"', '32"', '40"', '43"', '50"', '55"', '65"', '75"', '85"', 'Other'] },
      { key: 'resolution', label: 'Resolution', type: 'select', options: ['HD (1366x768)', 'FHD (1920x1080)', '4K UHD (3840x2160)', '8K (7680x4320)'] },
      { key: 'display_type', label: 'Display Type', type: 'select', options: ['LED', 'OLED', 'QLED', 'LCD', 'Plasma', 'MicroLED'] },
      { key: 'smart_tv', label: 'Smart TV', type: 'select', options: ['Yes', 'No'] },
      { key: 'refresh_rate', label: 'Refresh Rate', type: 'select', options: ['60 Hz', '120 Hz', '144 Hz', '240 Hz'] },
    ],
    'Air Conditioner': [
      { key: 'capacity', label: 'Capacity', type: 'select', options: ['0.75 Ton', '1.0 Ton', '1.2 Ton', '1.5 Ton', '2.0 Ton', '2.5 Ton', '3.0 Ton'] },
      { key: 'ac_type', label: 'AC Type', type: 'select', options: ['Split', 'Window', 'Inverter Split', 'Inverter Window', 'Cassette', 'Portable'] },
      { key: 'star_rating', label: 'Star Rating', type: 'select', options: ['1 Star', '2 Star', '3 Star', '4 Star', '5 Star', 'BEE Not Rated'] },
      { key: 'cooling_capacity', label: 'Cooling Capacity (BTU)', type: 'text' },
    ],
    'Refrigerator': [
      { key: 'capacity', label: 'Capacity', type: 'select', options: ['100 L', '165 L', '190 L', '215 L', '260 L', '320 L', '400 L', '500 L', '600 L', '700 L+'] },
      { key: 'ref_type', label: 'Type', type: 'select', options: ['Single Door', 'Double Door', 'Side-by-Side', 'French Door', 'Multi-Door'] },
      { key: 'frost_type', label: 'Cooling Type', type: 'select', options: ['Direct Cool', 'Frost Free', 'Hybrid'] },
    ],
    'Washing Machine': [
      { key: 'capacity', label: 'Capacity', type: 'select', options: ['5 kg', '6 kg', '6.5 kg', '7 kg', '8 kg', '9 kg', '10 kg', '12 kg', '14 kg+'] },
      { key: 'wm_type', label: 'Type', type: 'select', options: ['Top Load Fully Auto', 'Front Load Fully Auto', 'Semi-Automatic', 'Washer-Dryer Combo'] },
      { key: 'spin_speed', label: 'Max Spin Speed', type: 'select', options: ['600 RPM', '800 RPM', '1000 RPM', '1200 RPM', '1400 RPM', '1600 RPM'] },
    ],
    'Monitor': [
      { key: 'screen_size', label: 'Screen Size', type: 'select', options: ['19"', '21.5"', '24"', '27"', '32"', '34"', '38"', '49"', 'Other'] },
      { key: 'resolution', label: 'Resolution', type: 'select', options: ['HD (1366x768)', 'FHD (1920x1080)', 'QHD (2560x1440)', '4K UHD (3840x2160)', '5K (5120x2880)' ] },
      { key: 'panel_type', label: 'Panel Type', type: 'select', options: ['IPS', 'TN', 'VA', 'OLED', 'Mini-LED'] },
      { key: 'refresh_rate', label: 'Refresh Rate', type: 'select', options: ['60 Hz', '75 Hz', '100 Hz', '144 Hz', '165 Hz', '240 Hz', '360 Hz'] },
    ],
    'Printer': [
      { key: 'printer_type', label: 'Printer Type', type: 'select', options: ['Inkjet', 'Laser', 'Dot Matrix', 'Thermal', '3D Printer'] },
      { key: 'connectivity', label: 'Connectivity', type: 'select', options: ['USB Only', 'USB + Wi-Fi', 'USB + Ethernet', 'USB + Wi-Fi + Ethernet', 'Bluetooth'] },
      { key: 'multifunction', label: 'Multifunction', type: 'select', options: ['Print Only', 'Print + Scan', 'Print + Scan + Copy', 'Print + Scan + Copy + Fax'] },
    ],
    'Fan': [
      { key: 'fan_type', label: 'Fan Type', type: 'select', options: ['Ceiling Fan', 'Pedestal Fan', 'Table Fan', 'Wall Fan', 'Exhaust Fan', 'Tower Fan', 'Bladeless Fan'] },
      { key: 'size', label: 'Size', type: 'select', options: ['600 mm', '900 mm', '1050 mm', '1200 mm', '1400 mm', '1500 mm', 'Other'] },
      { key: 'speed_settings', label: 'Speed Settings', type: 'select', options: ['2 Speed', '3 Speed', '4 Speed', '5 Speed', 'Variable / Remote'] },
    ],
    'Server': [
      { key: 'processor', label: 'Processor', type: 'select', options: ['Intel Xeon E', 'Intel Xeon Scalable', 'AMD EPYC', 'Intel Core', 'Other'] },
      { key: 'ram', label: 'RAM', type: 'select', options: ['8 GB', '16 GB', '32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB+'] },
      { key: 'storage', label: 'Storage', type: 'select', options: ['256 GB', '512 GB', '1 TB', '2 TB', '4 TB', '8 TB', '16 TB+'] },
      { key: 'form_factor', label: 'Form Factor', type: 'select', options: ['Rack 1U', 'Rack 2U', 'Rack 4U', 'Tower', 'Blade', 'Micro'] },
    ],
    'Router': [
      { key: 'standard', label: 'Wi-Fi Standard', type: 'select', options: ['Wi-Fi 4 (802.11n)', 'Wi-Fi 5 (802.11ac)', 'Wi-Fi 6 (802.11ax)', 'Wi-Fi 6E', 'Wi-Fi 7'] },
      { key: 'bands', label: 'Bands', type: 'select', options: ['Single Band (2.4 GHz)', 'Dual Band (2.4 + 5 GHz)', 'Tri Band (2.4 + 5 + 6 GHz)'] },
      { key: 'ports', label: 'Ethernet Ports', type: 'select', options: ['1x LAN', '2x LAN', '3x LAN', '4x LAN', '8x LAN'] },
    ],
    'Microwave Oven': [
      { key: 'capacity', label: 'Capacity', type: 'select', options: ['15 L', '20 L', '23 L', '25 L', '28 L', '30 L', '32 L', '42 L'] },
      { key: 'mw_type', label: 'Type', type: 'select', options: ['Solo (Basic)', 'Grill', 'Convection', 'OTG'] },
      { key: 'power', label: 'Power (Watts)', type: 'select', options: ['700 W', '800 W', '900 W', '1000 W', '1200 W', '1500 W'] },
    ],
  };

  const prodChecks = {
    'Laptop': { physical: [{ id: 'hinges_sturdy', label: 'Hinges sturdy and open/close smoothly without wobble' }, { id: 'keyboard_intact', label: 'All keycaps present; no missing or stuck keys' }, { id: 'screen_crackfree', label: 'Display panel free of cracks, dead pixels & discoloration' }, { id: 'chassis_undamaged', label: 'Top/bottom casing undamaged (no cracks, dents)' }, { id: 'ports_clean', label: 'USB, HDMI, audio, power ports clean and undamaged' }, { id: 'trackpad_ok', label: 'Trackpad surface smooth and click buttons responsive' }, { id: 'fan_grille_clear', label: 'Ventilation grilles and fan openings free of dust/debris' }, { id: 'bottom_feet', label: 'Rubber feet present and not worn out' }], functional: [{ id: 'boots_os', label: 'Boots into operating system without hangs or errors' }, { id: 'display_brightness', label: 'Display brightness adjustable; no flickering at any level' }, { id: 'keyboard_input', label: 'All character keys, modifiers, and Fn layer respond correctly' }, { id: 'wifi_bt', label: 'Wi-Fi scans & connects; Bluetooth pairs with a device' }, { id: 'battery_charge', label: 'Battery charges to 100% and holds charge for >30 min unplugged' }, { id: 'audio_io', label: 'Internal speakers, headphone jack, and mic functional' }, { id: 'webcam_works', label: 'Built-in camera and microphone work for video calls' }, { id: 'performance_stable', label: 'No random shutdowns, BSOD, or kernel panics during use' }] },
    'Desktop': { physical: [{ id: 'casing_intact', label: 'Case side panels, front bezel, and top vents intact' }, { id: 'ports_clean', label: 'USB, audio, video ports on front/reary clean and undamaged' }, { id: 'psu_intact', label: 'Power supply fan spins, no burnt smell, cable sleeving intact' }, { id: 'internal_clean', label: 'Interior free of excessive dust, no corrosion on board' }, { id: 'drive_bays', label: 'Drive bays and screws present for mounting storage' }, { id: 'ram_slots', label: 'RAM slots clean with retention clips functional' }], functional: [{ id: 'boots_ok', label: 'System POSTs and boots into operating system' }, { id: 'usb_works', label: 'All USB ports detect and transfer data correctly' }, { id: 'display_output', label: 'Video output works through integrated/dedicated GPU' }, { id: 'storage_detected', label: 'Hard drive / SSD detected and readable' }, { id: 'fan_noise', label: 'All case/CPU fans spin with no grinding or loud noise' }, { id: 'network_ok', label: 'Ethernet port connects; Wi-Fi if equipped works' }] },
    'Mobile Phone': { physical: [{ id: 'screen_crackfree', label: 'Display free of cracks, deep scratches, and pressure marks' }, { id: 'back_casing', label: 'Back cover / glass panel intact without cracks' }, { id: 'buttons_tactile', label: 'Power, volume, mute/side buttons clicky and not stuck' }, { id: 'charging_port', label: 'Charging port (USB-C/Lightning) clean with no bent pins' }, { id: 'speaker_grille', label: 'Speaker/earpiece grilles free of debris' }, { id: 'camera_lens', label: 'Rear/front camera lenses scratch-free and clear' }, { id: 'sim_tray', label: 'SIM tray present, eject mechanism functional' }], functional: [{ id: 'touch_responsive', label: 'Touchscreen fully responsive all across with no dead zones' }, { id: 'cameras_work', label: 'Rear camera focuses, flash works; front camera functional' }, { id: 'audio_io', label: 'Speaker, earpiece, and microphone clear during call' }, { id: 'charging_ok', label: 'Charges normally; battery percentage increases steadily' }, { id: 'sensors_work', label: 'Proximity, ambient light, accelerometer, gyroscope functional' }, { id: 'fingerprint_face', label: 'Biometric unlock (fingerprint/face) enrolls and unlocks' }, { id: 'cellular_wifi', label: 'Makes calls, mobile data connects; Wi-Fi scans and connects' }] },
    'Tablet': { physical: [{ id: 'screen_ok', label: 'Display intact; no cracks, bright spots or dead pixels' }, { id: 'casing_ok', label: 'Back casing and bezel undamaged' }, { id: 'buttons_ok', label: 'Power/volume buttons clicky and responsive' }, { id: 'port_clean', label: 'Charging port and headphone jack undamaged and clean' }, { id: 'speaker_grille', label: 'Speaker grilles free of debris, not clogged' }], functional: [{ id: 'touch_works', label: 'Touchscreen responsive; no ghost touches or dead areas' }, { id: 'wifi_bt', label: 'Wi-Fi connects; Bluetooth pairs with peripherals' }, { id: 'battery_ok', label: 'Holds charge; discharges at normal rate' }, { id: 'cameras_work', label: 'Front/rear cameras produce clear image' }, { id: 'audio_ok', label: 'Speakers produce sound without distortion' }] },
    'Monitor': { physical: [{ id: 'panel_undamaged', label: 'Display panel undamaged with no cracks or pressure marks' }, { id: 'bezel_frame', label: 'Bezel/frame intact and not separating from panel' }, { id: 'stand_stable', label: 'Stand or VESA mount bracket sturdy and not wobbly' }, { id: 'ports_clean', label: 'HDMI, DP, DVI, VGA ports clean with no bent pins' }, { id: 'buttons_intact', label: 'Power button and OSD menu buttons clicky and functional' }, { id: 'cable_included', label: 'Power cable and at least one signal cable included' }], functional: [{ id: 'display_ok', label: 'Panel powers on: no lines, flicker, or dead pixels' }, { id: 'osd_works', label: 'On-screen display menu navigable and adjustable' }, { id: 'input_detection', label: 'Auto-detects input signal on all ports tested' }, { id: 'color_accuracy', label: 'Color reproduction appears normal (not washed out/tinted)' }, { id: 'refresh_stable', label: 'Rated refresh rate achievable without dropout' }] },
    'Printer': { physical: [{ id: 'casing_intact', label: 'Casing / cover intact with no cracks' }, { id: 'trays_present', label: 'Paper input tray and output tray present' }, { id: 'ports_clean', label: 'USB / network port clean; power cord intact' }, { id: 'rollers_clean', label: 'Paper feed rollers visible and not worn/slippery' }, { id: 'scanner_lid', label: 'Scanner lid hinges ok; glass clean (if multifunction)' }], functional: [{ id: 'powers_on', label: 'Printer powers on and goes through initialization' }, { id: 'prints_ok', label: 'Test page prints without streaks, smudges, or jams' }, { id: 'scans_ok', label: 'Scanner produces clear digital copy (if equipped)' }, { id: 'network_print', label: 'Prints correctly over USB or network' }, { id: 'ink_toner', label: 'Ink/toner levels visible; not completely depleted' }] },
    'Server': { physical: [{ id: 'chassis_intact', label: 'Rackmount chassis rails and ears intact; no major dents' }, { id: 'drive_bays', label: 'Hot-swap drive trays present and locking mechanism works' }, { id: 'psu_units', label: 'Redundant PSUs present with fans spinning freely' }, { id: 'internal_clean', label: 'Interior free of dust; DIMM slots, CPU heatsinks clean' }, { id: 'led_indicators', label: 'Front panel LED indicators (power, status, disk activity) functional' }], functional: [{ id: 'boots_ok', label: 'Server POSTs and boots successfully' }, { id: 'network_ok', label: 'All network interfaces detected and link established' }, { id: 'storage_detected', label: 'All drives detected in RAID controller / BIOS' }, { id: 'memory_ok', label: 'All DIMMs detected; memory test passes without errors' }, { id: 'remote_mgmt', label: 'BMC/iDRAC/iLO web interface accessible (if available)' }] },
    'Router': { physical: [{ id: 'casing_intact', label: 'Casing intact; no cracks or heat damage discoloration' }, { id: 'ports_clean', label: 'Ethernet WAN/LAN ports clean with no bent pins' }, { id: 'antenna_ok', label: 'Antennas present, attached securely, and not broken' }, { id: 'led_indicators', label: 'Power and port LEDs illuminate when connected' }, { id: 'power_adapter', label: 'Power adapter included with correct voltage rating' }], functional: [{ id: 'powers_on', label: 'Powers on; status LEDs show normal boot sequence' }, { id: 'wifi_works', label: 'Wi-Fi broadcasts SSID; 2.4GHz and 5GHz bands work' }, { id: 'lan_ports', label: 'LAN ports pass traffic; WAN port gets internet connectivity' }, { id: 'admin_panel', label: 'Web admin panel accessible at default gateway' }, { id: 'reset_works', label: 'Reset button restores factory defaults' }] },
    'Fan': { physical: [{ id: 'blades_intact', label: 'Blades intact, balanced, and not warped/chipped' }, { id: 'guard_cage', label: 'Blade guard / cage present, not rusted or bent' }, { id: 'base_stable', label: 'Pedestal base / wall mount bracket stable and not wobbly' }, { id: 'cord_undamaged', label: 'Power cord insulation intact; plug pins not bent' }, { id: 'pull_chain', label: 'Pull chain / remote sensor present and responsive' }, { id: 'canopy_mount', label: 'Ceiling canopy or mounting bracket secure' }], functional: [{ id: 'motor_smooth', label: 'Motor spins freely; no grinding or screeching noise' }, { id: 'speeds_work', label: 'All speed settings (low/med/high) produce distinct speeds' }, { id: 'oscillation', label: 'Oscillation mechanism engages and sweeps smoothly' }, { id: 'quiet_operation', label: 'Fan runs quietly at low speed; acceptable noise at high' }, { id: 'remote_works', label: 'Remote control changes speed and turns light on/off (if fan light)' }] },
    'TV': { physical: [{ id: 'screen_cracks', label: 'Screen free of cracks, dead pixels, and burn-in marks' }, { id: 'bezel_frame', label: 'Bezel / frame undamaged and not separating' }, { id: 'stand_wallmount', label: 'Stand feet or VESA mount points sturdy and intact' }, { id: 'ports_clean', label: 'HDMI, USB, AV ports clean with no bent pins' }, { id: 'remote_included', label: 'Remote control included; battery compartment clean' }, { id: 'power_cord', label: 'Power cord attached firmly; not frayed or cut' }], functional: [{ id: 'display_ok', label: 'Display powers on; colors, contrast, brightness normal' }, { id: 'sound_ok', label: 'Internal speakers clear at all volume levels (no crackling)' }, { id: 'remote_works', label: 'Remote IR receiver works at normal distance and angle' }, { id: 'inputs_work', label: 'HDMI, USB, AV inputs detected and display content' }, { id: 'smart_tv', label: 'Smart TV interface loads; apps open (if smart TV)' }] },
    'Air Conditioner': { physical: [{ id: 'filters_clean', label: 'Air filters present, clean, and not torn' }, { id: 'casing_intact', label: 'Indoor unit casing intact, not yellowed or cracked' }, { id: 'coil_fins', label: 'Evaporator/condenser coil fins straight, not crushed' }, { id: 'drain_pipe', label: 'Condensate drain pipe clear and not clogged' }, { id: 'remote_included', label: 'Remote control included with working display' }, { id: 'mounting_bracket', label: 'Outdoor unit mounting brackets secure with no rust' }], functional: [{ id: 'compressor_cool', label: 'Compressor starts; room cools to set temperature' }, { id: 'fan_speeds', label: 'Fan speeds (low/med/high/auto) each produce distinct airflow' }, { id: 'thermostat', label: 'Thermostat maintains set temperature; compressor cycles correctly' }, { id: 'remote_works', label: 'Remote receiver picks up IR signals at normal range' }, { id: 'quiet_mode', label: 'Quiet/sleep mode fan noise acceptable' }] },
    'Refrigerator': { physical: [{ id: 'door_seals', label: 'Door gaskets / seals intact, flexible, no gaps when closed' }, { id: 'shelves_bins', label: 'All shelves, crisper drawers, door bins present and intact' }, { id: 'casing_intact', label: 'Exterior casing undamaged; no major dents or rust' }, { id: 'coils_clean', label: 'Condenser coils (rear/bottom) clean and not crushed' }, { id: 'light_bulb', label: 'Interior light bulb / LED present' }, { id: 'water_filter', label: 'Water filter present (if plumbed model)' }], functional: [{ id: 'cools_ok', label: 'Fridge compartment cools to 2-8C within reasonable time' }, { id: 'freezer_ok', label: 'Freezer compartment reaches -18C or below' }, { id: 'thermostat', label: 'Thermostat dial/display adjusts temperature correctly' }, { id: 'defrost_works', label: 'Auto-defrost cycle completes (no excessive ice buildup)' }, { id: 'compressor_noise', label: 'Compressor runs without knocking, hissing, or excessive vibration' }] },
    'Washing Machine': { physical: [{ id: 'drum_smooth', label: 'Drum rotates freely by hand; no rough spots or rust' }, { id: 'hoses_intact', label: 'Inlet and drain hoses not cracked, kinked, or bulging' }, { id: 'door_lock', label: 'Door / lid lock mechanism engages and disengages correctly' }, { id: 'body_rustfree', label: 'Exterior body rust-free with no dents or sharp edges' }, { id: 'detergent_tray', label: 'Detergent / fabric softener drawer slides smoothly and clean' }], functional: [{ id: 'wash_runs', label: 'Wash cycle fills, agitates, drains, and spins without errors' }, { id: 'spin_smooth', label: 'Spin cycle reaches rated RPM without violent shaking' }, { id: 'drain_works', label: 'Drain pump evacuates water completely within cycle time' }, { id: 'heater_works', label: 'Water heater (if present) brings water to selected temperature' }, { id: 'panel_responsive', label: 'Control panel buttons/dial responsive; display shows cycle status' }] },
    'Microwave Oven': { physical: [{ id: 'door_seal', label: 'Door seal / gasket intact and clean; hinges tight' }, { id: 'turntable', label: 'Turntable glass plate and roller ring present' }, { id: 'casing_ok', label: 'Exterior casing intact with no rust or dents' }, { id: 'door_latch', label: 'Door latches and safety interlock engage correctly' }, { id: 'display_intact', label: 'Digital display / membrane keypad free of cracks' }], functional: [{ id: 'heats_ok', label: 'Heats a cup of water to near-boiling within 2 min' }, { id: 'turntable_spins', label: 'Turntable rotates during operation' }, { id: 'timer_works', label: 'Timer counts down; beeps at end of cycle' }, { id: 'light_works', label: 'Interior light turns on during operation' }, { id: 'power_levels', label: 'Power level selection changes heating intensity' }] },
    'Television': { physical: [{ id: 'screen_condition', label: 'Screen intact, free of burn-in, pressure marks, and cracks' }, { id: 'stand_stable', label: 'Tabletop stand or wall mount bracket sturdy' }, { id: 'ports_clean', label: 'HDMI, USB, AV, coaxial ports all clean and undamaged' }, { id: 'remote_included', label: 'Remote control included and has working batteries' }], functional: [{ id: 'display_works', label: 'Display powers on with uniform brightness, no banding or flicker' }, { id: 'sound_clear', label: 'Speakers produce clear audio without distortion or buzz' }, { id: 'remote_works', label: 'Remote controls power, volume, input, and menu navigation' }, { id: 'inputs_detected', label: 'Connected devices detected on all HDMI/USB ports' }] },
    'Music System': { physical: [{ id: 'casing_ok', label: 'Speaker cabinets / main unit casing intact' }, { id: 'speaker_cones', label: 'Speaker cones / tweeter diaphragms intact without tears' }, { id: 'controls_knobs', label: 'Knobs, buttons, and sliders present and not loose' }, { id: 'ports_clean', label: 'Aux, USB, Bluetooth pairing button intact and clean' }, { id: 'grille_cloth', label: 'Speaker grille cloth free of tears or large stains' }], functional: [{ id: 'powers_on', label: 'System powers on; display / indicator lights normal' }, { id: 'sound_clear', label: 'Sound output clear across volume range with no distortion' }, { id: 'inputs_work', label: 'Aux, USB, Bluetooth, FM radio all produce audio input' }, { id: 'remote_works', label: 'Remote control (if included) changes volume and source' }, { id: 'headphone_out', label: 'Headphone output works without noise' }] },
    'Rice Cooker': { physical: [{ id: 'inner_pot', label: 'Inner pot present, non-stick coating not peeling, no dents' }, { id: 'lid_seal', label: 'Lid seal / gasket intact and clean; lid closes securely' }, { id: 'casing_ok', label: 'Exterior casing intact; no cracks or burn marks' }, { id: 'power_cord', label: 'Power cord attached securely; insulation intact' }, { id: 'steam_vent', label: 'Steam vent cap present and not clogged' }], functional: [{ id: 'heats_ok', label: 'Heats and cooks rice properly without burning or undercooking' }, { id: 'keep_warm', label: 'Keep warm function maintains temperature' }, { id: 'lid_lock', label: 'Pressure lid locks and seals (for pressure models)' }, { id: 'indicators_work', label: 'Cook/warm indicator lights function correctly' }] },
    'Induction Stove': { physical: [{ id: 'glass_top', label: 'Glass cooktop free of cracks, chips, and deep scratches' }, { id: 'casing_ok', label: 'Casing intact; cooling vents not blocked' }, { id: 'power_cord', label: 'Power cord insulation intact; plug not bent or damaged' }, { id: 'control_panel', label: 'Touch / button control panel intact with no cracks or delamination' }], functional: [{ id: 'heats_ok', label: 'Heats a pan of water to boiling within reasonable time' }, { id: 'temp_control', label: 'Temperature levels change heating intensity detectably' }, { id: 'timer_works', label: 'Timer function counts down and auto-shuts off' }, { id: 'pan_detection', label: 'Correctly detects ferrous pan; does not heat without pan' }] },
    'Mixer Grinder': { physical: [{ id: 'jars_present', label: 'All jars (wet/dry/chutney) present with lids and gaskets' }, { id: 'blades_sharp', label: 'Blades in all jars intact and not dull/chipped' }, { id: 'base_casing', label: 'Base unit casing intact; jar locking mechanism functional' }, { id: 'cord_ok', label: 'Power cord undamaged; plug pins not bent' }], functional: [{ id: 'motor_runs', label: 'Motor runs at all speed settings without burning smell' }, { id: 'jar_seal', label: 'Jars seal properly without leaking contents' }, { id: 'pulse_works', label: 'Pulse function activates and stops immediately' }, { id: 'safety_lock', label: 'Overload safety cut-off trips correctly (if equipped)' }] },
    'Vacuum Cleaner': { physical: [{ id: 'casing_ok', label: 'Casing intact with no cracks; bumper/rubber trim present' }, { id: 'hose_attachments', label: 'Hose, wand, and all attachments present and not cracked' }, { id: 'dust_bin_bag', label: 'Dust bin / bag compartment clean and latch/intact' }, { id: 'filters_clean', label: 'Pre-motor and HEPA filters present and cleanable' }, { id: 'cord_retract', label: 'Power cord retracts fully (if auto-rewind model)' }], functional: [{ id: 'suction_ok', label: 'Suction strong enough to lift debris; no loss of power' }, { id: 'brush_roll', label: 'Brush roll spins and agitates carpet fibers' }, { id: 'bag_full', label: 'Bag-full indicator works (if equipped)' }, { id: 'nozzle_adj', label: 'Height adjustment for different floor types' }] },
    'Iron Box': { physical: [{ id: 'soleplate', label: 'Soleplate smooth with no scratches, rust, or burnt residue' }, { id: 'casing_ok', label: 'Body casing intact with no cracks or heat damage' }, { id: 'cord_flex', label: 'Power cord flexible, insulation intact; cord guard not split' }, { id: 'water_tank', label: 'Water tank cap present; no mineral buildup in tank (for steam)' }], functional: [{ id: 'heats_ok', label: 'Heats to set temperature within reasonable time' }, { id: 'steam_works', label: 'Steam burst and continuous steam function (for steam iron)' }, { id: 'temp_control', label: 'Temperature dial adjusts heat level detectably' }, { id: 'auto_off', label: 'Auto shut-off activates when stationary (if equipped)' }] },
    'Water Purifier': { physical: [{ id: 'casing_ok', label: 'Casing intact with no cracks; drip tray present' }, { id: 'filters_present', label: 'All filter cartridges present and not expired' }, { id: 'tubing_ok', label: 'Tubing connections secure, no kinks or leaks' }, { id: 'faucet_ok', label: 'Faucet / dispensing nozzle clean and not clogged' }, { id: 'power_adapter', label: 'Power adapter / cord included with correct voltage' }], functional: [{ id: 'water_flow', label: 'Water flows properly through all stages' }, { id: 'quality_ok', label: 'Purified water TDS reading shows acceptable reduction' }, { id: 'indicators', label: 'Power and purification indicator lights function' }, { id: 'heater_works', label: 'Water heater brings water to selected temperature (if UV/hot model)' }] },
    'Geyser': { physical: [{ id: 'casing_ok', label: 'Outer casing intact with no rust or dents' }, { id: 'inlet_outlet', label: 'Inlet/outlet brass connections intact and not corroded' }, { id: 'pressure_valve', label: 'Pressure relief valve (PRV) present and not clogged' }, { id: 'mounting', label: 'Wall mounting bracket securely attached' }], functional: [{ id: 'heats_ok', label: 'Heats water to set temperature within rated time' }, { id: 'thermostat', label: 'Thermostat cuts off at set temperature; auto-reheats' }, { id: 'safety_cutoff', label: 'Thermal cut-off / safety switch operational' }, { id: 'indicator', label: 'Power / heating indicator light works' }] },
    'Gaming Console': { physical: [{ id: 'casing_intact', label: 'Console casing intact; vents not blocked or damaged' }, { id: 'ports_clean', label: 'HDMI, USB, ethernet, power ports clean and undamaged' }, { id: 'controller_condition', label: 'Controller(s) present; thumbsticks not worn, buttons not sticky' }, { id: 'disc_drive', label: 'Disc drive slot / tray mechanism intact (if disc model)' }, { id: 'stand_base', label: 'Console stand / base feet present and stable' }], functional: [{ id: 'boots_ok', label: 'Console boots to dashboard / home screen without errors' }, { id: 'controller_sync', label: 'Controller(s) sync and respond without input lag' }, { id: 'display_output', label: 'Video output at rated resolution without artifacts' }, { id: 'audio_works', label: 'Audio through HDMI / optical works without distortion' }, { id: 'online_connect', label: 'Connects to Wi-Fi / ethernet; online services accessible' }] },
    'Drone': { physical: [{ id: 'frame_intact', label: 'Frame / body intact with no cracks or stress marks' }, { id: 'propellers', label: 'Propellers present, not chipped, and balanced' }, { id: 'camera_lens', label: 'Camera lens scratch-free and gimbal moves freely' }, { id: 'battery_dept', label: 'Battery not swollen; contacts clean' }, { id: 'controller', label: 'Controller present; joysticks centered and responsive' }], functional: [{ id: 'powers_on', label: 'Drone powers on; all LEDs functional' }, { id: 'gps_lock', label: 'GPS lock acquired within normal time' }, { id: 'hover_stable', label: 'Hover stability test passes (holds position without drifting)' }, { id: 'camera_works', label: 'Camera records video / captures photo without distortion' }, { id: 'range_ok', label: 'Control range acceptable; no dropouts at short range' }] },
    'Treadmill': { physical: [{ id: 'belt_condition', label: 'Walking belt intact, centered, not frayed on edges' }, { id: 'deck_ok', label: 'Running deck surface smooth; no cracking or splintering' }, { id: 'handrails', label: 'Handrails / handlebars secure and not loose' }, { id: 'motor_cover', label: 'Motor hood / cover intact and properly seated' }, { id: 'safety_key', label: 'Safety key / lanyard present and functional' }], functional: [{ id: 'belt_moves', label: 'Belt moves smoothly at all speeds without stuttering' }, { id: 'incline_works', label: 'Incline adjustment mechanism works through full range' }, { id: 'console_works', label: 'Console displays speed, time, distance; buttons responsive' }, { id: 'heart_rate', label: 'Heart rate sensors (handgrip / chest strap) read correctly' }, { id: 'quiet_run', label: 'Motor runs at acceptable noise level; no grinding' }] },
    'LED Bulb': { physical: [{ id: 'bulb_intact', label: 'Glass / polycarbonate globe intact; no cracks visible' }, { id: 'base_ok', label: 'Base (E27/B22/pin) clean and not bent or corroded' }, { id: 'dimmable', label: 'Dimmable marking present if applicable (for dimmer test)' }], functional: [{ id: 'lights_up', label: 'Lights up at full brightness without flickering' }, { id: 'color_temp', label: 'Color temperature (warm/cool/daylight) matches rated spec' }, { id: 'dimmer_compat', label: 'Dims smoothly with compatible dimmer (if dimmable)' }] },
    'Tube Light': { physical: [{ id: 'tube_intact', label: 'Glass tube intact; no blackening at ends' }, { id: 'pins_clean', label: 'Pin connectors clean and not bent' }, { id: 'starter_ok', label: 'Starter / LED driver present (if applicable)' }], functional: [{ id: 'lights_up', label: 'Lights up fully without flickering or delay' }, { id: 'brightness_ok', label: 'Illuminates at rated brightness' }] },
    'Emergency Light': { physical: [{ id: 'casing_ok', label: 'Casing intact; no cracks or yellowing' }, { id: 'lamp_head', label: 'Lamp heads / LED panel intact and swivel freely' }, { id: 'battery_ok', label: 'Battery compartment clean; terminals not corroded' }], functional: [{ id: 'mains_works', label: 'Lights on when mains power applied' }, { id: 'battery_backup', label: 'Switches to battery and stays lit when mains cut' }, { id: 'test_switch', label: 'Test switch / indicator light works' }] },
    'Blood Pressure Monitor': { physical: [{ id: 'casing_ok', label: 'Monitor casing intact; display not cracked' }, { id: 'cuff_ok', label: 'Cuff present; bladder not leaking, Velcro holds' }, { id: 'tubing_ok', label: 'Air tubing not kinked or cut; connector snug' }, { id: 'battery_cover', label: 'Battery cover present; battery terminals clean' }], functional: [{ id: 'powers_on', label: 'Device powers on and initializes' }, { id: 'measures_bp', label: 'Measures blood pressure with consistent readings' }, { id: 'irregular_detect', label: 'Irregular heartbeat detection works (if feature available)' }, { id: 'memory_works', label: 'Memory recall shows previous readings' }] },
    'Thermometer': { physical: [{ id: 'probe_intact', label: 'Probe / sensor tip intact and clean' }, { id: 'display_ok', label: 'Display screen intact; numbers readable' }, { id: 'casing_ok', label: 'Casing intact; battery cover present' }], functional: [{ id: 'measures_temp', label: 'Measures temperature accurately within tolerance' }, { id: 'backlight', label: 'Backlight works (if equipped)' }, { id: 'unit_switch', label: 'Switches between C and F correctly' }] },
    'Pulse Oximeter': { physical: [{ id: 'clip_intact', label: 'Finger clip spring action works; hinges not broken' }, { id: 'display_ok', label: 'OLED / LCD display intact with no dead segments' }, { id: 'sensor_clean', label: 'Sensor lens on clip clean and not scratched' }], functional: [{ id: 'reads_ok', label: 'Reads SpO2 and pulse rate consistently' }, { id: 'waveform', label: 'Plethysmograph waveform displayed (if feature available)' }, { id: 'low_battery', label: 'Low battery indicator works' }] },
    'Nebulizer': { physical: [{ id: 'compressor_ok', label: 'Compressor unit casing intact; air vents clean' }, { id: 'med_cup', label: 'Medication cup present with cap; nozzle clear' }, { id: 'tubing_ok', label: 'Air tubing not kinked or split; connectors snug' }, { id: 'mask_mouthpiece', label: 'Mask / mouthpiece present and clean' }], functional: [{ id: 'compressor_runs', label: 'Compressor runs with consistent airflow' }, { id: 'nebulizes', label: 'Produces fine mist with medication solution' }, { id: 'timer_works', label: 'Auto shut-off timer functions (if equipped)' }] },
    'Glucose Meter': { physical: [{ id: 'meter_casing', label: 'Meter casing intact; test strip slot clean' }, { id: 'display_ok', label: 'Display intact; numbers readable without missing segments' }, { id: 'strip_drum', label: 'Test strip drum / vial not expired (if included)' }], functional: [{ id: 'powers_on', label: 'Device powers on with correct code setting' }, { id: 'reads_ok', label: 'Measures glucose with consistent reading' }, { id: 'memory_works', label: 'Memory stores and recalls previous readings' }] },
    'ECG Device': { physical: [{ id: 'casing_ok', label: 'Device casing intact; display not cracked' }, { id: 'leads_ok', label: 'Lead wires / electrodes present and not broken' }, { id: 'electrodes', label: 'Electrode pads / clips present and clean' }, { id: 'battery_ok', label: 'Battery compartment clean; terminals not corroded' }], functional: [{ id: 'powers_on', label: 'Device powers on and runs self-test' }, { id: 'records_ecg', label: 'Records ECG trace with clear signal without excessive noise' }, { id: 'display_ok', label: 'Display shows HR and ECG waveform' }, { id: 'prints_ok', label: 'Printer (if equipped) outputs clear tracing' }] },
    'Drilling Machine': { physical: [{ id: 'chuck_intact', label: 'Chuck jaws hold bit securely; tighten mechanism works' }, { id: 'casing_ok', label: 'Casing intact; no cracks from drops' }, { id: 'carbon_brushes', label: 'Carbon brush caps present (if brushed motor)' }, { id: 'cord_ok', label: 'Power cord insulation intact; plug not bent (cordless: battery terminals clean)' }], functional: [{ id: 'motor_runs', label: 'Motor runs at each speed setting without sparking or smoke' }, { id: 'trigger_variable', label: 'Variable speed trigger modulates speed smoothly' }, { id: 'forward_reverse', label: 'Forward / reverse switch engages both directions' }, { id: 'hammer_works', label: 'Hammer action engages (if hammer drill)' }] },
    'Welding Machine': { physical: [{ id: 'casing_ok', label: 'Casing intact; cooling vents not blocked' }, { id: 'cables_ok', label: 'Welding cables and electrode holder intact; insulation not melted' }, { id: 'clamps_ok', label: 'Ground clamp spring tension strong; teeth sharp' }, { id: 'controls_intact', label: 'Current / voltage dials, display, and switches intact' }], functional: [{ id: 'powers_on', label: 'Machine powers on; cooling fan runs' }, { id: 'welds_ok', label: 'Welds without arc instability or excessive spatter' }, { id: 'current_adjust', label: 'Current adjustment changes weld penetration' }, { id: 'thermal_cutoff', label: 'Thermal overload protection activates correctly' }] },
    'Power Tools': { physical: [{ id: 'casing_ok', label: 'Casing intact; vibration dampeners not worn' }, { id: 'chuck_collet', label: 'Chuck / collet holds accessory securely' }, { id: 'cord_battery', label: 'Corded: cable intact. Cordless: battery terminals clean' }, { id: 'safety_guard', label: 'Safety guard / trigger lock present and functional' }], functional: [{ id: 'motor_runs', label: 'Motor runs at full power without abnormal noise' }, { id: 'variable_speed', label: 'Variable speed or trigger control works' }, { id: 'brake_works', label: 'Brake stops accessory quickly (if applicable)' }] },
    'Testing Equipment': { physical: [{ id: 'casing_ok', label: 'Casing intact; display not cracked' }, { id: 'probes_leads', label: 'Test probes / leads present with intact insulation' }, { id: 'input_jacks', label: 'Input jacks clean; not loose' }, { id: 'battery_compart', label: 'Battery compartment / power input intact' }], functional: [{ id: 'powers_on', label: 'Device powers on; self-test passes' }, { id: 'measures_acc', label: 'Measurements within rated accuracy (spot-check known value)' }, { id: 'range_select', label: 'All range settings / autoranging function correctly' }, { id: 'display_reading', label: 'Display shows stable readings without excessive drift' }] },
    'Electronic Toys': { physical: [{ id: 'casing_ok', label: 'Toy casing intact; battery cover present' }, { id: 'buttons_intact', label: 'Buttons, switches, and controls intact and responsive' }, { id: 'speaker_grille', label: 'Speaker grille intact; not punctured' }, { id: 'battery_terminals', label: 'Battery terminals clean; not corroded' }], functional: [{ id: 'powers_on', label: 'Toy powers on; lights/sounds activate' }, { id: 'movement_works', label: 'Moving parts operate correctly' }, { id: 'sound_clear', label: 'Sound output clear (not distorted/muffled)' }, { id: 'remote_works', label: 'Remote control connects and operates (if RC toy)' }] },
    'Exercise Equipment': { physical: [{ id: 'frame_stable', label: 'Frame stable and level; joints tight' }, { id: 'seat_pads', label: 'Seat, pads, and grips present and not worn through' }, { id: 'cables_pulleys', label: 'Cables intact (no fraying); pulleys spin freely' }, { id: 'weight_stacks', label: 'Weight stack selector pin engages correctly' }], functional: [{ id: 'movement_smooth', label: 'Movement smooth throughout full range of motion' }, { id: 'resistance_adj', label: 'Resistance / weight adjustment mechanism works' }, { id: 'console_works', label: 'Console displays reps/time; sensors work' }] },
    'Street Light': { physical: [{ id: 'housing_intact', label: 'Housing intact; no cracks or corrosion' }, { id: 'lens_clean', label: 'Lens / cover clean; not yellowed or cracked' }, { id: 'mounting_bracket', label: 'Mounting bracket secure; bolts present' }, { id: 'wiring_ok', label: 'Wiring connections intact; insulation not brittle' }], functional: [{ id: 'lights_up', label: 'Lights up at full brightness' }, { id: 'sensor_works', label: 'Dusk-to-dawn / motion sensor triggers correctly (if equipped)' }, { id: 'waterproof', label: 'IP rating maintained; no moisture inside housing' }] },
    'Decorative Lighting': { physical: [{ id: 'string_intact', label: 'Light string intact (no broken or missing bulbs)' }, { id: 'control_box', label: 'Controller / transformer box intact and not cracked' }, { id: 'connectors', label: 'Connector plugs not bent or corroded' }, { id: 'bulbs_present', label: 'All LED bulbs / lamps present and seated securely' }], functional: [{ id: 'lights_up', label: 'All LEDs light up; no flickering' }, { id: 'modes_work', label: 'Lighting modes (steady/flash/fade) cycle correctly' }, { id: 'dimmer_works', label: 'Dimmer / brightness control works (if equipped)' }] },
  };

  function initYearSelects() {
    const ys = document.getElementById('productYear');
    const ps = document.getElementById('productPurchaseYear');
    if (ys) { ys.innerHTML = '<option value="">Select Year</option>'; for (let y = 2026; y >= 1990; y--) { const o = document.createElement('option'); o.value = y; o.textContent = y; ys.appendChild(o); } }
    if (ps) { ps.innerHTML = '<option value="">Select Year</option>'; for (let y = 2026; y >= 1990; y--) { const o = document.createElement('option'); o.value = y; o.textContent = y; ps.appendChild(o); } }
  }
  initYearSelects();

  function renderProductList() {
    const container = document.getElementById('productListContainer');
    if (!container) return;
    const p = data.products;
    if (p.length === 0) {
      container.innerHTML = '<p class="text-muted text-center py-3 mb-0"><i class="bi bi-inbox me-1"></i> No products added yet. Select a category and type above, then click Add.</p>';
      return;
    }
    container.innerHTML = p.map((pr, i) =>
      `<div class="product-list-item ${i === activeIdx ? 'active' : ''}" onclick="window.switchProduct(${i})">
        <span class="fw-semibold">${i + 1}. ${pr.type || 'Not selected'}</span>
        <span class="badge bg-${pr.category ? 'secondary' : 'danger'}">${pr.category || '?'}</span>
        ${p.length > 1 ? `<button class="btn btn-sm btn-outline-danger ms-2 py-0 px-1" onclick="event.stopPropagation();window.removeProduct(${i})">&times;</button>` : ''}
      </div>`
    ).join('');
  }

  window.switchProduct = function (idx) {
    saveActiveProduct();
    activeIdx = idx;
    loadActiveProduct();
    renderProductList();
    updateProductTabs();
    updateUI();
    if (currentStep >= 3 && currentStep <= 8) {
      if (currentStep === 3) refreshProductDetails();
      if (currentStep === 4) refreshImagePreview(); // toggle active zone + render preview
      if (currentStep === 5) refreshQuestions();
      if (currentStep === 6 && !isStaff) runAIAnalysis();
      if (currentStep === 7) calculateValue();
      if (currentStep === 8) updateCustomerQuoteStep();
    }
  };

  window.removeProduct = function (idx) {
    if (data.products.length <= 1) { showToast('At least one product is required', 'warning'); return; }
    data.products.splice(idx, 1);
    if (activeIdx >= data.products.length) activeIdx = data.products.length - 1;
    loadActiveProduct();
    renderProductList();
    updateProductTabs();
    if (currentStep === 3) refreshProductDetails();
    if (currentStep === 4) refreshImageUpload();
    if (currentStep === 5) refreshQuestions();
  };

  function saveActiveProduct() {
    if (currentStep === 1) saveCustomerStep();
    if (currentStep === 3) saveDetailsStep();
    if (currentStep === 5) saveQuestionsStep();
    if (currentStep === 8) saveExpectedValueStep();
  }

  function loadActiveProduct() {
    const p = data.products[activeIdx];
    if (!p) return;
    document.getElementById('selectedProductType').value = p.type || '';
    document.getElementById('selectedCategory').value = p.category || '';
    if (document.getElementById('productBrand')) document.getElementById('productBrand').value = p.brand || '';
    if (document.getElementById('productModel')) document.getElementById('productModel').value = p.model || '';
    if (document.getElementById('productSerial')) document.getElementById('productSerial').value = p.serial || '';
    if (document.getElementById('productYear')) document.getElementById('productYear').value = p.year || '';
    if (document.getElementById('productPurchaseYear')) document.getElementById('productPurchaseYear').value = p.purchaseYear || '';
    if (document.getElementById('productCondition')) document.getElementById('productCondition').value = p.condition || 'good';
    if (document.getElementById('productWarranty')) document.getElementById('productWarranty').value = p.warranty || '';
    if (document.getElementById('productOwnership')) document.getElementById('productOwnership').value = p.ownership || '';
    if (document.getElementById('productWeight')) document.getElementById('productWeight').value = p.weight || '';
    renderAccessories();
    renderSpecs();
    if (document.getElementById('productNotes')) document.getElementById('productNotes').value = p.notes || '';
    if (document.getElementById('qPowerOn')) document.getElementById('qPowerOn').value = p.qPowerOn || 'yes';
    if (document.getElementById('qDamage')) document.getElementById('qDamage').value = p.qDamage || 'none';
    if (document.getElementById('qAge')) document.getElementById('qAge').value = p.qAge || 'new';
    if (document.getElementById('qAccessories')) document.getElementById('qAccessories').value = p.qAccessories || 'all';
    if (document.getElementById('customerExpectedValue')) document.getElementById('customerExpectedValue').value = p.customerExpectedValue || '';
  }

  function updateProductTabs() {
    const container = document.getElementById('productTabs');
    if (!container) return;
    const p = data.products;
    if (p.length <= 1) { container.innerHTML = ''; return; }
    container.innerHTML = p.map((pr, i) =>
      `<button class="btn btn-sm ${i === activeIdx ? 'btn-success' : 'btn-outline-secondary'} me-1 mb-1" onclick="window.switchProduct(${i})">
        ${pr.type || 'Product ' + (i + 1)}
      </button>`
    ).join('');
  }

  const MAX_PHOTOS = 10;

  window.captureGPS = function () {
    const statusEl = document.getElementById('gpsStatus');
    if (!navigator.geolocation) {
      if (statusEl) statusEl.textContent = 'GPS not supported on this device';
      showToast('GPS not supported', 'error');
      return;
    }
    if (statusEl) statusEl.textContent = 'Capturing location...';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        data.customer.gpsLat = pos.coords.latitude.toFixed(7);
        data.customer.gpsLng = pos.coords.longitude.toFixed(7);
        document.getElementById('custGpsLat').value = data.customer.gpsLat;
        document.getElementById('custGpsLng').value = data.customer.gpsLng;
        if (statusEl) statusEl.textContent = `Location captured: ${data.customer.gpsLat}, ${data.customer.gpsLng}`;
        showToast('GPS location captured', 'success');
      },
      () => {
        if (statusEl) statusEl.textContent = 'Could not capture location';
        showToast('Failed to capture GPS location', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  function saveCustomerStep() {
    data.customer.name = document.getElementById('custName').value.trim();
    data.customer.phone = document.getElementById('custPhone').value.trim();
    data.customer.email = document.getElementById('custEmail').value.trim();
    data.customer.address = document.getElementById('custAddress').value.trim();
    data.customer.ward = document.getElementById('custWard').value.trim();
    data.customer.areaCategory = document.getElementById('custAreaCategory').value;
    data.customer.localBodyName = document.getElementById('custLocalBody')?.value.trim() || '';
    data.customer.village = document.getElementById('custVillage')?.value.trim() || '';
    data.customer.district = document.getElementById('custDistrict').value.trim();
    const streetVal = document.getElementById('custStreet')?.value.trim();
    data.customer.state = document.getElementById('custState').value.trim();
    data.customer.pincode = document.getElementById('custPincode').value.trim();
    data.customer.gpsLat = document.getElementById('custGpsLat')?.value || data.customer.gpsLat || '';
    data.customer.gpsLng = document.getElementById('custGpsLng')?.value || data.customer.gpsLng || '';
    if (streetVal && !data.customer.address.includes(streetVal)) {
      data.customer.address = streetVal + ', ' + data.customer.address;
    }
  }

  function customerLocationPayload(c) {
    const payload = {};
    if (c.village) payload.customer_village = c.village;
    if (c.localBodyName) {
      if (c.areaCategory === 'Corporation') payload.customer_corporation = c.localBodyName;
      else if (c.areaCategory === 'Municipality') payload.customer_municipality = c.localBodyName;
      else if (c.areaCategory === 'Panchayat') payload.customer_panchayat = c.localBodyName;
      else payload.customer_panchayat = c.localBodyName;
    }
    if (c.gpsLat) payload.customer_gps_lat = parseFloat(c.gpsLat);
    if (c.gpsLng) payload.customer_gps_lng = parseFloat(c.gpsLng);
    return payload;
  }

  function saveDetailsStep() {
    const p = data.products[activeIdx];
    p.brand = document.getElementById('productBrand').value.trim();
    p.model = document.getElementById('productModel').value.trim();
    p.serial = document.getElementById('productSerial').value.trim();
    p.year = document.getElementById('productYear').value;
    p.purchaseYear = document.getElementById('productPurchaseYear').value;
    p.condition = document.getElementById('productCondition').value;
    p.warranty = document.getElementById('productWarranty').value;
    p.ownership = document.getElementById('productOwnership').value;
    const accContainer = document.getElementById('productAccessoriesContainer');
    const selected = [];
    if (accContainer) accContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => selected.push(cb.value));
    p.accessories = selected;
    p.weight = parseFloat(document.getElementById('productWeight').value) || 0;
    const specsContainer = document.getElementById('productSpecsContainer');
    const specsObj = {};
    if (specsContainer) {
      specsContainer.querySelectorAll('select, input[type="text"]').forEach(el => {
        const key = el.dataset.specKey || el.id.replace('spec_', '');
        if (el.value) specsObj[key] = el.value;
      });
    }
    p.specs = specsObj;
    p.notes = document.getElementById('productNotes').value.trim();
  }

  function saveQuestionsStep() {
    const p = data.products[activeIdx];
    p.qPowerOn = document.getElementById('qPowerOn').value;
    p.qDamage = document.getElementById('qDamage').value;
    p.qAge = document.getElementById('qAge').value;
    p.qAccessories = document.getElementById('qAccessories').value;
    const container = document.getElementById('productSpecificQuestions');
    if (container) {
      const checks = {};
      if (p?.isCustom) {
        const customCondition = document.getElementById('sq_custom_condition');
        const customFunctionality = document.getElementById('sq_custom_functionality');
        const customNotes = document.getElementById('sq_custom_notes');
        checks.customCondition = customCondition ? customCondition.value : 'good';
        checks.customFunctionality = customFunctionality ? customFunctionality.value : 'full';
        checks.customNotes = customNotes ? customNotes.value : '';
      } else {
        container.querySelectorAll('input[type="checkbox"]').forEach(cb => { checks[cb.id.replace('sqchk_', '')] = cb.checked; });
      }
      p.productSpecificChecks = checks;
    }
  }

  function saveExpectedValueStep() {
    data.products.forEach((p, i) => {
      const inp = document.getElementById('custExpVal_' + i);
      p.customerExpectedValue = inp ? (parseFloat(inp.value) || null) : (p.customerExpectedValue || null);
    });
  }

  window.navigateStep = function (dir) {
    if (dir === 1 && !validateStep(currentStep)) return;
    let newStep = currentStep + dir;
    if (newStep < 1 || newStep > totalSteps) return;

    if (isStaff) {
      if (dir === 1 && currentStep === 5) newStep = 8;
      if (dir === -1 && currentStep === 8) newStep = 5;
    }

    saveActiveProduct();

    if (dir === 1 && currentStep === 2 && data.products.length === 0) {
      showToast('Please add at least one product', 'error');
      return;
    }

    if (newStep === 1) {
      ['custName','custPhone','custAddress','custEmail','custWard','custAreaCategory','custLocalBody','custVillage','custDistrict','custStreet','custState','custPincode'].forEach(clearFieldError);
    }
    if (newStep === 3) {
      const p = data.products[activeIdx];
      if (!p.category || !p.type) { showToast('Please set category and type for all products in Step 2', 'error'); return; }
      refreshProductDetails();
      renderAccessories();
      renderSpecs();
    }
    if (newStep === 4) refreshImageUpload();
    if (newStep === 5) refreshQuestions();
    if (newStep === 6 && !isStaff) runAIAnalysis();
    if (newStep === 7 || (isStaff && newStep === 8)) calculateValue();
    if (newStep === 8) updateCustomerQuoteStep();
    if (newStep === 9) buildSummary();

    currentStep = newStep;
    updateUI();
  };

  function clearFieldError(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('is-invalid'); }
  }

  function markFieldError(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.add('is-invalid'); el.focus(); }
  }

  function validateStep(step) {
    if (step === 1) {
      let valid = true;
      const fields = [
        { id: 'custName', label: 'Full Name' },
        { id: 'custPhone', label: 'Phone Number' },
        { id: 'custAddress', label: 'Street / Address' },
        { id: 'custDistrict', label: 'District' },
        { id: 'custState', label: 'State' },
      ];
      ['custName','custPhone','custAddress','custEmail','custWard','custAreaCategory','custLocalBody','custVillage','custDistrict','custStreet','custState','custPincode'].forEach(clearFieldError);
      for (const f of fields) {
        const el = document.getElementById(f.id);
        if (!el || !el.value.trim()) {
          markFieldError(f.id);
          showToast('Please enter ' + f.label, 'error');
          valid = false;
          break;
        }
      }
      if (!valid) return false;
      const phone = document.getElementById('custPhone').value.trim();
      if (phone.length < 10) {
        markFieldError('custPhone');
        showToast('Please enter a valid 10-digit phone number', 'error');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (data.products.length === 0) { showToast('Please add at least one product', 'error'); return false; }
      if (data.products.some(p => !p.type)) { showToast('All products must have a type selected', 'error'); return false; }
      return true;
    }
    return true;
  }

  function updateUI() {
    document.querySelectorAll('.wizard-step').forEach(el => {
      const step = parseInt(el.dataset.step);
      if (isStaff && (step === 6 || step === 7)) {
        el.classList.add('d-none');
        return;
      } else {
        el.classList.remove('d-none');
      }
      el.classList.remove('active', 'completed');
      if (step === currentStep) el.classList.add('active');
      else if (step < currentStep) el.classList.add('completed');
    });
    document.querySelectorAll('.wizard-step-content').forEach(el => {
      if (isStaff && (parseInt(el.dataset.step) === 6 || parseInt(el.dataset.step) === 7)) {
        el.classList.add('d-none');
        return;
      }
      el.classList.toggle('d-none', parseInt(el.dataset.step) !== currentStep);
    });
    document.getElementById('stepIndicator').textContent = 'Step ' + currentStep + ' of ' + totalSteps;
    document.getElementById('prevBtn').disabled = currentStep === 1;
    const isLast = currentStep === totalSteps;
    document.getElementById('nextBtn').classList.toggle('d-none', isLast);
    document.getElementById('submitBtn').classList.toggle('d-none', !isLast);
  }

  // ───────── Step 1: Customer Info ─────────
  // fields defined in HTML

  // ───────── Step 2: Product Categories (Multi-Product) ─────────
  function initCategoryDropdowns() {
    const catSel = document.getElementById('catCategory');
    const typeSel = document.getElementById('catType');
    if (!catSel || !typeSel) return;

    catSel.innerHTML = '<option value="">Select Category</option>';
    Object.keys(catDefs).forEach(k => {
      const o = document.createElement('option');
      o.value = k;
      o.textContent = k + ' - ' + catDefs[k].desc;
      catSel.appendChild(o);
    });

    catSel.addEventListener('change', function () {
      const cat = this.value;
      typeSel.innerHTML = '<option value="">Select Type</option>';
      typeSel.disabled = !cat;
      document.getElementById('customProductNameGroup').classList.add('d-none');
      if (cat && catDefs[cat]) {
        catDefs[cat].products.forEach(t => {
          const o = document.createElement('option');
          o.value = t;
          o.textContent = t;
          typeSel.appendChild(o);
        });
      }
    });

    typeSel.addEventListener('change', function () {
      const show = this.value === 'Others';
      document.getElementById('customProductNameGroup').classList.toggle('d-none', !show);
      if (!show) document.getElementById('customProductName').value = '';
    });
  }

  window.addProduct = function () {
    const cat = document.getElementById('catCategory').value;
    let type = document.getElementById('catType').value;
    if (!cat || !type) { showToast('Please select category and type', 'error'); return; }
    
    if (type === 'Others') {
      const customName = document.getElementById('customProductName').value.trim();
      if (!customName) { showToast('Please enter the product name', 'error'); return; }
      type = customName;
    }
    
    const p = makeProduct();
    p.category = cat;
    p.type = type;
    p.isCustom = type !== document.getElementById('catType').value || document.getElementById('catType').value === 'Others';
    data.products.push(p);
    activeIdx = data.products.length - 1;
    document.getElementById('catCategory').value = '';
    document.getElementById('catType').innerHTML = '<option value="">Select Type</option>';
    document.getElementById('catType').disabled = true;
    document.getElementById('customProductName').value = '';
    document.getElementById('customProductNameGroup').classList.add('d-none');
    renderProductList();
    updateProductTabs();
    showToast('Added: ' + type, 'success');
  };

  // ───────── Step 3: Product Details ─────────
  // ───────── Step 3: Product Details with selector ─────────
  function refreshProductDetails() {
    const select = document.getElementById('step3ProductSelect');
    if (!select) return;
    select.innerHTML = data.products.map((p, i) =>
      '<option value="' + i + '">Product ' + (i + 1) + ' - ' + (p.type || 'Unknown') + (p.brand ? ' (' + p.brand + ')' : '') + '</option>'
    ).join('');
    select.value = activeIdx;
    select.onchange = function () {
      saveActiveProduct();
      activeIdx = parseInt(this.value);
      loadActiveProduct();
      populateProductDetails();
      renderProductList();
      updateProductTabs();
      updateUI();
    };
    populateProductDetails();
  }

  function toggleCustomProductFields() {
    const p = data.products[activeIdx];
    const isCustom = p && p.isCustom;
    const hideIds = ['productSerial','productYear','productPurchaseYear','productWarranty','productOwnership','productWeight','productNotes'];
    const hideContainerIds = ['productAccessoriesContainer','productSpecsContainer'];
    const hideLabels = [
      'label[for="productAccessoriesContainer"]',
      'label[for="productSpecsContainer"]',
      'label[for="productWeight"]',
      'label[for="productSerial"]',
      'label[for="productYear"]',
      'label[for="productPurchaseYear"]',
      'label[for="productWarranty"]',
      'label[for="productOwnership"]',
      'label[for="productNotes"]',
    ];
    hideIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const col = el.closest('.col-md-4, .col-md-6, .col-12');
        if (col) col.style.display = isCustom ? 'none' : '';
        else el.style.display = isCustom ? 'none' : '';
      }
    });
    hideContainerIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const col = el.closest('.col-12');
        if (col) col.style.display = isCustom ? 'none' : '';
        else el.style.display = isCustom ? 'none' : '';
      }
    });
    hideLabels.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) {
        const col = el.closest('.col-12, .col-md-4, .col-md-6');
        if (col) col.style.display = isCustom ? 'none' : '';
        else el.style.display = isCustom ? 'none' : '';
      }
    });
  }

  async function populateProductDetails() {
    const p = data.products[activeIdx];
    if (!p) return;
    toggleCustomProductFields();
    const brandSel = document.getElementById('productBrand');
    const modelSel = document.getElementById('productModel');
    const savedBrand = brandSel.value;
    const savedModel = modelSel.value;
    brandSel.innerHTML = '<option value="">Select Brand</option>';
    modelSel.innerHTML = '<option value="">Select Model</option>';

    try {
      const res = await fetch(API_BASE + '/assessments/catalog/' + encodeURIComponent(p.type), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed');
      const d = await res.json();
      categoryCatalog = d.catalog || [];
      const brands = [...new Set(categoryCatalog.map(item => item.company))].sort();
      brands.forEach(b => { const o = document.createElement('option'); o.value = b; o.textContent = b; brandSel.appendChild(o); });

      if (!brandSel.dataset.bound) {
        brandSel.addEventListener('change', function () {
          modelSel.innerHTML = '<option value="">Select Model</option>';
          const models = categoryCatalog.filter(item => item.company === this.value).map(item => item.model).sort();
          models.forEach(m => { const o = document.createElement('option'); o.value = m; o.textContent = m; modelSel.appendChild(o); });
        });
        brandSel.dataset.bound = 'true';
      }

      const restoreBrand = p.brand || savedBrand || p.extractedBrand || '';
      if (restoreBrand && restoreBrand !== 'N/A') {
        brandSel.value = restoreBrand;
        brandSel.dispatchEvent(new Event('change'));
        const restoreModel = p.model || savedModel || p.extractedModel || '';
        if (restoreModel && restoreModel !== 'N/A') {
          modelSel.value = restoreModel;
        }
        if (restoreBrand === p.extractedBrand || p.extractedBrand && restoreBrand.includes(p.extractedBrand)) {
          const bb = document.getElementById('brandBadge');
          if (bb) bb.style.display = 'inline-block';
        }
        if (restoreModel === p.extractedModel || p.extractedModel && restoreModel.includes(p.extractedModel)) {
          const mb = document.getElementById('modelBadge');
          if (mb) mb.style.display = 'inline-block';
        }
      }
    } catch (e) {
      showToast('Error loading catalog', 'error');
    }
  }

  function renderAccessories() {
    const container = document.getElementById('productAccessoriesContainer');
    if (!container) return;
    const p = data.products[activeIdx];
    const type = p ? p.type : '';
    const saved = p && Array.isArray(p.accessories) ? p.accessories : [];
    const items = prodAccessories[type] || prodAccessories['Laptop'] || [];
    container.innerHTML = items.map(item =>
      `<div class="col-md-4 col-6">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="acc_${item.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}" value="${item}" ${saved.includes(item) ? 'checked' : ''}>
          <label class="form-check-label" for="acc_${item.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}">${item}</label>
        </div>
      </div>`
    ).join('');
  }

  function renderSpecs() {
    const container = document.getElementById('productSpecsContainer');
    if (!container) return;
    const p = data.products[activeIdx];
    const type = p ? p.type : '';
    const saved = p && typeof p.specs === 'object' && !Array.isArray(p.specs) ? p.specs : {};
    const fields = prodSpecs[type] || [];
    container.innerHTML = fields.map(f => {
      const id = 'spec_' + f.key;
      const val = saved[f.key] || '';
      if (f.type === 'select') {
        return `<div class="col-md-4 col-6">
          <label class="form-label small mb-0" for="${id}">${f.label}</label>
          <select class="form-select form-select-sm" id="${id}" data-spec-key="${f.key}">
            <option value="">-- Select --</option>
            ${f.options.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>`;
      }
      return `<div class="col-md-4 col-6">
        <label class="form-label small mb-0" for="${id}">${f.label}</label>
        <input type="text" class="form-control form-control-sm" id="${id}" data-spec-key="${f.key}" value="${val}">
      </div>`;
    }).join('');
  }

  // ───────── Step 4: Per-Product Image Upload (Single Box, Max 10) ─────────
  function refreshImageUpload() {
    const select = document.getElementById('step4ProductSelect');
    const zone = document.getElementById('step4UploadZone');
    if (!select || !zone) return;
    select.innerHTML = data.products.map((p, i) =>
      '<option value="' + i + '">Product ' + (i + 1) + ' - ' + (p.type || 'Unknown') + (p.brand ? ' (' + p.brand + ')' : '') + '</option>'
    ).join('');
    select.value = activeIdx;
    select.onchange = function () {
      saveActiveProduct();
      activeIdx = parseInt(this.value);
      loadActiveProduct();
      renderStep4Zone(activeIdx);
      renderProductList();
      updateProductTabs();
    };
    renderStep4Zone(activeIdx);
  }

  function renderStep4Zone(prodIdx) {
    const zone = document.getElementById('step4UploadZone');
    const p = data.products[prodIdx];
    if (!zone || !p) return;
    if (!p.files) p.files = [];
    const fileCount = p.files.length;
    let previewHtml = '';
    p.files.forEach((file, fi) => {
      previewHtml += `<div class="preview-item">
        <img src="" id="preview_${prodIdx}_${fi}" data-file-idx="${fi}" class="img-fluid" style="width:100%;height:100%;object-fit:cover;">
        <button class="remove-btn" onclick="window.removeProductImage(${prodIdx}, ${fi})">&times;</button>
      </div>`;
    });
    zone.innerHTML =
      '<div class="product-upload-zone">' +
      '<div class="d-flex align-items-center gap-2 mb-3">' +
      '<span class="badge bg-green">Product ' + (prodIdx + 1) + '</span>' +
      '<strong>' + (p.type || 'Unknown') + '</strong>' +
      (p.brand ? '<small class="text-muted">' + p.brand + (p.model ? ' / ' + p.model : '') + '</small>' : '') +
      '</div>' +
      '<div class="upload-area" id="uploadArea_' + prodIdx + '" onclick="document.getElementById(\'fileInput_' + prodIdx + '\').click()">' +
      '<i class="bi bi-cloud-arrow-up"></i>' +
      '<p class="mb-1 fw-semibold">Click to upload photos</p>' +
      '<small class="text-muted">' + fileCount + ' of ' + MAX_PHOTOS + ' photos uploaded</small>' +
      '<input type="file" id="fileInput_' + prodIdx + '" accept="image/*" multiple style="display:none" onchange="window.handleProductImages(' + prodIdx + ', this)">' +
      '</div>' +
      (fileCount > 0 ? '<div class="upload-preview" id="previewContainer_' + prodIdx + '">' + previewHtml + '</div>' : '') +
      '</div>';
    p.files.forEach((file, fi) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = document.getElementById('preview_' + prodIdx + '_' + fi);
        if (img) img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  window.handleProductImages = function (prodIdx, input) {
    const p = data.products[prodIdx];
    if (!p || !input.files) return;
    if (!p.files) p.files = [];
    const remaining = MAX_PHOTOS - p.files.length;
    if (remaining <= 0) { showToast('Maximum ' + MAX_PHOTOS + ' photos allowed', 'warning'); return; }
    const newFiles = Array.from(input.files).slice(0, remaining);
    for (const file of newFiles) {
      if (!file.type.startsWith('image/')) { showToast(file.name + ' is not an image', 'error'); continue; }
      if (file.size > 5 * 1024 * 1024) { showToast(file.name + ' is too large (max 5MB)', 'error'); continue; }
      p.files.push(file);
    }
    input.value = '';
    renderStep4Zone(prodIdx);
    if (p.files.length >= MAX_PHOTOS) showToast('Maximum ' + MAX_PHOTOS + ' photos reached', 'info');
  };

  window.removeProductImage = function (prodIdx, fileIdx) {
    const p = data.products[prodIdx];
    if (!p || !p.files) return;
    p.files.splice(fileIdx, 1);
    renderStep4Zone(prodIdx);
  };

  function refreshImagePreview() {
    const select = document.getElementById('step4ProductSelect');
    if (select) select.value = activeIdx;
    renderStep4Zone(activeIdx);
  }

  // ───────── Step 5: Questions ─────────
  function refreshQuestions() {
    const select = document.getElementById('step5ProductSelect');
    if (!select) return;
    select.innerHTML = data.products.map((p, i) =>
      '<option value="' + i + '">Product ' + (i + 1) + ' - ' + (p.type || 'Unknown') + (p.brand ? ' (' + p.brand + ')' : '') + '</option>'
    ).join('');
    select.value = activeIdx;
    select.onchange = function () {
      saveQuestionsStep();
      activeIdx = parseInt(this.value);
      loadActiveProduct();
      renderProductSpecificQuestions();
      toggleGeneralQuestions();
      renderProductList();
      updateProductTabs();
    };
    loadActiveProduct();
    renderProductSpecificQuestions();
    toggleGeneralQuestions();
  }

  function toggleGeneralQuestions() {
    const p = data.products[activeIdx];
    const col = document.getElementById('generalQuestionsColumn');
    if (col) {
      col.style.display = (p && p.isCustom) ? 'none' : '';
    }
  }

  function renderProductSpecificQuestions() {
    const container = document.getElementById('productSpecificQuestions');
    if (!container) return;
    const p = data.products[activeIdx];
    const type = p?.type || 'Fan';
    
    if (p?.isCustom) {
      let html = '<div class="col-12 alert alert-info"><i class="bi bi-info-circle me-2"></i>Custom product - answer general condition questions below.</div>';
      html += '<div class="col-12"><div class="form-floating mb-3"><select class="form-select" id="sq_custom_condition"><option value="excellent">Excellent - Like New</option><option value="good" selected>Good - Minor Wear</option><option value="fair">Fair - Visible Wear</option><option value="poor">Poor - Heavy Wear</option><option value="damaged">Damaged - Broken</option></select><label>Overall Condition</label></div></div>';
      html += '<div class="col-12"><div class="form-floating mb-3"><select class="form-select" id="sq_custom_functionality"><option value="full">Fully Functional</option><option value="partial">Partially Functional</option><option value="non">Non-Functional</option></select><label>Functionality Status</label></div></div>';
      html += '<div class="col-12"><div class="form-floating mb-3"><textarea class="form-control" id="sq_custom_notes" style="height:80px" placeholder="Describe the product condition in detail"></textarea><label>Additional Notes</label></div></div>';
      container.innerHTML = html;
      // Restore saved state
      if (p.productSpecificChecks) {
        if (document.getElementById('sq_custom_condition')) document.getElementById('sq_custom_condition').value = p.productSpecificChecks.customCondition || 'good';
        if (document.getElementById('sq_custom_functionality')) document.getElementById('sq_custom_functionality').value = p.productSpecificChecks.customFunctionality || 'full';
        if (document.getElementById('sq_custom_notes')) document.getElementById('sq_custom_notes').value = p.productSpecificChecks.customNotes || '';
      }
      return;
    }
    
    const checks = prodChecks[type] || prodChecks['Laptop'];
    let html = '<div class="col-12"><h6 class="fw-bold text-dark mb-2"><i class="bi bi-box-seam me-2 text-green"></i>Physical Condition</h6></div>';
    (checks.physical || []).forEach(item => {
      const checked = p?.productSpecificChecks && p.productSpecificChecks[item.id] !== false;
      html += `<div class="col-12"><div class="form-check"><input class="form-check-input" type="checkbox" id="sqchk_${item.id}" ${checked ? 'checked' : ''}><label class="form-check-label text-muted" for="sqchk_${item.id}">${item.label}</label></div></div>`;
    });
    html += '<div class="col-12 mt-3"><h6 class="fw-bold text-dark mb-2"><i class="bi bi-gear me-2 text-green"></i>Functional Check</h6></div>';
    (checks.functional || []).forEach(item => {
      const checked = p?.productSpecificChecks && p.productSpecificChecks[item.id] !== false;
      html += `<div class="col-12"><div class="form-check"><input class="form-check-input" type="checkbox" id="sqchk_${item.id}" ${checked ? 'checked' : ''}><label class="form-check-label text-muted" for="sqchk_${item.id}">${item.label}</label></div></div>`;
    });
    container.innerHTML = html;
  }

  // ───────── Step 6: Per-Product AI Analysis ─────────
  async function analyzeSingleProduct(p, i) {
    const type = p?.type || 'Unknown';
    try {
      const res = await fetch(API_BASE + '/assessments/ai-analyze', {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({
          product_type: type,
          filename: p?.files?.[0]?.name || '',
          questionnaire: {
            qPowerOn: p.qPowerOn || 'yes',
            qDamage: p.qDamage || 'none',
            qAge: p.qAge || 'new',
            qAccessories: p.qAccessories || 'all',
          },
          productDetails: {
            condition: p.condition || 'good',
            weight: p.weight || 0,
            brand: p.brand || '',
            model: p.model || '',
            hasStorage: ['Laptop', 'Desktop', 'Mobile', 'Tablet', 'Server'].includes(type),
          }
        })
      });
      const d = await res.json();
      if (d.analysis) {
        p.aiResult = d.analysis;
        p.extractedBrand = d.analysis.brand || '';
        p.extractedModel = d.analysis.model || '';
        return d.analysis;
      }
    } catch (e) { }
    return null;
  }

  function renderProductAIResult(analysis, p, i) {
    const brand = analysis?.brand || 'Not detected';
    const model = analysis?.model || 'Not detected';
    const ptype = analysis?.product_type || p?.type || 'Unknown';
    const score = analysis?.condition_score != null ? analysis.condition_score + '/100' : 'N/A';
    const cat = analysis?.category || 'N/A';
    const recycle = analysis?.recyclability || 'N/A';
    const risk = analysis?.data_risk || 'N/A';
    return `<div class="col-md-6">
      <div class="card border-light h-100">
        <div class="card-body">
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge bg-green">Product ${i + 1}</span>
            <strong>${p?.type || 'Unknown'}</strong>
          </div>
          <div class="ai-result-card-sm">
            <div class="ai-analysis-item"><span class="label">Brand</span><span class="value fw-bold text-green">${brand}</span></div>
            <div class="ai-analysis-item"><span class="label">Model</span><span class="value fw-bold text-green">${model}</span></div>
            <div class="ai-analysis-item"><span class="label">Type</span><span class="value">${ptype}</span></div>
            <div class="ai-analysis-item"><span class="label">Condition Score</span><span class="value">${score}</span></div>
            <div class="ai-analysis-item"><span class="label">Category</span><span class="value">${cat}</span></div>
            <div class="ai-analysis-item"><span class="label">Recyclability</span><span class="value">${recycle}</span></div>
            <div class="ai-analysis-item"><span class="label">Data Risk</span><span class="value">${risk}</span></div>
            <div class="mt-2"><small class="text-muted">Images: ${(p?.files?.length || 0)} uploaded</small></div>
          </div>
        </div>
      </div>
    </div>`;
  }

  async function runAIAnalysis() {
    const container = document.getElementById('perProductAIResults');
    if (!container) return;

    // Show loading state for all products
    let loadingHtml = '';
    data.products.forEach((p, i) => {
      loadingHtml += `<div class="col-md-6">
        <div class="card border-light h-100">
          <div class="card-body text-center py-4">
            <span class="badge bg-green mb-2">Product ${i + 1}</span>
            <p class="fw-semibold mb-1">${p.type || 'Unknown'}</p>
            <div class="spinner-border spinner-border-sm text-green mt-2"></div>
            <div class="text-muted small mt-1">Analyzing...</div>
          </div>
        </div>
      </div>`;
    });
    container.innerHTML = loadingHtml;

    // Analyze each product
    for (let i = 0; i < data.products.length; i++) {
      const p = data.products[i];
      const analysis = await analyzeSingleProduct(p, i);
      const cards = container.querySelectorAll('.col-md-6');
      if (cards[i]) {
        cards[i].outerHTML = renderProductAIResult(analysis, p, i);
      }
    }

    showToast('AI analysis complete for all products', 'success');
  }

  // ───────── Step 7: Valuation Engine ─────────
  function computeProductValue(p, index) {
    const baseMap = {
      'Laptop': 12000, 'Desktop': 8000, 'Server': 25000, 'Mobile Phone': 5000, 'Tablet': 7000,
      'Monitor': 3000, 'Printer': 2000, 'Router': 800,
      'Television': 5000, 'Air Conditioner': 8000, 'Refrigerator': 7000, 'Washing Machine': 4500,
      'Fan': 800, 'Microwave Oven': 2000, 'Music System': 1500,
      'Rice Cooker': 800, 'Induction Stove': 1000, 'Mixer Grinder': 1200, 'Vacuum Cleaner': 1500,
      'Iron Box': 400, 'Water Purifier': 3000, 'Geyser': 2500,
      'Drilling Machine': 1500, 'Welding Machine': 5000, 'Power Tools': 2000, 'Testing Equipment': 3000,
      'Gaming Console': 8000, 'Drone': 12000, 'Electronic Toys': 500, 'Treadmill': 10000, 'Exercise Equipment': 5000,
      'LED Bulb': 100, 'Tube Light': 150, 'Emergency Light': 300, 'Street Light': 2000, 'Decorative Lighting': 500,
      'Blood Pressure Monitor': 500, 'Thermometer': 200, 'Pulse Oximeter': 300, 'Nebulizer': 1500, 'Glucose Meter': 800, 'ECG Device': 5000,
    };
    const scrapMap = {
      'Laptop': 600, 'Desktop': 400, 'Server': 1000, 'Mobile Phone': 200, 'Tablet': 300,
      'Monitor': 150, 'Printer': 100, 'Router': 50,
      'Television': 300, 'Air Conditioner': 500, 'Refrigerator': 400, 'Washing Machine': 300,
      'Fan': 50, 'Microwave Oven': 100, 'Music System': 80,
      'Rice Cooker': 40, 'Induction Stove': 50, 'Mixer Grinder': 60, 'Vacuum Cleaner': 80,
      'Iron Box': 30, 'Water Purifier': 100, 'Geyser': 150,
      'Drilling Machine': 80, 'Welding Machine': 200, 'Power Tools': 100, 'Testing Equipment': 150,
      'Gaming Console': 300, 'Drone': 500, 'Electronic Toys': 30, 'Treadmill': 500, 'Exercise Equipment': 300,
      'LED Bulb': 10, 'Tube Light': 15, 'Emergency Light': 20, 'Street Light': 100, 'Decorative Lighting': 30,
      'Blood Pressure Monitor': 30, 'Thermometer': 10, 'Pulse Oximeter': 20, 'Nebulizer': 80, 'Glucose Meter': 40, 'ECG Device': 200,
    };

    const matched = categoryCatalog.find(item => item.company === p.brand && item.model === p.model);
    const base = matched ? matched.rebuyValue : (baseMap[p.type] || 2000);
    const scrap = matched ? matched.scrapValue : (scrapMap[p.type] || 100);

    const powerMult = p.qPowerOn === 'yes' ? 1.0 : (p.qPowerOn === 'intermittent' ? 0.6 : 0.2);
    const damageMult = p.qDamage === 'none' ? 1.0 : (p.qDamage === 'scratches' ? 0.85 : (p.qDamage === 'cracks' ? 0.5 : 0.2));
    const ageMult = p.qAge === 'new' ? 1.0 : (p.qAge === 'medium' ? 0.85 : (p.qAge === 'old' ? 0.65 : 0.45));
    const accMult = p.qAccessories === 'all' ? 1.0 : (p.qAccessories === 'partial' ? 0.85 : 0.7);

    const type = p.type || 'Fan';
    const checks = prodChecks[type] || prodChecks['Laptop'];
    let totalChecks = 0, checkedCount = 0;
    if (checks) {
      totalChecks = (checks.physical?.length || 0) + (checks.functional?.length || 0);
      (checks.physical || []).forEach(item => { if (p.productSpecificChecks && p.productSpecificChecks[item.id] !== false) checkedCount++; });
      (checks.functional || []).forEach(item => { if (p.productSpecificChecks && p.productSpecificChecks[item.id] !== false) checkedCount++; });
    }
    const checklistFactor = totalChecks > 0 ? (0.7 + 0.3 * (checkedCount / totalChecks)) : 1.0;

    const cond = p.condition || 'good';
    const condMap = { excellent: 1.0, good: 0.85, fair: 0.7, poor: 0.5, damaged: 0.3 };
    const conditionFactor = condMap[cond] || 0.85;
    const conditionMultiplier = conditionFactor * powerMult * damageMult * ageMult * accMult * checklistFactor;

    const weightKg = parseFloat(p.weight) || 1.0;
    const weightFactor = weightKg ? Math.min(weightKg / 10, 2) : 1;
    const brandStr = p.brand || 'Generic';
    const marketFactor = parseFloat((0.9 + (brandStr.length % 5) * 0.05).toFixed(2));

    let estimated = base * conditionMultiplier * weightFactor * marketFactor;
    estimated = Math.max(estimated, scrap);
    estimated = Math.round(estimated);

    p.estimatedValue = estimated;
    p.valueMin = Math.round(estimated * 0.7);
    p.valueMax = Math.round(estimated * 1.3);
  }

  function calculateValue() {
    if (!data.products.length) return;
    data.products.forEach((p, i) => computeProductValue(p, i));
    const container = document.getElementById('allProductsValuation');
    if (!container) return;
    if (isStaff) {
      container.innerHTML = '<div class="alert alert-info mb-0"><i class="bi bi-lock me-2"></i>Valuation is calculated automatically and is not visible to field staff. Proceed to capture customer expected value.</div>';
      return;
    }
    let totalMin = 0, totalMax = 0;
    let html = '';
    data.products.forEach((p, i) => {
      totalMin += p.valueMin || 0;
      totalMax += p.valueMax || 0;
      html += `<div class="col-md-6">
        <div class="card border-light h-100">
          <div class="card-body py-3">
            <h6 class="fw-bold mb-1">${i + 1}. ${p.type || '-'}</h6>
            <small class="text-muted">${p.brand || ''}${p.model ? ' / ' + p.model : ''}</small>
            <div class="d-flex justify-content-between mt-2">
              <span class="text-danger small"><i class="bi bi-arrow-down-circle"></i> Min: <strong>\u20B9${(p.valueMin || 0).toLocaleString('en-IN')}</strong></span>
              <span class="text-success small"><i class="bi bi-arrow-up-circle"></i> Max: <strong>\u20B9${(p.valueMax || 0).toLocaleString('en-IN')}</strong></span>
            </div>
          </div>
        </div>
      </div>`;
    });
    html += `<div class="col-12">
      <div class="alert alert-success py-2 mb-0 text-center">
        <strong>Total Deal Value: </strong>\u20B9${totalMin.toLocaleString('en-IN')} - \u20B9${totalMax.toLocaleString('en-IN')}
      </div>
    </div>`;
    container.innerHTML = html;
  }

  // ───────── Step 8: Expected Value ─────────
  function updateCustomerQuoteStep() {
    if (!data.products.length) return;
    const container = document.getElementById('allProductsQuotation');
    if (!container) return;
    let html = '';
    data.products.forEach((p, i) => {
      html += `<div class="col-md-6">
        <div class="card border-light h-100">
          <div class="card-body py-3">
            <h6 class="fw-bold mb-1">${i + 1}. ${p.type || '-'}</h6>
            <small class="text-muted">${p.brand || ''}${p.model ? ' / ' + p.model : ''}</small>
            ${!isStaff ? `<p class="small text-muted mt-2 mb-2">Suggested range: \u20B9${(p.valueMin || 0).toLocaleString('en-IN')} - \u20B9${(p.valueMax || 0).toLocaleString('en-IN')}</p>` : ''}
            <label class="form-label small mb-1">Customer Expected Value (\u20B9)</label>
            <input type="number" class="form-control" id="custExpVal_${i}" value="${p.customerExpectedValue || ''}" min="0" step="1" placeholder="Enter amount">
          </div>
        </div>
      </div>`;
    });
    container.innerHTML = html;
  }

  // ───────── Step 9: Summary ─────────
  function buildSummary() {
    saveActiveProduct();
    const c = data.customer;
    const summary = document.getElementById('summaryContent');
    let html = `
      <div class="mb-3"><h6 class="fw-bold text-green"><i class="bi bi-person me-2"></i>Customer</h6>
      <p class="mb-1">${c.name || '-'} | ${c.phone || '-'}${c.email ? ' | ' + c.email : ''}</p>
      <p class="text-muted small mb-0">${c.address || ''}${c.village ? ', ' + c.village : ''}${c.localBodyName ? ', ' + c.localBodyName : ''}${c.areaCategory ? ' (' + c.areaCategory + ')' : ''}${c.district ? ', ' + c.district : ''}${c.state ? ', ' + c.state : ''}${c.pincode ? ' - ' + c.pincode : ''}</p></div>
      <hr>
      <h6 class="fw-bold text-green mb-3"><i class="bi bi-box me-2"></i>Products (${data.products.length})</h6>`;
    data.products.forEach((p, i) => {
      html += `<div class="card mb-2 border-light">
        <div class="card-body py-2 px-3">
          <div class="d-flex justify-content-between align-items-center">
            <div><strong>${i + 1}. ${p.type || '-'}</strong> <span class="badge bg-secondary ms-1">${p.category || ''}</span></div>
            ${!isStaff ? `<div class="text-end"><span class="text-green fw-bold">\u20B9${(p.valueMin || 0).toLocaleString('en-IN')} - \u20B9${(p.valueMax || 0).toLocaleString('en-IN')}</span></div>` : ''}
          </div>
          <small class="text-muted">${p.brand || ''}${p.brand && p.model ? ' / ' : ''}${p.model || ''}${p.condition ? ' | ' + p.condition : ''}</small>
          ${p.customerExpectedValue ? `<br><small class="text-info">Customer Expected: \u20B9${p.customerExpectedValue.toLocaleString('en-IN')}</small>` : ''}
        </div>
      </div>`;
    });
    summary.innerHTML = html;
  }

  // ───────── Submit ─────────
  window.submitAssessment = async function () {
    saveActiveProduct();
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Submitting...';

    const products = data.products;
    const customer = data.customer;
    let successCount = 0;
    let failCount = 0;

    // Generate a single order ID for all products from this customer
    const now = new Date();
    const seq = String(now.getFullYear()).slice(-2) + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    const dealGroupId = 'ORD-' + seq;

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const c = customer;

      try {
        const accessories = Array.isArray(p.accessories)
          ? p.accessories
          : (p.accessories ? String(p.accessories).split(',').map(s => s.trim()).filter(Boolean) : []);
        const specs = (p.specs && typeof p.specs === 'object' && !Array.isArray(p.specs)) ? p.specs : {};

        const body = {
          customer_name: c.name, customer_email: c.email, customer_phone: c.phone,
          customer_address: c.address, customer_state: c.state, customer_district: c.district,
          customer_pincode: c.pincode, customer_area_category: c.areaCategory,
          customer_ward_number: c.ward,
          ...customerLocationPayload(c),
          brand: p.brand, model: p.model, serial_number: p.serial,
          year_of_manufacture: p.year ? parseInt(p.year, 10) : null,
          purchase_year: p.purchaseYear ? parseInt(p.purchaseYear, 10) : null,
          condition: p.condition || 'good', warranty_status: p.warranty,
          ownership_type: p.ownership,
          accessories_available: accessories.length ? accessories.join(', ') : '',
          weight_kg: p.weight || 1,
          specifications: Object.keys(specs).length ? JSON.stringify(specs) : '',
          notes: p.notes,
          product_category: p.category,
          product_type: p.type,
          value_estimate: p.estimatedValue || 0, value_min: p.valueMin || 0,
          value_max: p.valueMax || 0, customer_expected_value: p.customerExpectedValue || 0,
          deal_group_id: dealGroupId + '-' + String.fromCharCode(65 + i),
          status: 'draft',
        };

        const res = await fetch(API_BASE + '/assessments', {
          method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body)
        });
        const created = await res.json();
        if (!res.ok) throw new Error(created.error || 'Failed to create assessment');
        const id = created.assessment.id;

        try {
          await fetch(API_BASE + '/assessments/' + id + '/details', {
            method: 'PUT', headers: getAuthHeaders(),
            body: JSON.stringify({
              verification_answers: { power_on: p.qPowerOn, damage: p.qDamage, age: p.qAge, accessories: p.qAccessories },
              functional_status: p.productSpecificChecks,
            })
          });
        } catch (e) { }

        const allFiles = p.files || [];
        for (const file of allFiles) {
          const fd = new FormData();
          fd.append('image', file);
          fd.append('assessment_id', id);
          fd.append('image_type', 'general');
          try {
            await fetch(API_BASE + '/assessments/upload-image', {
              method: 'POST', headers: { 'Authorization': getAuthHeaders()['Authorization'] }, body: fd
            });
          } catch (e) { }
        }

        const subRes = await fetch(API_BASE + '/assessments/' + id + '/submit', {
          method: 'POST', headers: getAuthHeaders()
        });
        const submitted = await subRes.json();
        if (!subRes.ok) throw new Error(submitted.error || 'Submit failed');
        successCount++;
      } catch (err) {
        failCount++;
        console.error('Product ' + (i + 1) + ' failed:', err);
      }
    }

    if (successCount > 0) {
      const msg = isStaff
        ? 'Assessment submitted successfully!'
        : successCount + ' of ' + products.length + ' assessments submitted successfully!';
      showToast(msg, 'success');
      setTimeout(() => window.location.href = 'assessment-history.html', 1500);
    } else {
      showToast('Submission failed for all products', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Submit Assessment';
    }
  };

  // ───────── Reset ─────────
  window.resetWizard = function (silent) {
    if (!silent && !confirm('Cancel this assessment?')) return;
    resetData();
  };

  // ───────── Init ─────────
  initCategoryDropdowns();
  renderProductList();
  updateProductTabs();
  updateUI();
})();
