const { Op } = require('sequelize');
const { Assessment, AssessmentImage, AssessmentDetail, ProductCatalog, User } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const pagination = require('../utils/pagination');
const { log } = require('../services/activity.service');
const valuationService = require('../services/valuation.service');
const aiStub = require('../services/ai-stub.service');
const reportService = require('../services/report.service');

exports.create = catchAsync(async (req, res) => {
  const body = { ...req.body };

  if (Array.isArray(body.accessories_available)) {
    body.accessories_available = body.accessories_available.join(', ');
  }
  if (body.specifications && typeof body.specifications === 'object') {
    body.specifications = JSON.stringify(body.specifications);
  }

  // Resolve product_type_id from catalog if not provided or invalid
  if (body.product_type_id) {
    const catalogEntry = await ProductCatalog.findByPk(body.product_type_id);
    if (!catalogEntry) body.product_type_id = null;
  }
  if (!body.product_type_id && body.product_type) {
    const catalogEntry = await ProductCatalog.findOne({
      where: { name: body.product_type }
    });
    if (catalogEntry) body.product_type_id = catalogEntry.id;
  }
  if (!body.product_type_id && body.product_category) {
    const catalogEntry = await ProductCatalog.findOne({
      where: { name: body.product_category }
    });
    if (catalogEntry) body.product_type_id = catalogEntry.id;
  }

  delete body.product_type;
  const assessment = await Assessment.create({ ...body, user_id: req.user.id });
  await log({ userId: req.user.id, action: 'assessment_created', entityType: 'assessment', entityId: assessment.id });
  res.status(201).json({ assessment });
});

exports.list = catchAsync(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const { search, status, type, date_from, date_to } = req.query;
  const where = {};

  if (req.user.role === 'employee') where.user_id = req.user.id;
  if (status) where.status = status;
  if (type) where.product_type_id = type;
  if (date_from) where.created_at = { ...where.created_at, [Op.gte]: new Date(date_from) };
  if (date_to) where.created_at = { ...where.created_at, [Op.lte]: new Date(date_to) };
  if (search) {
    where[Op.or] = [
      { customer_name: { [Op.like]: `%${search}%` } },
      { brand: { [Op.like]: `%${search}%` } },
      { model: { [Op.like]: `%${search}%` } },
    ];
  }

  const { rows, count } = await Assessment.findAndCountAll({
    where, limit, offset, order: [['created_at', 'DESC']],
    include: [{ model: ProductCatalog, attributes: ['name'] }],
  });

  res.json({ assessments: rows, total: count, page, total_pages: Math.ceil(count / limit) });
});

exports.getOne = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id, {
    include: [
      { model: AssessmentImage },
      { model: AssessmentDetail },
      { model: ProductCatalog, attributes: ['name', 'icon'] },
      { model: User, attributes: ['full_name', 'username'] },
    ],
  });
  if (!assessment) throw new AppError('Assessment not found', 404);
  if (req.user.role === 'employee' && assessment.user_id !== req.user.id) throw new AppError('Unauthorized', 403);
  res.json({ assessment });
});

exports.update = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Assessment not found', 404);
  if (req.user.role === 'employee' && assessment.user_id !== req.user.id) throw new AppError('Unauthorized', 403);
  await assessment.update(req.body);
  res.json({ assessment });
});

exports.remove = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Assessment not found', 404);
  if (req.user.role === 'employee' && assessment.user_id !== req.user.id) throw new AppError('Unauthorized', 403);
  await assessment.destroy();
  res.json({ message: 'Assessment deleted' });
});

exports.submit = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Assessment not found', 404);
  if (req.user.role === 'employee' && assessment.user_id !== req.user.id) throw new AppError('Unauthorized', 403);

  let valuation;
  if (assessment.value_estimate !== null && assessment.value_estimate !== undefined) {
    valuation = {
      base_price: parseFloat(assessment.value_estimate),
      condition_multiplier: 1.0,
      weight_adjustment: 1.0,
      market_factor: 1.0,
      estimated_value: parseFloat(assessment.value_estimate)
    };
  } else {
    const product = await ProductCatalog.findByPk(assessment.product_type_id);
    const productName = product ? product.name : 'General';
    valuation = valuationService.calculate(
      productName,
      assessment.condition || 'fair',
      parseFloat(assessment.weight_kg) || 1
    );
  }

  const valueMin = Math.round(valuation.estimated_value * 0.7);
  const valueMax = Math.round(valuation.estimated_value * 1.3);

  await assessment.update({
    status: 'pending_hr_approval',
    value_estimate: valuation.estimated_value,
    value_min: valueMin,
    value_max: valueMax,
    submitted_at: new Date(),
  });

  await log({ userId: req.user.id, action: 'assessment_submitted', entityType: 'assessment', entityId: assessment.id,
    metadata: { customer: assessment.customer_name, value: valuation.estimated_value, value_min: valueMin, value_max: valueMax } });

  res.json({ assessment, valuation, value_min: valueMin, value_max: valueMax });
});

exports.estimate = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id, { include: [{ model: ProductCatalog }] });
  if (!assessment) throw new AppError('Assessment not found', 404);
  const productName = assessment.product_catalog ? assessment.product_catalog.name : 'General';
  const valuation = valuationService.calculate(
    productName,
    assessment.condition || 'fair',
    parseFloat(assessment.weight_kg) || 1
  );
  res.json({ valuation });
});

exports.uploadImage = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);
  const image = await AssessmentImage.create({
    assessment_id: req.body.assessment_id || 0,
    filename: req.file.filename,
    original_name: req.file.originalname,
    mime_type: req.file.mimetype,
    file_size: req.file.size,
  });
  res.status(201).json({ image, url: `/uploads/assessments/${req.file.filename}` });
});

exports.deleteImage = catchAsync(async (req, res) => {
  const image = await AssessmentImage.findByPk(req.params.imageId);
  if (!image) throw new AppError('Image not found', 404);
  await image.destroy();
  res.json({ message: 'Image deleted' });
});

exports.aiAnalyze = catchAsync(async (req, res) => {
  const { product_type, filename, questionnaire, productDetails } = req.body;
  const cvDetector = require('../../../cv-services');
  const detection = await cvDetector.detect(product_type || 'Mobile', filename || '');

  const q = questionnaire || {};
  const pd = productDetails || {};

  const powerScore = q.qPowerOn === 'yes' ? 25 : (q.qPowerOn === 'intermittent' ? 12 : 0);
  const damageScore = q.qDamage === 'none' ? 25 : (q.qDamage === 'scratches' ? 18 : (q.qDamage === 'cracks' ? 8 : 0));
  const ageScore = q.qAge === 'new' ? 20 : (q.qAge === 'medium' ? 14 : (q.qAge === 'old' ? 8 : 3));
  const accessoriesScore = q.qAccessories === 'all' ? 15 : (q.qAccessories === 'partial' ? 8 : 0);
  const conditionMap = { excellent: 15, good: 12, fair: 8, poor: 4, damaged: 0 };
  const conditionScore = conditionMap[pd.condition] || 10;

  const total = powerScore + damageScore + ageScore + accessoriesScore + conditionScore;
  const condition_score = Math.min(Math.round(total), 100);
  const recyclability = condition_score >= 70 ? Math.floor(Math.random() * 10) + 85
    : condition_score >= 50 ? Math.floor(Math.random() * 15) + 65
    : condition_score >= 30 ? Math.floor(Math.random() * 15) + 40
    : Math.floor(Math.random() * 10) + 20;

  const category = condition_score >= 80 ? 'Reusable'
    : condition_score >= 60 ? 'Repairable'
    : condition_score >= 35 ? 'Recyclable'
    : 'Scrap';

  const data_risk = ['Laptop', 'Mobile', 'Tablet', 'Server'].includes(product_type)
    ? (pd.hasStorage !== false ? 'high' : 'medium')
    : 'low';

  const result = {
    brand: detection.brand,
    model: detection.model,
    product_type: product_type || 'Mobile',
    condition_score,
    category,
    recyclability: recyclability + '%',
    data_risk,
    retailPrice: detection.retailPrice,
    rebuyValue: detection.rebuyValue,
    expectedLifetime: detection.expectedLifetime,
    scrapValue: detection.scrapValue
  };
  res.json({ analysis: result });
});

exports.exportData = catchAsync(async (req, res) => {
  const { format, status, date_from, date_to } = req.query;
  const where = {};
  if (req.user.role === 'employee') where.user_id = req.user.id;
  if (status) where.status = status;
  if (date_from) where.created_at = { ...where.created_at, [Op.gte]: new Date(date_from) };
  if (date_to) where.created_at = { ...where.created_at, [Op.lte]: new Date(date_to) };

  const assessments = await Assessment.findAll({
    where, order: [['created_at', 'DESC']],
    include: [{ model: ProductCatalog, attributes: ['name'] }],
  });

  const headers = ['ID', 'Date', 'Customer', 'Product', 'Brand', 'Condition', 'Value', 'Status'];
  const rows = assessments.map((a) => [
    a.id, new Date(a.created_at).toLocaleDateString(),
    a.customer_name || '-', a.product_catalog?.name || '-',
    a.brand || '-', a.condition || '-',
    a.value_estimate ? `₹${a.value_estimate.toLocaleString()}` : '-', a.status,
  ]);

  if (format === 'xlsx') {
    const buf = await reportService.generateExcel('Assessments', headers, rows);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=assessments.xlsx');
    return res.send(buf);
  }

  const buf = reportService.generatePDF('Assessment Report', headers, rows);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=assessments.pdf');
  res.send(buf);
});

exports.getCatalogByCategory = catchAsync(async (req, res) => {
  const { category } = req.params;
  const cvDetector = require('../../../cv-services');
  const catalog = await cvDetector.getCatalog(category);
  res.json({ catalog });
});

exports.updateDetails = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Assessment not found', 404);

  let detail = await AssessmentDetail.findOne({ where: { assessment_id: assessment.id } });
  if (!detail) {
    detail = await AssessmentDetail.create({ assessment_id: assessment.id, ...req.body });
  } else {
    await detail.update(req.body);
  }

  res.json({ detail });
});
