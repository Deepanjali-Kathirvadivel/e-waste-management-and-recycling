const logisticsService = require('../services/logisticsService');

class LogisticsController {
  async getAll(req, res, next) {
    try {
      const routes = await logisticsService.getAll(req.query);
      res.json(routes);
    } catch (err) { next(err); }
  }

  async getById(req, res, next) {
    try {
      const route = await logisticsService.getById(req.params.id);
      res.json(route);
    } catch (err) {
      if (err.message === 'Route not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const route = await logisticsService.create(req.body);
      res.status(201).json(route);
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const route = await logisticsService.update(req.params.id, req.body);
      res.json(route);
    } catch (err) {
      if (err.message === 'Route not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await logisticsService.delete(req.params.id);
      res.json(result);
    } catch (err) { next(err); }
  }

  async getTotalCosts(req, res, next) {
    try {
      const costs = await logisticsService.getTotalCosts();
      res.json(costs);
    } catch (err) { next(err); }
  }

  async getAnalytics(req, res, next) {
    try {
      const analytics = await logisticsService.getAnalytics();
      res.json(analytics);
    } catch (err) { next(err); }
  }
}

module.exports = new LogisticsController();
