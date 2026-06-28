const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryItem = sequelize.define('inventory_items', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  assessment_id: { type: DataTypes.INTEGER, allowNull: false },
  facility_id: { type: DataTypes.INTEGER, allowNull: false },
  batch_number: { type: DataTypes.STRING(50) },
  storage_location: { type: DataTypes.STRING(100) },
  rack_number: { type: DataTypes.STRING(30) },
  weight_kg: { type: DataTypes.DECIMAL(8, 2) },
  stock_status: { type: DataTypes.ENUM('in_stock', 'in_transit', 'under_analysis', 'forwarded', 'disposed', 'recovered'), defaultValue: 'in_stock' },
  lifecycle_stage: { type: DataTypes.ENUM('received', 'analysing', 'classified', 'processing', 'completed'), defaultValue: 'received' },
  received_at: { type: DataTypes.DATE },
  received_by: { type: DataTypes.INTEGER },
});

module.exports = InventoryItem;
