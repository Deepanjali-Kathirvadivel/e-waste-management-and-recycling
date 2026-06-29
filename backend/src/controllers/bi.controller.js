const { Op } = require('sequelize');
const { SustainabilityScore, Recommendation, Assessment, Region, User, Facility, LogisticsRoute, ForecastResult, AnalysisResult, InventoryItem } = require('../models');
const catchAsync = require('../utils/catchAsync');
const reportService = require('../services/report.service');

const PER_CAPITA_WASTE_KG = 3.2;

exports.sustainability = catchAsync(async (req, res) => {
  const regions = await Region.findAll({ where: { type: 'city' } });
  const facilities = await Facility.findAll({ where: { status: 'active' } });
  const routes = await LogisticsRoute.findAll();

  const totalAssessments = await Assessment.count();
  const totalWeight = await Assessment.sum('weight_kg', { where: { status: 'completed' } }) || 0;
  const totalClassified = await AnalysisResult.count();
  const analysisResults = await AnalysisResult.findAll();
  const classCounts = { reusable: 0, repairable: 0, recyclable: 0, scrap: 0 };
  for (const ar of analysisResults) {
    if (ar.classification && classCounts[ar.classification] !== undefined) {
      classCounts[ar.classification]++;
    }
  }

  const totalInventory = await InventoryItem.count();
  const facilityCapacity = facilities.reduce((s, f) => s + (f.capacity || 1000), 0);
  const facilityUtil = facilityCapacity > 0 ? (totalInventory / facilityCapacity) * 100 : 65;

  const collectionEfficiency = regions.length > 0
    ? regions.reduce((s, r) => {
        const potential = (r.population || 100000) * PER_CAPITA_WASTE_KG * 12;
        const actual = totalAssessments / regions.length * 5;
        return s + Math.min(100, Math.max(10, (actual / potential) * 100));
      }, 0) / regions.length
    : 72;

  const recoveryRate = totalClassified > 0
    ? ((classCounts.reusable + classCounts.repairable + classCounts.recyclable) / totalClassified) * 100
    : 78;

  const transportEfficiency = routes.length > 0
    ? 85
    : 70;

  const co2Saved = totalWeight * 1.5;
  const energySaved = totalWeight * 2.5;
  const landfillDiverted = totalWeight * 0.95;
  const waterSaved = totalWeight * 5;

  const score = parseFloat((
    collectionEfficiency * 0.25 +
    recoveryRate * 0.25 +
    transportEfficiency * 0.25 +
    facilityUtil * 0.25
  ).toFixed(1));

  const regionPerformance = await Promise.all(regions.map(async (r) => {
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

  await SustainabilityScore.create({
    score,
    collection_efficiency: parseFloat(collectionEfficiency.toFixed(1)),
    recovery_rate: parseFloat(recoveryRate.toFixed(1)),
    transportation_efficiency: parseFloat(transportEfficiency.toFixed(1)),
    facility_utilization: parseFloat(facilityUtil.toFixed(1)),
    environmental_impact: {
      co2_saved_kg: Math.round(co2Saved),
      energy_saved_kwh: Math.round(energySaved),
      landfill_diverted_kg: Math.round(landfillDiverted),
      water_saved_l: Math.round(waterSaved),
    },
    recovery_rate_history: [],
    calculated_at: new Date(),
  });

  res.json({
    score,
    collection_efficiency: parseFloat(collectionEfficiency.toFixed(1)),
    recovery_rate: parseFloat(recoveryRate.toFixed(1)),
    transportation_efficiency: parseFloat(transportEfficiency.toFixed(1)),
    facility_utilization: parseFloat(facilityUtil.toFixed(1)),
    environmental_impact: {
      co2_saved_kg: Math.round(co2Saved),
      energy_saved_kwh: Math.round(energySaved),
      landfill_diverted_kg: Math.round(landfillDiverted),
      water_saved_l: Math.round(waterSaved),
    },
    region_performance: regionPerformance.filter((r) => r.value > 0),
    sustainability_trend: { labels, data: trend },
  });
});

exports.environmental = catchAsync(async (req, res) => {
  const totalWeight = await Assessment.sum('weight_kg', { where: { status: 'completed' } }) || 0;

  const co2Saved = Math.round(totalWeight * 1.5);
  const energySaved = Math.round(totalWeight * 2.5);
  const landfillDiverted = Math.round(totalWeight * 0.95);
  const waterSaved = Math.round(totalWeight * 5);

  const regions = await Region.findAll({ where: { type: 'city' } });
  const regionImpact = await Promise.all(regions.map(async (r) => {
    const weight = await Assessment.sum('weight_kg', {
      include: [{ model: User, where: { region_id: r.id }, attributes: [] }],
      where: { status: 'completed' },
    }) || 0;
    return {
      region: r.name,
      co2_saved_kg: Math.round(weight * 1.5),
      energy_saved_kwh: Math.round(weight * 2.5),
      landfill_diverted_kg: Math.round(weight * 0.95),
      water_saved_l: Math.round(weight * 5),
      total_weight_kg: Math.round(weight),
    };
  }));

  res.json({
    total_co2_saved_kg: co2Saved,
    total_energy_saved_kwh: energySaved,
    total_landfill_diverted_kg: landfillDiverted,
    total_water_saved_l: waterSaved,
    total_weight_processed_kg: Math.round(totalWeight),
    region_impact: regionImpact.filter(r => r.total_weight_kg > 0),
  });
});

exports.profitability = catchAsync(async (req, res) => {
  const totalRevenue = await Assessment.sum('value_estimate', { where: { status: 'completed' } }) || 0;

  const facilityRent = await Facility.sum('rent') || 0;
  const facilityElectricity = await Facility.sum('electricity_cost') || 0;
  const facilityStaff = await Facility.sum('staff_cost') || 0;
  const totalFacilityCost = facilityRent + facilityElectricity + facilityStaff;

  const routes = await LogisticsRoute.findAll();
  const totalTransportCost = routes.reduce((sum, r) => {
    return sum + (r.fuel_cost || 0) + (r.driver_salary || 0) + (r.vehicle_cost || 0) + (r.maintenance_cost || 0);
  }, 0);

  const staffCount = await User.count({ where: { role: 'employee', is_active: true } });
  const laborCost = staffCount * 15000;

  const totalCosts = (totalFacilityCost + totalTransportCost + laborCost) * 3;

  const profit = totalRevenue - totalCosts;
  const savings = Math.round(profit * 0.15);
  const roi = totalCosts > 0 ? parseFloat(((profit / totalCosts) * 100).toFixed(1)) : 0;
  const paybackPeriod = profit > 0 ? parseFloat((totalCosts / (profit / 12)).toFixed(1)) : 0;

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
        status: 'completed',
      },
    }) || 0;
    const cost = rev > 0 ? Math.round(rev * 0.6) : 0;
    return { revenue: rev, cost, profit: rev - cost };
  }));

  const costBreakdown = {
    transportation: totalTransportCost * 3,
    facility: totalFacilityCost * 3,
    labor: laborCost * 3,
    operational: Math.round(totalCosts - (totalTransportCost + totalFacilityCost + laborCost) * 3),
  };

  res.json({
    current_profit: profit,
    predicted_profit: Math.round(profit * 1.25),
    savings,
    roi,
    payback_period: paybackPeriod,
    cost_breakdown: costBreakdown,
    profit_trend: {
      labels,
      revenue: profitTrendData.map(d => d.revenue),
      cost: profitTrendData.map(d => d.cost),
      profit: profitTrendData.map(d => d.profit),
    },
  });
});

exports.scenarios = catchAsync(async (req, res) => {
  const currentRevenue = await Assessment.sum('value_estimate', { where: { status: 'completed' } }) || 0;

  const facilityRent = await Facility.sum('rent') || 0;
  const facilityElectricity = await Facility.sum('electricity_cost') || 0;
  const facilityStaff = await Facility.sum('staff_cost') || 0;
  const totalFacilityCost = (facilityRent + facilityElectricity + facilityStaff) * 3;

  const routes = await LogisticsRoute.findAll();
  const totalLogisticsCost = routes.reduce((sum, r) => {
    return sum + (r.fuel_cost || 0) + (r.driver_salary || 0) + (r.vehicle_cost || 0) + (r.maintenance_cost || 0);
  }, 0) * 3;

  const staffCount = await User.count({ where: { role: 'employee', is_active: true } });
  const laborCost = staffCount * 15000 * 3;

  const baseCost = totalFacilityCost + totalLogisticsCost + laborCost;
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

exports.simulate = catchAsync(async (req, res) => {
  const { type, region_id, cost, revenue_increase_pct, cost_increase_pct } = req.body;

  const currentRevenue = await Assessment.sum('value_estimate', { where: { status: 'completed' } }) || 0;

  const facilityRent = await Facility.sum('rent') || 0;
  const facilityElectricity = await Facility.sum('electricity_cost') || 0;
  const facilityStaff = await Facility.sum('staff_cost') || 0;
  const totalFacilityCost = (facilityRent + facilityElectricity + facilityStaff) * 3;

  const routes = await LogisticsRoute.findAll();
  const totalLogisticsCost = routes.reduce((sum, r) => {
    return sum + (r.fuel_cost || 0) + (r.driver_salary || 0) + (r.vehicle_cost || 0) + (r.maintenance_cost || 0);
  }, 0) * 3;

  const staffCount = await User.count({ where: { role: 'employee', is_active: true } });
  const laborCost = staffCount * 15000 * 3;

  const baseCost = totalFacilityCost + totalLogisticsCost + laborCost;
  const baseProfit = currentRevenue - baseCost;

  const newCost = baseCost + (cost || 0) + (baseCost * ((cost_increase_pct || 0) / 100));
  const newRevenue = currentRevenue * (1 + ((revenue_increase_pct || 0) / 100));
  const projectedProfit = newRevenue - newCost;

  const improvement = projectedProfit - baseProfit;
  const recommend = improvement > 0 && projectedProfit > baseProfit;

  const scenarioNames = {
    new_center: 'New Collection Center',
    new_unit: 'New Preprocessing Unit',
    expansion: 'Facility Expansion',
    route_optimization: 'Route Optimization',
    resource_allocation: 'Resource Allocation',
  };

  res.json({
    scenario_name: scenarioNames[type] || 'Custom Scenario',
    scenario_type: type,
    current_revenue: currentRevenue,
    current_cost: baseCost,
    current_profit: baseProfit,
    projected_revenue: Math.round(newRevenue),
    projected_cost: Math.round(newCost),
    projected_profit: Math.round(projectedProfit),
    improvement: Math.round(improvement),
    recommend_infrastructure: recommend,
    recommendation: recommend
      ? `This scenario is projected to increase profit by \u20B9${improvement.toLocaleString('en-IN')}. Recommended for implementation.`
      : `This scenario does not improve profitability over the current baseline. Consider alternative approaches.`,
  });
});

exports.recommendations = catchAsync(async (req, res) => {
  const { transportation, facility: facilityCost, labor, operational } = req.body;
  const totalCost = (parseFloat(transportation) || 0) + (parseFloat(facilityCost) || 0) + (parseFloat(labor) || 0) + (parseFloat(operational) || 0);
  const revenue = await Assessment.sum('value_estimate', { where: { status: 'completed' } }) || 0;

  const profit = revenue - totalCost;
  const feasibility = profit > 0 ? 'high' : 'low';

  const recommendations = [
    { type: 'logistics_optimization', title: 'Optimize Logistics Routes', description: 'Consolidate shipments to reduce transportation costs by up to 15%. Recommend dynamic route scheduling.', feasibility: 'high', estimated_cost: Math.round(totalCost * 0.05), estimated_benefit: Math.round(revenue * 0.1) },
    { type: 'new_center', title: 'Open New Collection Center', description: 'Expand collection coverage to high-density zones.', feasibility: profit > 300000 ? 'high' : 'medium', estimated_cost: 200000, estimated_benefit: 600000 },
    { type: 'expansion', title: 'Expand Processing Facility', description: 'Upgrade sorting machinery to increase throughput by 30%.', feasibility: profit > 600000 ? 'high' : 'medium', estimated_cost: 400000, estimated_benefit: 1200000 },
  ].filter(r => r.estimated_benefit > r.estimated_cost);
  res.json({ current_profit: profit, predicted_profit: Math.round(profit * 1.25), feasibility, recommendations });
});

exports.executiveDashboard = catchAsync(async (req, res) => {
  const [
    totalRevenue, totalAssessments, pendingApprovals, completedAssessments,
    hubCount, activeFacilities, inventoryCount, classifiedCount,
    reusableCount, repairableCount, recyclableCount, scrapCount,
    forecastWaste, forecastGrowth, totalEmployees,
  ] = await Promise.all([
    Assessment.sum('value_estimate', { where: { status: 'completed' } }),
    Assessment.count(),
    Assessment.count({ where: { status: 'pending_manager_review' } }),
    Assessment.count({ where: { status: 'completed' } }),
    Facility.count({ where: { type: 'collection_center', status: 'active' } }),
    Facility.count({ where: { status: 'active' } }),
    InventoryItem.count(),
    AnalysisResult.count(),
    AnalysisResult.count({ where: { classification: 'reusable' } }),
    AnalysisResult.count({ where: { classification: 'repairable' } }),
    AnalysisResult.count({ where: { classification: 'recyclable' } }),
    AnalysisResult.count({ where: { classification: 'scrap' } }),
    ForecastResult.sum('forecasted_waste'),
    ForecastResult.findOne({ attributes: [[require('sequelize').fn('AVG', require('sequelize').col('growth_rate')), 'avg']] }),
    User.count({ where: { is_active: true } }),
  ]);

  const totalWeight = await Assessment.sum('weight_kg', { where: { status: 'completed' } }) || 0;
  const supplyChainUsers = await User.count({ where: { role: 'supply_chain', is_active: true } });

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }
  const trend = await Promise.all(months.map(async (m) => {
    const start = new Date(m.getFullYear(), m.getMonth(), 1);
    const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    const rev = await Assessment.sum('value_estimate', {
      where: { created_at: { [Op.gte]: start, [Op.lt]: end }, status: 'completed' },
    }) || 0;
    const col = await Assessment.count({
      where: { created_at: { [Op.gte]: start, [Op.lt]: end } },
    });
    return { revenue: rev, collections: col };
  }));

  const scoreData = await SustainabilityScore.findOne({ order: [['calculated_at', 'DESC']] });

  res.json({
    revenue_summary: {
      total: totalRevenue || 0,
      monthly_trend: trend.map(t => t.revenue),
    },
    collections_summary: {
      total: totalAssessments,
      completed: completedAssessments,
      pending: pendingApprovals,
      monthly_trend: trend.map(t => t.collections),
    },
    sustainability_summary: {
      score: scoreData?.score || 75,
      collection_efficiency: scoreData?.collection_efficiency || 0,
      recovery_rate: scoreData?.recovery_rate || 0,
      transportation_efficiency: scoreData?.transportation_efficiency || 0,
      facility_utilization: scoreData?.facility_utilization || 0,
      environmental_impact: scoreData?.environmental_impact || { co2_saved_kg: 0, energy_saved_kwh: 0, landfill_diverted_kg: 0, water_saved_l: 0 },
    },
    profitability_summary: {
      current_profit: (totalRevenue || 0) - Math.round((totalRevenue || 0) * 0.6),
      roi: totalRevenue ? parseFloat((((totalRevenue - Math.round(totalRevenue * 0.6)) / Math.round(totalRevenue * 0.6)) * 100).toFixed(1)) : 0,
    },
    forecast_summary: {
      total_waste: forecastWaste || 0,
      avg_growth_rate: parseFloat(forecastGrowth?.dataValues?.avg || 12),
    },
    staff_summary: {
      total_employees: totalEmployees,
      supply_chain: supplyChainUsers,
      assessments_per_staff: totalEmployees > 0 ? parseFloat((totalAssessments / totalEmployees).toFixed(1)) : 0,
    },
    hub_summary: {
      total_hubs: hubCount,
      active_facilities: activeFacilities,
    },
    logistics_summary: {
      active_routes: await LogisticsRoute.count(),
      transport_efficiency: scoreData?.transportation_efficiency || 75,
    },
    inventory_summary: {
      total_items: inventoryCount,
      classification: {
        reusable: reusableCount,
        repairable: repairableCount,
        recyclable: recyclableCount,
        scrap: scrapCount,
      },
      total_weight_kg: Math.round(totalWeight),
    },
  });
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
    profit: { title: 'Profit Trend Report', headers: ['Month', 'Gross Revenue', 'Total Operating Cost', 'Net Profit', 'Savings (15%)'] },
  };

  const cfg = reportConfigs[type] || reportConfigs.collection;
  const rows = [];

  if (type === 'sustainability') {
    const scores = await SustainabilityScore.findAll({
      include: [{ model: Region, attributes: ['name'] }],
      order: [['score', 'DESC']],
    });
    scores.forEach((s) => {
      rows.push([
        s.region?.name || 'Unknown',
        `${s.score}`,
        `${s.collection_efficiency}%`,
        `${s.recovery_rate}%`,
        `${s.transportation_efficiency}%`,
        `${s.facility_utilization}%`,
      ]);
    });
  } else if (type === 'environmental') {
    const regions = await Region.findAll({ where: { type: 'city' } });
    await Promise.all(regions.map(async (r) => {
      const weight = await Assessment.sum('weight_kg', {
        include: [{ model: User, where: { region_id: r.id } }],
        where: { status: 'completed' },
      }) || 0;
      const co2 = Math.round(weight * 1.5);
      const energy = Math.round(weight * 2.5);
      const landfill = Math.round(weight * 0.95);
      const water = Math.round(weight * 5);
      rows.push([
        r.name,
        `${co2.toLocaleString()} kg`,
        `${energy.toLocaleString()} kWh`,
        `${landfill.toLocaleString()} kg`,
        `${water.toLocaleString()} L`,
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
        `Rs. ${total.toLocaleString('en-IN')}`,
      ]);
    });
    const routeList = await LogisticsRoute.findAll();
    routeList.forEach(route => {
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
        `Rs. ${total.toLocaleString('en-IN')}`,
      ]);
    });
  } else if (type === 'profit') {
    const monthList = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      monthList.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
    }
    await Promise.all(monthList.map(async (m) => {
      const start = new Date(m.getFullYear(), m.getMonth(), 1);
      const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
      const label = m.toLocaleString('default', { month: 'long', year: 'numeric' });
      const revenue = await Assessment.sum('value_estimate', {
        where: { created_at: { [Op.gte]: start, [Op.lt]: end }, status: 'completed' },
      }) || 0;
      const cost = revenue > 0 ? Math.round(revenue * 0.6) : 0;
      const profit = revenue - cost;
      const savings = Math.round(profit * 0.15);
      rows.push([
        label,
        `Rs. ${revenue.toLocaleString('en-IN')}`,
        `Rs. ${cost.toLocaleString('en-IN')}`,
        `Rs. ${profit.toLocaleString('en-IN')}`,
        `Rs. ${savings.toLocaleString('en-IN')}`,
      ]);
    }));
  } else if (type === 'profitability') {
    const regions = await Region.findAll({ where: { type: 'city' } });
    await Promise.all(regions.map(async (r) => {
      const revenue = await Assessment.sum('value_estimate', {
        include: [{ model: User, where: { region_id: r.id } }],
        where: { status: 'completed' },
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
        payback !== 'N/A' ? `${payback} mo` : 'N/A',
      ]);
    }));
  } else if (type === 'revenue' || type === 'collection') {
    const monthList = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      monthList.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
    }
    await Promise.all(monthList.map(async (m) => {
      const start = new Date(m.getFullYear(), m.getMonth(), 1);
      const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
      const label = m.toLocaleString('default', { month: 'long', year: 'numeric' });
      const countCompleted = await Assessment.count({
        where: { created_at: { [Op.gte]: start, [Op.lt]: end }, status: 'completed' },
      });
      const countDraft = await Assessment.count({
        where: { created_at: { [Op.gte]: start, [Op.lt]: end }, status: 'draft' },
      });
      const revenue = await Assessment.sum('value_estimate', {
        where: { created_at: { [Op.gte]: start, [Op.lt]: end }, status: 'completed' },
      }) || 0;
      if (type === 'revenue') {
        const totalCount = countCompleted;
        const avgVal = totalCount > 0 ? Math.round(revenue / totalCount) : 0;
        rows.push([label, `${totalCount}`, `Rs. ${revenue.toLocaleString('en-IN')}`, `Rs. ${avgVal.toLocaleString('en-IN')}`]);
      } else {
        rows.push([label, `${countCompleted}`, `${countDraft}`, `Rs. ${revenue.toLocaleString('en-IN')}`]);
      }
    }));
  } else if (type === 'forecast') {
    const results = await ForecastResult.findAll({
      include: [{ model: Region, attributes: ['name'] }],
      order: [['forecast_year', 'ASC'], ['forecasted_waste', 'DESC']],
    });
    results.forEach((fr) => {
      rows.push([
        fr.region?.name || 'Unknown',
        `${fr.forecast_year}`,
        `${fr.forecasted_waste.toLocaleString()}`,
        `${fr.growth_rate}%`,
        `${fr.opportunity_score}`,
      ]);
    });
  } else if (type === 'staff') {
    const staffMembers = await User.findAll({ where: { role: 'employee' } });
    await Promise.all(staffMembers.map(async (u) => {
      const count = await Assessment.count({ where: { user_id: u.id } });
      const value = await Assessment.sum('value_estimate', { where: { user_id: u.id } }) || 0;
      rows.push([u.full_name || 'N/A', u.username, `${count}`, `Rs. ${value.toLocaleString('en-IN')}`]);
    }));
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
