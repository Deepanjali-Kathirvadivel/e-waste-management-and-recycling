const { Op, fn, col } = require('sequelize');
const { User, Assessment, ProductCatalog, Region, ActivityLog, Facility, InventoryItem, AnalysisResult, SustainabilityScore } = require('../models');
const catchAsync = require('../utils/catchAsync');

exports.kpi = catchAsync(async (req, res) => {
  const [
    employeeCount,
    managerCount,
    supplyChainCount,
    totalAssessments,
    pendingQuotations,
    approvedQuotations,
    closedDealsCount,
    pendingApprovals,
    collectedCount,
  ] = await Promise.all([
    User.count({ where: { role: 'employee' } }),
    User.count({ where: { role: { [Op.in]: ['manager', 'hr', 'center_manager'] } } }),
    User.count({ where: { role: 'supply_chain' } }),
    Assessment.count(),
    Assessment.count({ where: { status: 'pending_manager_review' } }),
    Assessment.count({ where: { status: 'approved' } }),
    Assessment.count({ where: { status: 'completed' } }),
    Assessment.count({ where: { status: 'pending_manager_review' } }),
    Assessment.count({ where: { status: { [Op.in]: ['collected', 'in_transit', 'arrived_at_hub', 'received', 'completed'] } } }),
  ]);

  const revenueResult = await Assessment.findOne({
    attributes: [
      [fn('SUM', fn('COALESCE', col('hr_approved_value'), col('value_estimate'))), 'total']
    ],
    where: { status: 'completed' },
    raw: true
  });
  const revenue = Math.round(revenueResult?.total || 0);

  // Collection Stats: e.g. collected count / total assessments
  const collectionRate = totalAssessments > 0 ? Math.round((collectedCount / totalAssessments) * 100) : 0;
  const collectionStats = `${collectedCount} / ${totalAssessments} (${collectionRate}%)`;

  res.json({
    total_employees: employeeCount,
    total_managers: managerCount,
    total_supply_chain: supplyChainCount,
    total_assessments: totalAssessments,
    pending_quotations: pendingQuotations,
    approved_quotations: approvedQuotations,
    closed_deals: closedDealsCount,
    revenue: revenue,
    collection_stats: collectionStats,
    // Keep legacy support for fields that might be used elsewhere
    total_staff: employeeCount + managerCount + supplyChainCount,
    total_hr: managerCount,
    collections: totalAssessments,
    total_products: totalAssessments,
    pending_approvals: pendingApprovals,
    completed_assessments: closedDealsCount,
    collected: collectedCount,
    hub_count: await Facility.count({ where: { type: 'collection_center', status: 'active' } }),
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
    const val = await Assessment.sum('value_estimate', {
      where: { created_at: { [Op.gte]: start, [Op.lt]: end }, status: 'completed' },
    });
    return val || 0;
  }));

  const regions = await Region.findAll({ where: { type: 'city' } });
  const regionRevenue = await Promise.all(regions.map(async (r) => {
    const val = await Assessment.sum('value_estimate', {
      include: [{ model: User, where: { region_id: r.id }, attributes: [] }],
      where: { status: 'completed' },
    });
    return { label: r.name, value: val || 0 };
  }));

  const CATEGORY_LABELS = {
    IT: 'IT',
    CE: 'Consumer Electronics',
    LS: 'Household Appliances',
    EE: 'Electrical & Electronic Tools',
    TLS: 'Toys, Leisure & Sports Equipment',
    LI: 'Lighting Instruments',
    MD: 'Medical Devices',
  };

  const rows = await Assessment.findAll({
    include: [{
      model: ProductCatalog,
      attributes: ['category'],
      required: true
    }],
    attributes: [[fn('COUNT', col('assessments.id')), 'count']],
    group: ['product_catalog.category'],
    raw: true,
  });

  const categoryMap = {};
  Object.keys(CATEGORY_LABELS).forEach((k) => { categoryMap[k] = 0; });
  rows.forEach((row) => {
    const catKey = row['product_catalog.category'];
    if (categoryMap[catKey] !== undefined) {
      categoryMap[catKey] = Number(row.count || 0);
    }
  });

  const productDist = Object.entries(categoryMap).map(([key, value]) => ({
    label: CATEGORY_LABELS[key] || key,
    value,
  }));

  const classifications = ['reusable', 'repairable', 'recyclable', 'scrap'];
  const reusabilityDist = await Promise.all(classifications.map(async (c) => {
    const count = await AnalysisResult.count({ where: { classification: c } });
    return { label: c, value: count };
  }));

  const hubUtilization = await Promise.all(regions.map(async (r) => {
    const facilityCount = await Facility.count({ where: { region_id: r.id, status: 'active' } });
    const inventoryCount = await InventoryItem.count({
      include: [{ model: Facility, where: { region_id: r.id }, attributes: [] }],
    });
    return { label: r.name, facilities: facilityCount, inventory: inventoryCount };
  }));

  res.json({
    collection_trend: { labels, collections: collectionData, revenue: revenueData },
    region_revenue: regionRevenue.filter((r) => r.value > 0),
    product_distribution: productDist.filter((p) => p.value > 0),
    reusability_distribution: reusabilityDist,
    hub_utilization: hubUtilization.filter(h => h.facilities > 0 || h.inventory > 0),
  });
});

exports.heatmap = catchAsync(async (req, res) => {
  const assessments = await Assessment.findAll({
    where: {
      customer_gps_lat: { [Op.ne]: null },
      customer_gps_lng: { [Op.ne]: null },
    },
    attributes: ['id', 'customer_name', 'customer_gps_lat', 'customer_gps_lng', 'value_estimate', 'status', 'region_id', 'created_at'],
    include: [{ model: Region, attributes: ['name'] }],
    limit: 500,
    order: [['created_at', 'DESC']],
  });

  const points = assessments.map(a => ({
    id: a.id,
    name: a.customer_name || 'Unknown',
    lat: parseFloat(a.customer_gps_lat),
    lng: parseFloat(a.customer_gps_lng),
    value: a.value_estimate || 0,
    status: a.status,
    region: a.region?.name || 'Unknown',
    date: a.created_at,
  }));

  const regionTotals = {};
  for (const p of points) {
    if (!regionTotals[p.region]) regionTotals[p.region] = { count: 0, total_value: 0, points: [] };
    regionTotals[p.region].count++;
    regionTotals[p.region].total_value += p.value;
    if (regionTotals[p.region].points.length < 50) {
      regionTotals[p.region].points.push({ lat: p.lat, lng: p.lng, value: p.value });
    }
  }

  res.json({
    total_points: points.length,
    regions: Object.entries(regionTotals).map(([name, data]) => ({
      region: name,
      count: data.count,
      total_value: Math.round(data.total_value),
      points: data.points,
    })),
    points: points.slice(0, 200),
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
