const { Op, fn, col } = require('sequelize');
const { Assessment, AssessmentImage, AssessmentDetail, ProductCatalog, User, Facility, ActivityLog } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { log } = require('../services/activity.service');
const notificationService = require('../services/notification.service');
const pagination = require('../utils/pagination');

const CATEGORY_LABELS = {
  IT: 'IT',
  CE: 'Consumer Electronics',
  LS: 'Appliances',
  EE: 'Electrical Tools',
  TLS: 'Toys & Sports',
  LI: 'Lighting',
  MD: 'Medical Devices',
};

exports.dashboard = catchAsync(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pending, approvedToday, rejectedToday, total, approvedTotal, rejectedTotal] = await Promise.all([
    Assessment.count({ where: { status: 'pending_manager_review' } }),
    Assessment.count({ where: { status: 'approved', hr_acted_at: { [Op.gte]: today } } }),
    Assessment.count({ where: { status: 'rejected', hr_acted_at: { [Op.gte]: today } } }),
    Assessment.count(),
    Assessment.count({ where: { status: 'approved' } }),
    Assessment.count({ where: { status: 'rejected' } }),
  ]);

  const revenueSum = await Assessment.sum('hr_approved_value', {
    where: { status: { [Op.in]: ['approved', 'hub_assigned', 'completed'] } },
  });

  const branchRows = await Assessment.findAll({
    attributes: [
      'destination_id',
      [fn('COUNT', col('assessments.id')), 'count'],
      [fn('SUM', col('hr_approved_value')), 'revenue'],
    ],
    where: { destination_id: { [Op.ne]: null }, hr_approved_value: { [Op.ne]: null } },
    group: ['destination_id'],
    raw: true,
  });

  const facilityIds = branchRows.map((row) => row.destination_id).filter(Boolean);
  const facilities = facilityIds.length
    ? await Facility.findAll({ where: { id: facilityIds }, attributes: ['id', 'name'] })
    : [];
  const facilityMap = Object.fromEntries(facilities.map((f) => [f.id, f.name]));

  const categoryRows = await Assessment.findAll({
    attributes: ['product_category', [fn('COUNT', col('assessments.id')), 'count']],
    where: { product_category: { [Op.ne]: null } },
    group: ['product_category'],
    raw: true,
  });

  const trendStart = new Date();
  trendStart.setMonth(trendStart.getMonth() - 5);
  trendStart.setDate(1);
  trendStart.setHours(0, 0, 0, 0);

  const trendRows = await Assessment.findAll({
    attributes: [
      [fn('strftime', '%Y-%m', col('submitted_at')), 'month'],
      [fn('COUNT', col('assessments.id')), 'count'],
    ],
    where: { submitted_at: { [Op.gte]: trendStart } },
    group: [fn('strftime', '%Y-%m', col('submitted_at'))],
    order: [[fn('strftime', '%Y-%m', col('submitted_at')), 'ASC']],
    raw: true,
  });

  const monthLabels = [];
  const monthCounts = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(trendStart.getFullYear(), trendStart.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const row = trendRows.find((r) => r.month === key);
    monthLabels.push(label);
    monthCounts.push(Number(row?.count || 0));
  }

  const totalDecided = approvedTotal + rejectedTotal;
  const approvalRate = totalDecided > 0 ? Math.round((approvedTotal / totalDecided) * 100) : 0;

  res.json({
    pending_reviews: pending,
    approved_today: approvedToday,
    rejected_today: rejectedToday,
    total_quotations: total,
    approval_rate: approvalRate,
    branch_revenue: revenueSum || 0,
    branch_performance: branchRows.map((row) => ({
      branch: facilityMap[row.destination_id] || 'Unassigned',
      count: Number(row.count || 0),
      revenue: Number(row.revenue || 0),
    })),
    category_distribution: categoryRows.map((row) => ({
      category: CATEGORY_LABELS[row.product_category] || row.product_category || 'Other',
      count: Number(row.count || 0),
    })),
    quotation_trends: { labels: monthLabels, counts: monthCounts },
  });
});

exports.pendingReviews = catchAsync(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const { rows, count } = await Assessment.findAndCountAll({
    where: { status: 'pending_manager_review' },
    limit, offset, order: [['submitted_at', 'DESC']],
    include: [
      { model: ProductCatalog, attributes: ['name', 'icon'] },
      { model: User, attributes: ['full_name', 'username'] },
    ],
  });
  res.json({ quotations: rows, total: count, page, total_pages: Math.ceil(count / limit) });
});

exports.approvedQuotations = catchAsync(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const { rows, count } = await Assessment.findAndCountAll({
    where: { status: 'approved' },
    limit, offset, order: [['hr_acted_at', 'DESC']],
    include: [
      { model: ProductCatalog, attributes: ['name', 'icon'] },
      { model: User, attributes: ['full_name', 'username'] },
      { model: User, as: 'approver', attributes: ['full_name'] },
      { model: Facility, as: 'assigned_hub', attributes: ['id', 'name'] },
      { model: User, as: 'supply_chain_user', attributes: ['full_name', 'username'] },
    ],
  });
  res.json({ quotations: rows, total: count, page, total_pages: Math.ceil(count / limit) });
});

exports.rejectedQuotations = catchAsync(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const { rows, count } = await Assessment.findAndCountAll({
    where: { status: 'rejected' },
    limit, offset, order: [['hr_acted_at', 'DESC']],
    include: [
      { model: ProductCatalog, attributes: ['name', 'icon'] },
      { model: User, attributes: ['full_name', 'username'] },
      { model: User, as: 'approver', attributes: ['full_name'] },
    ],
  });
  res.json({ quotations: rows, total: count, page, total_pages: Math.ceil(count / limit) });
});

exports.getQuotation = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id, {
    include: [
      { model: AssessmentImage },
      { model: AssessmentDetail },
      { model: ProductCatalog, attributes: ['name', 'icon'] },
      { model: User, attributes: ['full_name', 'username', 'phone'] },
      { model: User, as: 'approver', attributes: ['full_name'] },
      { model: Facility, as: 'assigned_hub', attributes: ['id', 'name', 'type'] },
      { model: User, as: 'supply_chain_user', attributes: ['full_name', 'username'] },
    ],
  });
  if (!assessment) throw new AppError('Quotation not found', 404);
  res.json({ quotation: assessment });
});

exports.approveQuotation = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Quotation not found', 404);
  if (assessment.status !== 'pending_manager_review') throw new AppError('Quotation is not pending review', 400);

  const { approved_value } = req.body;
  await assessment.update({
    status: 'approved',
    hr_approved_value: approved_value || assessment.customer_expected_value || assessment.value_estimate,
    approved_by: req.user.id,
    hr_acted_at: new Date(),
  });

  await log({ userId: req.user.id, action: 'quotation_approved', entityType: 'assessment', entityId: assessment.id,
    metadata: { customer: assessment.customer_name, value: approved_value } });

  try {
    await notificationService.notifyEmployee(assessment, 'approved', req.user.full_name);
  } catch (e) { console.error('Notify error:', e.message); }

  res.json({ message: 'Quotation approved', quotation: assessment });
});

exports.rejectQuotation = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Quotation not found', 404);
  if (assessment.status !== 'pending_manager_review') throw new AppError('Quotation is not pending review', 400);

  const { reason } = req.body;
  await assessment.update({
    status: 'rejected',
    rejection_reason: reason || 'No reason provided',
    hr_rejection_reason: reason || 'No reason provided',
    approved_by: req.user.id,
    hr_acted_at: new Date(),
  });

  await log({ userId: req.user.id, action: 'quotation_rejected', entityType: 'assessment', entityId: assessment.id,
    metadata: { customer: assessment.customer_name, reason } });

  try {
    await notificationService.notifyEmployee(assessment, 'rejected', req.user.full_name);
  } catch (e) { console.error('Notify error:', e.message); }

  res.json({ message: 'Quotation rejected', quotation: assessment });
});

exports.getFacilities = catchAsync(async (req, res) => {
  const facilities = await Facility.findAll({
    where: { status: 'active' },
    attributes: ['id', 'name', 'type', 'location'],
    order: [['name', 'ASC']],
  });
  res.json({ facilities });
});

exports.assignHub = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Assessment not found', 404);
  if (assessment.status !== 'approved') throw new AppError('Assessment must be approved first', 400);

  const { hub_id } = req.body;
  if (!hub_id) throw new AppError('hub_id is required', 400);

  const facility = await Facility.findByPk(hub_id);
  if (!facility) throw new AppError('Hub not found', 404);

  const history = assessment.movement_history || [];
  history.push({
    from: assessment.assigned_hub_id || null,
    to: hub_id,
    type: facility.type,
    assigned_by: req.user.id,
    assigned_at: new Date().toISOString(),
  });

  await assessment.update({
    assigned_hub_id: hub_id,
    destination_id: hub_id,
    destination_type: facility.type,
    movement_history: history,
    status: 'hub_assigned',
  });

  await log({ userId: req.user.id, action: 'hub_assigned', entityType: 'assessment', entityId: assessment.id,
    metadata: { customer: assessment.customer_name, hub: facility.name } });

  try {
    await notificationService.notifyEmployee(assessment, 'hub_assigned', req.user.full_name);
    await notificationService.notifySupplyChain(assessment, facility.name);
  } catch (e) { console.error('Notify error:', e.message); }

  res.json({ message: 'Hub assigned successfully', quotation: assessment });
});

exports.modifyQuotation = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Quotation not found', 404);
  if (assessment.status !== 'pending_manager_review') throw new AppError('Can only modify pending quotations', 400);

  const { value_estimate, value_min, value_max, notes } = req.body;

  const updates = {};
  if (value_estimate !== undefined) updates.value_estimate = value_estimate;
  if (value_min !== undefined) updates.value_min = value_min;
  if (value_max !== undefined) updates.value_max = value_max;
  if (notes !== undefined) updates.notes = notes;

  if (!Object.keys(updates).length) throw new AppError('No fields to update', 400);

  await assessment.update(updates);

  await log({ userId: req.user.id, action: 'quotation_modified', entityType: 'assessment', entityId: assessment.id,
    metadata: { customer: assessment.customer_name, changes: updates } });

  try {
    await notificationService.notifyEmployee(assessment, 'modified', req.user.full_name);
  } catch (e) { console.error('Notify error:', e.message); }

  res.json({ message: 'Quotation modified', quotation: assessment });
});

exports.employeeKPIs = catchAsync(async (req, res) => {
  const employees = await User.findAll({
    where: { role: 'employee', is_active: true },
    attributes: ['id', 'full_name', 'username', 'region_id'],
  });

  const results = await Promise.all(employees.map(async (emp) => {
    const total = await Assessment.count({ where: { user_id: emp.id } });
    const approved = await Assessment.count({ where: { user_id: emp.id, status: 'approved' } });
    const rejected = await Assessment.count({ where: { user_id: emp.id, status: 'rejected' } });
    const totalValue = await Assessment.sum('hr_approved_value', { where: { user_id: emp.id, deal_number: { [Op.ne]: null } } });
    return {
      id: emp.id,
      name: emp.full_name,
      username: emp.username,
      total_assessments: total,
      approved: approved,
      rejected: rejected,
      approval_rate: total > 0 ? Math.round((approved / total) * 100) : 0,
      rejection_rate: total > 0 ? Math.round((rejected / total) * 100) : 0,
      average_deal_value: total > 0 && totalValue ? Math.round(totalValue / total) : 0,
    };
  }));

  res.json({ employees: results });
});

exports.receiptHistory = catchAsync(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const { rows, count } = await Assessment.findAndCountAll({
    where: { deal_number: { [Op.ne]: null } },
    limit, offset, order: [['deal_closed_at', 'DESC']],
    include: [
      { model: ProductCatalog, attributes: ['name'] },
      { model: User, attributes: ['full_name'] },
      { model: User, as: 'approver', attributes: ['full_name'] },
    ],
  });
  res.json({ receipts: rows, total: count, page, total_pages: Math.ceil(count / limit) });
});

exports.getReceipt = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id, {
    include: [
      { model: ProductCatalog, attributes: ['name'] },
      { model: User, attributes: ['full_name'] },
    ],
  });
  if (!assessment) throw new AppError('Assessment not found', 404);

  const receiptHtml = `
    <html><head><style>
      body{font-family:Arial,sans-serif;max-width:600px;margin:40px auto;padding:20px}
      h1{color:#16A34A;border-bottom:2px solid #16A34A;padding-bottom:10px}
      table{width:100%;border-collapse:collapse;margin:20px 0}
      td{padding:8px;border-bottom:1px solid #ddd}
      .label{font-weight:bold;color:#555;width:40%}
      .total{font-size:1.2em;font-weight:bold;color:#16A34A}
      .footer{margin-top:30px;font-size:0.85em;color:#999;text-align:center}
    </style></head><body>
    <h1>Green Era Recyclers - Receipt</h1>
    <table>
      <tr><td class="label">Receipt No</td><td>${assessment.receipt_number || 'N/A'}</td></tr>
      <tr><td class="label">Deal No</td><td>${assessment.deal_number || 'N/A'}</td></tr>
      <tr><td class="label">Collection No</td><td>${assessment.collection_number || 'N/A'}</td></tr>
      <tr><td class="label">Customer</td><td>${assessment.customer_name || '-'}</td></tr>
      <tr><td class="label">Phone</td><td>${assessment.customer_phone || '-'}</td></tr>
      <tr><td class="label">Product</td><td>${assessment.product_catalog?.name || assessment.brand || '-'}</td></tr>
      <tr><td class="label">Brand/Model</td><td>${assessment.brand || '-'} ${assessment.model || ''}</td></tr>
      <tr><td class="label">Condition</td><td>${assessment.condition || '-'}</td></tr>
      <tr><td class="label">Approved Value</td><td class="total">\u20B9${(assessment.hr_approved_value || 0).toLocaleString('en-IN')}</td></tr>
      <tr><td class="label">Date</td><td>${new Date(assessment.deal_closed_at || assessment.updatedAt).toLocaleString()}</td></tr>
    </table>
    <div class="footer">Thank you for recycling with Green Era!</div>
    </body></html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(receiptHtml);
});
