const User = require('./User');
const Region = require('./Region');
const Facility = require('./Facility');
const LogisticsRoute = require('./LogisticsRoute');
const ProductCatalog = require('./ProductCatalog');
const Assessment = require('./Assessment');
const AssessmentImage = require('./AssessmentImage');
const AssessmentDetail = require('./AssessmentDetail');
const ActivityLog = require('./ActivityLog');
const ForecastData = require('./ForecastData');
const ForecastResult = require('./ForecastResult');
const SustainabilityScore = require('./SustainabilityScore');
const Recommendation = require('./Recommendation');

User.belongsTo(Region, { foreignKey: 'region_id' });
Region.hasMany(User, { foreignKey: 'region_id' });

Assessment.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Assessment, { foreignKey: 'user_id' });
Assessment.belongsTo(User, { as: 'approver', foreignKey: 'approved_by' });
Assessment.belongsTo(ProductCatalog, { foreignKey: 'product_type_id' });
ProductCatalog.hasMany(Assessment, { foreignKey: 'product_type_id' });
Assessment.belongsTo(Facility, { as: 'destination', foreignKey: 'destination_id' });

Assessment.hasMany(AssessmentImage, { foreignKey: 'assessment_id' });
AssessmentImage.belongsTo(Assessment, { foreignKey: 'assessment_id' });

Assessment.hasOne(AssessmentDetail, { foreignKey: 'assessment_id' });
AssessmentDetail.belongsTo(Assessment, { foreignKey: 'assessment_id' });

ActivityLog.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(ActivityLog, { foreignKey: 'user_id' });

ForecastData.belongsTo(User, { foreignKey: 'uploaded_by' });

Facility.belongsTo(Region, { foreignKey: 'region_id' });
Region.hasMany(Facility, { foreignKey: 'region_id' });

LogisticsRoute.belongsTo(Facility, { as: 'origin', foreignKey: 'origin_facility_id' });
LogisticsRoute.belongsTo(Facility, { as: 'destination', foreignKey: 'destination_facility_id' });

ForecastResult.belongsTo(Region, { foreignKey: 'region_id' });
Region.hasMany(ForecastResult, { foreignKey: 'region_id' });

SustainabilityScore.belongsTo(Region, { foreignKey: 'region_id' });
Region.hasMany(SustainabilityScore, { foreignKey: 'region_id' });

module.exports = {
  User, Region, Facility, LogisticsRoute, ProductCatalog,
  Assessment, AssessmentImage, AssessmentDetail, ActivityLog,
  ForecastData, ForecastResult, SustainabilityScore, Recommendation,
};
