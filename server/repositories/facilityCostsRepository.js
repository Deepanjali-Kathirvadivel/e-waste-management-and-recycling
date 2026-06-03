const BaseRepository = require('./baseRepository');

class FacilityCostsRepository extends BaseRepository {
  constructor() {
    super('facility_costs');
  }

  async getByFacility(facilityType, facilityId) {
    const [rows] = await this.query(
      'SELECT * FROM facility_costs WHERE facility_type = ? AND facility_id = ? ORDER BY recorded_at DESC',
      [facilityType, facilityId]
    );
    return rows;
  }

  async getByRegionViaFacilities(regionId) {
    const [rows] = await this.query(`
      SELECT fc.*, 
        CASE WHEN fc.facility_type = 'collection_center' THEN cc.name 
             WHEN fc.facility_type = 'preprocessing_center' THEN pc.name 
        END as facility_name
      FROM facility_costs fc
      LEFT JOIN collection_centers cc ON fc.facility_type = 'collection_center' AND fc.facility_id = cc.id
      LEFT JOIN preprocessing_centers pc ON fc.facility_type = 'preprocessing_center' AND fc.facility_id = pc.id
      WHERE cc.region_id = ? OR pc.region_id = ?
      ORDER BY fc.recorded_at DESC
    `, [regionId, regionId]);
    return rows;
  }

  async getTotalCostsByType(facilityType) {
    const [result] = await this.query(
      'SELECT cost_type, COALESCE(SUM(amount), 0) as total_amount FROM facility_costs WHERE facility_type = ? GROUP BY cost_type',
      [facilityType]
    );
    return result;
  }

  async getAggregates(period = 'monthly') {
    const [result] = await this.query(
      'SELECT facility_type, COALESCE(SUM(amount), 0) as total_cost, COUNT(*) as record_count, AVG(amount) as avg_cost FROM facility_costs WHERE period = ? GROUP BY facility_type',
      [period]
    );
    return result;
  }

  async getMonthlyTrend() {
    const [rows] = await this.query(`
      SELECT DATE_FORMAT(recorded_at, '%Y-%m') as month, facility_type, COALESCE(SUM(amount), 0) as total_cost
      FROM facility_costs
      WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY month, facility_type ORDER BY month
    `);
    return rows;
  }
}

module.exports = FacilityCostsRepository;
