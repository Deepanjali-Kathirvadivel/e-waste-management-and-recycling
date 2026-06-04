const { Op, fn, col } = require('sequelize');
const { Assessment, ProductCatalog, Region, User } = require('../models');
const catchAsync = require('../utils/catchAsync');

exports.reusability = catchAsync(async (req, res) => {
  const classifications = ['reusable', 'repairable', 'recyclable', 'scrap'];
  const kpiData = await Promise.all(classifications.map(async (c) => {
    const count = await Assessment.count({ where: { classification: c } });
    return { label: c, count, percentage: 0 };
  }));
  const total = kpiData.reduce((s, d) => s + d.count, 0) || 1;
  kpiData.forEach((d) => { d.percentage = Math.round((d.count / total) * 100); });

  const catalog = await ProductCatalog.findAll();
  const byProduct = await Promise.all(catalog.map(async (p) => {
    const dist = await Promise.all(classifications.map(async (c) => {
      return Assessment.count({ where: { product_type_id: p.id, classification: c } });
    }));
    return { product: p.name, reusable: dist[0], repairable: dist[1], recyclable: dist[2], scrap: dist[3] };
  }));

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d);
  }
  const labels = months.map((m) => m.toLocaleString('default', { month: 'short' }));
  const trend = await Promise.all(months.map(async (m) => {
    const start = new Date(m.getFullYear(), m.getMonth(), 1);
    const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    return Assessment.count({ where: { created_at: { [Op.gte]: start, [Op.lt]: end }, classification: { [Op.ne]: null } } });
  }));

  const regions = await Region.findAll({ where: { type: 'city' } });
  const byRegion = await Promise.all(regions.map(async (r) => {
    const count = await Assessment.count({
      include: [{ model: User, where: { region_id: r.id }, attributes: [] }],
    });
    return { region: r.name, count };
  }));

  const breakdown = await Promise.all(classifications.map(async (c) => {
    const count = await Assessment.count({ where: { classification: c } });
    const val = await Assessment.sum('value_estimate', { where: { classification: c, status: 'completed' } });
    const totalVal = await Assessment.sum('value_estimate', { where: { status: 'completed' } });
    return { category: c, count, percentage: Math.round((count / total) * 100), avg_value: count ? Math.round((val || 0) / count) : 0, total_value: val || 0 };
  }));

  res.json({
    kpis: kpiData,
    by_product: byProduct,
    trend: { labels, data: trend },
    by_region: byRegion,
    breakdown,
    grand_total: total,
    grand_value: await Assessment.sum('value_estimate', { where: { status: 'completed' } }) || 0,
  });
});
