const { Op } = require('sequelize');
const { Assessment, AssessmentImage, AssessmentDetail, ProductCatalog, User, ActivityLog } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const pagination = require('../utils/pagination');
const { log } = require('../services/activity.service');
const valuationService = require('../services/valuation.service');
const aiStub = require('../services/ai-stub.service');
const reportService = require('../services/report.service');

function sanitizeAssessment(assessment, role) {
  const plain = assessment.toJSON ? assessment.toJSON() : { ...assessment };
  if (role === 'employee') {
    plain.value_estimate = null;
    plain.value_min = null;
    plain.value_max = null;
    plain.recommended_value = null;
    plain.hr_approved_value = null;
  }
  return plain;
}

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
  const catalogEntry = body.product_type_id ? await ProductCatalog.findByPk(body.product_type_id) : null;
  await log({ userId: req.user.id, action: 'assessment_created', entityType: 'assessment', entityId: assessment.id,
    metadata: { customer: body.customer_name || 'Unknown', product: catalogEntry?.name || body.product_category || 'Unknown' } });
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
    where, limit, offset, order: [['id', 'DESC']],
    include: [{ model: ProductCatalog, attributes: ['name'] }],
  });

  const assessments = rows.map((row) => sanitizeAssessment(row, req.user.role));
  res.json({ assessments, total: count, page, total_pages: Math.ceil(count / limit) });
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
  res.json({ assessment: sanitizeAssessment(assessment, req.user.role) });
});

exports.update = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Assessment not found', 404);
  if (req.user.role === 'employee' && assessment.user_id !== req.user.id) throw new AppError('Unauthorized', 403);
  if (assessment.status !== 'draft') throw new AppError('Cannot edit a submitted assessment. Only draft assessments can be modified.', 400);
  await assessment.update(req.body);
  res.json({ assessment });
});

exports.remove = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Assessment not found', 404);
  if (req.user.role === 'employee' && assessment.user_id !== req.user.id) throw new AppError('Unauthorized', 403);
  if (assessment.status !== 'draft') throw new AppError('Cannot delete a submitted assessment.', 400);
  await assessment.destroy();
  res.json({ message: 'Assessment deleted' });
});

exports.submit = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id, { include: [{ model: ProductCatalog, attributes: ['name'] }] });
  if (!assessment) throw new AppError('Assessment not found', 404);
  if (req.user.role === 'employee' && assessment.user_id !== req.user.id) throw new AppError('Unauthorized', 403);

  let valuation;
  if (assessment.value_estimate !== null && assessment.value_estimate !== undefined && parseFloat(assessment.value_estimate) > 0) {
    valuation = {
      base_price: parseFloat(assessment.value_estimate),
      condition_multiplier: 1.0,
      weight_adjustment: 1.0,
      market_factor: 1.0,
      estimated_value: parseFloat(assessment.value_estimate)
    };
  } else {
    const product = assessment.product_catalog || await ProductCatalog.findByPk(assessment.product_type_id);
    const productName = product ? product.name : 'General';
    valuation = valuationService.calculate(
      productName,
      assessment.condition || 'fair',
      parseFloat(assessment.weight_kg) || 1
    );
  }

  const valueMin = Math.round(valuation.estimated_value * 0.7);
  const valueMax = Math.round(valuation.estimated_value * 1.3);

  const recommendedValue = valuation.recommended_value ?? Math.round(valuation.estimated_value);

  await assessment.update({
    status: 'pending_manager_review',
    value_estimate: valuation.estimated_value,
    value_min: valueMin,
    value_max: valueMax,
    recommended_value: recommendedValue,
    submitted_at: new Date(),
  });

  const productName = assessment.product_catalog?.name || 'General';
  await log({ userId: req.user.id, action: 'assessment_submitted', entityType: 'assessment', entityId: assessment.id,
    metadata: { customer: assessment.customer_name, product: productName, value: valuation.estimated_value, value_min: valueMin, value_max: valueMax } });

  // Hide valuation details from employees, only show submission confirmation
  if (req.user.role === 'employee') {
    res.json({
      message: 'Quotation submitted for Manager approval.',
      assessment: sanitizeAssessment(assessment, req.user.role),
    });
  } else {
    res.json({ assessment, valuation, value_min: valueMin, value_max: valueMax, recommended_value: recommendedValue });
  }
});

exports.resubmit = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Assessment not found', 404);
  if (req.user.role === 'employee' && assessment.user_id !== req.user.id) throw new AppError('Unauthorized', 403);
  if (assessment.status !== 'rejected') throw new AppError('Only rejected assessments can be resubmitted', 400);

  const { customer_expected_value } = req.body;
  if (customer_expected_value === undefined || customer_expected_value === null) {
    throw new AppError('Customer expected value is required', 400);
  }

  await assessment.update({
    customer_expected_value,
    status: 'pending_manager_review',
    rejection_reason: null,
    hr_rejection_reason: null,
    submitted_at: new Date(),
  });

  await log({
    userId: req.user.id,
    action: 'assessment_resubmitted',
    entityType: 'assessment',
    entityId: assessment.id,
    metadata: { customer: assessment.customer_name, customer_expected_value },
  });

  res.json({
    message: 'Assessment resubmitted for Manager approval.',
    assessment: sanitizeAssessment(assessment, req.user.role),
  });
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
  const imageType = req.body.image_type || 'general';

  let autoAiResult = null;
  try {
    const aiAnalysis = aiStub.analyzeImage();
    const oResults = aiAnalysis.detection_details || [];
    autoAiResult = {
      image_type: imageType,
      product_type: aiAnalysis.product_type,
      brand: aiAnalysis.brand,
      model: aiAnalysis.model,
      condition_score: aiAnalysis.condition_score,
      category: aiAnalysis.category,
      suggested_condition: aiAnalysis.suggested_condition,
      confidence: oResults.length > 0 ? Math.round(oResults.reduce((s, d) => s + d.confidence, 0) / oResults.length) : 75,
      observations: oResults.map(d => ({
        component: d.component,
        confidence: d.confidence,
        status: d.confidence >= 80 ? 'good' : d.confidence >= 60 ? 'fair' : 'needs_attention',
      })),
      recyclability: aiAnalysis.recyclability,
      data_risk: aiAnalysis.data_risk,
      analyzed_at: new Date().toISOString(),
    };
  } catch (e) {
    autoAiResult = { image_type: imageType, error: e.message, analyzed_at: new Date().toISOString() };
  }

  const image = await AssessmentImage.create({
    assessment_id: req.body.assessment_id || 0,
    filename: req.file.filename,
    original_name: req.file.originalname,
    mime_type: req.file.mimetype,
    file_size: req.file.size,
    ai_analysis: autoAiResult,
  });

  res.status(201).json({ image, url: `/uploads/assessments/${req.file.filename}`, ai_analysis: autoAiResult });
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

  const oResults = detection.detection_details || [];
  const confidenceScore = oResults.length > 0 ? Math.round(oResults.reduce((s, d) => s + d.confidence, 0) / oResults.length) : 75;

  const result = {
    brand: detection.brand,
    model: detection.model,
    product_type: product_type || 'Mobile',
    condition_score,
    confidence_score: confidenceScore,
    category,
    classification: category,
    recyclability: recyclability + '%',
    data_risk,
    retailPrice: detection.retailPrice,
    rebuyValue: detection.rebuyValue,
    expectedLifetime: detection.expectedLifetime,
    scrapValue: detection.scrapValue,
    observations: oResults.map(d => ({
      component: d.component,
      confidence: d.confidence,
      status: d.confidence >= 80 ? 'good' : d.confidence >= 60 ? 'fair' : 'needs_attention',
    })),
  };
  res.json({ analysis: result });
});

exports.exportData = catchAsync(async (req, res) => {
  const { format, search, status, type, date_from, date_to } = req.query;
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

  const assessments = await Assessment.findAll({
    where, order: [['created_at', 'DESC']],
    include: [{ model: ProductCatalog, attributes: ['name'] }],
  });

  const headers = ['ID', 'Date', 'Customer', 'Product', 'Brand', 'Condition', 'Value', 'Status'];
  const isEmployee = req.user.role === 'employee';
  const rows = assessments.map((a) => [
    a.id, new Date(a.created_at).toLocaleDateString(),
    a.customer_name || '-', a.product_catalog?.name || '-',
    a.brand || '-', a.condition || '-',
    isEmployee ? '-' : (a.value_estimate ? `₹${a.value_estimate.toLocaleString()}` : '-'),
    a.status,
  ]);

  if (format === 'xlsx') {
    const buf = await reportService.generateExcel('Assessments', headers, rows);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=assessments.xlsx');
    return res.send(buf);
  }

  if (format === 'csv') {
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=assessments.csv');
    return res.send(Buffer.from(csvContent));
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

exports.getHistory = catchAsync(async (req, res) => {
  const assessment = await Assessment.findByPk(req.params.id);
  if (!assessment) throw new AppError('Assessment not found', 404);
  const logs = await ActivityLog.findAll({
    where: { entity_type: 'assessment', entity_id: assessment.id },
    order: [['created_at', 'DESC']],
    include: [{ model: User, attributes: ['full_name', 'role'] }],
  });
  res.json({ history: logs });
});
