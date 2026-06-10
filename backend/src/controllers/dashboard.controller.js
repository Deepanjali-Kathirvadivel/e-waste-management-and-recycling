const { Op } = require('sequelize');
const { Assessment, ActivityLog, User, ProductCatalog } = require('../models');
const catchAsync = require('../utils/catchAsync');
const { getRecent } = require('../services/activity.service');

exports.staffKPI = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayCount, totalCount, draftCount, pendingHrCount, approvedCount, rejectedCount, activities] = await Promise.all([
    Assessment.count({ where: { user_id: userId, created_at: { [Op.gte]: today } } }),
    Assessment.count({ where: { user_id: userId } }),
    Assessment.count({ where: { user_id: userId, status: { [Op.in]: ['draft', 'in_progress'] } } }),
    Assessment.count({ where: { user_id: userId, status: 'pending_hr_approval' } }),
    Assessment.count({ where: { user_id: userId, status: 'hr_approved' } }),
    Assessment.count({ where: { user_id: userId, status: 'hr_rejected' } }),
    getRecent(userId, 10),
  ]);

  const totalValue = await Assessment.sum('value_estimate', { where: { user_id: userId, status: 'completed' } });

  res.json({
    today_collections: todayCount,
    total_assessments: totalCount,
    collection_value: totalValue || 0,
    pending_assessments: draftCount,
    pending_quotations: pendingHrCount,
    approved_quotations: approvedCount,
    rejected_quotations: rejectedCount,
    activities,
  });
});

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
