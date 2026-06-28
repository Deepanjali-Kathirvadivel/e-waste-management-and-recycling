require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const sequelize = require('../src/config/database');
const bcrypt = require('bcryptjs');
const { User, Region, ProductCatalog, Facility, LogisticsRoute, Assessment, AssessmentImage, AssessmentDetail, ActivityLog, ForecastData, ForecastResult, SustainabilityScore, Recommendation } = require('../src/models');

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('Database reset & synced');

    // Regions (Primary Coverage)
    const regions = await Region.bulkCreate([
      { name: 'Coimbatore', type: 'city' },
      { name: 'Chennai', type: 'city' },
      { name: 'Trichy', type: 'city' },
      { name: 'Kochi', type: 'city' },
      { name: 'Salem', type: 'city' },
    ]);
    console.log(`Created ${regions.length} regions`);

    // Users
    const hash = await bcrypt.hash('password', 10);
    const adminHash = await bcrypt.hash('Admin@123', 10);
    const rootHash = await bcrypt.hash('root@123', 10);

    const users = await User.bulkCreate([
      { username: 'root', email: 'root@greenera.in', password_hash: rootHash, full_name: 'Root User', phone: '9876543210', role: 'root', region_id: 1 },
      { username: 'admin', email: 'admin@greenera.in', password_hash: adminHash, full_name: 'Super Admin', phone: '9876543211', role: 'admin', region_id: 1 },
      { username: 'admin_tn', email: 'admin.tn@greenera.in', password_hash: adminHash, full_name: 'Tamil Nadu Admin', phone: '9876543212', role: 'admin', region_id: 1 },

      { username: 'employee', email: 'employee@greenera.in', password_hash: adminHash, full_name: 'Staff User', phone: '9876543215', role: 'employee', region_id: 1 },
      { username: 'manager', email: 'manager@greenera.in', password_hash: adminHash, full_name: 'HR Manager', phone: '9876543220', role: 'manager', region_id: 1 },

      { username: 'emp_priya', email: 'priya@greenera.in', password_hash: hash, full_name: 'Priya Sharma', phone: '9876543216', role: 'employee', region_id: 1 },
      { username: 'emp_ravi', email: 'ravi@greenera.in', password_hash: hash, full_name: 'Ravi Kumar', phone: '9876543217', role: 'employee', region_id: 2 },
      { username: 'emp_sneha', email: 'sneha@greenera.in', password_hash: hash, full_name: 'Sneha Patel', phone: '9876543218', role: 'employee', region_id: 3 },
      { username: 'emp_arun', email: 'arun@greenera.in', password_hash: hash, full_name: 'Arun Raj', phone: '9876543219', role: 'employee', region_id: 1 },
      // Supply Chain role users
      { username: 'sc_raju', email: 'sc.raju@greenera.in', password_hash: hash, full_name: 'Raju Supply Chain', phone: '9876543224', role: 'supply_chain', region_id: 1 },
      { username: 'sc_geetha', email: 'sc.geetha@greenera.in', password_hash: hash, full_name: 'Geetha Supply Chain', phone: '9876543225', role: 'supply_chain', region_id: 2 },
    ]);
    console.log(`Created ${users.length} users`);

    // Product Catalog - expanded to cover all GreenEra categories
    const products = await ProductCatalog.bulkCreate([
      // IT - Information Technology
      { name: 'Laptop', category: 'IT', icon: 'laptop', base_price: 12000 },
      { name: 'Desktop', category: 'IT', icon: 'pc', base_price: 8000 },
      { name: 'Server', category: 'IT', icon: 'server', base_price: 25000 },
      { name: 'Mobile Phone', category: 'IT', icon: 'phone', base_price: 5000 },
      { name: 'Tablet', category: 'IT', icon: 'tablet', base_price: 8000 },
      { name: 'Monitor', category: 'IT', icon: 'monitor', base_price: 3000 },
      { name: 'Printer', category: 'IT', icon: 'printer', base_price: 4000 },
      { name: 'Router', category: 'IT', icon: 'router', base_price: 1500 },
      { name: 'Keyboard', category: 'IT', icon: 'keyboard', base_price: 500 },
      { name: 'Mouse', category: 'IT', icon: 'mouse', base_price: 300 },
      // CE - Consumer Electronics
      { name: 'Television', category: 'CE', icon: 'tv', base_price: 5000 },
      { name: 'Air Conditioner', category: 'CE', icon: 'ac', base_price: 8000 },
      { name: 'Refrigerator', category: 'CE', icon: 'fridge', base_price: 7000 },
      { name: 'Washing Machine', category: 'CE', icon: 'washing-machine', base_price: 4500 },
      { name: 'Fan', category: 'CE', icon: 'fan', base_price: 800 },
      { name: 'Microwave Oven', category: 'CE', icon: 'microwave', base_price: 3000 },
      { name: 'Music System', category: 'CE', icon: 'music', base_price: 2500 },
      // LS - Large/Small Household Appliances
      { name: 'Rice Cooker', category: 'LS', icon: 'rice-cooker', base_price: 1500 },
      { name: 'Induction Stove', category: 'LS', icon: 'stove', base_price: 2000 },
      { name: 'Mixer Grinder', category: 'LS', icon: 'mixer', base_price: 2000 },
      { name: 'Vacuum Cleaner', category: 'LS', icon: 'vacuum', base_price: 3000 },
      { name: 'Iron Box', category: 'LS', icon: 'iron', base_price: 600 },
      { name: 'Water Purifier', category: 'LS', icon: 'water', base_price: 4000 },
      { name: 'Geyser', category: 'LS', icon: 'geyser', base_price: 3500 },
      // EE - Electrical & Electronic Tools
      { name: 'Drilling Machine', category: 'EE', icon: 'drill', base_price: 2500 },
      { name: 'Welding Machine', category: 'EE', icon: 'welder', base_price: 8000 },
      { name: 'Power Tools', category: 'EE', icon: 'power-tool', base_price: 3500 },
      { name: 'Testing Equipment', category: 'EE', icon: 'test', base_price: 5000 },
      // TLS - Toys, Leisure & Sports
      { name: 'Gaming Console', category: 'TLS', icon: 'gamepad', base_price: 8000 },
      { name: 'Drone', category: 'TLS', icon: 'drone', base_price: 12000 },
      { name: 'Electronic Toys', category: 'TLS', icon: 'toy', base_price: 1000 },
      { name: 'Treadmill', category: 'TLS', icon: 'treadmill', base_price: 15000 },
      { name: 'Exercise Equipment', category: 'TLS', icon: 'exercise', base_price: 5000 },
      // LI - Lighting Instruments
      { name: 'LED Bulb', category: 'LI', icon: 'bulb', base_price: 200 },
      { name: 'Tube Light', category: 'LI', icon: 'tube-light', base_price: 300 },
      { name: 'Emergency Light', category: 'LI', icon: 'emergency', base_price: 500 },
      { name: 'Street Light', category: 'LI', icon: 'street-light', base_price: 2000 },
      { name: 'Decorative Lighting', category: 'LI', icon: 'decorative', base_price: 800 },
      // MD - Medical Devices
      { name: 'Blood Pressure Monitor', category: 'MD', icon: 'bp', base_price: 1500 },
      { name: 'Thermometer', category: 'MD', icon: 'thermometer', base_price: 300 },
      { name: 'Pulse Oximeter', category: 'MD', icon: 'oximeter', base_price: 1000 },
      { name: 'Nebulizer', category: 'MD', icon: 'nebulizer', base_price: 2000 },
      { name: 'Glucose Meter', category: 'MD', icon: 'glucose', base_price: 1200 },
      { name: 'ECG Device', category: 'MD', icon: 'ecg', base_price: 5000 },
    ]);
    console.log(`Created ${products.length} product types`);

    // Facilities (Collection Centers)
    const facilities = await Facility.bulkCreate([
      { name: 'CC001 - Coimbatore Hub', type: 'collection_center', region_id: 1, capacity: 5000, rent: 8000, electricity_cost: 2000, staff_cost: 10000 },
      { name: 'CC002 - Chennai Center', type: 'collection_center', region_id: 2, capacity: 3000, rent: 4000, electricity_cost: 1200, staff_cost: 6000 },
      { name: 'CC003 - Trichy Center', type: 'collection_center', region_id: 3, capacity: 2500, rent: 3500, electricity_cost: 1100, staff_cost: 5000 },
      { name: 'CC004 - Kochi Center', type: 'collection_center', region_id: 4, capacity: 3000, rent: 4500, electricity_cost: 1400, staff_cost: 6500 },
      { name: 'CC005 - Salem Center', type: 'collection_center', region_id: 5, capacity: 2000, rent: 3000, electricity_cost: 1000, staff_cost: 5000 },
      { name: 'Coimbatore Head Recycler Hub', type: 'preprocessing_unit', region_id: 1, capacity: 10000, rent: 15000, electricity_cost: 4000, staff_cost: 18000 },
    ]);
    console.log(`Created ${facilities.length} facilities`);

    // Assign supply chain users to their facilities
    await User.update({ facility_id: 1 }, { where: { username: 'sc_raju' } });
    await User.update({ facility_id: 2 }, { where: { username: 'sc_geetha' } });
    console.log('Assigned facility_id to SC users');

    // Logistics Routes
    const routes = await LogisticsRoute.bulkCreate([
      { route_name: 'Coimbatore CC to Head Hub', origin_facility_id: 1, destination_facility_id: 6, distance_km: 12, fuel_cost: 100, driver_salary: 150, vehicle_cost: 100, maintenance_cost: 50 },
      { route_name: 'Chennai CC to Head Hub', origin_facility_id: 2, destination_facility_id: 6, distance_km: 500, fuel_cost: 1200, driver_salary: 600, vehicle_cost: 800, maintenance_cost: 300 },
      { route_name: 'Trichy CC to Head Hub', origin_facility_id: 3, destination_facility_id: 6, distance_km: 250, fuel_cost: 600, driver_salary: 300, vehicle_cost: 400, maintenance_cost: 150 },
      { route_name: 'Kochi CC to Head Hub', origin_facility_id: 4, destination_facility_id: 6, distance_km: 300, fuel_cost: 700, driver_salary: 350, vehicle_cost: 450, maintenance_cost: 200 },
      { route_name: 'Salem CC to Head Hub', origin_facility_id: 5, destination_facility_id: 6, distance_km: 160, fuel_cost: 400, driver_salary: 200, vehicle_cost: 250, maintenance_cost: 100 },
    ]);
    console.log(`Created ${routes.length} logistics routes`);

    // Assessments (sample data)
    const brands = ['Samsung', 'LG', 'Sony', 'Whirlpool', 'Dell', 'HP', 'Apple', 'OnePlus', 'Lenovo', 'Panasonic'];
    const models = ['UE43TU7100', 'OLED55C1', 'XBR65X90J', 'WM3400CW', 'Inspiron 15', 'Pavilion 14', 'iPhone 14', 'Nord CE3', 'ThinkPad X1', 'TH-50GX700'];
    const conditions = ['excellent', 'good', 'fair', 'poor', 'damaged'];
    const classifications = ['reusable', 'repairable', 'recyclable', 'scrap'];

    const closedDealIds = new Set();
    // Pick ~15% of assessments (some hr_approved ones) to be closed deals
    const totalAssessments = 175;
    const numClosed = Math.floor(totalAssessments * 0.15);
    while (closedDealIds.size < numClosed) {
      closedDealIds.add(Math.floor(Math.random() * totalAssessments));
    }

    const assessmentData = [];
    for (let i = 0; i < totalAssessments; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const user = users[Math.floor(Math.random() * 5) + 5];
      const conditionVal = conditions[Math.floor(Math.random() * conditions.length)];
      const classVal = classifications[Math.floor(Math.random() * classifications.length)];
      const statusRand = Math.random();
const isClosed = closedDealIds.has(i);
let statusVal;
if (isClosed) {
  statusVal = 'completed';
} else if (statusRand > 0.7) {
  statusVal = 'pending_manager_review';
} else if (statusRand > 0.5) {
  statusVal = 'approved';
} else if (statusRand > 0.35) {
  statusVal = 'rejected';
} else if (statusRand > 0.2) {
  statusVal = 'in_progress';
} else {
  statusVal = 'draft';
}
      
      const supplyChainStatuses = ['hub_assigned', 'supply_chain_assigned', 'otp_verified', 'payment_completed', 'collected', 'in_transit', 'delivered_to_hub', 'received', 'reusability_analysis'];
      if (i >= 5 && i < 45 && !isClosed) {
        const scIdx = Math.floor((i - 5) / 4);
        if (scIdx < supplyChainStatuses.length) statusVal = supplyChainStatuses[scIdx];
      }

      // Multi-peak up and down fluctuation: Jan (15), Feb (32) [up], Mar (20) [down], Apr (45) [up], May (25) [down], Jun (38) [up]
      let mOffset = 0;
      if (i < 15) mOffset = 5;
      else if (i < 47) mOffset = 4;
      else if (i < 67) mOffset = 3;
      else if (i < 112) mOffset = 2;
      else if (i < 137) mOffset = 1;
      else mOffset = 0;

      const now = new Date();
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - mOffset, 1);
      let randomDay = 1 + Math.floor(Math.random() * 27);
      if (mOffset === 0) {
        randomDay = Math.max(1, Math.min(now.getDate(), randomDay));
      }
      const createdDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), randomDay, 12, 0, 0);
      const approvedVal = Math.floor(Math.random() * 3000) + 3000;

      // Supply chain assignment logic
      let assignedHubId = null;
      let supplyChainUserId = null;
      let movementHistory = null;
      let scDealNum = null;
      let scReceiptNum = null;
      let scCollNum = null;
      let scOtpVerified = false;
      let scDealClosedAt = null;
      let scClassification = null;

      if (supplyChainStatuses.includes(statusVal)) {
        const userRegion = user.region_id;
        const hub = facilities.find(f => f.region_id === userRegion && f.type === 'collection_center');
        assignedHubId = hub?.id || facilities[0]?.id || null;
        supplyChainUserId = userRegion === 1 ? users.find(u => u.username === 'sc_raju')?.id : users.find(u => u.username === 'sc_geetha')?.id;

        if (['payment_completed', 'collected', 'in_transit', 'delivered_to_hub', 'received', 'reusability_analysis', 'completed'].includes(statusVal)) {
          scDealNum = `DEAL-${String(i + 1).padStart(6, '0')}`;
          scReceiptNum = `RCPT-${String(i + 1).padStart(6, '0')}-${Date.now().toString(36).toUpperCase()}`;
          scCollNum = `COL-${String(i + 1).padStart(6, '0')}`;
          scOtpVerified = true;
          scDealClosedAt = new Date(createdDate.getTime() + 86400000 * (2 + Math.floor(Math.random() * 2)));
          movementHistory = [{ action: 'hub_assigned', assigned_at: new Date().toISOString() }];
          if (['supply_chain_assigned', 'otp_verified', 'payment_completed', 'collected', 'in_transit', 'delivered_to_hub', 'received', 'reusability_analysis'].includes(statusVal)) {
            movementHistory.push({ action: 'assigned_to_sc', assigned_to: supplyChainUserId, assigned_at: new Date().toISOString() });
          }
          if (['otp_verified', 'payment_completed', 'collected', 'in_transit', 'delivered_to_hub', 'received', 'reusability_analysis'].includes(statusVal)) {
            movementHistory.push({ action: 'otp_verified', verified_at: new Date().toISOString() });
          }
          if (['payment_completed', 'collected', 'in_transit', 'delivered_to_hub', 'received', 'reusability_analysis'].includes(statusVal)) {
            movementHistory.push({ action: 'collected', collected_at: new Date().toISOString() });
          }
          if (['collected', 'in_transit', 'delivered_to_hub', 'received', 'reusability_analysis'].includes(statusVal)) {
            movementHistory.push({ action: 'in_transit', updated_at: new Date().toISOString() });
          }
          if (['delivered_to_hub', 'received', 'reusability_analysis'].includes(statusVal)) {
            movementHistory.push({ action: 'delivered_to_hub', updated_at: new Date().toISOString() });
          }
          if (['received', 'reusability_analysis'].includes(statusVal)) {
            movementHistory.push({ action: 'received_at_hub', received_at: new Date().toISOString() });
          }
          if (['reusability_analysis'].includes(statusVal)) {
            movementHistory.push({ action: 'forwarded_for_analysis', forwarded_at: new Date().toISOString() });
          }
        }
        scClassification = statusVal === 'completed' ? classVal : null;
      }

      assessmentData.push({
        user_id: user.id,
        customer_name: ['Rajesh Kumar', 'Priya Singh', 'Anand Murugan', 'Lakshmi Nair', 'Vikram Raj'][Math.floor(Math.random() * 5)],
        customer_email: `customer${i}@email.com`,
        customer_phone: `98765${String(40000 + i).slice(0, 5)}`,
        customer_address: `${Math.floor(Math.random() * 100) + 1}, ${['MG Road', 'Sathy Road', 'Avani Road', 'Marine Drive', 'Church Street'][Math.floor(Math.random() * 5)]}`,
        product_type_id: product.id,
        brand: brands[Math.floor(Math.random() * brands.length)],
        model: models[Math.floor(Math.random() * models.length)],
        year_of_manufacture: 2015 + Math.floor(Math.random() * 9),
        condition: conditionVal,
        weight_kg: Math.floor(Math.random() * 30) + 2,
        notes: [null, 'Minor scratches', 'Screen working', 'Power cable missing', 'Fully functional'][Math.floor(Math.random() * 5)],
        status: statusVal,
        assigned_hub_id: assignedHubId,
        supply_chain_user_id: supplyChainUserId,
        movement_history: movementHistory,
        hr_approved_value: (isClosed || supplyChainStatuses.includes(statusVal)) ? approvedVal : null,
        deal_number: isClosed ? `DEAL-${String(i + 1).padStart(6, '0')}` : scDealNum,
        receipt_number: isClosed ? `RCPT-${String(i + 1).padStart(6, '0')}` : scReceiptNum,
        collection_number: isClosed ? `COL-${String(i + 1).padStart(6, '0')}` : scCollNum,
        otp_verified: isClosed ? true : scOtpVerified,
        deal_closed_at: isClosed ? new Date(createdDate.getTime() + 86400000 * (1 + Math.floor(Math.random() * 3))) : scDealClosedAt,
        value_estimate: Math.floor(Math.random() * 5000) + 7000,
        ai_score: Math.floor(Math.random() * 40) + 55,
        classification: statusVal === 'completed' ? classVal : scClassification,
        submitted_at: statusVal === 'completed' || supplyChainStatuses.includes(statusVal) ? createdDate : null,
        createdAt: createdDate,
        updatedAt: createdDate,
        created_at: createdDate,
        updated_at: createdDate,
      });
    }
    const assessments = await Assessment.bulkCreate(assessmentData);
    console.log(`Created ${assessments.length} assessments`);

    // Activities
    const customerNames = ['Rajesh Kumar', 'Priya Singh', 'Anand Murugan', 'Lakshmi Nair', 'Vikram Raj'];
    const productNames = ['Television', 'Laptop', 'Mobile', 'Refrigerator', 'Air Conditioner'];
    const staffNames = ['Priya Sharma', 'Ravi Kumar', 'Sneha Patel', 'Arun Raj'];
    const actionTypes = [
      { action: 'assessment_created', type: 'assessment', getMeta: () => ({ customer: customerNames[Math.floor(Math.random() * customerNames.length)], product: productNames[Math.floor(Math.random() * productNames.length)] }) },
      { action: 'assessment_submitted', type: 'assessment', getMeta: () => ({ customer: customerNames[Math.floor(Math.random() * customerNames.length)], product: productNames[Math.floor(Math.random() * productNames.length)], value: Math.floor(Math.random() * 5000 + 3000) }) },
      { action: 'staff_created', type: 'staff', getMeta: () => ({ name: staffNames[Math.floor(Math.random() * staffNames.length)], role: 'employee' }) },
      { action: 'staff_updated', type: 'staff', getMeta: () => ({ name: staffNames[Math.floor(Math.random() * staffNames.length)] }) },
      { action: 'forecast_generated', type: 'forecast', getMeta: () => ({ region: ['Coimbatore', 'Chennai', 'Trichy'][Math.floor(Math.random() * 3)] }) },
      { action: 'data_imported', type: 'import', getMeta: () => ({ count: Math.floor(Math.random() * 500 + 50), type: 'assessments' }) },
    ];
    const activityData = [];
    for (let i = 0; i < 30; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const at = actionTypes[Math.floor(Math.random() * actionTypes.length)];
      activityData.push({
        user_id: user.id,
        action: at.action,
        entity_type: at.type,
        entity_id: Math.floor(Math.random() * 50) + 1,
        metadata: at.getMeta(),
        created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      });
    }
    await ActivityLog.bulkCreate(activityData);
    console.log(`Created ${activityData.length} activities`);

    // Forecast Uploaded Data
    const adminUser = users.find(u => u.role === 'admin');
    if (adminUser) {
      const uploadTypes = ['collection', 'revenue', 'recycling', 'growth'];
      const fData = [];
      for (let i = 0; i < 8; i++) {
        const region = regions.filter(r => r.type === 'city')[i % regions.filter(r => r.type === 'city').length];
        fData.push({
          type: uploadTypes[i % uploadTypes.length],
          filename: `seed_upload_${i+1}.csv`,
          original_name: `Quarterly_Data_${i+1}.csv`,
          row_count: Math.floor(Math.random() * 200 + 50),
          status: 'imported',
          uploaded_by: adminUser.id,
          created_at: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
        });
      }
      await ForecastData.bulkCreate(fData);
      console.log(`Created ${fData.length} forecast upload records`);
    }

    // Forecast Results
    const forecastYears = [2025, 2026, 2027, 2028, 2029];
    const forecastData = [];
    regions.filter((r) => r.type === 'city').forEach((region) => {
      forecastYears.forEach((year, idx) => {
        forecastData.push({
          region_id: region.id,
          forecast_year: year,
          forecasted_waste: Math.floor((Math.random() * 10000 + 2000 + idx * 2000) * 0.25),
          growth_rate: parseFloat((Math.random() * 10 + 5).toFixed(1)),
          opportunity_score: Math.floor(Math.random() * 30) + 60,
          predicted_revenue: Math.floor((Math.random() * 100000 + 100000 + idx * 20000) * 0.25),
        });
      });
    });
    await ForecastResult.bulkCreate(forecastData);
    console.log(`Created ${forecastData.length} forecast results`);

    // Sustainability Scores
    await SustainabilityScore.bulkCreate(
      regions.filter((r) => r.type === 'city').map((r) => ({
        region_id: r.id,
        score: Math.floor(Math.random() * 20) + 65,
        collection_efficiency: parseFloat((Math.random() * 20 + 70).toFixed(1)),
        recovery_rate: parseFloat((Math.random() * 20 + 60).toFixed(1)),
        transportation_efficiency: parseFloat((Math.random() * 15 + 70).toFixed(1)),
        facility_utilization: parseFloat((Math.random() * 20 + 65).toFixed(1)),
        calculated_at: new Date(),
      }))
    );
    console.log('Created sustainability scores');

    // Recommendations
    await Recommendation.bulkCreate([
      { type: 'new_center', title: 'Expand to Salem Collection Center', description: 'Salem is showing high collection potential. Establishing a center there will capture the central TN market.', feasibility: 'high', estimated_cost: 3000000, estimated_benefit: 10000000 },
      { type: 'new_unit', title: 'Add Dismantling Unit at Chennai', description: 'Chennai center has high intake volumes. A dedicated regional dismantling unit will reduce logistics overhead.', feasibility: 'high', estimated_cost: 6000000, estimated_benefit: 18000000 },
      { type: 'expansion', title: 'Expand Coimbatore Head Recycler Hub Capacity', description: 'Head hub is operating at 85% capacity. Expansion is needed to handle incoming volume from Chennai and Kochi.', feasibility: 'high', estimated_cost: 12000000, estimated_benefit: 35000000 },
    ]);
    console.log('Created recommendations');

    console.log('\n=== SEEDING COMPLETE ===');
    console.log('Demo Credentials:');
    console.log('  Root:       root / root@123');
    console.log('  Admin:      admin / Admin@123');
    console.log('  Employee:   employee / Admin@123');
    console.log('  Manager:    manager / Admin@123');
    console.log(`  Others:     password = "password"`);
    console.log(`\nServer: http://localhost:${process.env.PORT || 5400}`);

  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
