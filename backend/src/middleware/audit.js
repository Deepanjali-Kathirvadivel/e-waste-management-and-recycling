const { log } = require('../services/activity.service');

const audit = ({ action, entityType, getEntityId, getOldValue, getNewValue } = {}) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        let entityId = null;
        if (getEntityId) {
          entityId = typeof getEntityId === 'function' ? getEntityId(req, res, body) : getEntityId;
        } else if (req.params.id) {
          entityId = parseInt(req.params.id);
        } else if (body?.id) {
          entityId = body.id;
        }

        let oldValue = null;
        if (getOldValue) {
          oldValue = typeof getOldValue === 'function' ? await getOldValue(req, res, body) : getOldValue;
        }

        let newValue = null;
        if (getNewValue) {
          newValue = typeof getNewValue === 'function' ? getNewValue(req, res, body) : getNewValue;
        } else if (req.body && Object.keys(req.body).length > 0) {
          newValue = req.body;
        }

        await log({
          userId: req.user.id,
          action: action || `${req.method} ${req.originalUrl}`,
          entityType: entityType || 'generic',
          entityId,
          metadata: { url: req.originalUrl, method: req.method, status: res.statusCode },
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('User-Agent') || null,
          oldValue,
          newValue,
        });
      }
      return originalJson(body);
    };
    next();
  };
};

module.exports = { audit };
