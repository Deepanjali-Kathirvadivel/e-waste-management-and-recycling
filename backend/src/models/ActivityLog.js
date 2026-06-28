const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivityLog = sequelize.define('activity_logs', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  action: { type: DataTypes.STRING(100), allowNull: false },
  entity_type: { type: DataTypes.STRING(50) },
  entity_id: { type: DataTypes.INTEGER },
  metadata: { type: DataTypes.JSON },
  ip_address: { type: DataTypes.STRING(45) },
  user_agent: { type: DataTypes.STRING(255) },
  old_value: { type: DataTypes.JSON },
  new_value: { type: DataTypes.JSON },
});

module.exports = ActivityLog;
