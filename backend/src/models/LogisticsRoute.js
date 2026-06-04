const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LogisticsRoute = sequelize.define('logistics_routes', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  route_name: { type: DataTypes.STRING(100), allowNull: false },
  origin_facility_id: { type: DataTypes.INTEGER, allowNull: true },
  destination_facility_id: { type: DataTypes.INTEGER, allowNull: true },
  distance_km: { type: DataTypes.DECIMAL(8, 2) },
  fuel_cost: { type: DataTypes.DECIMAL(12, 2) },
  driver_salary: { type: DataTypes.DECIMAL(12, 2) },
  vehicle_cost: { type: DataTypes.DECIMAL(12, 2) },
  maintenance_cost: { type: DataTypes.DECIMAL(12, 2) },
});

module.exports = LogisticsRoute;
