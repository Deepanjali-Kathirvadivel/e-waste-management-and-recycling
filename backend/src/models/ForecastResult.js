const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ForecastResult = sequelize.define('forecast_results', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  region_id: { type: DataTypes.INTEGER, allowNull: true },
  forecast_year: { type: DataTypes.INTEGER },
  forecasted_waste: { type: DataTypes.DECIMAL(15, 2) },
  growth_rate: { type: DataTypes.DECIMAL(5, 2) },
  opportunity_score: { type: DataTypes.DECIMAL(5, 2) },
  predicted_revenue: { type: DataTypes.DECIMAL(15, 2) },
});

module.exports = ForecastResult;
