const simService = require('../services/scenarioSimulationService');

class ScenarioSimulationController {
  async getAll(req, res, next) {
    try {
      const sims = await simService.getAll();
      res.json(sims);
    } catch (err) { next(err); }
  }

  async getById(req, res, next) {
    try {
      const sim = await simService.getById(req.params.id);
      res.json(sim);
    } catch (err) { next(err); }
  }

  async create(req, res, next) {
    try {
      const sim = await simService.create(req.body);
      res.status(201).json(sim);
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const sim = await simService.update(req.params.id, req.body);
      res.json(sim);
    } catch (err) { next(err); }
  }

  async remove(req, res, next) {
    try {
      const result = await simService.remove(req.params.id);
      res.json(result);
    } catch (err) { next(err); }
  }

  async getStats(req, res, next) {
    try {
      const stats = await simService.getStats();
      res.json(stats);
    } catch (err) { next(err); }
  }
}

module.exports = new ScenarioSimulationController();
