const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { ASSESSMENT_STATUS, PRODUCT_CONDITIONS, CLASSIFICATIONS } = require('../utils/enums');

const Assessment = sequelize.define('assessments', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  customer_name: { type: DataTypes.STRING(100) },
  customer_email: { type: DataTypes.STRING(100) },
  customer_phone: { type: DataTypes.STRING(20) },
  customer_address: { type: DataTypes.TEXT },
  product_type_id: { type: DataTypes.INTEGER },
  brand: { type: DataTypes.STRING(100) },
  model: { type: DataTypes.STRING(100) },
  year_of_manufacture: { type: DataTypes.INTEGER },
  condition: { type: DataTypes.ENUM(...PRODUCT_CONDITIONS) },
  weight_kg: { type: DataTypes.DECIMAL(8, 2) },
  notes: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM(...ASSESSMENT_STATUS), defaultValue: 'draft' },
  value_estimate: { type: DataTypes.DECIMAL(12, 2) },
  ai_score: { type: DataTypes.DECIMAL(5, 2) },
  classification: { type: DataTypes.ENUM(...CLASSIFICATIONS) },
  submitted_at: { type: DataTypes.DATE },
});

module.exports = Assessment;
