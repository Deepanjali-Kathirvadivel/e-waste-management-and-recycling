const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SustainabilityScore = sequelize.define('sustainability_scores', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  region_id: { type: DataTypes.INTEGER, allowNull: true },
  score: { type: DataTypes.DECIMAL(5, 2) },
  collection_efficiency: { type: DataTypes.DECIMAL(5, 2) },
  recovery_rate: { type: DataTypes.DECIMAL(5, 2) },
  transportation_efficiency: { type: DataTypes.DECIMAL(5, 2) },
  facility_utilization: { type: DataTypes.DECIMAL(5, 2) },
  environmental_impact: { type: DataTypes.JSON },
  recovery_rate_history: { type: DataTypes.JSON },
  calculated_at: { type: DataTypes.DATE },
});

module.exports = SustainabilityScore;
