const ReusabilityRepository = require('../repositories/reusabilityRepository');
const pool = require('../config/db');

const reusabilityRepo = new ReusabilityRepository();

class ReusabilityService {
  async getAll(filters) {
    return await reusabilityRepo.getReusabilityList(filters);
  }

  async getById(id) {
    const [rows] = await pool.query(`
      SELECT rs.*, a.assessment_code, p.*, s.full_name as staff_name, r.name as region_name
      FROM reusability_scores rs
      JOIN assessments a ON rs.assessment_id = a.id
      LEFT JOIN products p ON a.product_id = p.id
      LEFT JOIN staff s ON a.staff_id = s.id
      LEFT JOIN regions r ON a.region_id = r.id
      WHERE rs.id = ?
    `, [id]);
    if (!rows[0]) throw new Error('Reusability record not found');
    return rows[0];
  }

  async getAnalytics(filters) {
    const breakdown = await reusabilityRepo.getAnalytics(filters);
    const byProduct = await reusabilityRepo.getBreakdownByProduct();
    const trend = await reusabilityRepo.getMonthlyTrend();
    const total = breakdown.reduce((sum, item) => sum + item.count, 0);

    const percentages = {};
    breakdown.forEach(item => {
      percentages[item.classification] = total > 0 ? Math.round((item.count / total) * 100) : 0;
    });

    const revenuePotential = breakdown.reduce((sum, item) => sum + parseFloat(item.total_value), 0);

    const byRegion = await pool.query(`
      SELECT r.name as region,
        COALESCE(SUM(CASE WHEN rs.classification = 'Reusable' THEN 1 ELSE 0 END), 0) as reusable,
        COALESCE(SUM(CASE WHEN rs.classification = 'Repairable' THEN 1 ELSE 0 END), 0) as repairable,
        COALESCE(SUM(CASE WHEN rs.classification = 'Recyclable' THEN 1 ELSE 0 END), 0) as recyclable,
        COALESCE(SUM(CASE WHEN rs.classification = 'Scrap' THEN 1 ELSE 0 END), 0) as scrap
      FROM reusability_scores rs
      JOIN assessments a ON rs.assessment_id = a.id
      RIGHT JOIN regions r ON a.region_id = r.id
      GROUP BY r.id, r.name
    `);

    return {
      breakdown,
      percentages,
      byProduct,
      trend,
      revenuePotential,
      total,
      byRegion: byRegion[0]
    };
  }
}

module.exports = new ReusabilityService();
