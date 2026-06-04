const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssessmentDetail = sequelize.define('assessment_details', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  assessment_id: { type: DataTypes.INTEGER, allowNull: false },
  casing_intact: { type: DataTypes.BOOLEAN },
  screen_intact: { type: DataTypes.BOOLEAN },
  has_scratches: { type: DataTypes.BOOLEAN },
  ports_functional: { type: DataTypes.BOOLEAN },
  remote_present: { type: DataTypes.BOOLEAN },
  functional_status: { type: DataTypes.JSON },
  verification_answers: { type: DataTypes.JSON },
});

module.exports = AssessmentDetail;
