const assessmentService = require('../services/assessmentService');
const AssessmentRepository = require('../repositories/assessmentRepository');

const assessmentRepo = new AssessmentRepository();

class AssessmentController {
  async createCustomer(req, res, next) {
    try {
      const customer = await assessmentService.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (err) { next(err); }
  }

  async getCustomers(req, res, next) {
    try {
      const customers = await assessmentService.getCustomers(req.query.search);
      res.json(customers);
    } catch (err) { next(err); }
  }

  async getCustomerById(req, res, next) {
    try {
      const customer = await assessmentService.getCustomerById(req.params.id);
      res.json(customer);
    } catch (err) {
      if (err.message === 'Customer not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async createProduct(req, res, next) {
    try {
      const product = await assessmentService.createProduct(req.body);
      res.status(201).json(product);
    } catch (err) { next(err); }
  }

  async getCatalog(req, res, next) {
    try {
      const products = await assessmentService.getCatalog();
      res.json(products);
    } catch (err) { next(err); }
  }

  async createAssessment(req, res, next) {
    try {
      const code = await assessmentRepo.generateCode();
      const assessment = await assessmentRepo.create({
        assessment_code: code,
        customer_id: req.body.customer_id,
        product_id: req.body.product_id,
        staff_id: req.user.id,
        region_id: req.body.region_id || null,
        status: 'draft',
        step: 1
      });
      res.status(201).json(assessment);
    } catch (err) { next(err); }
  }

  async getAssessmentById(req, res, next) {
    try {
      const assessment = await assessmentRepo.findById(req.params.id);
      if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
      res.json(assessment);
    } catch (err) { next(err); }
  }

  async updateAssessment(req, res, next) {
    try {
      const assessment = await assessmentRepo.findById(req.params.id);
      if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
      await assessmentRepo.update(req.params.id, { ...req.body, step: req.body.step || assessment.step });
      const updated = await assessmentRepo.findById(req.params.id);
      res.json(updated);
    } catch (err) { next(err); }
  }

  async uploadImages(req, res, next) {
    try {
      const files = req.files || [];
      if (files.length === 0) return res.status(400).json({ message: 'No files uploaded' });
      const images = await assessmentService.uploadImages(req.params.id, files);
      res.json(images);
    } catch (err) { next(err); }
  }

  async runCVAnalysis(req, res, next) {
    try {
      const result = await assessmentService.runCvAnalysis(req.params.id);
      res.json(result);
    } catch (err) {
      if (err.message === 'Assessment not found' || err.message === 'Product not found') {
        return res.status(404).json({ message: err.message });
      }
      next(err);
    }
  }

  async audit(req, res, next) {
    try {
      const result = await assessmentService.audit(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      if (err.message === 'Assessment not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async calculateReusability(req, res, next) {
    try {
      const result = await assessmentService.calculateReusability(req.params.id);
      res.json(result);
    } catch (err) {
      if (err.message === 'Assessment not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async calculateValuation(req, res, next) {
    try {
      const result = await assessmentService.calculateValuation(req.params.id);
      res.json(result);
    } catch (err) {
      if (err.message === 'Assessment not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async submit(req, res, next) {
    try {
      const result = await assessmentService.submit(req.params.id, req.user.id);
      res.json(result);
    } catch (err) {
      if (err.message === 'Assessment not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async getHistory(req, res, next) {
    try {
      const result = await assessmentService.getHistory(req.query);
      res.json(result);
    } catch (err) { next(err); }
  }
}

module.exports = new AssessmentController();
