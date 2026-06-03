-- GreenEra E-Waste Management System Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS greenera_db;
USE greenera_db;

-- ============================================================
-- AUTH & USER MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('super_admin', 'admin') DEFAULT 'admin',
  avatar VARCHAR(500),
  status ENUM('active', 'inactive') DEFAULT 'active',
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('collector', 'assessor', 'verifier', 'manager') DEFAULT 'assessor',
  region_id INT,
  avatar VARCHAR(500),
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  user_type ENUM('admin', 'staff') NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CUSTOMERS & REGIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  region_id INT,
  total_assessments INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) UNIQUE,
  description TEXT,
  population BIGINT DEFAULT 0,
  growth_rate DECIMAL(5,2) DEFAULT 0,
  waste_volume DECIMAL(12,2) DEFAULT 0,
  collection_quantity DECIMAL(12,2) DEFAULT 0,
  revenue DECIMAL(14,2) DEFAULT 0,
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- PRODUCTS & ASSESSMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  type ENUM('TV', 'AC', 'Fridge', 'Washing Machine', 'Fan', 'Laptop', 'Mobile', 'Monitor', 'Keyboard', 'Mouse', 'Other') DEFAULT 'Other',
  brand VARCHAR(100),
  model VARCHAR(100),
  year INT,
  `condition` ENUM('Excellent', 'Good', 'Fair', 'Poor', 'Not Working') DEFAULT 'Good',
  weight DECIMAL(8,2),
  description TEXT,
  category VARCHAR(100),
  base_value DECIMAL(12,2) DEFAULT 0,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assessment_id INT,
  image_type ENUM('front', 'back', 'left', 'right', 'serial', 'damage', 'other') DEFAULT 'other',
  image_path VARCHAR(500) NOT NULL,
  original_name VARCHAR(255),
  file_size INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assessment_code VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT,
  product_id INT,
  staff_id INT,
  region_id INT,
  status ENUM('draft', 'pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'draft',
  step INT DEFAULT 1,
  power_status ENUM('yes', 'no', 'unknown') DEFAULT 'unknown',
  working_status ENUM('yes', 'no', 'partial', 'unknown') DEFAULT 'unknown',
  battery_status ENUM('good', 'swollen', 'dead', 'missing', 'unknown') DEFAULT 'unknown',
  display_status ENUM('good', 'cracked', 'dead', 'flickering', 'unknown') DEFAULT 'unknown',
  accessories TEXT,
  missing_parts TEXT,
  audit_notes TEXT,
  cv_confidence_score DECIMAL(5,2),
  cv_predicted_product VARCHAR(255),
  cv_predicted_brand VARCHAR(100),
  cv_predicted_model VARCHAR(100),
  condition_indicators TEXT,
  reusability_score DECIMAL(5,2),
  reusability_classification ENUM('Reusable', 'Repairable', 'Recyclable', 'Scrap'),
  market_value DECIMAL(12,2) DEFAULT 0,
  component_value DECIMAL(12,2) DEFAULT 0,
  scrap_value DECIMAL(12,2) DEFAULT 0,
  suggested_value DECIMAL(12,2) DEFAULT 0,
  final_value DECIMAL(12,2) DEFAULT 0,
  submitted_at DATETIME,
  completed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS assessment_audit (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assessment_id INT NOT NULL,
  staff_id INT,
  action VARCHAR(100) NOT NULL,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cv_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assessment_id INT NOT NULL,
  predicted_product VARCHAR(255),
  predicted_brand VARCHAR(100),
  predicted_model VARCHAR(100),
  confidence_score DECIMAL(5,2),
  condition_indicators JSON,
  raw_analysis JSON,
  processing_time_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reusability_scores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assessment_id INT NOT NULL,
  score DECIMAL(5,2),
  classification ENUM('Reusable', 'Repairable', 'Recyclable', 'Scrap'),
  reusable_score DECIMAL(5,2) DEFAULT 0,
  repairable_score DECIMAL(5,2) DEFAULT 0,
  recyclable_score DECIMAL(5,2) DEFAULT 0,
  scrap_score DECIMAL(5,2) DEFAULT 0,
  factors JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS valuations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assessment_id INT NOT NULL,
  market_value DECIMAL(12,2) DEFAULT 0,
  component_value DECIMAL(12,2) DEFAULT 0,
  scrap_value DECIMAL(12,2) DEFAULT 0,
  suggested_value DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'INR',
  calculation_details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
);

-- ============================================================
-- FORECASTING
-- ============================================================

CREATE TABLE IF NOT EXISTS forecast_inputs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  data_type ENUM('collection', 'population', 'sales', 'import', 'revenue', 'cost') NOT NULL,
  file_path VARCHAR(500),
  original_name VARCHAR(255),
  file_size INT,
  row_count INT DEFAULT 0,
  uploaded_by INT,
  status ENUM('pending', 'validated', 'processed', 'failed') DEFAULT 'pending',
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forecast_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  region_id INT,
  target_year INT NOT NULL,
  model_type VARCHAR(50) DEFAULT 'linear',
  prediction_1yr DECIMAL(14,2) DEFAULT 0,
  prediction_3yr DECIMAL(14,2) DEFAULT 0,
  prediction_5yr DECIMAL(14,2) DEFAULT 0,
  growth_rate DECIMAL(5,2) DEFAULT 0,
  opportunity_score DECIMAL(5,2) DEFAULT 0,
  confidence_interval DECIMAL(5,2) DEFAULT 0,
  data_points JSON,
  generated_by INT,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sales_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  region_id INT,
  product_type VARCHAR(100),
  quantity INT DEFAULT 0,
  revenue DECIMAL(14,2) DEFAULT 0,
  sale_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS population_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  region_id INT,
  year INT,
  population BIGINT DEFAULT 0,
  growth_rate DECIMAL(5,2) DEFAULT 0,
  e_waste_per_capita DECIMAL(8,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS import_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  region_id INT,
  year INT,
  import_quantity DECIMAL(14,2) DEFAULT 0,
  import_value DECIMAL(14,2) DEFAULT 0,
  source_country VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL
);

-- ============================================================
-- FACILITIES & LOGISTICS
-- ============================================================

CREATE TABLE IF NOT EXISTS collection_centers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  region_id INT,
  address TEXT,
  capacity DECIMAL(10,2) DEFAULT 0,
  current_load DECIMAL(10,2) DEFAULT 0,
  rent DECIMAL(12,2) DEFAULT 0,
  electricity_cost DECIMAL(12,2) DEFAULT 0,
  labor_cost DECIMAL(12,2) DEFAULT 0,
  staff_count INT DEFAULT 0,
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS preprocessing_centers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  region_id INT,
  address TEXT,
  processing_capacity DECIMAL(10,2) DEFAULT 0,
  current_load DECIMAL(10,2) DEFAULT 0,
  rent DECIMAL(12,2) DEFAULT 0,
  electricity_cost DECIMAL(12,2) DEFAULT 0,
  labor_cost DECIMAL(12,2) DEFAULT 0,
  equipment_cost DECIMAL(12,2) DEFAULT 0,
  staff_count INT DEFAULT 0,
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS facility_costs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  facility_type ENUM('collection_center', 'preprocessing_center') NOT NULL,
  facility_id INT NOT NULL,
  cost_type VARCHAR(100),
  amount DECIMAL(12,2) DEFAULT 0,
  period ENUM('monthly', 'quarterly', 'yearly') DEFAULT 'monthly',
  recorded_at DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logistics_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_name VARCHAR(255),
  source VARCHAR(255),
  destination VARCHAR(255),
  distance DECIMAL(10,2) DEFAULT 0,
  fuel_cost DECIMAL(12,2) DEFAULT 0,
  driver_cost DECIMAL(12,2) DEFAULT 0,
  vehicle_cost DECIMAL(12,2) DEFAULT 0,
  maintenance_cost DECIMAL(12,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  region_id INT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL
);

-- ============================================================
-- PROFIT & SUSTAINABILITY
-- ============================================================

CREATE TABLE IF NOT EXISTS profit_analysis (
  id INT PRIMARY KEY AUTO_INCREMENT,
  scenario_name VARCHAR(255),
  scenario_type ENUM('current', 'new_center', 'new_unit', 'expansion', 'route_optimization') DEFAULT 'current',
  revenue DECIMAL(14,2) DEFAULT 0,
  transportation_cost DECIMAL(14,2) DEFAULT 0,
  facility_cost DECIMAL(14,2) DEFAULT 0,
  labor_cost DECIMAL(14,2) DEFAULT 0,
  operational_cost DECIMAL(14,2) DEFAULT 0,
  total_cost DECIMAL(14,2) DEFAULT 0,
  net_profit DECIMAL(14,2) DEFAULT 0,
  roi DECIMAL(5,2) DEFAULT 0,
  payback_period DECIMAL(5,2) DEFAULT 0,
  investment_required DECIMAL(14,2) DEFAULT 0,
  region_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS scenario_simulations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  type ENUM('what_if', 'comparison', 'optimization') DEFAULT 'what_if',
  parameters JSON,
  baseline_net_profit DECIMAL(14,2) DEFAULT 0,
  simulated_net_profit DECIMAL(14,2) DEFAULT 0,
  delta DECIMAL(14,2) DEFAULT 0,
  delta_percentage DECIMAL(5,2) DEFAULT 0,
  confidence DECIMAL(5,2) DEFAULT 0,
  status ENUM('draft', 'completed', 'archived') DEFAULT 'draft',
  region_id INT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS environmental_impact (
  id INT PRIMARY KEY AUTO_INCREMENT,
  region_id INT,
  co2_saved DECIMAL(14,2) DEFAULT 0,
  energy_saved DECIMAL(14,2) DEFAULT 0,
  water_saved DECIMAL(14,2) DEFAULT 0,
  landfill_diverted DECIMAL(14,2) DEFAULT 0,
  material_recovered DECIMAL(14,2) DEFAULT 0,
  trees_equivalent INT DEFAULT 0,
  households_equivalent INT DEFAULT 0,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS recommendations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  region_id INT,
  recommendation_type VARCHAR(100),
  title VARCHAR(255),
  description TEXT,
  expected_savings DECIMAL(14,2) DEFAULT 0,
  investment_required DECIMAL(14,2) DEFAULT 0,
  roi DECIMAL(5,2) DEFAULT 0,
  payback_period DECIMAL(5,2) DEFAULT 0,
  confidence_score DECIMAL(5,2) DEFAULT 0,
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  status ENUM('pending', 'approved', 'in_progress', 'completed', 'rejected') DEFAULT 'pending',
  generated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS recommendation_actions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recommendation_id INT NOT NULL,
  action VARCHAR(500),
  assigned_to INT,
  due_date DATE,
  status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE CASCADE
);

-- ============================================================
-- REPORTS & AUDIT
-- ============================================================

CREATE TABLE IF NOT EXISTS reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255),
  type ENUM('collection', 'forecast', 'reusability', 'profitability', 'sustainability', 'staff_performance', 'executive') NOT NULL,
  format ENUM('pdf', 'excel') NOT NULL,
  file_path VARCHAR(500),
  generated_by INT,
  parameters JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  user_type ENUM('admin', 'staff') DEFAULT 'staff',
  username VARCHAR(100),
  action VARCHAR(255) NOT NULL,
  module VARCHAR(100),
  description TEXT,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_user (user_id, user_type),
  INDEX idx_audit_module (module),
  INDEX idx_audit_created (created_at)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  user_type ENUM('admin', 'staff') DEFAULT 'staff',
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  module VARCHAR(100),
  reference_id INT,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user (user_id, user_type, is_read)
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default Admin (password: Admin@123)
INSERT INTO admins (username, email, password, full_name, role) VALUES
('admin', 'admin@greenera.com', '$2a$10$OONHIUV/rvzy8dAtU7bbqupuEO5O1PccGgsSFR9Bth3Wkc0LEzr.G', 'System Admin', 'super_admin');

-- Default Regions
INSERT INTO regions (name, code, population, growth_rate, waste_volume, collection_quantity, revenue) VALUES
('Chennai', 'CHN', 8500000, 3.5, 125000.00, 45000.00, 5200000.00),
('Salem', 'SLM', 3200000, 2.8, 48000.00, 18000.00, 2100000.00),
('Trichy', 'TRY', 2800000, 2.1, 42000.00, 15000.00, 1800000.00),
('Kochi', 'KCH', 3600000, 3.2, 54000.00, 20000.00, 2400000.00),
('Coimbatore', 'CBE', 4500000, 4.1, 68000.00, 25000.00, 3100000.00);

-- Default Staff (password: Admin@123)
INSERT INTO staff (username, email, password, full_name, role, region_id, status) VALUES
('staff', 'staff@greenera.com', '$2a$10$OONHIUV/rvzy8dAtU7bbqupuEO5O1PccGgsSFR9Bth3Wkc0LEzr.G', 'Staff User', 'assessor', 1, 'active');

-- Default Products
INSERT INTO products (name, type, brand, model, year, `condition`, base_value) VALUES
('Samsung Smart TV 43"', 'TV', 'Samsung', 'UA43T7000', 2022, 'Good', 15000.00),
('LG Front Load Washing Machine', 'Washing Machine', 'LG', 'FHM1208', 2021, 'Fair', 8000.00),
('Dell Latitude Laptop', 'Laptop', 'Dell', 'Latitude 5420', 2023, 'Excellent', 25000.00);

-- ============================================================
-- INDEXES & OPTIMIZATIONS
-- ============================================================

CREATE INDEX idx_assessments_staff ON assessments(staff_id);
CREATE INDEX idx_assessments_region ON assessments(region_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_created ON assessments(created_at);
CREATE INDEX idx_assessments_completed ON assessments(completed_at);

CREATE INDEX idx_reusability_assessment ON reusability_scores(assessment_id);
CREATE INDEX idx_reusability_classification ON reusability_scores(classification);

CREATE INDEX idx_valuations_assessment ON valuations(assessment_id);

CREATE INDEX idx_forecast_results_region ON forecast_results(region_id);
CREATE INDEX idx_forecast_results_year ON forecast_results(target_year);
CREATE INDEX idx_forecast_results_status ON forecast_results(status);

CREATE INDEX idx_forecast_inputs_type ON forecast_inputs(data_type);
CREATE INDEX idx_forecast_inputs_status ON forecast_inputs(status);

CREATE INDEX idx_sales_region ON sales_data(region_id);
CREATE INDEX idx_sales_date ON sales_data(sale_date);
CREATE INDEX idx_sales_product ON sales_data(product_type);

CREATE INDEX idx_population_region ON population_data(region_id);
CREATE INDEX idx_population_year ON population_data(year);

CREATE INDEX idx_import_region ON import_data(region_id);
CREATE INDEX idx_import_year ON import_data(year);

CREATE INDEX idx_logistics_region ON logistics_data(region_id);
CREATE INDEX idx_logistics_status ON logistics_data(status);

CREATE INDEX idx_facility_costs_type ON facility_costs(facility_type, facility_id);
CREATE INDEX idx_facility_costs_date ON facility_costs(recorded_at);

CREATE INDEX idx_collection_centers_region ON collection_centers(region_id);
CREATE INDEX idx_preprocessing_centers_region ON preprocessing_centers(region_id);

CREATE INDEX idx_recommendations_status ON recommendations(status);
CREATE INDEX idx_recommendations_region ON recommendations(region_id);

CREATE INDEX idx_scenario_simulations_region ON scenario_simulations(region_id);
CREATE INDEX idx_scenario_simulations_status ON scenario_simulations(status);
CREATE INDEX idx_scenario_simulations_type ON scenario_simulations(type);

CREATE INDEX idx_environmental_impact_region ON environmental_impact(region_id);
CREATE INDEX idx_environmental_impact_date ON environmental_impact(recorded_at);

CREATE INDEX idx_reports_type ON reports(type, format);
