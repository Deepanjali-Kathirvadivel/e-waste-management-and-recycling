const BaseRepository = require('./baseRepository');

class LogisticsRepository extends BaseRepository {
  constructor() {
    super('logistics_data');
  }

  async getTotalCosts() {
    const [result] = await this.query(
      'SELECT COALESCE(SUM(fuel_cost), 0) as total_fuel, COALESCE(SUM(driver_cost), 0) as total_driver, COALESCE(SUM(vehicle_cost), 0) as total_vehicle, COALESCE(SUM(maintenance_cost), 0) as total_maintenance, COALESCE(SUM(total_cost), 0) as grand_total FROM logistics_data WHERE status = ?',
      ['active']
    );
    return result[0];
  }
}

module.exports = LogisticsRepository;
