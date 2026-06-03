const LogisticsRepository = require('../repositories/logisticsRepository');
const pool = require('../config/db');

const logisticsRepo = new LogisticsRepository();

class LogisticsService {
  async getAll(filters = {}) {
    let sql = 'SELECT * FROM logistics_data WHERE 1=1';
    const params = [];

    if (filters.region_id) { sql += ' AND region_id = ?'; params.push(filters.region_id); }
    if (filters.status) { sql += ' AND status = ?'; params.push(filters.status); }
    sql += ' ORDER BY route_name';

    return await pool.query(sql, params);
  }

  async getById(id) {
    const route = await logisticsRepo.findById(id);
    if (!route) throw new Error('Route not found');
    return route;
  }

  async create(data) {
    const totalCost = (parseFloat(data.fuel_cost) || 0) +
      (parseFloat(data.driver_cost) || 0) +
      (parseFloat(data.vehicle_cost) || 0) +
      (parseFloat(data.maintenance_cost) || 0);
    return await logisticsRepo.create({ ...data, total_cost: totalCost });
  }

  async update(id, data) {
    const route = await logisticsRepo.findById(id);
    if (!route) throw new Error('Route not found');

    const fields = ['fuel_cost', 'driver_cost', 'vehicle_cost', 'maintenance_cost'];
    let totalCost = 0;
    for (const f of fields) {
      totalCost += parseFloat(data[f] !== undefined ? data[f] : route[f]) || 0;
    }
    data.total_cost = totalCost;

    await logisticsRepo.update(id, data);
    return await logisticsRepo.findById(id);
  }

  async delete(id) {
    await logisticsRepo.delete(id);
    return { message: 'Route deleted successfully' };
  }

  async getTotalCosts() {
    return await logisticsRepo.getTotalCosts();
  }

  async getAnalytics() {
    const [summary] = await pool.query(`
      SELECT COUNT(*) as total_routes,
        COALESCE(SUM(distance), 0) as total_distance,
        COALESCE(AVG(distance), 0) as avg_distance,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(AVG(total_cost), 0) as avg_cost_per_route,
        COALESCE(SUM(total_cost) / NULLIF(SUM(distance), 0), 0) as cost_per_km
      FROM logistics_data WHERE status = 'active'
    `);

    const [byRegion] = await pool.query(`
      SELECT r.name as region, COUNT(*) as route_count, COALESCE(SUM(l.total_cost), 0) as total_cost
      FROM logistics_data l
      JOIN regions r ON l.region_id = r.id
      WHERE l.status = 'active'
      GROUP BY r.id, r.name
    `);

    return {
      summary: summary[0],
      byRegion
    };
  }
}

module.exports = new LogisticsService();
