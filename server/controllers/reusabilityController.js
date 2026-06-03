const reusabilityService = require('../services/reusabilityService');

class ReusabilityController {
  async getAll(req, res, next) {
    try {
      const products = await reusabilityService.getAll(req.query);
      res.json(products);
    } catch (err) { next(err); }
  }

  async getById(req, res, next) {
    try {
      const product = await reusabilityService.getById(req.params.id);
      res.json(product);
    } catch (err) {
      if (err.message === 'Reusability record not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async getAnalytics(req, res, next) {
    try {
      const analytics = await reusabilityService.getAnalytics(req.query);
      res.json(analytics);
    } catch (err) { next(err); }
  }
}

module.exports = new ReusabilityController();
