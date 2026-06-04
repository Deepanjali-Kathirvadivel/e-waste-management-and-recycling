const { ActivityLog } = require('../models');

const log = async ({ userId, action, entityType, entityId, metadata }) => {
  try {
    await ActivityLog.create({ user_id: userId, action, entity_type: entityType, entity_id: entityId, metadata });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
};

const getRecent = async (userId, limit = 10) => {
  return ActivityLog.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    limit,
  });
};

const getAllRecent = async (limit = 20) => {
  return ActivityLog.findAll({
    order: [['created_at', 'DESC']],
    limit,
    include: [{ association: 'user', attributes: ['full_name', 'role'] }],
  });
};

module.exports = { log, getRecent, getAllRecent };
