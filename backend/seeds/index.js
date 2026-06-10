require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const sequelize = require('../src/config/database');
const bcrypt = require('bcryptjs');
const { User, Region, ProductCatalog, Facility, LogisticsRoute, Assessment, AssessmentImage, AssessmentDetail, ActivityLog, ForecastResult, SustainabilityScore, Recommendation } = require('../src/models');

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
      { username: 'chennai_mgr', email: 'chennai@greenera.in', password_hash: hash, full_name: 'Chennai Center Manager', phone: '9876543213', role: 'center_manager', region_id: 2 },
      { username: 'trichy_mgr', email: 'trichy@greenera.in', password_hash: hash, full_name: 'Trichy Center Manager', phone: '9876543214', role: 'center_manager', region_id: 3 },
      { username: 'employee', email: 'employee@greenera.in', password_hash: adminHash, full_name: 'Staff User', phone: '9876543215', role: 'employee', region_id: 1 },
      { username: 'hr_user', email: 'hr@greenera.in', password_hash: adminHash, full_name: 'HR Manager', phone: '9876543220', role: 'hr', region_id: 1 },
      { username: 'hr_senior', email: 'hr.senior@greenera.in', password_hash: hash, full_name: 'Senior HR Officer', phone: '9876543221', role: 'hr', region_id: 2 },
      { username: 'emp_priya', email: 'priya@greenera.in', password_hash: hash, full_name: 'Priya Sharma', phone: '9876543216', role: 'employee', region_id: 1 },
      { username: 'emp_ravi', email: 'ravi@greenera.in', password_hash: hash, full_name: 'Ravi Kumar', phone: '9876543217', role: 'employee', region_id: 2 },
      { username: 'emp_sneha', email: 'sneha@greenera.in', password_hash: hash, full_name: 'Sneha Patel', phone: '9876543218', role: 'employee', region_id: 3 },
      { username: 'emp_arun', email: 'arun@greenera.in', password_hash: hash, full_name: 'Arun Raj', phone: '9876543219', role: 'employee', region_id: 1 },
    ]);
    console.log(`Created ${users.length} users`);

    // Product Catalog
    const products = await ProductCatalog.bulkCreate([
      { name: 'Television', category: 'Home Appliance', icon: 'tv', base_price: 5000 },
      { name: 'Air Conditioner', category: 'Home Appliance', icon: 'ac', base_price: 8000 },
      { name: 'Refrigerator', category: 'Home Appliance', icon: 'fridge', base_price: 7000 },
      { name: 'Washing Machine', category: 'Home Appliance', icon: 'washing-machine', base_price: 4500 },
      { name: 'Fan', category: 'Home Appliance', icon: 'fan', base_price: 800 },
      { name: 'Laptop', category: 'Electronics', icon: 'laptop', base_price: 12000 },
      { name: 'Mobile', category: 'Electronics', icon: 'mobile', base_price: 5000 },
      { name: 'Monitor', category: 'Electronics', icon: 'monitor', base_price: 3000 },
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

    const assessmentData = [];
    const totalAssessments = 175;
    for (let i = 0; i < totalAssessments; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const user = users[Math.floor(Math.random() * 5) + 5];
      const conditionVal = conditions[Math.floor(Math.random() * conditions.length)];
      const classVal = classifications[Math.floor(Math.random() * classifications.length)];
      const statusRand = Math.random();
const statusVal = statusRand > 0.5 ? 'completed' : (statusRand > 0.3 ? 'pending_hr_approval' : (statusRand > 0.15 ? 'hr_approved' : (Math.random() > 0.5 ? 'draft' : 'in_progress')));
      
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
        // Individual estimate values average to ₹9,500, keeping peak month (45 items) under ₹5,00,000
        value_estimate: Math.floor(Math.random() * 5000) + 7000,
        ai_score: Math.floor(Math.random() * 40) + 55,
        classification: statusVal === 'completed' ? classVal : null,
        submitted_at: statusVal === 'completed' ? createdDate : null,
        createdAt: createdDate,
        updatedAt: createdDate,
        created_at: createdDate,
        updated_at: createdDate,
      });
    }
    const assessments = await Assessment.bulkCreate(assessmentData);
    console.log(`Created ${assessments.length} assessments`);

    // Activities
    const actionTypes = [
      'assessment_created', 'assessment_submitted', 'staff_created',
      'staff_updated', 'forecast_generated', 'data_imported',
    ];
    const activityData = [];
    for (let i = 0; i < 30; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      activityData.push({
        user_id: user.id,
        action: actionTypes[Math.floor(Math.random() * actionTypes.length)],
        entity_type: ['assessment', 'staff', 'forecast'][Math.floor(Math.random() * 3)],
        entity_id: Math.floor(Math.random() * 50) + 1,
        metadata: { random: true },
        created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      });
    }
    await ActivityLog.bulkCreate(activityData);
    console.log(`Created ${activityData.length} activities`);

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
    console.log('  Root:     root / root@123');
    console.log('  Admin:    admin / Admin@123');
    console.log('  Employee: employee / Admin@123');
    console.log(`  All seeded users: password = "password" (except root/admin/employee)`);
    console.log(`\nServer: http://localhost:${process.env.PORT || 5400}`);

  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
