const staffService = require('../services/staffService');

class StaffController {
  async getAll(req, res, next) {
    try {
      const staff = await staffService.getAll();
      res.json(staff);
    } catch (err) { next(err); }
  }

  async getById(req, res, next) {
    try {
      const staff = await staffService.getById(req.params.id);
      res.json(staff);
    } catch (err) {
      if (err.message === 'Staff not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = { ...req.body, adminId: req.user.id };
      const staff = await staffService.create(data);
      res.status(201).json(staff);
    } catch (err) {
      if (err.message.includes('already exists')) return res.status(409).json({ message: err.message });
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const staff = await staffService.update(req.params.id, req.body);
      res.json(staff);
    } catch (err) {
      if (err.message === 'Staff not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await staffService.delete(req.params.id);
      res.json(result);
    } catch (err) {
      if (err.message === 'Staff not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const result = await staffService.updateStatus(req.params.id, req.body.status);
      res.json(result);
    } catch (err) {
      if (err.message === 'Staff not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const result = await staffService.resetPassword(req.params.id, req.body.newPassword);
      res.json(result);
    } catch (err) {
      if (err.message === 'Staff not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async getDashboard(req, res, next) {
    try {
      const dashboard = await staffService.getDashboard(req.user.id);
      res.json(dashboard);
    } catch (err) { next(err); }
  }
}

module.exports = new StaffController();
