const { Op, fn, col } = require('sequelize');
const { Assessment, AssessmentImage, AssessmentDetail, ProductCatalog, User, Facility } = require('../models');
const sequelize = require('../config/database');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { log } = require('../services/activity.service');
const notificationService = require('../services/notification.service');
const receiptService = require('../services/receipt.service');
const pagination = require('../utils/pagination');

exports.dashboard = catchAsync(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const userId = req.user.id;

  const [todayPickups, pendingCollections, completedCollections, assignedPickups, collectionTrend, branchDistribution] = await Promise.all([
    Assessment.count({
      where: { supply_chain_user_id: userId, status: { [Op.in]: ['supply_chain_assigned', 'otp_verified'] } },
    }),
    Assessment.count({
      where: {
        [Op.or]: [
          { supply_chain_user_id: userId },
          { supply_chain_user_id: null, status: 'hub_assigned' },
        ],
        status: { [Op.in]: ['hub_assigned', 'supply_chain_assigned', 'otp_verified'] },
      },
    }),
    Assessment.count({
      where: {
        supply_chain_user_id: userId,
        status: { [Op.in]: ['payment_completed', 'collected', 'in_transit', 'delivered_to_hub'] },
      },
    }),
    Assessment.count({
      where: {
        [Op.or]: [
          { supply_chain_user_id: userId },
          { supply_chain_user_id: null, status: 'hub_assigned' },
        ],
        status: { [Op.in]: ['hub_assigned', 'supply_chain_assigned'] },
      },
    }),
    sequelize.query(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM assessments
      WHERE supply_chain_user_id = ?
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
      LIMIT 6
    `, { replacements: [userId], type: sequelize.QueryTypes.SELECT }),
    sequelize.query(`
      SELECT COALESCE(f.name, 'Unassigned') as hub_name, COUNT(*) as count
      FROM assessments a
      LEFT JOIN facilities f ON f.id = a.assigned_hub_id
      WHERE a.supply_chain_user_id = ?
      GROUP BY a.assigned_hub_id
    `, { replacements: [userId], type: sequelize.QueryTypes.SELECT }),
  ]);

  res.json({
    today_pickups: todayPickups,
    pending_collections: pendingCollections,
    completed_collections: completedCollections,
    assigned_pickups: assignedPickups,
    collection_trend: collectionTrend,
    branch_distribution: branchDistribution,
  });
});

exports.availableDeals = catchAsync(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const statusFilter = { [Op.in]: ['hub_assigned', 'supply_chain_assigned', 'otp_verified', 'payment_completed', 'collected', 'in_transit'] };

  const where = {};
  if (req.user.role === 'supply_chain') {
    where[Op.or] = [
      { supply_chain_user_id: req.user.id, status: statusFilter },
      { supply_chain_user_id: null, status: 'hub_assigned' },
    ];
  } else {
    where.status = statusFilter;
  }

  const { rows, count } = await Assessment.findAndCountAll({
    where, limit, offset, order: [['hr_acted_at', 'DESC']],
    include: [
      { model: ProductCatalog, attributes: ['name', 'icon'] },
      { model: User, attributes: ['full_name', 'username'] },
      { model: User, as: 'approver', attributes: ['full_name'] },
      { model: Facility, as: 'assigned_hub', attributes: ['name', 'type'] },
    ],
  });
  res.json({ deals: rows, total: count, page, total_pages: Math.ceil(count / limit) });
});

exports.getDeal = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id, {
    include: [
      { model: AssessmentImage },
      { model: AssessmentDetail },
      { model: ProductCatalog, attributes: ['name', 'icon'] },
      { model: User, attributes: ['full_name', 'username', 'phone'] },
      { model: Facility, as: 'assigned_hub', attributes: ['name', 'type', 'location'] },
    ],
  });
  if (!assessment) throw new AppError('Deal not found', 404);
  res.json({ deal: assessment });
});

exports.assignSelf = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Deal not found', 404);
  if (!['hub_assigned', 'ready_for_pickup'].includes(assessment.status)) {
    throw new AppError('Deal is not available for pickup', 400);
  }

  await assessment.update({
    supply_chain_user_id: req.user.id,
    status: 'supply_chain_assigned',
  });

  await log({ userId: req.user.id, action: 'pickup_assigned', entityType: 'assessment', entityId: assessment.id,
    metadata: { customer: assessment.customer_name } });

  res.json({ message: 'Deal assigned to you', deal: assessment });
});

exports.generateOTP = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Deal not found', 404);
  if (!['hub_assigned', 'supply_chain_assigned', 'ready_for_pickup'].includes(assessment.status)) {
    throw new AppError('Deal is not ready for OTP generation', 400);
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await assessment.update({ otp_code: otp, otp: otp, otp_verified: false, otp_generated_at: new Date() });

  await notificationService.sendOTP(assessment.customer_phone, otp, assessment.customer_name);

  res.json({ message: 'OTP sent to customer', otp });
});

exports.verifyOTP = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Deal not found', 404);
  if (assessment.otp_verified) throw new AppError('OTP already verified', 400);

  const { otp } = req.body;
  if (assessment.otp_code !== otp && assessment.otp !== otp) throw new AppError('Invalid OTP', 400);

  await assessment.update({ otp_verified: true, status: 'otp_verified' });

  await log({ userId: req.user.id, action: 'otp_verified', entityType: 'assessment', entityId: assessment.id,
    metadata: { customer: assessment.customer_name } });

  res.json({ message: 'OTP verified successfully' });
});

exports.collectProduct = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id, {
    include: [
      { model: ProductCatalog, attributes: ['name'] },
      { model: Facility, as: 'assigned_hub', attributes: ['name'] },
    ],
  });
  if (!assessment) throw new AppError('Deal not found', 404);
  if (!assessment.otp_verified) throw new AppError('Customer OTP not verified', 400);

  const scUser = await User.findByPk(req.user.id, { attributes: ['full_name'] });

  const dealNum = `DEAL-${String(assessment.id).padStart(6, '0')}`;
  const receiptNum = `RCPT-${String(assessment.id).padStart(6, '0')}-${Date.now().toString(36).toUpperCase()}`;
  const collNum = `COL-${String(assessment.id).padStart(6, '0')}`;

  const history = assessment.movement_history || [];
  history.push({
    action: 'collected',
    collected_by: req.user.id,
    collected_at: new Date().toISOString(),
  });

  await assessment.update({
    status: 'payment_completed',
    deal_number: dealNum,
    receipt_number: receiptNum,
    collection_number: collNum,
    deal_closed_at: new Date(),
    movement_history: history,
  });

  await log({ userId: req.user.id, action: 'product_collected', entityType: 'assessment', entityId: assessment.id,
    metadata: { customer: assessment.customer_name, deal_number: dealNum } });

  const dealInfo = {
    deal_number: dealNum,
    receipt_number: receiptNum,
    collection_number: collNum,
    product_name: assessment.product_catalog?.name || assessment.brand || '-',
    approved_value: assessment.hr_approved_value || assessment.value_estimate || 0,
    branch_name: assessment.assigned_hub?.name || 'Not assigned',
    collected_by_name: scUser?.full_name || 'Supply Chain Staff',
    deal_closed_at: new Date(),
    qr_data: JSON.stringify({
      id: assessment.id,
      receipt: receiptNum,
      deal: dealNum,
    }),
  };

  await notificationService.sendDealClosedNotification(
    { customer_name: assessment.customer_name, customer_email: assessment.customer_email, customer_phone: assessment.customer_phone },
    dealInfo, ''
  );

  res.json({
    message: 'Product collected successfully. Receipt sent to customer.',
    deal_number: dealNum,
    receipt_number: receiptNum,
    collection_number: collNum,
    deal: assessment,
  });
});

exports.downloadReceipt = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id, {
    include: [
      { model: ProductCatalog, attributes: ['name'] },
      { model: Facility, as: 'assigned_hub', attributes: ['name'] },
      { model: User, attributes: ['full_name'] },
    ],
  });
  if (!assessment) throw new AppError('Deal not found', 404);
  if (!assessment.receipt_number) throw new AppError('Receipt not yet generated. Collect the product first.', 400);

  const dealInfo = {
    receipt_number: assessment.receipt_number,
    deal_number: assessment.deal_number,
    collection_number: assessment.collection_number,
    product_name: assessment.product_catalog?.name || assessment.brand || '-',
    approved_value: assessment.hr_approved_value || assessment.final_value || assessment.value_estimate || 0,
    branch_name: assessment.assigned_hub?.name || 'Not assigned',
    collected_by_name: assessment.user?.full_name || 'Supply Chain Staff',
    deal_closed_at: assessment.deal_closed_at || new Date(),
    qr_data: JSON.stringify({
      id: assessment.id,
      receipt: assessment.receipt_number,
      deal: assessment.deal_number,
    }),
  };

  const pdfBuffer = await receiptService.generateReceiptPDF(dealInfo, assessment);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${assessment.receipt_number}.pdf"`,
    'Content-Length': pdfBuffer.length,
  });
  res.send(pdfBuffer);
});

exports.updateTransportStatus = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Deal not found', 404);

  const { status } = req.body;
  const validTransitions = {
    'payment_completed': 'collected',
    'collected': 'in_transit',
    'in_transit': 'delivered_to_hub',
  };

  if (!Object.values(validTransitions).includes(status)) {
    throw new AppError('Invalid transport status', 400);
  }

  const history = assessment.movement_history || [];
  history.push({
    action: `status_updated_to_${status}`,
    updated_by: req.user.id,
    updated_at: new Date().toISOString(),
  });

  await assessment.update({ status, movement_history: history });

  await log({ userId: req.user.id, action: `transport_${status}`, entityType: 'assessment', entityId: assessment.id,
    metadata: { customer: assessment.customer_name } });

  res.json({ message: `Status updated to ${status}`, deal: assessment });
});

exports.completedDeliveries = catchAsync(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const where = req.user.role === 'supply_chain'
    ? { supply_chain_user_id: req.user.id }
    : {};
  where.status = { [Op.in]: ['delivered_to_hub', 'received', 'completed'] };

  const { rows, count } = await Assessment.findAndCountAll({
    where, limit, offset, order: [['deal_closed_at', 'DESC']],
    include: [
      { model: ProductCatalog, attributes: ['name'] },
      { model: Facility, as: 'assigned_hub', attributes: ['name'] },
    ],
  });
  res.json({ deliveries: rows, total: count, page, total_pages: Math.ceil(count / limit) });
});
