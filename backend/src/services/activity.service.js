const { ActivityLog, User } = require('../models');

const log = async ({ userId, action, entityType, entityId, metadata, ipAddress, userAgent, oldValue, newValue }) => {
  try {
    await ActivityLog.create({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      old_value: oldValue || null,
      new_value: newValue || null,
    });
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
    include: [{ model: User, attributes: ['full_name', 'role'] }],
  });
};

module.exports = { log, getRecent, getAllRecent };
