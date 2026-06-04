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
      { name: 'Pollachi', type: 'city' },
      { name: 'Mettupalayam', type: 'city' },
      { name: 'Sulur', type: 'city' },
      { name: 'Annur', type: 'city' },
      { name: 'Kinathukadavu', type: 'city' },
      { name: 'Valparai', type: 'city' },
      { name: 'Tamil Nadu', type: 'state' },
    ]);
    console.log(`Created ${regions.length} regions`);

    // Users
    const hash = await bcrypt.hash('password', 10);
    const adminHash = await bcrypt.hash('Admin@123', 10);
    const rootHash = await bcrypt.hash('root@123', 10);

    const users = await User.bulkCreate([
      { username: 'root', email: 'root@greenera.in', password_hash: rootHash, full_name: 'Root User', phone: '9876543210', role: 'root', region_id: 1 },
      { username: 'admin', email: 'admin@greenera.in', password_hash: adminHash, full_name: 'Super Admin', phone: '9876543211', role: 'admin', region_id: 1 },
      { username: 'admin_tn', email: 'admin.tn@greenera.in', password_hash: adminHash, full_name: 'Tamil Nadu Admin', phone: '9876543212', role: 'admin', region_id: 8 },
      { username: 'pollachi_mgr', email: 'pollachi@greenera.in', password_hash: hash, full_name: 'Pollachi Center Manager', phone: '9876543213', role: 'center_manager', region_id: 2 },
      { username: 'mettupalayam_mgr', email: 'mettupalayam@greenera.in', password_hash: hash, full_name: 'Mettupalayam Center Manager', phone: '9876543214', role: 'center_manager', region_id: 3 },
      { username: 'employee', email: 'employee@greenera.in', password_hash: adminHash, full_name: 'Staff User', phone: '9876543215', role: 'employee', region_id: 1 },
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
      { name: 'Keyboard', category: 'Accessories', icon: 'keyboard', base_price: 300 },
      { name: 'Mouse', category: 'Accessories', icon: 'mouse', base_price: 150 },
    ]);
    console.log(`Created ${products.length} product types`);

    // Facilities (Collection Centers)
    const facilities = await Facility.bulkCreate([
      { name: 'CC001 - Green Era Central Collection Hub', type: 'collection_center', region_id: 1, capacity: 5000, rent: 150000, electricity_cost: 45000, staff_cost: 200000 },
      { name: 'CC002 - Green Era North Collection Center - Thudiyalur', type: 'collection_center', region_id: 1, capacity: 3000, rent: 80000, electricity_cost: 25000, staff_cost: 120000 },
      { name: 'CC003 - Green Era South Collection Center - Kuniyamuthur', type: 'collection_center', region_id: 1, capacity: 2500, rent: 70000, electricity_cost: 22000, staff_cost: 100000 },
      { name: 'CC004 - Green Era East Collection Center - Peelamedu', type: 'collection_center', region_id: 1, capacity: 3000, rent: 90000, electricity_cost: 28000, staff_cost: 130000 },
      { name: 'CC005 - Green Era West Collection Center - Vadavalli', type: 'collection_center', region_id: 1, capacity: 2000, rent: 60000, electricity_cost: 20000, staff_cost: 100000 },
      { name: 'CC006 - Green Era Industrial Collection Hub - SIDCO', type: 'collection_center', region_id: 1, capacity: 4000, rent: 120000, electricity_cost: 35000, staff_cost: 160000 },
      { name: 'CC007 - Green Era IT Collection Hub - Saravanampatti', type: 'collection_center', region_id: 1, capacity: 3500, rent: 100000, electricity_cost: 30000, staff_cost: 140000 },
      { name: 'Green Era Processing Hub - Edayarpalayam', type: 'preprocessing_unit', region_id: 1, capacity: 10000, rent: 300000, electricity_cost: 80000, staff_cost: 350000 },
    ]);
    console.log(`Created ${facilities.length} facilities`);

    // Logistics Routes (to Processing Hub)
    const routes = await LogisticsRoute.bulkCreate([
      { route_name: 'Central Hub to Processing Hub', origin_facility_id: 1, destination_facility_id: 8, distance_km: 12, fuel_cost: 1500, driver_salary: 2000, vehicle_cost: 1000, maintenance_cost: 500 },
      { route_name: 'North Center to Processing Hub', origin_facility_id: 2, destination_facility_id: 8, distance_km: 18, fuel_cost: 2000, driver_salary: 2500, vehicle_cost: 1500, maintenance_cost: 600 },
      { route_name: 'South Center to Processing Hub', origin_facility_id: 3, destination_facility_id: 8, distance_km: 22, fuel_cost: 2500, driver_salary: 2500, vehicle_cost: 1500, maintenance_cost: 700 },
      { route_name: 'East Center to Processing Hub', origin_facility_id: 4, destination_facility_id: 8, distance_km: 15, fuel_cost: 1800, driver_salary: 2000, vehicle_cost: 1200, maintenance_cost: 500 },
      { route_name: 'West Center to Processing Hub', origin_facility_id: 5, destination_facility_id: 8, distance_km: 20, fuel_cost: 2200, driver_salary: 2500, vehicle_cost: 1500, maintenance_cost: 600 },
      { route_name: 'Industrial Hub to Processing Hub', origin_facility_id: 6, destination_facility_id: 8, distance_km: 10, fuel_cost: 1200, driver_salary: 2000, vehicle_cost: 1000, maintenance_cost: 400 },
      { route_name: 'IT Hub to Processing Hub', origin_facility_id: 7, destination_facility_id: 8, distance_km: 14, fuel_cost: 1600, driver_salary: 2000, vehicle_cost: 1200, maintenance_cost: 500 },
    ]);
    console.log(`Created ${routes.length} logistics routes`);

    // Assessments (sample data)
    const brands = ['Samsung', 'LG', 'Sony', 'Whirlpool', 'Dell', 'HP', 'Apple', 'OnePlus', 'Lenovo', 'Panasonic'];
    const models = ['UE43TU7100', 'OLED55C1', 'XBR65X90J', 'WM3400CW', 'Inspiron 15', 'Pavilion 14', 'iPhone 14', 'Nord CE3', 'ThinkPad X1', 'TH-50GX700'];
    const conditions = ['excellent', 'good', 'fair', 'poor', 'damaged'];
    const classifications = ['reusable', 'repairable', 'recyclable', 'scrap'];

    const assessmentData = [];
    for (let i = 0; i < 50; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const user = users[Math.floor(Math.random() * 5) + 8];
      const conditionVal = conditions[Math.floor(Math.random() * conditions.length)];
      const classVal = classifications[Math.floor(Math.random() * classifications.length)];
      const statusVal = Math.random() > 0.2 ? 'completed' : (Math.random() > 0.5 ? 'draft' : 'in_progress');
      const daysAgo = Math.floor(Math.random() * 90);
      const createdDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

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
        value_estimate: Math.floor(Math.random() * 15000) + 500,
        ai_score: Math.floor(Math.random() * 40) + 55,
        classification: statusVal === 'completed' ? classVal : null,
        submitted_at: statusVal === 'completed' ? createdDate : null,
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
          forecasted_waste: Math.floor(Math.random() * 10000) + 2000 + idx * 2000,
          growth_rate: parseFloat((Math.random() * 10 + 5).toFixed(1)),
          opportunity_score: Math.floor(Math.random() * 30) + 60,
          predicted_revenue: Math.floor(Math.random() * 50000000) + 10000000 + idx * 10000000,
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
      { type: 'new_center', title: 'Expand to Pollachi Collection Center', description: 'Pollachi is a growing market. Establishing a collection center could increase coverage by 20%.', feasibility: 'high', estimated_cost: 3000000, estimated_benefit: 10000000 },
      { type: 'new_unit', title: 'Add Dismantling Unit at Industrial Hub', description: 'CC006 SIDCO hub needs dedicated dismantling capacity to reduce processing hub congestion.', feasibility: 'medium', estimated_cost: 6000000, estimated_benefit: 18000000 },
      { type: 'expansion', title: 'Expand Processing Hub Capacity', description: 'Edayarpalayam processing hub at 85% capacity. Expansion needed to handle forecasted growth.', feasibility: 'high', estimated_cost: 12000000, estimated_benefit: 35000000 },
      { type: 'logistics_optimization', title: 'Optimize West Zone Route', description: 'Alternative route from Vadavalli to processing hub via Mettupalayam Road could reduce distance.', feasibility: 'medium', estimated_cost: 500000, estimated_benefit: 1500000 },
      { type: 'new_center', title: 'Open Collection Center in Tiruppur', description: 'Tiruppur is a major industrial hub. Expanding there could increase industrial e-waste collection by 30%.', feasibility: 'medium', estimated_cost: 5000000, estimated_benefit: 15000000 },
    ]);
    console.log('Created recommendations');

    console.log('\n=== SEEDING COMPLETE ===');
    console.log('Demo Credentials:');
    console.log('  Root:     root / root@123');
    console.log('  Admin:    admin / Admin@123');
    console.log('  Employee: employee / Admin@123');
    console.log(`  All seeded users: password = "password" (except root/admin/employee)`);
    console.log(`\nServer: http://localhost:${process.env.PORT || 5000}`);

  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
