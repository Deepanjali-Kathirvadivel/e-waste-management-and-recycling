const envService = require('../services/environmentalImpactService');

class EnvironmentalImpactController {
  async getDashboard(req, res, next) {
    try {
      const data = await envService.getDashboard();
      res.json(data);
    } catch (err) { next(err); }
  }

  async getByRegion(req, res, next) {
    try {
      const data = await envService.getByRegion(req.params.regionId);
      res.json(data);
    } catch (err) { next(err); }
  }

  async record(req, res, next) {
    try {
      const result = await envService.record(req.body);
      res.status(201).json(result);
    } catch (err) { next(err); }
  }
}

module.exports = new EnvironmentalImpactController();
