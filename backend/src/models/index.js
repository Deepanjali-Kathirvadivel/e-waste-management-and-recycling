const User = require('./User');
const Region = require('./Region');
const Facility = require('./Facility');
const LogisticsRoute = require('./LogisticsRoute');
const ProductCatalog = require('./ProductCatalog');
const Assessment = require('./Assessment');
const AssessmentImage = require('./AssessmentImage');
const AssessmentDetail = require('./AssessmentDetail');
const ActivityLog = require('./ActivityLog');
const Notification = require('./Notification');
const ForecastData = require('./ForecastData');
const ForecastResult = require('./ForecastResult');
const SustainabilityScore = require('./SustainabilityScore');
const Recommendation = require('./Recommendation');
const InventoryItem = require('./InventoryItem');
const InventoryMovement = require('./InventoryMovement');
const AnalysisResult = require('./AnalysisResult');

User.belongsTo(Region, { foreignKey: 'region_id' });
Region.hasMany(User, { foreignKey: 'region_id' });
User.belongsTo(Facility, { foreignKey: 'facility_id' });
Facility.hasMany(User, { foreignKey: 'facility_id' });

Assessment.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Assessment, { foreignKey: 'user_id' });
Assessment.belongsTo(User, { as: 'approver', foreignKey: 'approved_by' });
Assessment.belongsTo(ProductCatalog, { foreignKey: 'product_type_id' });
ProductCatalog.hasMany(Assessment, { foreignKey: 'product_type_id' });
Assessment.belongsTo(Facility, { as: 'assigned_hub', foreignKey: 'assigned_hub_id' });
Assessment.belongsTo(User, { as: 'supply_chain_user', foreignKey: 'supply_chain_user_id' });
Assessment.belongsTo(Region, { foreignKey: 'region_id' });
Region.hasMany(Assessment, { foreignKey: 'region_id' });

Assessment.hasMany(AssessmentImage, { foreignKey: 'assessment_id' });
AssessmentImage.belongsTo(Assessment, { foreignKey: 'assessment_id' });

Assessment.hasOne(AssessmentDetail, { foreignKey: 'assessment_id' });
AssessmentDetail.belongsTo(Assessment, { foreignKey: 'assessment_id' });

ActivityLog.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(ActivityLog, { foreignKey: 'user_id' });

Notification.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(Assessment, { foreignKey: 'assessment_id' });

ForecastData.belongsTo(User, { foreignKey: 'uploaded_by' });

Facility.belongsTo(Region, { foreignKey: 'region_id' });
Region.hasMany(Facility, { foreignKey: 'region_id' });

LogisticsRoute.belongsTo(Facility, { as: 'origin', foreignKey: 'origin_facility_id' });
LogisticsRoute.belongsTo(Facility, { as: 'destination', foreignKey: 'destination_facility_id' });

ForecastResult.belongsTo(Region, { foreignKey: 'region_id' });
Region.hasMany(ForecastResult, { foreignKey: 'region_id' });

SustainabilityScore.belongsTo(Region, { foreignKey: 'region_id' });
Region.hasMany(SustainabilityScore, { foreignKey: 'region_id' });

Recommendation.belongsTo(Region, { foreignKey: 'region_id' });
Region.hasMany(Recommendation, { foreignKey: 'region_id' });
Recommendation.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Recommendation, { foreignKey: 'user_id' });

InventoryItem.belongsTo(Assessment, { foreignKey: 'assessment_id' });
Assessment.hasOne(InventoryItem, { foreignKey: 'assessment_id' });
InventoryItem.belongsTo(Facility, { foreignKey: 'facility_id' });
Facility.hasMany(InventoryItem, { foreignKey: 'facility_id' });
InventoryItem.belongsTo(User, { as: 'receiver', foreignKey: 'received_by' });

InventoryMovement.belongsTo(InventoryItem, { foreignKey: 'inventory_item_id' });
InventoryMovement.belongsTo(Assessment, { foreignKey: 'assessment_id' });
InventoryMovement.belongsTo(User, { as: 'performer', foreignKey: 'performed_by' });

AnalysisResult.belongsTo(Assessment, { foreignKey: 'assessment_id' });
Assessment.hasOne(AnalysisResult, { foreignKey: 'assessment_id' });
AnalysisResult.belongsTo(User, { as: 'analyser', foreignKey: 'analysed_by' });

module.exports = {
  User, Region, Facility, LogisticsRoute, ProductCatalog,
  Assessment, AssessmentImage, AssessmentDetail, ActivityLog, Notification,
  ForecastData, ForecastResult, SustainabilityScore, Recommendation,
  InventoryItem, InventoryMovement, AnalysisResult,
};
