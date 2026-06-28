const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('notifications', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  assessment_id: { type: DataTypes.INTEGER, allowNull: true },
  type: { type: DataTypes.STRING(50), allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: true },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  metadata: { type: DataTypes.JSON },
});

module.exports = Notification;
