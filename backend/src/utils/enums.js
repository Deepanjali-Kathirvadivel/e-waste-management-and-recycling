module.exports = {
  USER_ROLES: ['root', 'admin', 'center_manager', 'employee'],
  ASSESSMENT_STATUS: ['draft', 'in_progress', 'completed', 'cancelled'],
  PRODUCT_CONDITIONS: ['excellent', 'good', 'fair', 'poor', 'damaged'],
  CLASSIFICATIONS: ['reusable', 'repairable', 'recyclable', 'scrap'],
  FACILITY_TYPES: ['collection_center', 'preprocessing_unit', 'dismantling', 'recovery'],
  FACILITY_STATUS: ['active', 'inactive', 'under_maintenance'],
  FORECAST_DATA_TYPES: ['historical_collection', 'population', 'product_sales', 'import_export', 'revenue', 'operational_costs'],
  FORECAST_DATA_STATUS: ['uploaded', 'validated', 'imported', 'failed'],
  RECOMMENDATION_TYPES: ['new_center', 'new_unit', 'expansion', 'logistics_optimization'],
  RECOMMENDATION_FEASIBILITY: ['high', 'medium', 'low'],
  RECOMMENDATION_STATUS: ['pending', 'approved', 'implemented', 'rejected'],
  REGION_TYPES: ['state', 'city'],
};
