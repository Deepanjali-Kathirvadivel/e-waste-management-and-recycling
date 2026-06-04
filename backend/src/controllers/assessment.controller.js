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
  const assessment = await Assessment.create({ ...req.body, user_id: req.user.id });
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

  const product = await ProductCatalog.findByPk(assessment.product_type_id);
  const productName = product ? product.name : 'General';

  const valuation = valuationService.calculate(
    productName,
    assessment.condition || 'fair',
    parseFloat(assessment.weight_kg) || 1
  );

  await assessment.update({
    status: 'completed',
    value_estimate: valuation.estimated_value,
    submitted_at: new Date(),
  });

  await log({ userId: req.user.id, action: 'assessment_submitted', entityType: 'assessment', entityId: assessment.id,
    metadata: { customer: assessment.customer_name, value: valuation.estimated_value } });

  res.json({ assessment, valuation });
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
  const result = aiStub.analyzeImage();
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
