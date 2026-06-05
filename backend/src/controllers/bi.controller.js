const { Op } = require('sequelize');
const { SustainabilityScore, Recommendation, Assessment, Region, User, Facility, LogisticsRoute, ForecastResult } = require('../models');
const catchAsync = require('../utils/catchAsync');
const aiStub = require('../services/ai-stub.service');
const reportService = require('../services/report.service');

exports.sustainability = catchAsync(async (req, res) => {
  const scores = await SustainabilityScore.findOne({ order: [['calculated_at', 'DESC']] });
  const data = scores ? scores.toJSON() : aiStub.generateSustainabilityScore();

  const regions = await Region.findAll({ where: { type: 'city' } });
  const regionData = await Promise.all(regions.map(async (r) => {
    const count = await Assessment.count({
      include: [{ model: User, where: { region_id: r.id }, attributes: [] }],
    });
    return { region: r.name, value: count };
  }));

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }
  const labels = months.map((m) => m.toLocaleString('default', { month: 'short' }));
  const trend = await Promise.all(months.map(async (m) => {
    const start = new Date(m.getFullYear(), m.getMonth(), 1);
    const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    return Assessment.count({ where: { created_at: { [Op.gte]: start, [Op.lt]: end } } });
  }));

  res.json({ 
    ...data, 
    region_performance: regionData.filter((r) => r.value > 0), 
    sustainability_trend: { labels, data: trend } 
  });
});

exports.profitability = catchAsync(async (req, res) => {
  // Sum value estimates of completed assessments
  const totalRevenue = await Assessment.sum('value_estimate', { where: { status: 'completed' } }) || 1500000;
  
  // Sum monthly costs from facilities
  const facilityRent = await Facility.sum('rent') || 0;
  const facilityElectricity = await Facility.sum('electricity_cost') || 0;
  const facilityStaff = await Facility.sum('staff_cost') || 0;
  const totalFacilityCost = facilityRent + facilityElectricity + facilityStaff;

  // Sum monthly logistics route costs
  const routes = await LogisticsRoute.findAll();
  const totalLogisticsCost = routes.reduce((sum, r) => {
    return sum + (r.fuel_cost || 0) + (r.driver_salary || 0) + (r.vehicle_cost || 0) + (r.maintenance_cost || 0);
  }, 0);

  // Total operating costs (Assume quarterly/3-month operational baseline)
  const totalCosts = totalFacilityCost + totalLogisticsCost > 0 ? (totalFacilityCost + totalLogisticsCost) * 3 : Math.round(totalRevenue * 0.6);

  const profit = totalRevenue - totalCosts;
  const savings = Math.round(profit * 0.15);
  const roi = totalCosts > 0 ? parseFloat(((profit / totalCosts) * 100).toFixed(1)) : 15.0;
  const paybackPeriod = profit > 0 ? parseFloat((totalCosts / (profit / 12)).toFixed(1)) : 12.0;

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }
  const labels = months.map((m) => m.toLocaleString('default', { month: 'short' }));
  const profitTrendData = await Promise.all(months.map(async (m) => {
    const start = new Date(m.getFullYear(), m.getMonth(), 1);
    const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    const rev = await Assessment.sum('value_estimate', { 
      where: { 
        created_at: { [Op.gte]: start, [Op.lt]: end }, 
        status: 'completed' 
      } 
    }) || 0;
    const cost = rev > 0 ? Math.round(rev * 0.6) : 0;
    return { revenue: rev, cost, profit: rev - cost };
  }));

  res.json({
    current_profit: profit,
    predicted_profit: Math.round(profit * 1.25),
    savings,
    roi,
    payback_period: paybackPeriod,
    profit_trend: {
      labels,
      revenue: profitTrendData.map(d => d.revenue),
      cost: profitTrendData.map(d => d.cost),
      profit: profitTrendData.map(d => d.profit)
    }
  });
});

exports.scenarios = catchAsync(async (req, res) => {
  const currentRevenue = await Assessment.sum('value_estimate', { where: { status: 'completed' } }) || 1500000;
  
  const facilityRent = await Facility.sum('rent') || 0;
  const facilityElectricity = await Facility.sum('electricity_cost') || 0;
  const facilityStaff = await Facility.sum('staff_cost') || 0;
  const totalFacilityCost = (facilityRent + facilityElectricity + facilityStaff) * 3;

  const routes = await LogisticsRoute.findAll();
  const totalLogisticsCost = routes.reduce((sum, r) => {
    return sum + (r.fuel_cost || 0) + (r.driver_salary || 0) + (r.vehicle_cost || 0) + (r.maintenance_cost || 0);
  }, 0) * 3;

  const baseCost = totalFacilityCost + totalLogisticsCost > 0 ? (totalFacilityCost + totalLogisticsCost) : Math.round(currentRevenue * 0.6);
  const baseProfit = currentRevenue - baseCost;

  const scenarios = [
    { id: 'A', name: 'Current Infrastructure', profit: baseProfit, cost: baseCost, description: 'Baseline operations with existing collection centers and facilities.' },
    { id: 'B', name: 'New Collection Center', profit: Math.round(baseProfit + currentRevenue * 0.12 - 120000), cost: Math.round(baseCost + 120000), description: 'Establish a new center (+12% revenue, +18% facility and labor costs).' },
    { id: 'C', name: 'New Preprocessing Unit', profit: Math.round(baseProfit + currentRevenue * 0.15 - 180000), cost: Math.round(baseCost + 180000), description: 'Establish a new unit (+15% revenue, +14% facility and processing costs).' },
    { id: 'D', name: 'Facility Expansion', profit: Math.round(baseProfit + currentRevenue * 0.25 - 300000), cost: Math.round(baseCost + 300000), description: 'Upgrade current processing hub (+25% revenue, +20% overhead costs).' },
    { id: 'E', name: 'Route Optimization', profit: Math.round(baseProfit + currentRevenue * 0.05 + totalLogisticsCost * 0.1), cost: Math.round(baseCost - totalLogisticsCost * 0.1), description: 'Optimize logistics network (+5% collection efficiency, -10% fuel and transport costs).' },
  ];
  res.json({ scenarios });
});

exports.recommendations = catchAsync(async (req, res) => {
  const { transportation, facility, labor, operational } = req.body;
  const totalCost = (parseFloat(transportation) || 0) + (parseFloat(facility) || 0) + (parseFloat(labor) || 0) + (parseFloat(operational) || 0);
  const revenue = await Assessment.sum('value_estimate', { where: { status: 'completed' } }) || 1500000;
  
  const profit = revenue - totalCost;
  const feasibility = profit > 0 ? 'high' : 'low';

  const recommendations = [
    { type: 'logistics_optimization', title: 'Optimize Logistics Routes', description: 'Consolidate shipments to reduce transportation costs by up to 15%. Recommend dynamic route scheduling.', feasibility: 'high', estimated_cost: Math.round(totalCost * 0.05), estimated_benefit: Math.round(revenue * 0.1) },
    { type: 'new_center', title: 'Open New Collection Center', description: 'Expand collection coverage to high-density zones in Pollachi or Sulur.', feasibility: profit > 300000 ? 'high' : 'medium', estimated_cost: 200000, estimated_benefit: 600000 },
    { type: 'expansion', title: 'Expand Processing Facility', description: 'Upgrade sorting machinery at Coimbatore Processing Hub to increase throughput by 30%.', feasibility: profit > 600000 ? 'high' : 'medium', estimated_cost: 400000, estimated_benefit: 1200000 },
  ];
  res.json({ current_profit: profit, predicted_profit: Math.round(profit * 1.25), feasibility, recommendations });
});

exports.reports = catchAsync(async (req, res) => {
  const { type, format } = req.params;
  const reportConfigs = {
    sustainability: { title: 'Sustainability Report', headers: ['Region', 'Score', 'Collection Eff.', 'Recovery Rate', 'Transport Eff.', 'Utilization'] },
    environmental: { title: 'Environmental Impact Report', headers: ['Region', 'CO2 Reduction (kg)', 'Energy Saved (kWh)', 'Landfill Diversion (kg)', 'Water Saved (L)'] },
    profitability: { title: 'Profitability Report', headers: ['Region', 'Revenue', 'Operating Cost', 'Net Profit', 'ROI', 'Payback'] },
    revenue: { title: 'Revenue Report', headers: ['Month', 'Assessments Count', 'Revenue Collected', 'Average Value'] },
    collection: { title: 'Collection Report', headers: ['Month', 'Completed Items', 'Draft Items', 'Total Value'] },
    forecast: { title: 'Forecast Report', headers: ['Region', 'Forecast Year', 'Forecasted Waste (kg)', 'Growth Rate (%)', 'Opportunity Score'] },
    staff: { title: 'Staff Performance Report', headers: ['Staff Name', 'Username', 'Assessments Performed', 'Total Estimated Value'] },
    cost: { title: 'Cost Analysis Report', headers: ['Facility / Route', 'Type', 'Rent / Fuel Cost', 'Utility / Driver Salary', 'Staff / Vehicle Cost', 'Maintenance', 'Total Cost'] },
    profit: { title: 'Profit Trend Report', headers: ['Month', 'Gross Revenue', 'Total Operating Cost', 'Net Profit', 'Savings (15%)'] }
  };

  const cfg = reportConfigs[type] || reportConfigs.collection;
  const rows = [];

  if (type === 'sustainability') {
    const scores = await SustainabilityScore.findAll({
      include: [{ model: Region, attributes: ['name'] }],
      order: [['score', 'DESC']]
    });
    scores.forEach((s) => {
      rows.push([
        s.region?.name || 'Unknown',
        `${s.score}`,
        `${s.collection_efficiency}%`,
        `${s.recovery_rate}%`,
        `${s.transportation_efficiency}%`,
        `${s.facility_utilization}%`
      ]);
    });
  } else if (type === 'environmental') {
    const regions = await Region.findAll({ where: { type: 'city' } });
    await Promise.all(regions.map(async (r) => {
      const weight = await Assessment.sum('weight_kg', {
        include: [{ model: User, where: { region_id: r.id } }],
        where: { status: 'completed' }
      }) || 0;

      // Calculations: 1.5 kg CO2 per kg, 2.5 kWh saved per kg, 0.95 diversion rate, 5L water saved per kg
      const co2 = Math.round(weight * 1.5);
      const energy = Math.round(weight * 2.5);
      const landfill = Math.round(weight * 0.95);
      const water = Math.round(weight * 5);

      rows.push([
        r.name,
        `${co2.toLocaleString()} kg`,
        `${energy.toLocaleString()} kWh`,
        `${landfill.toLocaleString()} kg`,
        `${water.toLocaleString()} L`
      ]);
    }));
  } else if (type === 'cost') {
    const facilities = await Facility.findAll({ include: [{ model: Region, attributes: ['name'] }] });
    facilities.forEach(f => {
      const rent = f.rent || 0;
      const electricity = f.electricity_cost || 0;
      const staff = f.staff_cost || 0;
      const total = rent + electricity + staff;
      rows.push([
        f.name,
        'Facility',
        `Rs. ${rent.toLocaleString('en-IN')}`,
        `Rs. ${electricity.toLocaleString('en-IN')}`,
        `Rs. ${staff.toLocaleString('en-IN')}`,
        'Rs. 0',
        `Rs. ${total.toLocaleString('en-IN')}`
      ]);
    });

    const routes = await LogisticsRoute.findAll();
    routes.forEach(route => {
      const fuel = route.fuel_cost || 0;
      const driver = route.driver_salary || 0;
      const vehicle = route.vehicle_cost || 0;
      const maintenance = route.maintenance_cost || 0;
      const total = fuel + driver + vehicle + maintenance;
      rows.push([
        route.route_name,
        'Logistics Route',
        `Rs. ${fuel.toLocaleString('en-IN')}`,
        `Rs. ${driver.toLocaleString('en-IN')}`,
        `Rs. ${vehicle.toLocaleString('en-IN')}`,
        `Rs. ${maintenance.toLocaleString('en-IN')}`,
        `Rs. ${total.toLocaleString('en-IN')}`
      ]);
    });
  } else if (type === 'profit') {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
    }
    await Promise.all(months.map(async (m) => {
      const start = new Date(m.getFullYear(), m.getMonth(), 1);
      const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
      const label = m.toLocaleString('default', { month: 'long', year: 'numeric' });

      const revenue = await Assessment.sum('value_estimate', {
        where: { created_at: { [Op.gte]: start, [Op.lt]: end }, status: 'completed' }
      }) || 0;

      const cost = revenue > 0 ? Math.round(revenue * 0.6) : 0;
      const profit = revenue - cost;
      const savings = Math.round(profit * 0.15);

      rows.push([
        label,
        `Rs. ${revenue.toLocaleString('en-IN')}`,
        `Rs. ${cost.toLocaleString('en-IN')}`,
        `Rs. ${profit.toLocaleString('en-IN')}`,
        `Rs. ${savings.toLocaleString('en-IN')}`
      ]);
    }));
  } else if (type === 'profitability') {
    const regions = await Region.findAll({ where: { type: 'city' } });
    await Promise.all(regions.map(async (r) => {
      const revenue = await Assessment.sum('value_estimate', {
        include: [{ model: User, where: { region_id: r.id } }],
        where: { status: 'completed' }
      }) || 0;
      
      const facilities = await Facility.findAll({ where: { region_id: r.id } });
      const opCost = facilities.reduce((sum, f) => sum + (f.rent || 0) + (f.electricity_cost || 0) + (f.staff_cost || 0), 0) * 3;
      const profit = revenue - opCost;
      const roi = opCost > 0 ? ((profit / opCost) * 100).toFixed(1) : 'N/A';
      const payback = profit > 0 ? (opCost / (profit / 12)).toFixed(1) : 'N/A';

      rows.push([
        r.name,
        `Rs. ${revenue.toLocaleString('en-IN')}`,
        `Rs. ${opCost.toLocaleString('en-IN')}`,
        `Rs. ${profit.toLocaleString('en-IN')}`,
        roi !== 'N/A' ? `${roi}%` : 'N/A',
        payback !== 'N/A' ? `${payback} mo` : 'N/A'
      ]);
    }));
  } else if (type === 'revenue' || type === 'collection') {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
    }
    await Promise.all(months.map(async (m) => {
      const start = new Date(m.getFullYear(), m.getMonth(), 1);
      const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
      
      const label = m.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      const countCompleted = await Assessment.count({
        where: { created_at: { [Op.gte]: start, [Op.lt]: end }, status: 'completed' }
      });
      const countDraft = await Assessment.count({
        where: { created_at: { [Op.gte]: start, [Op.lt]: end }, status: 'draft' }
      });
      const revenue = await Assessment.sum('value_estimate', {
        where: { created_at: { [Op.gte]: start, [Op.lt]: end }, status: 'completed' }
      }) || 0;

      if (type === 'revenue') {
        const totalCount = countCompleted;
        const avgVal = totalCount > 0 ? Math.round(revenue / totalCount) : 0;
        rows.push([
          label,
          `${totalCount}`,
          `Rs. ${revenue.toLocaleString('en-IN')}`,
          `Rs. ${avgVal.toLocaleString('en-IN')}`
        ]);
      } else {
        rows.push([
          label,
          `${countCompleted}`,
          `${countDraft}`,
          `Rs. ${revenue.toLocaleString('en-IN')}`
        ]);
      }
    }));
  } else if (type === 'forecast') {
    const results = await ForecastResult.findAll({
      include: [{ model: Region, attributes: ['name'] }],
      order: [['forecast_year', 'ASC'], ['forecasted_waste', 'DESC']]
    });
    results.forEach((fr) => {
      rows.push([
        fr.region?.name || 'Unknown',
        `${fr.forecast_year}`,
        `${fr.forecasted_waste.toLocaleString()}`,
        `${fr.growth_rate}%`,
        `${fr.opportunity_score}`
      ]);
    });
  } else if (type === 'staff') {
    const staffMembers = await User.findAll({ where: { role: 'employee' } });
    await Promise.all(staffMembers.map(async (u) => {
      const count = await Assessment.count({ where: { user_id: u.id } });
      const value = await Assessment.sum('value_estimate', { where: { user_id: u.id } }) || 0;
      rows.push([
        u.full_name || 'N/A',
        u.username,
        `${count}`,
        `Rs. ${value.toLocaleString('en-IN')}`
      ]);
    }));
  }

  // Fallback if rows are empty
  if (rows.length === 0) {
    for (let i = 0; i < 8; i++) {
      rows.push(cfg.headers.map(() => Math.floor(Math.random() * 100) + 1));
    }
  }

  if (format === 'json') {
    return res.json({ title: cfg.title, headers: cfg.headers, rows });
  }

  if (format === 'xlsx') {
    const buf = await reportService.generateExcel(cfg.title, cfg.headers, rows);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${type}.xlsx`);
    return res.send(buf);
  }

  const buf = reportService.generatePDF(cfg.title, cfg.headers, rows);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${type}.pdf`);
  res.send(buf);
});
