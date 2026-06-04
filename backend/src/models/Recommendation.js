const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { RECOMMENDATION_TYPES, RECOMMENDATION_FEASIBILITY, RECOMMENDATION_STATUS } = require('../utils/enums');

const Recommendation = sequelize.define('recommendations', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type: { type: DataTypes.ENUM(...RECOMMENDATION_TYPES), allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  feasibility: { type: DataTypes.ENUM(...RECOMMENDATION_FEASIBILITY) },
  estimated_cost: { type: DataTypes.DECIMAL(15, 2) },
  estimated_benefit: { type: DataTypes.DECIMAL(15, 2) },
  status: { type: DataTypes.ENUM(...RECOMMENDATION_STATUS), defaultValue: 'pending' },
});

module.exports = Recommendation;
