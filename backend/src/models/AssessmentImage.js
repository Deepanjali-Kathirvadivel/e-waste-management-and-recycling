const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssessmentImage = sequelize.define('assessment_images', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  assessment_id: { type: DataTypes.INTEGER, allowNull: false },
  filename: { type: DataTypes.STRING(255), allowNull: false },
  original_name: { type: DataTypes.STRING(255) },
  mime_type: { type: DataTypes.STRING(50) },
  file_size: { type: DataTypes.INTEGER },
  ai_analysis: { type: DataTypes.JSON },
});

module.exports = AssessmentImage;
