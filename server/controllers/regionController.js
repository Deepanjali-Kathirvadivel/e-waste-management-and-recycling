const regionService = require('../services/regionService');

class RegionController {
  async getAll(req, res, next) {
    try {
      const regions = await regionService.getAll();
      res.json(regions);
    } catch (err) { next(err); }
  }

  async getById(req, res, next) {
    try {
      const region = await regionService.getById(req.params.id);
      res.json(region);
    } catch (err) {
      if (err.message === 'Region not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const region = await regionService.create(req.body);
      res.status(201).json(region);
    } catch (err) {
      if (err.message === 'Region code already exists') return res.status(409).json({ message: err.message });
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const region = await regionService.update(req.params.id, req.body);
      res.json(region);
    } catch (err) {
      if (err.message === 'Region not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await regionService.delete(req.params.id);
      res.json(result);
    } catch (err) {
      if (err.message === 'Region not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async getSummary(req, res, next) {
    try {
      const summary = await regionService.getSummary();
      res.json(summary);
    } catch (err) { next(err); }
  }

  async getStats(req, res, next) {
    try {
      const stats = await regionService.getStats(req.params.id);
      res.json(stats);
    } catch (err) {
      if (err.message === 'Region not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }
}

module.exports = new RegionController();
