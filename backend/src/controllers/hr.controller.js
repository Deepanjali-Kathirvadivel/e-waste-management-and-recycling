const { Op, fn, col } = require('sequelize');
const { Assessment, AssessmentImage, AssessmentDetail, ProductCatalog, User, Facility } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { log } = require('../services/activity.service');
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

  const [pending, approvedToday, rejectedToday, total] = await Promise.all([
    Assessment.count({ where: { status: 'pending_hr_approval' } }),
    Assessment.count({ where: { status: 'hr_approved', hr_acted_at: { [Op.gte]: today } } }),
    Assessment.count({ where: { status: 'hr_rejected', hr_acted_at: { [Op.gte]: today } } }),
    Assessment.count(),
  ]);

  const branchRows = await Assessment.findAll({
    attributes: [
      'destination_id',
      [fn('COUNT', col('assessments.id')), 'count'],
    ],
    where: { destination_id: { [Op.ne]: null } },
    group: ['destination_id'],
    raw: true,
  });

  const facilityIds = branchRows.map((row) => row.destination_id).filter(Boolean);
  const facilities = facilityIds.length
    ? await Facility.findAll({ where: { id: facilityIds }, attributes: ['id', 'name'] })
    : [];
  const facilityMap = Object.fromEntries(facilities.map((f) => [f.id, f.name]));

  const categoryRows = await Assessment.findAll({
    attributes: [
      'product_category',
      [fn('COUNT', col('assessments.id')), 'count'],
    ],
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
    where: {
      submitted_at: { [Op.gte]: trendStart },
    },
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

  res.json({
    pending_quotations: pending,
    approved_today: approvedToday,
    rejected_today: rejectedToday,
    total_quotations: total,
    branch_performance: branchRows.map((row) => ({
      branch: facilityMap[row.destination_id] || 'Unassigned',
      count: Number(row.count || 0),
    })),
    category_distribution: categoryRows.map((row) => ({
      category: CATEGORY_LABELS[row.product_category] || row.product_category || 'Other',
      count: Number(row.count || 0),
    })),
    quotation_trends: {
      labels: monthLabels,
      counts: monthCounts,
    },
  });
});

exports.pendingQuotations = catchAsync(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const { rows, count } = await Assessment.findAndCountAll({
    where: { status: 'pending_hr_approval' },
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
    where: { status: 'hr_approved' },
    limit, offset, order: [['hr_acted_at', 'DESC']],
    include: [
      { model: ProductCatalog, attributes: ['name', 'icon'] },
      { model: User, attributes: ['full_name', 'username'] },
      { model: User, as: 'approver', attributes: ['full_name'] },
    ],
  });
  res.json({ quotations: rows, total: count, page, total_pages: Math.ceil(count / limit) });
});

exports.rejectedQuotations = catchAsync(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const { rows, count } = await Assessment.findAndCountAll({
    where: { status: 'hr_rejected' },
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
      { model: Facility, as: 'destination', attributes: ['name', 'type'] },
    ],
  });
  if (!assessment) throw new AppError('Quotation not found', 404);
  res.json({ quotation: assessment });
});

exports.approveQuotation = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Quotation not found', 404);
  if (assessment.status !== 'pending_hr_approval') throw new AppError('Quotation is not pending approval', 400);

  const { approved_value } = req.body;
  await assessment.update({
    status: 'hr_approved',
    hr_approved_value: approved_value || assessment.customer_expected_value || assessment.value_estimate,
    approved_by: req.user.id,
    hr_acted_at: new Date(),
  });

  await log({ userId: req.user.id, action: 'quotation_approved', entityType: 'assessment', entityId: assessment.id,
    metadata: { customer: assessment.customer_name, value: approved_value } });

  res.json({ message: 'Quotation approved', quotation: assessment });
});

exports.rejectQuotation = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Quotation not found', 404);
  if (assessment.status !== 'pending_hr_approval') throw new AppError('Quotation is not pending approval', 400);

  const { reason } = req.body;
  await assessment.update({
    status: 'hr_rejected',
    hr_rejection_reason: reason || 'No reason provided',
    approved_by: req.user.id,
    hr_acted_at: new Date(),
  });

  await log({ userId: req.user.id, action: 'quotation_rejected', entityType: 'assessment', entityId: assessment.id,
    metadata: { customer: assessment.customer_name, reason } });

  res.json({ message: 'Quotation rejected', quotation: assessment });
});

exports.generateOTP = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Quotation not found', 404);
  if (assessment.status !== 'hr_approved') throw new AppError('Quotation must be approved first', 400);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await assessment.update({ otp_code: otp, otp_verified: false });

  console.log(`[SMS] OTP for ${assessment.customer_phone}: ${otp}`);

  res.json({ message: 'OTP sent to customer', otp }); 
});

exports.verifyOTP = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Quotation not found', 404);
  if (assessment.otp_verified) throw new AppError('OTP already verified', 400);

  const { otp } = req.body;
  if (assessment.otp_code !== otp) throw new AppError('Invalid OTP', 400);

  await assessment.update({ otp_verified: true });
  res.json({ message: 'OTP verified successfully' });
});

exports.closeDeal = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Quotation not found', 404);
  if (!assessment.otp_verified) throw new AppError('Customer OTP not verified', 400);

  const dealNum = `DEAL-${String(assessment.id).padStart(6, '0')}`;
  const receiptNum = `RCPT-${String(assessment.id).padStart(6, '0')}-${Date.now().toString(36).toUpperCase()}`;
  const collNum = `COL-${String(assessment.id).padStart(6, '0')}`;

  await assessment.update({
    deal_number: dealNum,
    receipt_number: receiptNum,
    collection_number: collNum,
    deal_closed_at: new Date(),
  });

  await log({ userId: req.user.id, action: 'deal_closed', entityType: 'assessment', entityId: assessment.id,
    metadata: { customer: assessment.customer_name, deal_number: dealNum, receipt_number: receiptNum } });

  res.json({
    message: 'Deal closed successfully',
    deal_number: dealNum,
    receipt_number: receiptNum,
    collection_number: collNum,
    quotation: assessment,
  });
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

exports.assignDestination = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Assessment not found', 404);

  const { destination_id, destination_type } = req.body;
  const history = assessment.movement_history || [];
  history.push({
    from: assessment.destination_id || null,
    to: destination_id,
    type: destination_type,
    assigned_by: req.user.id,
    assigned_at: new Date().toISOString(),
  });

  await assessment.update({
    destination_id,
    destination_type,
    movement_history: history,
  });

  res.json({ message: 'Destination assigned', quotation: assessment });
});

exports.getDealGroup = catchAsync(async (req, res) => {
  const { deal_group_id } = req.params;
  if (!deal_group_id) throw new AppError('deal_group_id required', 400);
  const assessments = await Assessment.findAll({
    where: { deal_group_id },
    include: [
      { model: ProductCatalog, attributes: ['name', 'icon'] },
      { model: AssessmentImage },
    ],
    order: [['id', 'ASC']],
  });
  res.json({ assessments });
});

exports.setCustomerExpectedValue = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Assessment not found', 404);

  const { customer_expected_value } = req.body;
  await assessment.update({ customer_expected_value });

  res.json({ message: 'Customer expected value saved', quotation: assessment });
});
