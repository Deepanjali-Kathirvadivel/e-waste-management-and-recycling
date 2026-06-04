const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { FORECAST_DATA_TYPES, FORECAST_DATA_STATUS } = require('../utils/enums');

const ForecastData = sequelize.define('forecast_data', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type: { type: DataTypes.ENUM(...FORECAST_DATA_TYPES), allowNull: false },
  filename: { type: DataTypes.STRING(255), allowNull: false },
  original_name: { type: DataTypes.STRING(255) },
  file_path: { type: DataTypes.STRING(255) },
  row_count: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM(...FORECAST_DATA_STATUS), defaultValue: 'uploaded' },
  uploaded_by: { type: DataTypes.INTEGER },
});

module.exports = ForecastData;
