const { CollectionCenterRepository, PreprocessingCenterRepository } = require('../repositories/facilityRepository');
const FacilityCostsRepository = require('../repositories/facilityCostsRepository');
const pool = require('../config/db');

const centerRepo = new CollectionCenterRepository();
const unitRepo = new PreprocessingCenterRepository();
const costsRepo = new FacilityCostsRepository();

class FacilityService {
  async getAllCenters(filters = {}) {
    let sql = 'SELECT cc.*, r.name as region_name FROM collection_centers cc LEFT JOIN regions r ON cc.region_id = r.id WHERE 1=1';
    const params = [];
    if (filters.region_id) { sql += ' AND cc.region_id = ?'; params.push(filters.region_id); }
    if (filters.status) { sql += ' AND cc.status = ?'; params.push(filters.status); }
    sql += ' ORDER BY cc.name';
    return await pool.query(sql, params);
  }

  async getCenterById(id) {
    const [rows] = await pool.query(
      'SELECT cc.*, r.name as region_name FROM collection_centers cc LEFT JOIN regions r ON cc.region_id = r.id WHERE cc.id = ?',
      [id]
    );
    if (!rows[0]) throw new Error('Collection center not found');
    return rows[0];
  }

  async createCenter(data) {
    return await centerRepo.create(data);
  }

  async updateCenter(id, data) {
    const center = await centerRepo.findById(id);
    if (!center) throw new Error('Collection center not found');
    await centerRepo.update(id, data);
    return await this.getCenterById(id);
  }

  async deleteCenter(id) {
    await centerRepo.delete(id);
    return { message: 'Collection center deleted' };
  }

  async getAllUnits(filters = {}) {
    let sql = 'SELECT pc.*, r.name as region_name FROM preprocessing_centers pc LEFT JOIN regions r ON pc.region_id = r.id WHERE 1=1';
    const params = [];
    if (filters.region_id) { sql += ' AND pc.region_id = ?'; params.push(filters.region_id); }
    if (filters.status) { sql += ' AND pc.status = ?'; params.push(filters.status); }
    sql += ' ORDER BY pc.name';
    return await pool.query(sql, params);
  }

  async getUnitById(id) {
    const [rows] = await pool.query(
      'SELECT pc.*, r.name as region_name FROM preprocessing_centers pc LEFT JOIN regions r ON pc.region_id = r.id WHERE pc.id = ?',
      [id]
    );
    if (!rows[0]) throw new Error('Preprocessing unit not found');
    return rows[0];
  }

  async createUnit(data) {
    return await unitRepo.create(data);
  }

  async updateUnit(id, data) {
    const unit = await unitRepo.findById(id);
    if (!unit) throw new Error('Preprocessing unit not found');
    await unitRepo.update(id, data);
    return await this.getUnitById(id);
  }

  async deleteUnit(id) {
    await unitRepo.delete(id);
    return { message: 'Preprocessing unit deleted' };
  }

  async getAnalytics() {
    const [centerSummary] = await pool.query(`
      SELECT COUNT(*) as total, COALESCE(AVG((current_load / NULLIF(capacity, 0)) * 100), 0) as avg_utilization,
        COALESCE(SUM(rent), 0) as total_rent, COALESCE(SUM(electricity_cost), 0) as total_electricity,
        COALESCE(SUM(labor_cost), 0) as total_labor, COALESCE(SUM(staff_count), 0) as total_staff
      FROM collection_centers WHERE status = 'active'
    `);

    const [unitSummary] = await pool.query(`
      SELECT COUNT(*) as total, COALESCE(AVG((current_load / NULLIF(processing_capacity, 0)) * 100), 0) as avg_utilization,
        COALESCE(SUM(rent), 0) as total_rent, COALESCE(SUM(electricity_cost), 0) as total_electricity,
        COALESCE(SUM(labor_cost), 0) as total_labor, COALESCE(SUM(equipment_cost), 0) as total_equipment,
        COALESCE(SUM(staff_count), 0) as total_staff
      FROM preprocessing_centers WHERE status = 'active'
    `);

    const costTrend = await costsRepo.getMonthlyTrend();

    return {
      centers: centerSummary[0],
      units: unitSummary[0],
      costTrend
    };
  }

  async getCenterCosts(centerId) {
    return await costsRepo.getByFacility('collection_center', centerId);
  }

  async addCenterCost(centerId, data) {
    const center = await centerRepo.findById(centerId);
    if (!center) throw new Error('Collection center not found');
    return await costsRepo.create({
      facility_type: 'collection_center',
      facility_id: centerId,
      cost_type: data.cost_type || 'general',
      amount: data.amount || 0,
      period: data.period || 'monthly',
      recorded_at: data.recorded_at || new Date()
    });
  }

  async getUnitCosts(unitId) {
    return await costsRepo.getByFacility('preprocessing_center', unitId);
  }

  async addUnitCost(unitId, data) {
    const unit = await unitRepo.findById(unitId);
    if (!unit) throw new Error('Preprocessing unit not found');
    return await costsRepo.create({
      facility_type: 'preprocessing_center',
      facility_id: unitId,
      cost_type: data.cost_type || 'general',
      amount: data.amount || 0,
      period: data.period || 'monthly',
      recorded_at: data.recorded_at || new Date()
    });
  }
}

module.exports = new FacilityService();
