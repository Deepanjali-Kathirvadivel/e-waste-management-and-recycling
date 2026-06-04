const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductCatalog = sequelize.define('product_catalog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  category: { type: DataTypes.STRING(50) },
  icon: { type: DataTypes.STRING(50) },
  base_price: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
});

module.exports = ProductCatalog;
