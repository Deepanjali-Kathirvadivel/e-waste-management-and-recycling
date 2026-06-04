const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { FACILITY_TYPES, FACILITY_STATUS } = require('../utils/enums');

const Facility = sequelize.define('facilities', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  type: { type: DataTypes.ENUM(...FACILITY_TYPES), allowNull: false },
  region_id: { type: DataTypes.INTEGER, allowNull: true },
  capacity: { type: DataTypes.INTEGER, allowNull: true },
  rent: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  electricity_cost: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  staff_cost: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  status: { type: DataTypes.ENUM(...FACILITY_STATUS), defaultValue: 'active' },
  location: { type: DataTypes.TEXT },
});

module.exports = Facility;
