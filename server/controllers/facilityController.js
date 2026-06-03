const facilityService = require('../services/facilityService');

class FacilityController {
  async getAllCenters(req, res, next) {
    try { res.json(await facilityService.getAllCenters(req.query)); } catch (err) { next(err); }
  }

  async getCenterById(req, res, next) {
    try {
      const center = await facilityService.getCenterById(req.params.id);
      res.json(center);
    } catch (err) {
      if (err.message === 'Collection center not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async createCenter(req, res, next) {
    try { res.status(201).json(await facilityService.createCenter(req.body)); } catch (err) { next(err); }
  }

  async updateCenter(req, res, next) {
    try { res.json(await facilityService.updateCenter(req.params.id, req.body)); } catch (err) { next(err); }
  }

  async deleteCenter(req, res, next) {
    try { res.json(await facilityService.deleteCenter(req.params.id)); } catch (err) { next(err); }
  }

  async getAllUnits(req, res, next) {
    try { res.json(await facilityService.getAllUnits(req.query)); } catch (err) { next(err); }
  }

  async getUnitById(req, res, next) {
    try {
      const unit = await facilityService.getUnitById(req.params.id);
      res.json(unit);
    } catch (err) {
      if (err.message === 'Preprocessing unit not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async createUnit(req, res, next) {
    try { res.status(201).json(await facilityService.createUnit(req.body)); } catch (err) { next(err); }
  }

  async updateUnit(req, res, next) {
    try { res.json(await facilityService.updateUnit(req.params.id, req.body)); } catch (err) { next(err); }
  }

  async deleteUnit(req, res, next) {
    try { res.json(await facilityService.deleteUnit(req.params.id)); } catch (err) { next(err); }
  }

  async getAnalytics(req, res, next) {
    try { res.json(await facilityService.getAnalytics()); } catch (err) { next(err); }
  }

  async getCenterCosts(req, res, next) {
    try { res.json(await facilityService.getCenterCosts(req.params.id)); } catch (err) { next(err); }
  }

  async addCenterCost(req, res, next) {
    try { res.status(201).json(await facilityService.addCenterCost(req.params.id, req.body)); } catch (err) { next(err); }
  }

  async getUnitCosts(req, res, next) {
    try { res.json(await facilityService.getUnitCosts(req.params.id)); } catch (err) { next(err); }
  }

  async addUnitCost(req, res, next) {
    try { res.status(201).json(await facilityService.addUnitCost(req.params.id, req.body)); } catch (err) { next(err); }
  }
}

module.exports = new FacilityController();
