const { Op, fn, col } = require('sequelize');
const { User, Assessment, ProductCatalog, Region, ActivityLog } = require('../models');
const catchAsync = require('../utils/catchAsync');

exports.kpi = catchAsync(async (req, res) => {
  const [staffCount, hrCount, totalProducts, totalValue, sustainabilityScore] = await Promise.all([
    User.count({ where: { role: 'employee', is_active: true } }),
    User.count({ where: { role: 'hr', is_active: true } }),
    Assessment.count(),
    Assessment.sum('value_estimate', { where: { status: 'completed' } }),
    Assessment.findOne({
      attributes: [[fn('AVG', col('ai_score')), 'avg']],
      where: { ai_score: { [Op.ne]: null } },
    }),
  ]);

  const revenue = totalValue || 0;
  const profit = Math.round(revenue * 0.3);
  const avgScore = sustainabilityScore?.dataValues?.avg || 85;

  res.json({
    total_staff: staffCount + hrCount,
    total_hr: hrCount,
    collections: totalProducts,
    total_products: totalProducts,
    revenue: Math.round(revenue),
    profit,
    sustainability_score: Math.round(avgScore),
    forecast_accuracy: 85,
  });
});

exports.charts = catchAsync(async (req, res) => {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d);
  }
  const labels = months.map((m) => m.toLocaleString('default', { month: 'short' }));

  const collectionData = await Promise.all(months.map(async (m) => {
    const start = new Date(m.getFullYear(), m.getMonth(), 1);
    const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    return Assessment.count({ where: { created_at: { [Op.gte]: start, [Op.lt]: end } } });
  }));

  const revenueData = await Promise.all(months.map(async (m) => {
    const start = new Date(m.getFullYear(), m.getMonth(), 1);
    const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    const val = await Assessment.sum('value_estimate', { where: { created_at: { [Op.gte]: start, [Op.lt]: end }, status: 'completed' } });
    return val || 0;
  }));

  const regions = await Region.findAll({ where: { type: 'city' } });
  const regionRevenue = await Promise.all(regions.map(async (r) => {
    const val = await Assessment.sum('value_estimate', {
      include: [{
        model: User, where: { region_id: r.id }, attributes: [],
      }],
      where: { status: 'completed' },
    });
    return { label: r.name, value: val || 0 };
  }));

  const catalog = await ProductCatalog.findAll();
  const productDist = await Promise.all(catalog.map(async (p) => {
    const count = await Assessment.count({ where: { product_type_id: p.id } });
    return { label: p.name, value: count };
  }));

  res.json({
    collection_trend: { labels, collections: collectionData, revenue: revenueData },
    region_revenue: regionRevenue.filter((r) => r.value > 0),
    product_distribution: productDist.filter((p) => p.value > 0),
  });
});

exports.activities = catchAsync(async (req, res) => {
  const logs = await ActivityLog.findAll({
    order: [['created_at', 'DESC']],
    limit: 20,
    include: [{ model: User, attributes: ['full_name', 'role'] }],
  });
  res.json({ activities: logs });
});
