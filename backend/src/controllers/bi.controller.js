const { Op } = require('sequelize');
const { SustainabilityScore, Recommendation, Assessment, Region, User } = require('../models');
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

  res.json({ ...data, region_performance: regionData.filter((r) => r.value > 0), sustainability_trend: { labels, data: trend } });
});

exports.profitability = catchAsync(async (req, res) => {
  const totalRevenue = await Assessment.sum('value_estimate', { where: { status: 'completed' } }) || 1;
  const totalCosts = Math.round(totalRevenue * 0.6);
  const profit = totalRevenue - totalCosts;
  const savings = Math.round(profit * 0.15);
  const roi = parseFloat(((profit / totalCosts) * 100).toFixed(1));
  const paybackPeriod = parseFloat((totalCosts / (profit / 12)).toFixed(1));

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }
  const labels = months.map((m) => m.toLocaleString('default', { month: 'short' }));
  const profitData = await Promise.all(months.map(async (m) => {
    const start = new Date(m.getFullYear(), m.getMonth(), 1);
    const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    const rev = await Assessment.sum('value_estimate', { where: { created_at: { [Op.gte]: start, [Op.lt]: end }, status: 'completed' } }) || 0;
    const cost = Math.round(rev * 0.6);
    return { revenue: rev, cost, profit: rev - cost };
  }));

  res.json({
    current_profit: profit,
    predicted_profit: Math.round(profit * 1.25),
    savings,
    roi,
    payback_period: paybackPeriod,
    profit_trend: { labels, ...profitData.reduce((acc, d, i) => {
      acc.revenue = acc.revenue || []; acc.cost = acc.cost || []; acc.profit = acc.profit || [];
      acc.revenue.push(d.revenue); acc.cost.push(d.cost); acc.profit.push(d.profit);
      return acc;
    }, {}) },
  });
});

exports.scenarios = catchAsync(async (req, res) => {
  const currentRevenue = await Assessment.sum('value_estimate', { where: { status: 'completed' } }) || 50000000;
  const scenarios = [
    { id: 'A', name: 'Current Infrastructure', profit: Math.round(currentRevenue * 0.4), cost: Math.round(currentRevenue * 0.6), description: 'Baseline operations' },
    { id: 'B', name: 'New Collection Center', profit: Math.round(currentRevenue * 0.48), cost: Math.round(currentRevenue * 0.7), description: '+12% revenue, +18% costs' },
    { id: 'C', name: 'New Preprocessing Unit', profit: Math.round(currentRevenue * 0.5), cost: Math.round(currentRevenue * 0.68), description: '+15% revenue, +14% costs' },
    { id: 'D', name: 'Facility Expansion', profit: Math.round(currentRevenue * 0.55), cost: Math.round(currentRevenue * 0.72), description: '+25% revenue, +20% costs' },
    { id: 'E', name: 'Route Optimization', profit: Math.round(currentRevenue * 0.42), cost: Math.round(currentRevenue * 0.55), description: '+5% revenue, -8% costs' },
  ];
  res.json({ scenarios });
});

exports.recommendations = catchAsync(async (req, res) => {
  const { transportation, facility, labor, operational } = req.body;
  const totalCost = (parseFloat(transportation) || 0) + (parseFloat(facility) || 0) + (parseFloat(labor) || 0) + (parseFloat(operational) || 0);
  const revenue = await Assessment.sum('value_estimate', { where: { status: 'completed' } }) || 50000000;
  const profit = revenue - totalCost;
  const feasibility = profit > 0 ? 'high' : 'low';
  const recommendations = [
    { type: 'logistics_optimization', title: 'Optimize Logistics Routes', description: 'Consolidate shipments to reduce transportation costs by up to 15%', feasibility: 'high', estimated_cost: 500000, estimated_benefit: 2000000 },
    { type: 'new_center', title: 'Open New Collection Center', description: 'Expand coverage to underserved regions for increased collection volume', feasibility: profit > 10000000 ? 'high' : 'medium', estimated_cost: 5000000, estimated_benefit: 15000000 },
    { type: 'expansion', title: 'Expand Processing Facility', description: 'Upgrade equipment and increase processing capacity by 30%', feasibility: profit > 20000000 ? 'high' : 'medium', estimated_cost: 10000000, estimated_benefit: 25000000 },
  ];
  res.json({ current_profit: profit, predicted_profit: profit * 1.2, feasibility, recommendations });
});

exports.reports = catchAsync(async (req, res) => {
  const { type, format } = req.params;
  const reportConfigs = {
    sustainability: { title: 'Sustainability Report', headers: ['Region', 'Score', 'Efficiency', 'Recovery Rate', 'Transport', 'Utilization'] },
    profitability: { title: 'Profitability Report', headers: ['Metric', 'Current', 'Projected', 'Growth'] },
    revenue: { title: 'Revenue Report', headers: ['Month', 'Revenue', 'Cost', 'Profit'] },
    collection: { title: 'Collection Report', headers: ['Month', 'Collections', 'Products', 'Value'] },
    forecast: { title: 'Forecast Report', headers: ['Region', 'Y1', 'Y3', 'Y5', 'Growth Rate'] },
    staff: { title: 'Staff Performance Report', headers: ['Staff', 'Role', 'Assessments', 'Value', 'Rating'] },
  };

  const cfg = reportConfigs[type] || reportConfigs.collection;
  const rows = [];
  for (let i = 0; i < 8; i++) {
    rows.push(cfg.headers.map(() => Math.floor(Math.random() * 1000) + 1));
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
