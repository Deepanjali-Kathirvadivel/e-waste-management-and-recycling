const { Op, fn, col, literal } = require('sequelize');
const { Assessment, AssessmentImage, AssessmentDetail, ProductCatalog, User, Facility, InventoryItem, InventoryMovement, AnalysisResult, Region } = require('../models');
const sequelize = require('../config/database');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { log } = require('../services/activity.service');
const notificationService = require('../services/notification.service');
const receiptService = require('../services/receipt.service');
const pagination = require('../utils/pagination');

const MOVEMENT_ACTION = {
  ASSIGN: 'pickup_assigned',
  SCHEDULE: 'pickup_scheduled',
  OUT_FOR_PICKUP: 'out_for_pickup',
  ARRIVED: 'arrived_at_customer',
  OTP_GENERATED: 'otp_generated',
  OTP_VERIFIED: 'otp_verified',
  CUSTOMER_VERIFIED: 'customer_verified',
  DEAL_CONFIRMED: 'deal_confirmed',
  COLLECTED: 'product_collected',
  IN_TRANSIT: 'in_transit',
  ARRIVED_AT_HUB: 'arrived_at_hub',
  DELIVERED: 'delivered',
  RECEIVED: 'received_at_hub',
  FORWARDED_PROCESSING: 'forwarded_for_processing',
  EXCEPTION: 'exception_reported',
};

async function createInventoryItem(assessment, userId) {
  const existing = await InventoryItem.findOne({ where: { assessment_id: assessment.id } });
  if (existing) return existing;
  return InventoryItem.create({
    assessment_id: assessment.id,
    facility_id: assessment.assigned_hub_id,
    weight_kg: assessment.weight_kg || 0,
    batch_number: `BATCH-${String(assessment.id).padStart(6, '0')}-${Date.now().toString(36).toUpperCase()}`,
    stock_status: 'in_stock',
    lifecycle_stage: 'received',
    received_at: new Date(),
    received_by: userId,
  });
}

async function createInventoryMovement({ inventoryItemId, assessmentId, fromStatus, toStatus, fromLocation, toLocation, action, performedBy, notes }) {
  return InventoryMovement.create({
    inventory_item_id: inventoryItemId,
    assessment_id: assessmentId,
    from_status: fromStatus || null,
    to_status: toStatus || null,
    from_location: fromLocation || null,
    to_location: toLocation || null,
    action: action,
    performed_by: performedBy,
    notes: notes || null,
  });
}

const RECOVERY_MAP = { reusable: 95, repairable: 75, recyclable: 50, scrap: 10 };
const REVENUE_MAP = { reusable: 0.8, repairable: 0.5, recyclable: 0.3, scrap: 0.05 };

function pushMovement(assessment, action, userId, extra) {
  const history = assessment.movement_history || [];
  history.push({ action, user_id: userId, timestamp: new Date().toISOString(), ...extra });
  return history;
}

const SUPPLY_CHAIN_STATUS = {
  ready_for_pickup: { label: 'Ready for Pickup', color: 'warning' },
  supply_chain_assigned: { label: 'Assigned', color: 'info' },
  pickup_scheduled: { label: 'Pickup Scheduled', color: 'primary' },
  out_for_pickup: { label: 'Out for Pickup', color: 'dark' },
  arrived_at_customer: { label: 'Arrived at Customer', color: 'secondary' },
  customer_verified: { label: 'Customer Verified', color: 'success' },
  deal_confirmed: { label: 'Deal Confirmed', color: 'success' },
  collected: { label: 'Collected', color: 'secondary' },
  in_transit: { label: 'In Transit', color: 'dark' },
  arrived_at_hub: { label: 'Arrived at Hub', color: 'primary' },
  delivered: { label: 'Delivered', color: 'success' },
  received: { label: 'Received', color: 'success' },
  ready_for_processing: { label: 'Ready for Processing', color: 'info' },
  otp_verified: { label: 'OTP Verified', color: 'success' },
  payment_completed: { label: 'Payment Completed', color: 'primary' },
  delivered_to_hub: { label: 'Delivered to Hub', color: 'success' },
  reusability_analysis: { label: 'Under Analysis', color: 'warning' },
  completed: { label: 'Completed', color: 'success' },
  customer_unavailable: { label: 'Customer Unavailable', color: 'danger' },
  otp_failed: { label: 'OTP Failed', color: 'danger' },
  customer_cancelled: { label: 'Customer Cancelled', color: 'danger' },
  requires_manager_review: { label: 'Manager Review', color: 'warning' },
  transport_delayed: { label: 'Transport Delayed', color: 'warning' },
  delivery_exception: { label: 'Delivery Exception', color: 'danger' },
  cancelled: { label: 'Cancelled', color: 'danger' },
};

const PICKUP_WORKFLOW = [
  'ready_for_pickup', 'supply_chain_assigned', 'pickup_scheduled',
  'out_for_pickup', 'arrived_at_customer', 'customer_verified',
  'deal_confirmed', 'collected', 'in_transit', 'arrived_at_hub',
  'delivered', 'received', 'ready_for_processing',
];

const EXCEPTION_STATUSES = [
  'customer_unavailable', 'otp_failed', 'customer_cancelled',
  'requires_manager_review', 'transport_delayed', 'delivery_exception',
];

// ═══════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════
exports.dashboard = catchAsync(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const userId = req.user.id;

  const activeStatuses = PICKUP_WORKFLOW.filter(s => !['received', 'ready_for_processing', 'delivered', 'completed'].includes(s));

  const raw = await Promise.all([
    // today_assigned - assigned today
    Assessment.count({ where: { supply_chain_user_id: userId, updatedAt: { [Op.gte]: today }, status: { [Op.in]: ['supply_chain_assigned', 'pickup_scheduled'] } } }),
    // pending_pickups - not yet collected
    Assessment.count({ where: { supply_chain_user_id: userId, status: { [Op.in]: ['supply_chain_assigned', 'pickup_scheduled', 'out_for_pickup', 'arrived_at_customer', 'customer_verified', 'deal_confirmed'] } } }),
    // completed_today - collected/delivered today
    Assessment.count({ where: { supply_chain_user_id: userId, status: { [Op.in]: ['collected', 'delivered'] }, updatedAt: { [Op.gte]: today } } }),
    // in_transit
    Assessment.count({ where: { supply_chain_user_id: userId, status: 'in_transit' } }),
    // delivered total
    Assessment.count({ where: { supply_chain_user_id: userId, status: { [Op.in]: ['delivered', 'received', 'ready_for_processing', 'completed'] } } }),
    // total attempted pickups for success rate
    Assessment.count({ where: { supply_chain_user_id: userId, status: { [Op.notIn]: ['hub_assigned', 'ready_for_pickup'] } } }),
    // daily pickup trend
    sequelize.query(`SELECT strftime('%Y-%m-%d', created_at) as date, COUNT(*) as count FROM assessments WHERE supply_chain_user_id = ? AND created_at >= date('now', '-30 days') GROUP BY date ORDER BY date ASC`, { replacements: [userId], type: sequelize.QueryTypes.SELECT }),
    // category distribution
    sequelize.query(`SELECT COALESCE(pc.name,'Unknown') as category, COUNT(*) as count FROM assessments a LEFT JOIN product_catalog pc ON pc.id = a.product_type_id WHERE a.supply_chain_user_id = ? GROUP BY pc.name ORDER BY count DESC`, { replacements: [userId], type: sequelize.QueryTypes.SELECT }),
    // branch-wise pickup count
    sequelize.query(`SELECT COALESCE(f.name,'Unassigned') as branch, COUNT(*) as count FROM assessments a LEFT JOIN facilities f ON f.id = a.assigned_hub_id WHERE a.supply_chain_user_id = ? GROUP BY a.assigned_hub_id`, { replacements: [userId], type: sequelize.QueryTypes.SELECT }),
    // completion rate (status breakdown)
    sequelize.query(`SELECT status, COUNT(*) as count FROM assessments WHERE supply_chain_user_id = ? GROUP BY status`, { replacements: [userId], type: sequelize.QueryTypes.SELECT }),
  ]);

  const totalAttempted = raw[5] || 1;
  const totalDelivered = raw[4] || 0;
  const successRate = Math.round((totalDelivered / totalAttempted) * 100);

  res.json({
    today_assigned: raw[0],
    pending_pickups: raw[1],
    completed_today: raw[2],
    in_transit: raw[3],
    total_delivered: raw[4],
    success_rate: successRate,
    daily_trend: raw[6],
    category_distribution: raw[7],
    branch_pickups: raw[8],
    status_breakdown: raw[9],
  });
});

// ═══════════════════════════════════════════════
// PICKUP LIST (active + available)
// ═══════════════════════════════════════════════
exports.pickupList = catchAsync(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const { status, hub_id, priority, search, region_id } = req.query;
  const where = {};
  const isSupplyChain = req.user.role === 'supply_chain';

  const activeStatuses = [...PICKUP_WORKFLOW.filter(s => s !== 'ready_for_processing' && s !== 'completed'), ...EXCEPTION_STATUSES];

  if (status) {
    const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
    where.status = statuses.length === 1 ? statuses[0] : { [Op.in]: statuses };
  } else if (isSupplyChain) {
    where[Op.or] = [
      { supply_chain_user_id: req.user.id, status: { [Op.in]: activeStatuses } },
      { supply_chain_user_id: null, status: ['hub_assigned', 'ready_for_pickup'] },
    ];
  } else {
    where.status = { [Op.in]: activeStatuses };
  }
  if (hub_id) where.assigned_hub_id = hub_id;
  if (priority) where.pickup_priority = priority;
  if (region_id) where.region_id = region_id;
  if (search) {
    where[Op.or] = [
      { customer_name: { [Op.like]: `%${search}%` } },
      { customer_phone: { [Op.like]: `%${search}%` } },
      { brand: { [Op.like]: `%${search}%` } },
      { deal_number: { [Op.like]: `%${search}%` } },
    ];
  }

  const { rows, count } = await Assessment.findAndCountAll({
    where, limit, offset, order: [['hr_acted_at', 'DESC'], ['created_at', 'DESC']],
    include: [
      { model: ProductCatalog, attributes: ['name', 'icon'] },
      { model: User, as: 'supply_chain_user', attributes: ['full_name', 'username'] },
      { model: Facility, as: 'assigned_hub', attributes: ['name', 'type', 'location'] },
      { model: Region, attributes: ['id', 'name'] },
    ],
  });

  const statusMeta = {};
  rows.forEach(d => {
    const s = d.status;
    statusMeta[s] = SUPPLY_CHAIN_STATUS[s] || { label: s, color: 'secondary' };
  });

  res.json({ pickups: rows, total: count, page, total_pages: Math.ceil(count / limit), status_meta: statusMeta });
});

// ═══════════════════════════════════════════════
// LIST REGIONS (for filter dropdown)
// ═══════════════════════════════════════════════
exports.listRegions = catchAsync(async (req, res) => {
  const regions = await Region.findAll({ attributes: ['id', 'name', 'type'], order: [['name', 'ASC']] });
  res.json({ regions });
});

// ═══════════════════════════════════════════════
// PICKUP DETAIL
// ═══════════════════════════════════════════════
exports.pickupDetail = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id, {
    include: [
      { model: AssessmentImage },
      { model: AssessmentDetail },
      { model: ProductCatalog, attributes: ['name', 'icon'] },
      { model: User, attributes: ['full_name', 'username', 'phone'] },
      { model: User, as: 'supply_chain_user', attributes: ['full_name', 'username', 'phone'] },
      { model: Facility, as: 'assigned_hub', attributes: ['name', 'type', 'location'] },
      { model: AnalysisResult },
    ],
  });
  if (!assessment) throw new AppError('Pickup not found', 404);
  const scStatus = SUPPLY_CHAIN_STATUS[assessment.status] || { label: assessment.status, color: 'secondary' };
  res.json({ pickup: assessment, status_meta: scStatus });
});

// ═══════════════════════════════════════════════
// STEP 1: Assign pickup to self
// ═══════════════════════════════════════════════
exports.assignSelf = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Pickup not found', 404);
  if (!['hub_assigned', 'ready_for_pickup'].includes(assessment.status)) throw new AppError('Pickup not available for assignment', 400);
  await assessment.update({ supply_chain_user_id: req.user.id, status: 'supply_chain_assigned', movement_history: pushMovement(assessment, MOVEMENT_ACTION.ASSIGN, req.user.id) });
  await log({ userId: req.user.id, action: 'pickup_assigned', entityType: 'assessment', entityId: assessment.id, metadata: { customer: assessment.customer_name } });
  await notificationService.notifyEmployee(assessment, 'hub_assigned', req.user.full_name || 'Supply Chain');
  res.json({ message: 'Pickup assigned to you', pickup: assessment });
});

// ═══════════════════════════════════════════════
// STEP 2: Schedule pickup
// ═══════════════════════════════════════════════
exports.schedulePickup = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Pickup not found', 404);
  if (!['supply_chain_assigned', 'pickup_scheduled'].includes(assessment.status)) throw new AppError('Cannot schedule this pickup', 400);
  const { scheduled_pickup_date, scheduled_pickup_time, pickup_remarks, pickup_priority } = req.body;
  if (!scheduled_pickup_date) throw new AppError('Pickup date is required', 400);
  await assessment.update({
    status: 'pickup_scheduled',
    scheduled_pickup_date, scheduled_pickup_time: scheduled_pickup_time || null,
    pickup_remarks: pickup_remarks || null,
    pickup_priority: pickup_priority || 'normal',
    movement_history: pushMovement(assessment, MOVEMENT_ACTION.SCHEDULE, req.user.id, { scheduled_date: scheduled_pickup_date, scheduled_time: scheduled_pickup_time }),
  });
  await log({ userId: req.user.id, action: 'pickup_scheduled', entityType: 'assessment', entityId: assessment.id, metadata: { customer: assessment.customer_name, date: scheduled_pickup_date } });
  res.json({ message: 'Pickup scheduled', pickup: assessment });
});

// ═══════════════════════════════════════════════
// STEP 3: Start journey (out for pickup)
// ═══════════════════════════════════════════════
exports.startJourney = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Pickup not found', 404);
  if (assessment.status !== 'pickup_scheduled') throw new AppError('Pickup must be scheduled first', 400);
  const { vehicle_number, driver_name, executive_name } = req.body;
  await assessment.update({
    status: 'out_for_pickup',
    departure_time: new Date(),
    vehicle_number: vehicle_number || null,
    driver_name: driver_name || null,
    executive_name: executive_name || req.user.full_name || null,
    movement_history: pushMovement(assessment, MOVEMENT_ACTION.OUT_FOR_PICKUP, req.user.id, { vehicle_number, driver_name }),
  });
  await log({ userId: req.user.id, action: 'out_for_pickup', entityType: 'assessment', entityId: assessment.id, metadata: { customer: assessment.customer_name, vehicle_number } });
  res.json({ message: 'Out for pickup', pickup: assessment });
});

// ═══════════════════════════════════════════════
// STEP 4: Arrive at customer location
// ═══════════════════════════════════════════════
exports.arriveAtCustomer = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Pickup not found', 404);
  if (assessment.status !== 'out_for_pickup') throw new AppError('Must be out for pickup first', 400);
  const { gps_lat, gps_lng, distance_travelled } = req.body;
  const gpsStr = gps_lat && gps_lng ? `${gps_lat},${gps_lng}` : null;
  await assessment.update({
    status: 'arrived_at_customer',
    arrival_time: new Date(),
    gps_coordinates: gpsStr || null,
    distance_travelled: distance_travelled || null,
    movement_history: pushMovement(assessment, MOVEMENT_ACTION.ARRIVED, req.user.id, { gps: gpsStr, distance: distance_travelled }),
  });
  await log({ userId: req.user.id, action: 'arrived_at_customer', entityType: 'assessment', entityId: assessment.id, metadata: { customer: assessment.customer_name } });
  res.json({ message: 'Arrived at customer location', pickup: assessment });
});

// ═══════════════════════════════════════════════
// STEP 5: Generate OTP
// ═══════════════════════════════════════════════
exports.generateOTP = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Pickup not found', 404);
  if (!['arrived_at_customer', 'supply_chain_assigned', 'pickup_scheduled', 'out_for_pickup'].includes(assessment.status)) throw new AppError('Cannot generate OTP at this stage', 400);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await assessment.update({
    otp_code: otp, otp, otp_verified: false, otp_generated_at: new Date(),
    otp_retry_count: 0,
    movement_history: pushMovement(assessment, MOVEMENT_ACTION.OTP_GENERATED, req.user.id),
  });
  await notificationService.sendOTP(assessment.customer_phone, otp, assessment.customer_name);
  await log({ userId: req.user.id, action: 'otp_generated', entityType: 'assessment', entityId: assessment.id, metadata: { customer: assessment.customer_phone } });
  res.json({ message: 'OTP sent to customer', otp });
});

// ═══════════════════════════════════════════════
// STEP 6: Verify OTP
// ═══════════════════════════════════════════════
exports.verifyOTP = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Pickup not found', 404);
  if (assessment.otp_verified) throw new AppError('OTP already verified', 400);
  const { otp } = req.body;
  const maxRetries = 3;
  if (assessment.otp_code !== otp && assessment.otp !== otp) {
    const retryCount = (assessment.otp_retry_count || 0) + 1;
    const updateData = { otp_retry_count: retryCount };
    if (retryCount >= maxRetries) {
      updateData.status = 'otp_failed';
      updateData.movement_history = pushMovement(assessment, MOVEMENT_ACTION.EXCEPTION, req.user.id, { reason: 'OTP verification failed after max retries' });
    }
    await assessment.update(updateData);
    if (retryCount >= maxRetries) {
      await log({ userId: req.user.id, action: 'otp_failed', entityType: 'assessment', entityId: assessment.id, metadata: { customer: assessment.customer_name, reason: 'Max retries exceeded' } });
      throw new AppError('OTP verification failed. Pickup marked as failed.', 400);
    }
    throw new AppError(`Invalid OTP. ${maxRetries - retryCount} attempts remaining`, 400);
  }
  await assessment.update({
    otp_verified: true, status: 'customer_verified', otp_retry_count: 0,
    movement_history: pushMovement(assessment, MOVEMENT_ACTION.OTP_VERIFIED, req.user.id),
  });
  await log({ userId: req.user.id, action: 'otp_verified', entityType: 'assessment', entityId: assessment.id, metadata: { customer: assessment.customer_name } });
  res.json({ message: 'Customer verified successfully', pickup: assessment });
});

// ═══════════════════════════════════════════════
// STEP 7: Product verification
// ═══════════════════════════════════════════════
exports.verifyProduct = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Pickup not found', 404);
  if (!['customer_verified', 'arrived_at_customer'].includes(assessment.status)) throw new AppError('Customer must be verified first', 400);
  const { product_matches, serial_matches, accessories_present, condition_changed, verification_notes } = req.body;
  if (condition_changed) {
    await assessment.update({
      status: 'requires_manager_review',
      verification_notes: verification_notes || 'Product condition differs significantly from assessment',
      movement_history: pushMovement(assessment, MOVEMENT_ACTION.EXCEPTION, req.user.id, { reason: 'Product condition changed', notes: verification_notes }),
    });
    await notificationService.notifyEmployee(assessment, 'modified', req.user.full_name || 'Supply Chain');
    await log({ userId: req.user.id, action: 'product_mismatch', entityType: 'assessment', entityId: assessment.id, metadata: { customer: assessment.customer_name, reason: 'Product condition changed' } });
    return res.json({ message: 'Product differs from assessment. Returned to manager for review.', pickup: assessment, requires_review: true });
  }
  await assessment.update({
    product_verified: true,
    verification_notes: verification_notes || null,
    movement_history: pushMovement(assessment, MOVEMENT_ACTION.CUSTOMER_VERIFIED, req.user.id, { product_matches, serial_matches, accessories_present }),
  });
  await log({ userId: req.user.id, action: 'product_verified', entityType: 'assessment', entityId: assessment.id, metadata: { customer: assessment.customer_name } });
  res.json({ message: 'Product verified successfully', pickup: assessment });
});

// ═══════════════════════════════════════════════
// STEP 8: Confirm deal with customer
// ═══════════════════════════════════════════════
exports.confirmDeal = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Pickup not found', 404);
  if (!assessment.product_verified && assessment.status !== 'customer_verified') throw new AppError('Product must be verified first', 400);
  await assessment.update({
    status: 'deal_confirmed',
    movement_history: pushMovement(assessment, MOVEMENT_ACTION.DEAL_CONFIRMED, req.user.id, { confirmed_by: req.user.id }),
  });
  await log({ userId: req.user.id, action: 'deal_confirmed', entityType: 'assessment', entityId: assessment.id, metadata: { customer: assessment.customer_name, value: assessment.hr_approved_value } });
  res.json({ message: 'Deal confirmed by customer', pickup: assessment });
});

// ═══════════════════════════════════════════════
// STEP 9: Generate receipt & collect product
// ═══════════════════════════════════════════════
exports.collectProduct = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id, {
    include: [{ model: ProductCatalog, attributes: ['name'] }, { model: Facility, as: 'assigned_hub', attributes: ['name'] }],
  });
  if (!assessment) throw new AppError('Pickup not found', 404);
  if (!['deal_confirmed', 'customer_verified'].includes(assessment.status)) throw new AppError('Deal must be confirmed first', 400);

  const { collection_time, package_count, packaging_condition, collection_notes } = req.body;
  const scUser = await User.findByPk(req.user.id, { attributes: ['full_name'] });
  const dealNum = `DEAL-${String(assessment.id).padStart(6, '0')}`;
  const receiptNum = `RCPT-${String(assessment.id).padStart(6, '0')}-${Date.now().toString(36).toUpperCase()}`;
  const collNum = `COL-${String(assessment.id).padStart(6, '0')}`;

  await assessment.update({
    status: 'collected',
    deal_number: dealNum, receipt_number: receiptNum, collection_number: collNum,
    collection_time: collection_time ? new Date(collection_time) : new Date(),
    package_count: package_count || null,
    packaging_condition: packaging_condition || null,
    collection_notes: collection_notes || null,
    deal_closed_at: new Date(),
    movement_history: pushMovement(assessment, MOVEMENT_ACTION.COLLECTED, req.user.id, { deal_number: dealNum, receipt_number: receiptNum }),
  });

  await log({ userId: req.user.id, action: 'product_collected', entityType: 'assessment', entityId: assessment.id, metadata: { customer: assessment.customer_name, deal_number: dealNum } });

  const dealInfo = {
    deal_number: dealNum, receipt_number: receiptNum, collection_number: collNum,
    product_name: assessment.product_catalog?.name || assessment.brand || '-',
    approved_value: assessment.hr_approved_value || assessment.value_estimate || 0,
    branch_name: assessment.assigned_hub?.name || 'Not assigned',
    collected_by_name: scUser?.full_name || 'Supply Chain Staff',
    deal_closed_at: new Date(),
    qr_data: JSON.stringify({ id: assessment.id, receipt: receiptNum, deal: dealNum }),
  };

  await notificationService.sendDealClosedNotification(
    { customer_name: assessment.customer_name, customer_email: assessment.customer_email, customer_phone: assessment.customer_phone }, dealInfo, ''
  );

  res.json({ message: 'Product collected. Receipt generated.', deal_number: dealNum, receipt_number: receiptNum, pickup: assessment });
});

// ═══════════════════════════════════════════════
// STEP 10: Download receipt
// ═══════════════════════════════════════════════
exports.downloadReceipt = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id, {
    include: [{ model: ProductCatalog, attributes: ['name'] }, { model: Facility, as: 'assigned_hub', attributes: ['name'] }, { model: User, attributes: ['full_name'] }],
  });
  if (!assessment) throw new AppError('Pickup not found', 404);
  if (!assessment.receipt_number) throw new AppError('Receipt not yet generated', 400);
  const dealInfo = {
    receipt_number: assessment.receipt_number, deal_number: assessment.deal_number,
    collection_number: assessment.collection_number,
    product_name: assessment.product_catalog?.name || assessment.brand || '-',
    approved_value: assessment.hr_approved_value || assessment.final_value || assessment.value_estimate || 0,
    branch_name: assessment.assigned_hub?.name || 'Not assigned',
    collected_by_name: assessment.user?.full_name || 'Supply Chain Staff',
    deal_closed_at: assessment.deal_closed_at || new Date(),
    qr_data: JSON.stringify({ id: assessment.id, receipt: assessment.receipt_number, deal: assessment.deal_number }),
  };
  const pdfBuffer = await receiptService.generateReceiptPDF(dealInfo, assessment);
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${assessment.receipt_number}.pdf"`, 'Content-Length': pdfBuffer.length });
  res.send(pdfBuffer);
});

// ═══════════════════════════════════════════════
// STEP 11: Start transport / update transit milestones
// ═══════════════════════════════════════════════
exports.startTransport = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Pickup not found', 404);
  if (assessment.status !== 'collected') throw new AppError('Product must be collected first', 400);
  const { vehicle_number, driver_name } = req.body;
  await assessment.update({
    status: 'in_transit',
    departure_time: new Date(),
    vehicle_number: vehicle_number || assessment.vehicle_number || null,
    driver_name: driver_name || assessment.driver_name || null,
    movement_history: pushMovement(assessment, MOVEMENT_ACTION.IN_TRANSIT, req.user.id, { vehicle_number, driver_name }),
  });
  await log({ userId: req.user.id, action: 'transport_started', entityType: 'assessment', entityId: assessment.id, metadata: { customer: assessment.customer_name } });
  res.json({ message: 'Transport started', pickup: assessment });
});

// ═══════════════════════════════════════════════
// Update transit milestone (left_customer, midway, near_hub, reached_hub)
// ═══════════════════════════════════════════════
exports.updateTransitMilestone = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Pickup not found', 404);
  if (!['in_transit', 'arrived_at_hub'].includes(assessment.status)) throw new AppError('Product is not in transit', 400);
  const { milestone, gps_lat, gps_lng, notes } = req.body;
  const validMilestones = ['left_customer', 'midway', 'near_hub', 'reached_hub'];
  if (!validMilestones.includes(milestone)) throw new AppError('Invalid milestone', 400);

  const gpsStr = gps_lat && gps_lng ? `${gps_lat},${gps_lng}` : null;
  const updateData = { movement_history: pushMovement(assessment, `milestone_${milestone}`, req.user.id, { milestone, gps: gpsStr, notes }) };
  if (gpsStr) updateData.gps_coordinates = gpsStr;
  if (milestone === 'reached_hub') updateData.status = 'arrived_at_hub';
  if (milestone === 'reached_hub') {
    updateData.arrival_time = new Date();
  }

  await assessment.update(updateData);
  await log({ userId: req.user.id, action: `transit_${milestone}`, entityType: 'assessment', entityId: assessment.id, metadata: { customer: assessment.customer_name, milestone } });
  res.json({ message: `Milestone updated: ${milestone.replace(/_/g, ' ')}`, pickup: assessment });
});

// ═══════════════════════════════════════════════
// STEP 12: Deliver to hub (hub operator verifies)
// ═══════════════════════════════════════════════
exports.deliverToHub = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id, {
    include: [{ model: ProductCatalog, attributes: ['name'] }, { model: Facility, as: 'assigned_hub', attributes: ['name'] }],
  });
  if (!assessment) throw new AppError('Pickup not found', 404);
  if (assessment.status !== 'arrived_at_hub') throw new AppError('Product must arrive at hub first', 400);
  const { product_ok, quantity_ok, serial_ok, condition_ok, notes } = req.body;
  if (product_ok === false || quantity_ok === false || serial_ok === false || condition_ok === false) {
    await assessment.update({
      status: 'delivery_exception',
      exception_reason: notes || 'Hub operator rejected delivery',
      movement_history: pushMovement(assessment, MOVEMENT_ACTION.EXCEPTION, req.user.id, { reason: 'Delivery rejected by hub', notes }),
    });
    await log({ userId: req.user.id, action: 'delivery_exception', entityType: 'assessment', entityId: assessment.id, metadata: { customer: assessment.customer_name, reason: notes } });
    return res.json({ message: 'Delivery rejected by hub', pickup: assessment, rejected: true });
  }
  await assessment.update({
    status: 'delivered',
    movement_history: pushMovement(assessment, MOVEMENT_ACTION.DELIVERED, req.user.id, { verified_by: req.user.id }),
  });
  const inv = await createInventoryItem(assessment, req.user.id);
  await createInventoryMovement({
    inventoryItemId: inv.id, assessmentId: assessment.id,
    action: 'delivered_to_hub', toStatus: 'in_stock',
    performedBy: req.user.id, notes: 'Delivered to hub',
  });
  await log({ userId: req.user.id, action: 'product_delivered', entityType: 'assessment', entityId: assessment.id, metadata: { customer: assessment.customer_name, inventory_id: inv.id } });
  res.json({ message: 'Product delivered to hub', pickup: assessment, inventory: inv });
});

// ═══════════════════════════════════════════════
// STEP 13: Receive at hub (scan QR, assign rack, update inventory)
// ═══════════════════════════════════════════════
exports.receiveAtHub = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id, {
    include: [{ model: ProductCatalog, attributes: ['name'] }, { model: Facility, as: 'assigned_hub', attributes: ['name'] }],
  });
  if (!assessment) throw new AppError('Pickup not found', 404);
  if (assessment.status !== 'delivered') throw new AppError('Product must be delivered first', 400);
  const { rack_number, storage_location, notes } = req.body;
  const inv = await createInventoryItem(assessment, req.user.id);
  await inv.update({
    stock_status: 'in_stock', lifecycle_stage: 'received',
    rack_number: rack_number || null,
    storage_location: storage_location || null,
  });
  await createInventoryMovement({
    inventoryItemId: inv.id, assessmentId: assessment.id,
    action: 'received_at_hub', toStatus: 'in_stock',
    toLocation: storage_location || 'Unassigned',
    performedBy: req.user.id, notes: notes || 'Received at hub',
  });
  await assessment.update({
    status: 'received',
    movement_history: pushMovement(assessment, MOVEMENT_ACTION.RECEIVED, req.user.id, { received_by: req.user.id, rack_number, storage_location }),
  });
  await log({ userId: req.user.id, action: 'product_received_hub', entityType: 'assessment', entityId: assessment.id, metadata: { customer: assessment.customer_name, inventory_id: inv.id } });
  res.json({ message: 'Product received at hub', pickup: assessment, inventory: inv });
});

// ═══════════════════════════════════════════════
// STEP 14: Forward for processing
// ═══════════════════════════════════════════════
exports.forwardForProcessing = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Pickup not found', 404);
  if (assessment.status !== 'received') throw new AppError('Product must be received first', 400);
  await assessment.update({
    status: 'ready_for_processing',
    movement_history: pushMovement(assessment, MOVEMENT_ACTION.FORWARDED_PROCESSING, req.user.id, { forwarded_by: req.user.id }),
  });
  const inv = await InventoryItem.findOne({ where: { assessment_id: assessment.id } });
  if (inv) {
    await inv.update({ stock_status: 'forwarded', lifecycle_stage: 'processing' });
    await createInventoryMovement({
      inventoryItemId: inv.id, assessmentId: assessment.id,
      action: 'forwarded_for_processing', toStatus: 'forwarded',
      performedBy: req.user.id, notes: 'Forwarded for processing',
    });
  }
  await log({ userId: req.user.id, action: 'product_forwarded_processing', entityType: 'assessment', entityId: assessment.id, metadata: { customer: assessment.customer_name } });
  res.json({ message: 'Product forwarded for processing', pickup: assessment });
});

// ═══════════════════════════════════════════════
// EXCEPTION HANDLING: Report an exception
// ═══════════════════════════════════════════════
exports.reportException = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Pickup not found', 404);
  const { exception_type, reason, notes } = req.body;
  if (!EXCEPTION_STATUSES.includes(exception_type)) throw new AppError('Invalid exception type', 400);
  const validForExceptions = ['supply_chain_assigned', 'pickup_scheduled', 'out_for_pickup', 'arrived_at_customer', 'customer_verified', 'deal_confirmed', 'collected', 'in_transit', 'arrived_at_hub'];
  if (!validForExceptions.includes(assessment.status)) throw new AppError('Cannot report exception at current status', 400);
  await assessment.update({
    status: exception_type,
    exception_reason: reason || notes || null,
    movement_history: pushMovement(assessment, MOVEMENT_ACTION.EXCEPTION, req.user.id, { exception_type, reason: reason || notes }),
  });
  // If requires_manager_review, notify the manager/employee
  if (exception_type === 'requires_manager_review') {
    await notificationService.notifyEmployee(assessment, 'modified', req.user.full_name || 'Supply Chain');
  }
  await log({ userId: req.user.id, action: `exception_${exception_type}`, entityType: 'assessment', entityId: assessment.id, metadata: { customer: assessment.customer_name, reason } });
  res.json({ message: `Exception reported: ${exception_type.replace(/_/g, ' ')}`, pickup: assessment });
});

// ═══════════════════════════════════════════════
// PICKUP HISTORY (completed + exceptions)
// ═══════════════════════════════════════════════
exports.pickupHistory = catchAsync(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const { status, hub_id, date_from, date_to, search, category, export: exportFormat } = req.query;
  const where = {};
  if (req.user.role === 'supply_chain') {
    where.supply_chain_user_id = req.user.id;
  }
  where.status = { [Op.in]: ['delivered', 'received', 'ready_for_processing', 'completed', 'cancelled', ...EXCEPTION_STATUSES] };
  if (status) where.status = status;
  if (hub_id) where.assigned_hub_id = hub_id;
  if (date_from) where.createdAt = { ...where.createdAt, [Op.gte]: new Date(date_from) };
  if (date_to) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(date_to + 'T23:59:59') };
  if (search) {
    where[Op.or] = [
      { customer_name: { [Op.like]: `%${search}%` } },
      { customer_phone: { [Op.like]: `%${search}%` } },
      { deal_number: { [Op.like]: `%${search}%` } },
      { brand: { [Op.like]: `%${search}%` } },
    ];
  }
  if (category) {
    const catMap = { IT: 1, CE: 2, LS: 3, EE: 4, TLS: 5, LI: 6, MD: 7 };
    where.product_category = category;
  }

  const { rows, count } = await Assessment.findAndCountAll({
    where, limit, offset, order: [['deal_closed_at', 'DESC'], ['created_at', 'DESC']],
    include: [
      { model: ProductCatalog, attributes: ['name', 'icon'] },
      { model: User, as: 'supply_chain_user', attributes: ['full_name', 'username'] },
      { model: Facility, as: 'assigned_hub', attributes: ['name', 'type', 'location'] },
      { model: AnalysisResult },
    ],
  });

  // For export, return all data
  if (exportFormat === 'json') {
    return res.json({ history: rows, total: count });
  }

  res.json({ history: rows, total: count, page, total_pages: Math.ceil(count / limit) });
});

// ═══════════════════════════════════════════════
// QR SCAN
// ═══════════════════════════════════════════════
exports.scanQR = catchAsync(async (req, res) => {
  const { qr_data } = req.body;
  let parsed;
  try { parsed = typeof qr_data === 'string' ? JSON.parse(qr_data) : qr_data; } catch (e) { throw new AppError('Invalid QR data', 400); }
  const id = parsed.id || parsed.assessment_id;
  if (!id) throw new AppError('No assessment ID in QR code', 400);
  const assessment = await Assessment.findByPk(id, {
    include: [
      { model: ProductCatalog, attributes: ['name'] },
      { model: Facility, as: 'assigned_hub', attributes: ['name', 'location'] },
      { model: AssessmentImage },
    ],
  });
  if (!assessment) throw new AppError('Assessment not found', 404);
  const scStatus = SUPPLY_CHAIN_STATUS[assessment.status] || { label: assessment.status, color: 'secondary' };
  res.json({ pickup: assessment, status_meta: scStatus });
});

// ═══════════════════════════════════════════════
// MOVEMENT HISTORY
// ═══════════════════════════════════════════════
exports.movementHistory = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id, { attributes: ['id', 'movement_history'] });
  if (!assessment) throw new AppError('Assessment not found', 404);
  const detailedMovements = await InventoryMovement.findAll({
    where: { assessment_id: req.params.id },
    order: [['moved_at', 'DESC']],
    include: [{ model: User, as: 'performer', attributes: ['full_name'] }],
  });
  res.json({ movement_history: assessment.movement_history || [], inventory_movements: detailedMovements });
});

// ═══════════════════════════════════════════════
// LEGACY SUPPORT (for backward compat with old frontend)
// ═══════════════════════════════════════════════
exports.availableDeals = exports.pickupList;
exports.getDeal = exports.pickupDetail;
exports.updateTransportStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  if (status === 'collected') return exports.collectProduct(req, res);
  if (status === 'delivered_to_hub' || status === 'delivered') return exports.deliverToHub(req, res);
  throw new AppError('Invalid transport status', 400);
});
exports.completedDeliveries = exports.pickupHistory;
exports.receiveProduct = exports.receiveAtHub;
exports.forwardForAnalysis = exports.forwardForProcessing;
exports.completeAnalysis = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id, { include: [{ model: ProductCatalog, attributes: ['name'] }] });
  if (!assessment) throw new AppError('Item not found', 404);
  if (!['reusability_analysis', 'ready_for_processing'].includes(assessment.status)) throw new AppError('Item is not under analysis', 400);
  const { classification, condition_assessment, repairable_components, recoverable_materials, hazardous_materials, weight_breakdown, notes } = req.body;
  if (!['reusable', 'repairable', 'recyclable', 'scrap'].includes(classification)) throw new AppError('Invalid classification', 400);
  const recoveryPotential = RECOVERY_MAP[classification];
  const baseValue = parseFloat(assessment.hr_approved_value || assessment.value_estimate || 1000);
  const estimatedRevenue = Math.round(baseValue * REVENUE_MAP[classification]);
  const result = await AnalysisResult.create({
    assessment_id: assessment.id, classification, recovery_potential: recoveryPotential,
    estimated_revenue: estimatedRevenue, material_recovery_percentage: recoveryPotential,
    condition_assessment: condition_assessment || null,
    repairable_components: repairable_components || null,
    recoverable_materials: recoverable_materials || null,
    hazardous_materials: hazardous_materials || null,
    weight_breakdown: weight_breakdown || null,
    notes: notes || null, analysed_by: req.user.id,
  });
  await assessment.update({
    status: 'completed', classification,
    movement_history: pushMovement(assessment, { action: 'analysis_completed', user_id: req.user.id, timestamp: new Date().toISOString(), classified_as: classification }),
  });
  res.json({ message: 'Analysis completed', item: assessment, analysis: result });
});
