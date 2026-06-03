const AuditLogRepository = require('../repositories/auditLogRepository');

const auditRepo = new AuditLogRepository();

class AuditLogController {
  async getAll(req, res, next) {
    try {
      const logs = await auditRepo.getFiltered(req.query);
      res.json(logs);
    } catch (err) { next(err); }
  }
}

module.exports = new AuditLogController();
