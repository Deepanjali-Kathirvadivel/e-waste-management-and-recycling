const recommendationService = require('../services/recommendationService');

class RecommendationController {
  async getAll(req, res, next) {
    try {
      const recommendations = await recommendationService.getAll();
      res.json(recommendations);
    } catch (err) { next(err); }
  }

  async getById(req, res, next) {
    try {
      const rec = await recommendationService.getById(req.params.id);
      res.json(rec);
    } catch (err) {
      if (err.message === 'Recommendation not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async generate(req, res, next) {
    try {
      const data = { ...req.body, admin_id: req.user.id };
      const recommendations = await recommendationService.generate(data);
      res.status(201).json(recommendations);
    } catch (err) { next(err); }
  }

  async updateStatus(req, res, next) {
    try {
      const result = await recommendationService.updateStatus(req.params.id, req.body.status);
      res.json(result);
    } catch (err) {
      if (err.message === 'Recommendation not found') return res.status(404).json({ message: err.message });
      if (err.message === 'Invalid status') return res.status(400).json({ message: err.message });
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      const result = await recommendationService.remove(req.params.id);
      res.json(result);
    } catch (err) {
      if (err.message === 'Recommendation not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async getActions(req, res, next) {
    try {
      const actions = await recommendationService.getActions(req.params.id);
      res.json(actions);
    } catch (err) { next(err); }
  }

  async createAction(req, res, next) {
    try {
      const action = await recommendationService.createAction(req.params.id, req.body);
      res.status(201).json(action);
    } catch (err) {
      if (err.message === 'Recommendation not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async updateAction(req, res, next) {
    try {
      const action = await recommendationService.updateAction(req.params.actionId, req.body);
      res.json(action);
    } catch (err) {
      if (err.message === 'Action not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async removeAction(req, res, next) {
    try {
      const result = await recommendationService.removeAction(req.params.actionId);
      res.json(result);
    } catch (err) {
      if (err.message === 'Action not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }
}

module.exports = new RecommendationController();
