const { Op, fn, col } = require('sequelize');
const { Assessment, ActivityLog, User, ProductCatalog, Region } = require('../models');
const catchAsync = require('../utils/catchAsync');
const { getRecent } = require('../services/activity.service');

const CATEGORY_LABELS = {
  IT: 'IT',
  CE: 'Consumer Electronics',
  LS: 'Household Appliances',
  EE: 'Electrical & Electronic Tools',
  TLS: 'Toys, Leisure & Sports Equipment',
  LI: 'Lighting Instruments',
  MD: 'Medical Devices',
};

exports.staffKPI = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayAssessments, pendingApprovals, approvedDeals, rejectedDeals, activities] = await Promise.all([
    Assessment.count({
      where: {
        user_id: userId,
        [Op.or]: [
          { submitted_at: { [Op.gte]: today } },
          { created_at: { [Op.gte]: today }, status: { [Op.ne]: 'draft' } },
        ],
      },
    }),
    Assessment.count({ where: { user_id: userId, status: 'pending_manager_review' } }),
    Assessment.count({ where: { user_id: userId, status: 'approved' } }),
    Assessment.count({ where: { user_id: userId, status: 'rejected' } }),
    getRecent(userId, 10),
  ]);

  const collectionValue = await Assessment.sum('hr_approved_value', {
    where: { user_id: userId, status: { [Op.in]: ['approved', 'completed', 'hub_assigned', 'collected'] } },
  }) || await Assessment.sum('value_estimate', {
    where: { user_id: userId, deal_number: { [Op.ne]: null } },
  });

  res.json({
    today_assessments: todayAssessments,
    pending_approvals: pendingApprovals,
    approved_deals: approvedDeals,
    rejected_deals: rejectedDeals,
    collection_value: collectionValue || 0,
    // Legacy aliases
    today_collections: todayAssessments,
    pending_quotations: pendingApprovals,
    approved_quotations: approvedDeals,
    rejected_quotations: rejectedDeals,
    total_assessments: await Assessment.count({ where: { user_id: userId } }),
    activities,
  });
});

exports.staffDailyTrend = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const labels = [];
  const counts = [];

  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);

    const count = await Assessment.count({
      where: {
        user_id: userId,
        [Op.or]: [
          { submitted_at: { [Op.gte]: day, [Op.lt]: next } },
          { created_at: { [Op.gte]: day, [Op.lt]: next }, submitted_at: null },
        ],
      },
    });

    labels.push(day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    counts.push(count);
  }

  res.json({ labels, data: counts });
});

exports.staffCategoryDistribution = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Use raw SQL with COALESCE so we pick up category from either:
  //  - product_catalog.category (old assessments that have product_type_id)
  //  - assessments.product_category (new assessments that set the field directly)
  const sequelize = Assessment.sequelize;
  const rows = await sequelize.query(
    `SELECT COALESCE(pc.category, a.product_category) AS cat, COUNT(a.id) AS cnt
     FROM assessments a
     LEFT JOIN product_catalog pc ON a.product_type_id = pc.id
     WHERE a.user_id = :userId
     GROUP BY COALESCE(pc.category, a.product_category)`,
    { replacements: { userId }, type: sequelize.constructor.QueryTypes.SELECT }
  );

  const categoryMap = {};
  Object.keys(CATEGORY_LABELS).forEach((k) => { categoryMap[k] = 0; });

  rows.forEach((row) => {
    const catKey = row.cat;
    if (catKey && categoryMap[catKey] !== undefined) {
      categoryMap[catKey] = Number(row.cnt || 0);
    }
  });

  const distribution = Object.entries(categoryMap).map(([key, value]) => ({
    label: CATEGORY_LABELS[key] || key,
    value,
  }));

  res.json({ distribution });
});

exports.staffBranchDistribution = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.user.id, { include: [{ model: Region, attributes: ['id', 'name'] }] });
  const userRegionId = user?.region_id;

  if (!userRegionId) {
    return res.json({ distribution: [{ label: 'My Assessments', value: await Assessment.count({ where: { user_id: req.user.id } }) }] });
  }

  const regionUsers = await User.findAll({ where: { region_id: userRegionId }, attributes: ['id'] });
  const userIds = regionUsers.map((u) => u.id);

  const rows = await Assessment.findAll({
    attributes: ['user_id', [fn('COUNT', col('assessments.id')), 'count']],
    where: { user_id: { [Op.in]: userIds } },
    group: ['user_id'],
    raw: true,
  });

  const staff = await User.findAll({ where: { id: { [Op.in]: userIds } }, attributes: ['id', 'full_name'] });
  const nameMap = Object.fromEntries(staff.map((s) => [s.id, s.full_name]));

  const regionName = user.region?.name || user.Region?.name || 'Branch';
  res.json({
    branch_name: regionName,
    distribution: rows.map((row) => ({
      label: nameMap[row.user_id] || 'Staff',
      value: Number(row.count || 0),
    })),
  });
});

// Legacy monthly trend
exports.staffTrends = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d);
  }
  const labels = months.map((m) => m.toLocaleString('default', { month: 'short' }));
  const data = await Promise.all(months.map(async (m) => {
    const start = new Date(m.getFullYear(), m.getMonth(), 1);
    const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    return Assessment.count({ where: { user_id: userId, created_at: { [Op.gte]: start, [Op.lt]: end } } });
  }));
  res.json({ labels, data });
});

exports.staffDistribution = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const catalog = await ProductCatalog.findAll();
  const distribution = await Promise.all(catalog.map(async (p) => {
    const count = await Assessment.count({ where: { user_id: userId, product_type_id: p.id } });
    return { label: p.name, value: count };
  }));
  res.json({ distribution: distribution.filter((d) => d.value > 0) });
});
