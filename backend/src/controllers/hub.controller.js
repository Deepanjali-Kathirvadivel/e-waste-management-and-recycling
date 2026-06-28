const { Op, fn, col } = require('sequelize');
const { Assessment, AssessmentImage, AssessmentDetail, ProductCatalog, User, Facility, InventoryItem, InventoryMovement, AnalysisResult } = require('../models');
const sequelize = require('../config/database');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { log } = require('../services/activity.service');
const pagination = require('../utils/pagination');

// Helper to auto-create inventory item when product is received
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

function pushMovement(assessment, action, userId, extra) {
  const history = assessment.movement_history || [];
  history.push({ action, user_id: userId, timestamp: new Date().toISOString(), ...extra });
  return history;
}

// ───── Dashboard ─────
exports.dashboard = catchAsync(async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const raw = await Promise.all([
    Assessment.count({ where: { status: 'delivered_to_hub' } }),
    Assessment.count({ where: { status: { [Op.in]: ['received', 'reusability_analysis'] } } }),
    Assessment.count({ where: { status: 'received', deal_closed_at: { [Op.gte]: today } } }),
    Assessment.count({ where: { status: 'reusability_analysis' } }),
    InventoryItem.count(),
    InventoryItem.count({ where: { lifecycle_stage: 'received' } }),
    InventoryItem.count({ where: { lifecycle_stage: 'classifying' } }),
    InventoryItem.count({ where: { lifecycle_stage: 'completed' } }),
  ]);

  const recentDeliveries = await Assessment.findAll({
    where: { status: { [Op.in]: ['delivered_to_hub', 'received', 'reusability_analysis'] } },
    limit: 10, order: [['updatedAt', 'DESC']],
    include: [{ model: ProductCatalog, attributes: ['name'] }, { model: User, attributes: ['full_name'] }, { model: InventoryItem }],
  });

  const classificationSummary = await AnalysisResult.findAll({
    attributes: ['classification', [fn('COUNT', col('id')), 'count'], [fn('SUM', col('estimated_revenue')), 'total_revenue']],
    group: ['classification'], raw: true,
  });

  const storageSummary = await InventoryItem.findAll({
    attributes: ['storage_location', [fn('COUNT', col('id')), 'count']],
    where: { storage_location: { [Op.ne]: null } },
    group: ['storage_location'], raw: true,
  });

  res.json({
    pending_receiving: raw[0], total_inventory: raw[1], received_today: raw[2],
    forwarded_for_analysis: raw[3], total_inventory_items: raw[4],
    pending_storage: raw[5], under_analysis: raw[6], completed_items: raw[7],
    recent_deliveries: recentDeliveries, classification_summary: classificationSummary,
    storage_summary: storageSummary,
  });
});

// ───── Pending receiving ─────
exports.pendingReceiving = catchAsync(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const { rows, count } = await Assessment.findAndCountAll({
    where: { status: 'delivered_to_hub' },
    limit, offset, order: [['deal_closed_at', 'DESC']],
    include: [
      { model: ProductCatalog, attributes: ['name', 'icon'] },
      { model: User, attributes: ['full_name', 'username'] },
      { model: User, as: 'supply_chain_user', attributes: ['full_name'] },
      { model: InventoryItem },
    ],
  });
  res.json({ items: rows, total: count, page, total_pages: Math.ceil(count / limit) });
});

// ───── Receive product ─────
exports.receiveProduct = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Item not found', 404);
  if (assessment.status !== 'delivered_to_hub') throw new AppError('Item not in delivered status', 400);

  const history = pushMovement(assessment, 'received_at_hub', req.user.id, { received_by: req.user.id });
  await assessment.update({ status: 'received', movement_history: history });

  // Auto-create inventory record
  const inv = await createInventoryItem(assessment, req.user.id);

  await InventoryMovement.create({
    inventory_item_id: inv.id, assessment_id: assessment.id,
    action: 'received_at_hub', to_status: 'in_stock',
    to_location: 'Unassigned', performed_by: req.user.id,
  });

  await log({ userId: req.user.id, action: 'product_received', entityType: 'assessment', entityId: assessment.id, metadata: { customer: assessment.customer_name, inventory_id: inv.id } });
  res.json({ message: 'Product received at hub', item: assessment, inventory: inv });
});

// ───── Forward for analysis ─────
exports.forwardForAnalysis = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Item not found', 404);
  if (assessment.status !== 'received') throw new AppError('Item must be received first', 400);

  const history = pushMovement(assessment, 'forwarded_for_reusability_analysis', req.user.id, { forwarded_by: req.user.id });
  await assessment.update({ status: 'reusability_analysis', movement_history: history });

  const inv = await InventoryItem.findOne({ where: { assessment_id: assessment.id } });
  if (inv) {
    await inv.update({ stock_status: 'under_analysis', lifecycle_stage: 'analysing' });
    await InventoryMovement.create({
      inventory_item_id: inv.id, assessment_id: assessment.id,
      action: 'forwarded_for_analysis', to_status: 'under_analysis',
      performed_by: req.user.id, notes: 'Forwarded for reusability analysis',
    });
  }

  await log({ userId: req.user.id, action: 'product_forwarded_analysis', entityType: 'assessment', entityId: assessment.id, metadata: { customer: assessment.customer_name } });
  res.json({ message: 'Forwarded for reusability analysis', item: assessment });
});

// ───── Inventory ─────
exports.inventory = catchAsync(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const { stock_status, classification, storage_location } = req.query;
  const where = {};
  if (stock_status) where.stock_status = stock_status;
  if (storage_location) where.storage_location = storage_location;

  const itemWhere = {};
  if (classification) itemWhere.classification = classification;

  const { rows, count } = await InventoryItem.findAndCountAll({
    where, limit, offset, order: [['received_at', 'DESC']],
    include: [
      { model: Assessment, where: Object.keys(itemWhere).length ? itemWhere : undefined, include: [{ model: ProductCatalog, attributes: ['name', 'icon'] }, { model: AnalysisResult }] },
      { model: Facility, attributes: ['name', 'location'] },
    ],
  });

  const summary = await InventoryItem.findAll({
    attributes: ['stock_status', [fn('COUNT', col('id')), 'count']],
    group: ['stock_status'], raw: true,
  });

  const classificationCounts = await AnalysisResult.findAll({
    attributes: ['classification', [fn('COUNT', col('id')), 'count'], [fn('SUM', col('estimated_revenue')), 'total_revenue']],
    group: ['classification'], raw: true,
  });

  res.json({ items: rows, total: count, page, total_pages: Math.ceil(count / limit), summary, classification_summary: classificationCounts });
});

// ───── Complete reusability analysis ─────
exports.completeAnalysis = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id, { include: [{ model: ProductCatalog, attributes: ['name'] }] });
  if (!assessment) throw new AppError('Item not found', 404);
  if (assessment.status !== 'reusability_analysis') throw new AppError('Item is not under analysis', 400);

  const { classification, condition_assessment, repairable_components, recoverable_materials, hazardous_materials, weight_breakdown, notes } = req.body;

  if (!['reusable', 'repairable', 'recyclable', 'scrap'].includes(classification)) throw new AppError('Invalid classification', 400);

  // Calculate recovery metrics
  const recoveryMap = { reusable: 95, repairable: 75, recyclable: 50, scrap: 10 };
  const revenueMap = { reusable: 0.8, repairable: 0.5, recyclable: 0.3, scrap: 0.05 };
  const weight = parseFloat(assessment.weight_kg) || 1;
  const baseValue = parseFloat(assessment.hr_approved_value || assessment.value_estimate || 1000);
  const recoveryPotential = recoveryMap[classification];
  const estimatedRevenue = Math.round(baseValue * revenueMap[classification]);
  const materialRecoveryPercentage = recoveryMap[classification];

  // Save analysis result
  const result = await AnalysisResult.create({
    assessment_id: assessment.id,
    classification,
    recovery_potential: recoveryPotential,
    estimated_revenue: estimatedRevenue,
    material_recovery_percentage: materialRecoveryPercentage,
    condition_assessment: condition_assessment || null,
    repairable_components: repairable_components || null,
    recoverable_materials: recoverable_materials || null,
    hazardous_materials: hazardous_materials || null,
    weight_breakdown: weight_breakdown || null,
    notes: notes || null,
    analysed_by: req.user.id,
  });

  const history = pushMovement(assessment, 'analysis_completed', req.user.id, {
    classified_as: classification, analysed_by: req.user.id,
  });
  await assessment.update({ status: 'completed', classification, movement_history: history });

  const inv = await InventoryItem.findOne({ where: { assessment_id: assessment.id } });
  if (inv) {
    await inv.update({ stock_status: 'recovered', lifecycle_stage: 'classified' });
    await InventoryMovement.create({
      inventory_item_id: inv.id, assessment_id: assessment.id,
      action: 'analysis_completed', from_status: 'under_analysis', to_status: 'recovered',
      performed_by: req.user.id, notes: `Classified as ${classification}`,
    });
  }

  await log({ userId: req.user.id, action: 'analysis_completed', entityType: 'assessment', entityId: assessment.id, metadata: { classification, recoveryPotential, estimatedRevenue } });
  res.json({ message: 'Analysis completed', item: assessment, analysis: result });
});

// ───── Assign storage location ─────
exports.assignStorageLocation = catchAsync(async (req, res) => {
  const inv = await InventoryItem.findByPk(req.params.id, { include: [{ model: Assessment }] });
  if (!inv) throw new AppError('Inventory item not found', 404);
  const { storage_location } = req.body;
  if (!storage_location) throw new AppError('Storage location required', 400);

  const oldLocation = inv.storage_location;
  await inv.update({ storage_location });

  await InventoryMovement.create({
    inventory_item_id: inv.id, assessment_id: inv.assessment_id,
    from_location: oldLocation, to_location: storage_location,
    action: 'location_assigned', performed_by: req.user.id,
  });

  await log({ userId: req.user.id, action: 'storage_assigned', entityType: 'inventory_item', entityId: inv.id, metadata: { assessment_id: inv.assessment_id, storage_location } });
  res.json({ message: 'Storage location assigned', item: inv });
});
