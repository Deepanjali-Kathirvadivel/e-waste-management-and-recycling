const RegionRepository = require('../repositories/regionRepository');
const SalesDataRepository = require('../repositories/salesDataRepository');
const AssessmentRepository = require('../repositories/assessmentRepository');
const pool = require('../config/db');

const regionRepo = new RegionRepository();
const salesRepo = new SalesDataRepository();
const assessmentRepo = new AssessmentRepository();

class RegionService {
  async getAll() {
    return await regionRepo.findAll({ orderBy: 'name' });
  }

  async getById(id) {
    const region = await regionRepo.findById(id);
    if (!region) throw new Error('Region not found');
    return region;
  }

  async create(data) {
    const existing = await regionRepo.findByCode(data.code);
    if (existing) throw new Error('Region code already exists');
    return await regionRepo.create(data);
  }

  async update(id, data) {
    const region = await regionRepo.findById(id);
    if (!region) throw new Error('Region not found');
    await regionRepo.update(id, data);
    return await regionRepo.findById(id);
  }

  async delete(id) {
    const region = await regionRepo.findById(id);
    if (!region) throw new Error('Region not found');
    await regionRepo.delete(id);
    return { message: 'Region deleted successfully' };
  }

  async getSummary() {
    const result = await regionRepo.getSummary();
    return Array.isArray(result) ? result[0] : result;
  }

  async getStats(id) {
    const region = await regionRepo.findById(id);
    if (!region) throw new Error('Region not found');

    const assessments = await assessmentRepo.query(
      `SELECT COUNT(*) as total, COALESCE(SUM(suggested_value), 0) as total_value, COALESCE(AVG(suggested_value), 0) as avg_value FROM assessments WHERE region_id = ?`,
      [id]
    );

    const centers = await pool.query(
      'SELECT COUNT(*) as total, COALESCE(AVG((current_load / NULLIF(capacity, 0)) * 100), 0) as avg_utilization FROM collection_centers WHERE region_id = ?',
      [id]
    );

    const reusability = await pool.query(`
      SELECT rs.classification, COUNT(*) as count
      FROM reusability_scores rs
      JOIN assessments a ON rs.assessment_id = a.id
      WHERE a.region_id = ?
      GROUP BY rs.classification
    `, [id]);

    return {
      region_id: id,
      region_name: region.name,
      assessments: {
        total: assessments[0].total,
        total_value: assessments[0].total_value,
        avg_value: assessments[0].avg_value
      },
      collection_centers: {
        total: centers[0].total,
        avg_utilization: Math.round(centers[0].avg_utilization)
      },
      reusability_breakdown: reusability
    };
  }
}

module.exports = new RegionService();
