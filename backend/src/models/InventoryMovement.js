const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryMovement = sequelize.define('inventory_movements', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  inventory_item_id: { type: DataTypes.INTEGER, allowNull: false },
  assessment_id: { type: DataTypes.INTEGER, allowNull: false },
  from_status: { type: DataTypes.STRING(50) },
  to_status: { type: DataTypes.STRING(50) },
  from_location: { type: DataTypes.STRING(100) },
  to_location: { type: DataTypes.STRING(100) },
  action: { type: DataTypes.STRING(100), allowNull: false },
  performed_by: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT },
  moved_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

module.exports = InventoryMovement;
