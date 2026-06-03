const profitService = require('../services/profitService');

class ProfitController {
  async simulate(req, res, next) {
    try {
      const result = await profitService.simulate(req.body);
      res.json(result);
    } catch (err) { next(err); }
  }

  async simulateAll(req, res, next) {
    try {
      const results = await profitService.simulateAllScenarios();
      res.json(results);
    } catch (err) { next(err); }
  }

  async getDashboard(req, res, next) {
    try {
      const dashboard = await profitService.getDashboard();
      res.json(dashboard);
    } catch (err) { next(err); }
  }

  async getComparison(req, res, next) {
    try {
      const comparison = await profitService.getComparison();
      res.json(comparison);
    } catch (err) { next(err); }
  }
}

module.exports = new ProfitController();
