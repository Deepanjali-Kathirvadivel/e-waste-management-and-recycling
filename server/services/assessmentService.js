const AssessmentRepository = require('../repositories/assessmentRepository');
const CustomerRepository = require('../repositories/customerRepository');
const ProductRepository = require('../repositories/productRepository');
const ReusabilityRepository = require('../repositories/reusabilityRepository');
const NotificationRepository = require('../repositories/notificationRepository');
const pool = require('../config/db');

const assessmentRepo = new AssessmentRepository();
const customerRepo = new CustomerRepository();
const productRepo = new ProductRepository();
const reusabilityRepo = new ReusabilityRepository();
const notifRepo = new NotificationRepository();

class AssessmentService {
  async createCustomer(data) {
    const existing = await customerRepo.query(
      'SELECT * FROM customers WHERE email = ? OR phone = ?',
      [data.email, data.phone]
    );
    if (existing.length > 0) return existing[0];
    return await customerRepo.create(data);
  }

  async getCustomers(search) {
    if (search) return await customerRepo.search(search);
    return await customerRepo.findAll({ orderBy: 'created_at', orderDir: 'DESC' });
  }

  async getCustomerById(id) {
    const customer = await customerRepo.findById(id);
    if (!customer) throw new Error('Customer not found');
    return customer;
  }

  async createProduct(data) {
    return await productRepo.create(data);
  }

  async getCatalog() {
    return await productRepo.getCatalog();
  }

  async uploadImages(assessmentId, files) {
    const imageRepo = new (require('../repositories/baseRepository'))('product_images');
    const results = [];
    const imageTypes = ['front', 'back', 'left', 'right', 'serial', 'damage', 'other'];

    for (const file of files) {
      const imageType = imageTypes.includes(file.fieldname) ? file.fieldname : 'other';
      const result = await imageRepo.create({
        assessment_id: assessmentId,
        image_type: imageType,
        image_path: file.path,
        original_name: file.originalname,
        file_size: file.size
      });
      results.push(result);
    }
    return results;
  }

  async runCvAnalysis(assessmentId) {
    const assessment = await assessmentRepo.findById(assessmentId);
    if (!assessment) throw new Error('Assessment not found');

    const product = await productRepo.findById(assessment.product_id);
    if (!product) throw new Error('Product not found');

    const confidence = Math.floor(Math.random() * 30) + 65;
    const conditions = ['Screen intact', 'Minor scratches', 'Ports functional', 'Battery degraded'];

    const cvResult = {
      predicted_product: product.name,
      predicted_brand: product.brand,
      predicted_model: product.model,
      confidence_score: confidence,
      condition_indicators: conditions
    };

    await pool.query(
      `INSERT INTO cv_results (assessment_id, predicted_product, predicted_brand, predicted_model, confidence_score, condition_indicators)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [assessmentId, cvResult.predicted_product, cvResult.predicted_brand, cvResult.predicted_model, cvResult.confidence_score, JSON.stringify(conditions)]
    );

    return cvResult;
  }

  async audit(assessmentId, data) {
    const assessment = await assessmentRepo.findById(assessmentId);
    if (!assessment) throw new Error('Assessment not found');

    const updateData = {};
    const fields = ['power_status', 'working_status', 'battery_status', 'display_status', 'accessories', 'missing_parts', 'audit_notes'];
    for (const field of fields) {
      if (data[field] !== undefined) updateData[field] = data[field];
    }
    updateData.step = 6;

    await assessmentRepo.update(assessmentId, updateData);
    return await assessmentRepo.findById(assessmentId);
  }

  async calculateReusability(assessmentId) {
    const assessment = await assessmentRepo.findById(assessmentId);
    if (!assessment) throw new Error('Assessment not found');

    const reusableScore = Math.floor(Math.random() * 40) + 10;
    const repairableScore = Math.floor(Math.random() * 30) + 10;
    const recyclableScore = Math.floor(Math.random() * 25) + 5;
    const scrapScore = 100 - reusableScore - repairableScore - recyclableScore;

    let classification;
    const maxScore = Math.max(reusableScore, repairableScore, recyclableScore, scrapScore);
    if (maxScore === reusableScore) classification = 'Reusable';
    else if (maxScore === repairableScore) classification = 'Repairable';
    else if (maxScore === recyclableScore) classification = 'Recyclable';
    else classification = 'Scrap';

    const result = {
      score: maxScore,
      classification,
      reusable_score: reusableScore,
      repairable_score: repairableScore,
      recyclable_score: recyclableScore,
      scrap_score: scrapScore,
      factors: { power: assessment.power_status, working: assessment.working_status }
    };

    await pool.query(
      `INSERT INTO reusability_scores (assessment_id, score, classification, reusable_score, repairable_score, recyclable_score, scrap_score, factors)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [assessmentId, result.score, result.classification, reusableScore, repairableScore, recyclableScore, scrapScore, JSON.stringify(result.factors)]
    );

    return result;
  }

  async calculateValuation(assessmentId) {
    const assessment = await assessmentRepo.findById(assessmentId);
    if (!assessment) throw new Error('Assessment not found');

    const product = await productRepo.findById(assessment.product_id);
    const baseValue = product ? product.base_value : 5000;

    const conditionMultiplier = {
      'Excellent': 0.85, 'Good': 0.65, 'Fair': 0.45, 'Poor': 0.25, 'Not Working': 0.10
    };
    const multiplier = conditionMultiplier[product?.condition] || 0.5;

    const marketValue = Math.round(baseValue * multiplier);
    const componentValue = Math.round(baseValue * 0.4);
    const scrapValue = Math.round(baseValue * 0.15);
    const suggestedValue = Math.round((marketValue + componentValue + scrapValue) / 3);

    const valuation = { marketValue, componentValue, scrapValue, suggestedValue };

    await pool.query(
      `INSERT INTO valuations (assessment_id, market_value, component_value, scrap_value, suggested_value)
       VALUES (?, ?, ?, ?, ?)`,
      [assessmentId, marketValue, componentValue, scrapValue, suggestedValue]
    );

    await assessmentRepo.update(assessmentId, {
      market_value: marketValue,
      component_value: componentValue,
      scrap_value: scrapValue,
      suggested_value: suggestedValue,
      step: 8
    });

    return valuation;
  }

  async submit(assessmentId, staffId) {
    const assessment = await assessmentRepo.findById(assessmentId);
    if (!assessment) throw new Error('Assessment not found');

    await assessmentRepo.submitAssessment(assessmentId, staffId);
    await assessmentRepo.update(assessmentId, { step: 9 });

    await notifRepo.createNotification({
      user_id: staffId,
      user_type: 'staff',
      title: 'Assessment Completed',
      message: `Assessment ${assessment.assessment_code} has been submitted successfully.`,
      type: 'success',
      module: 'assessment',
      reference_id: assessmentId
    });

    return await assessmentRepo.findById(assessmentId);
  }

  async getHistory(filters) {
    return await assessmentRepo.getHistory(filters);
  }

  async getReusabilityList(filters) {
    return await reusabilityRepo.getReusabilityList(filters);
  }

  async getReusabilityById(id) {
    const [rows] = await pool.query(`
      SELECT rs.*, a.assessment_code, p.*, s.full_name as staff_name, r.name as region_name
      FROM reusability_scores rs
      JOIN assessments a ON rs.assessment_id = a.id
      LEFT JOIN products p ON a.product_id = p.id
      LEFT JOIN staff s ON a.staff_id = s.id
      LEFT JOIN regions r ON a.region_id = r.id
      WHERE rs.id = ?
    `, [id]);
    return rows[0] || null;
  }

  async getReusabilityAnalytics(filters) {
    const breakdown = await reusabilityRepo.getAnalytics(filters);
    const byProduct = await reusabilityRepo.getBreakdownByProduct();
    const trend = await reusabilityRepo.getMonthlyTrend();
    const total = breakdown.reduce((sum, item) => sum + item.count, 0);

    const percentages = {};
    breakdown.forEach(item => {
      percentages[item.classification] = total > 0 ? Math.round((item.count / total) * 100) : 0;
    });

    const revenuePotential = breakdown.reduce((sum, item) => sum + parseFloat(item.total_value), 0);

    return { breakdown, percentages, byProduct, trend, revenuePotential, total };
  }
}

module.exports = new AssessmentService();
