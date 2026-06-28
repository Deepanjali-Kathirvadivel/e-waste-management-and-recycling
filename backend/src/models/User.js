const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { USER_ROLES } = require('../utils/enums');

const User = sequelize.define('users', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  full_name: { type: DataTypes.STRING(100), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  role: { type: DataTypes.ENUM(...USER_ROLES), allowNull: false, defaultValue: 'employee' },
  region_id: { type: DataTypes.INTEGER, allowNull: true },
  facility_id: { type: DataTypes.INTEGER, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  avatar_url: { type: DataTypes.STRING(255) },
  last_login: { type: DataTypes.DATE },
});

module.exports = User;
