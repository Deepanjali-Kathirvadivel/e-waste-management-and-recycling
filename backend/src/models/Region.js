const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { REGION_TYPES } = require('../utils/enums');

const Region = sequelize.define('regions', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  type: { type: DataTypes.ENUM(...REGION_TYPES), defaultValue: 'city' },
  parent_id: { type: DataTypes.INTEGER, allowNull: true },
  population: { type: DataTypes.INTEGER, allowNull: true },
  growth_rate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  collection_quantity: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  revenue: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
});

Region.belongsTo(Region, { as: 'parent', foreignKey: 'parent_id' });
Region.hasMany(Region, { as: 'children', foreignKey: 'parent_id' });

module.exports = Region;
