const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AnalysisResult = sequelize.define('analysis_results', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  assessment_id: { type: DataTypes.INTEGER, allowNull: false },
  classification: { type: DataTypes.ENUM('reusable', 'repairable', 'recyclable', 'scrap'), allowNull: false },
  recovery_potential: { type: DataTypes.DECIMAL(5, 2) },
  estimated_revenue: { type: DataTypes.DECIMAL(12, 2) },
  material_recovery_percentage: { type: DataTypes.DECIMAL(5, 2) },
  condition_assessment: { type: DataTypes.TEXT },
  repairable_components: { type: DataTypes.JSON },
  recoverable_materials: { type: DataTypes.JSON },
  hazardous_materials: { type: DataTypes.JSON },
  weight_breakdown: { type: DataTypes.JSON },
  notes: { type: DataTypes.TEXT },
  analysed_by: { type: DataTypes.INTEGER },
  analysed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

module.exports = AnalysisResult;
