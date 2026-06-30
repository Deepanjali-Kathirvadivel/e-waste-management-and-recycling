const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { ASSESSMENT_STATUS, PRODUCT_CONDITIONS, CLASSIFICATIONS } = require('../utils/enums');

const Assessment = sequelize.define('assessments', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  region_id: { type: DataTypes.INTEGER, allowNull: true },
  customer_name: { type: DataTypes.STRING(100) },
  customer_email: { type: DataTypes.STRING(100) },
  customer_phone: { type: DataTypes.STRING(20) },
  customer_address: { type: DataTypes.TEXT },
  customer_state: { type: DataTypes.STRING(50) },
  customer_district: { type: DataTypes.STRING(50) },
  customer_corporation: { type: DataTypes.STRING(50) },
  customer_municipality: { type: DataTypes.STRING(50) },
  customer_panchayat: { type: DataTypes.STRING(50) },
  customer_city: { type: DataTypes.STRING(50) },
  customer_village: { type: DataTypes.STRING(50) },
  customer_pincode: { type: DataTypes.STRING(10) },
  customer_gps_lat: { type: DataTypes.DECIMAL(10, 7) },
  customer_gps_lng: { type: DataTypes.DECIMAL(10, 7) },
  product_type_id: { type: DataTypes.INTEGER },
  product_category: { type: DataTypes.STRING(10) },
  brand: { type: DataTypes.STRING(100) },
  model: { type: DataTypes.STRING(100) },
  serial_number: { type: DataTypes.STRING(100) },
  year_of_manufacture: { type: DataTypes.INTEGER },
  purchase_year: { type: DataTypes.INTEGER },
  specifications: { type: DataTypes.TEXT },
  warranty_status: { type: DataTypes.STRING(30) },
  accessories_available: { type: DataTypes.TEXT },
  working_condition: { type: DataTypes.STRING(50) },
  ownership_type: { type: DataTypes.STRING(30) },
  condition: { type: DataTypes.ENUM(...PRODUCT_CONDITIONS) },
  weight_kg: { type: DataTypes.DECIMAL(8, 2) },
  notes: { type: DataTypes.TEXT },
  // Workflow status
  status: { type: DataTypes.ENUM(...ASSESSMENT_STATUS), defaultValue: 'draft' },
  // Valuation fields
  value_estimate: { type: DataTypes.DECIMAL(12, 2) },
  value_min: { type: DataTypes.DECIMAL(12, 2) },
  value_max: { type: DataTypes.DECIMAL(12, 2) },
  recommended_value: { type: DataTypes.DECIMAL(12, 2) },
  final_value: { type: DataTypes.DECIMAL(12, 2) },
  customer_expected_value: { type: DataTypes.DECIMAL(12, 2) },
  // Manager review fields
  rejection_reason: { type: DataTypes.TEXT },
  approved_by: { type: DataTypes.INTEGER },
  hr_approved_value: { type: DataTypes.DECIMAL(12, 2) },
  hr_rejection_reason: { type: DataTypes.TEXT },
  manager_remarks: { type: DataTypes.TEXT },
  // Hub and supply-chain assignment
  assigned_hub_id: { type: DataTypes.INTEGER },
  supply_chain_user_id: { type: DataTypes.INTEGER },
  // OTP verification
  otp: { type: DataTypes.STRING(10) },
  otp_code: { type: DataTypes.STRING(10) },
  otp_generated_at: { type: DataTypes.DATE },
  otp_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  otp_retry_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  // Logistics tracking
  destination_id: { type: DataTypes.INTEGER },
  destination_type: { type: DataTypes.STRING(50) },
  movement_history: { type: DataTypes.JSON },
  // Pickup scheduling fields
  pickup_priority: { type: DataTypes.STRING(20), defaultValue: 'normal' },
  scheduled_pickup_date: { type: DataTypes.DATEONLY },
  scheduled_pickup_time: { type: DataTypes.STRING(10) },
  pickup_remarks: { type: DataTypes.TEXT },
  // Journey tracking
  departure_time: { type: DataTypes.DATE },
  vehicle_number: { type: DataTypes.STRING(30) },
  driver_name: { type: DataTypes.STRING(100) },
  executive_name: { type: DataTypes.STRING(100) },
  arrival_time: { type: DataTypes.DATE },
  gps_coordinates: { type: DataTypes.STRING(100) },
  distance_travelled: { type: DataTypes.DECIMAL(10, 2) },
  // Product verification
  product_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  verification_notes: { type: DataTypes.TEXT },
  // Collection details
  collection_time: { type: DataTypes.DATE },
  package_count: { type: DataTypes.INTEGER },
  packaging_condition: { type: DataTypes.STRING(50) },
  collection_notes: { type: DataTypes.TEXT },
  // Exception handling
  exception_reason: { type: DataTypes.TEXT },
  // AI scoring & classification
  ai_score: { type: DataTypes.DECIMAL(5, 2) },
  classification: { type: DataTypes.ENUM(...CLASSIFICATIONS) },
  // Additional meta fields
  deal_group_id: { type: DataTypes.STRING(30) },
  deal_number: { type: DataTypes.STRING(30) },
  receipt_number: { type: DataTypes.STRING(50) },
  collection_number: { type: DataTypes.STRING(30) },
  submitted_at: { type: DataTypes.DATE },
  hr_acted_at: { type: DataTypes.DATE },
  deal_closed_at: { type: DataTypes.DATE },
});

module.exports = Assessment;
