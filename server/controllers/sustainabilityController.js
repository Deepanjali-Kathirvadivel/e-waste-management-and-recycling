const sustainabilityService = require('../services/sustainabilityService');

class SustainabilityController {
  async getDashboard(req, res, next) {
    try {
      const dashboard = await sustainabilityService.getDashboard();
      res.json(dashboard);
    } catch (err) { next(err); }
  }
}

module.exports = new SustainabilityController();
