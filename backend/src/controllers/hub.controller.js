const { Op, fn, col } = require('sequelize');
const { Assessment, AssessmentImage, AssessmentDetail, ProductCatalog, User, Facility } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { log } = require('../services/activity.service');
const pagination = require('../utils/pagination');

exports.dashboard = catchAsync(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pendingReceiving, totalInventory, receivedToday, forwardedForAnalysis] = await Promise.all([
    Assessment.count({ where: { status: 'delivered_to_hub' } }),
    Assessment.count({ where: { status: { [Op.in]: ['received', 'reusability_analysis'] } } }),
    Assessment.count({ where: { status: 'received', deal_closed_at: { [Op.gte]: today } } }),
    Assessment.count({ where: { status: 'reusability_analysis' } }),
  ]);

  const recentDeliveries = await Assessment.findAll({
    where: { status: { [Op.in]: ['delivered_to_hub', 'received', 'reusability_analysis'] } },
    limit: 10,
    order: [['updatedAt', 'DESC']],
    include: [
      { model: ProductCatalog, attributes: ['name'] },
      { model: User, attributes: ['full_name'] },
    ],
  });

  res.json({
    pending_receiving: pendingReceiving,
    total_inventory: totalInventory,
    received_today: receivedToday,
    forwarded_for_analysis: forwardedForAnalysis,
    recent_deliveries: recentDeliveries,
  });
});

exports.pendingReceiving = catchAsync(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const { rows, count } = await Assessment.findAndCountAll({
    where: { status: 'delivered_to_hub' },
    limit, offset, order: [['deal_closed_at', 'DESC']],
    include: [
      { model: ProductCatalog, attributes: ['name', 'icon'] },
      { model: User, attributes: ['full_name', 'username'] },
      { model: User, as: 'supply_chain_user', attributes: ['full_name'] },
    ],
  });
  res.json({ items: rows, total: count, page, total_pages: Math.ceil(count / limit) });
});

exports.receiveProduct = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Item not found', 404);
  if (assessment.status !== 'delivered_to_hub') throw new AppError('Item is not in delivered status', 400);

  const history = assessment.movement_history || [];
  history.push({
    action: 'received_at_hub',
    received_by: req.user.id,
    received_at: new Date().toISOString(),
  });

  await assessment.update({
    status: 'received',
    movement_history: history,
  });

  await log({ userId: req.user.id, action: 'product_received', entityType: 'assessment', entityId: assessment.id,
    metadata: { customer: assessment.customer_name } });

  res.json({ message: 'Product received at hub', item: assessment });
});

exports.forwardForAnalysis = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Item not found', 404);
  if (assessment.status !== 'received') throw new AppError('Item must be received first', 400);

  const history = assessment.movement_history || [];
  history.push({
    action: 'forwarded_for_reusability_analysis',
    forwarded_by: req.user.id,
    forwarded_at: new Date().toISOString(),
  });

  await assessment.update({
    status: 'reusability_analysis',
    movement_history: history,
  });

  await log({ userId: req.user.id, action: 'product_forwarded_analysis', entityType: 'assessment', entityId: assessment.id,
    metadata: { customer: assessment.customer_name } });

  res.json({ message: 'Product forwarded for reusability analysis', item: assessment });
});

exports.inventory = catchAsync(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const { status, classification } = req.query;
  const where = { status: { [Op.in]: ['received', 'reusability_analysis', 'completed'] } };
  if (status) where.status = status;
  if (classification) where.classification = classification;

  const { rows, count } = await Assessment.findAndCountAll({
    where, limit, offset, order: [['updatedAt', 'DESC']],
    include: [
      { model: ProductCatalog, attributes: ['name', 'icon'] },
      { model: User, attributes: ['full_name'] },
    ],
  });

  const summary = await Assessment.findAll({
    attributes: ['classification', [fn('COUNT', col('id')), 'count']],
    where: { classification: { [Op.ne]: null }, status: { [Op.in]: ['received', 'reusability_analysis', 'completed'] } },
    group: ['classification'],
    raw: true,
  });

  res.json({ items: rows, total: count, page, total_pages: Math.ceil(count / limit), summary });
});

exports.completeAnalysis = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Item not found', 404);
  if (assessment.status !== 'reusability_analysis') throw new AppError('Item is not under analysis', 400);

  const { classification } = req.body;
  if (!['reusable', 'repairable', 'recyclable', 'scrap'].includes(classification)) {
    throw new AppError('Invalid classification', 400);
  }

  const history = assessment.movement_history || [];
  history.push({
    action: 'analysis_completed',
    classified_as: classification,
    classified_by: req.user.id,
    completed_at: new Date().toISOString(),
  });

  await assessment.update({
    status: 'completed',
    classification,
    movement_history: history,
  });

  await log({ userId: req.user.id, action: 'analysis_completed', entityType: 'assessment', entityId: assessment.id,
    metadata: { classification } });

  res.json({ message: 'Reusability analysis completed', item: assessment });
});
