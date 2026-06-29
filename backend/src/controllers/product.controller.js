const { Op } = require('sequelize');
const { Assessment, AssessmentImage, AssessmentDetail, ProductCatalog, User, Region, ActivityLog } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const pagination = require('../utils/pagination');

exports.list = catchAsync(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const { type, region, staff, condition, date_from } = req.query;
  const where = {};
  if (type) where.product_type_id = type;
  if (condition) where.condition = condition;
  if (staff) where.user_id = staff;
  if (date_from) where.created_at = { [Op.gte]: new Date(date_from) };

  const includeOpts = [
    { model: ProductCatalog, attributes: ['name', 'icon'] },
    { model: User, attributes: ['full_name'], include: [{ model: Region, attributes: ['name'] }] },
  ];
  if (region) {
    includeOpts[1].where = { region_id: region };
  }

  const { rows, count } = await Assessment.findAndCountAll({
    where, limit, offset, order: [['created_at', 'DESC']],
    include: includeOpts,
  });

  const stats = await Promise.all([
    Assessment.count(),
    Assessment.count({ where: { classification: 'reusable' } }),
    Assessment.count({ where: { classification: 'repairable' } }),
    Assessment.count({ where: { classification: 'recyclable' } }),
    Assessment.count({ where: { classification: 'scrap' } }),
    Assessment.sum('value_estimate', { where: { status: 'completed' } }),
  ]);

  res.json({
    products: rows, total: count, page, total_pages: Math.ceil(count / limit),
    stats: {
      total: stats[0], reusable: stats[1], repairable: stats[2],
      recyclable: stats[3], scrap: stats[4], est_value: stats[5] || 0,
    },
  });
});

exports.getOne = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id, {
    include: [
      { model: AssessmentImage },
      { model: AssessmentDetail },
      { model: ProductCatalog, attributes: ['name', 'category', 'base_price'] },
      { model: User, attributes: ['full_name', 'username'], include: [{ model: Region, attributes: ['name'] }] },
    ],
  });
  if (!assessment) throw new AppError('Product not found', 404);
  res.json({ product: assessment });
});

exports.create = catchAsync(async (req, res) => {
  const { name, category, icon, base_price } = req.body;
  if (!name) throw new AppError('Product name is required', 400);
  const existing = await ProductCatalog.findOne({ where: { name } });
  if (existing) throw new AppError('Product already exists', 400);
  const product = await ProductCatalog.create({ name, category, icon, base_price });
  await ActivityLog.create({ user_id: req.user.id, action: 'product_created', entity_type: 'product_catalog', entity_id: product.id, metadata: { name } });
  res.status(201).json({ product });
});

exports.update = catchAsync(async (req, res) => {
  const product = await ProductCatalog.findByPk(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  await product.update(req.body);
  await ActivityLog.create({ user_id: req.user.id, action: 'product_updated', entity_type: 'product_catalog', entity_id: product.id });
  res.json({ product });
});

exports.remove = catchAsync(async (req, res) => {
  const product = await ProductCatalog.findByPk(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  await product.destroy();
  await ActivityLog.create({ user_id: req.user.id, action: 'product_deleted', entity_type: 'product_catalog', entity_id: parseInt(req.params.id) });
  res.json({ message: 'Product deleted' });
});
