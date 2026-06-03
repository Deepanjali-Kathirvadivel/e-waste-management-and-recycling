const BaseRepository = require('./baseRepository');

class SalesDataRepository extends BaseRepository {
  constructor() {
    super('sales_data');
  }

  async getByRegion(regionId) {
    const [rows] = await this.query(
      'SELECT * FROM sales_data WHERE region_id = ? ORDER BY sale_date',
      [regionId]
    );
    return rows;
  }

  async getByRegionAndYear(regionId, year) {
    const [rows] = await this.query(
      "SELECT * FROM sales_data WHERE region_id = ? AND YEAR(sale_date) = ?",
      [regionId, year]
    );
    return rows;
  }

  async getAggregatesByRegion(regionId) {
    const [result] = await this.query(
      'SELECT COALESCE(SUM(quantity), 0) as total_quantity, COALESCE(SUM(revenue), 0) as total_revenue, COALESCE(AVG(revenue / NULLIF(quantity, 0)), 0) as avg_unit_price, COUNT(*) as record_count FROM sales_data WHERE region_id = ?',
      [regionId]
    );
    return result;
  }

  async getYearlyTrend(regionId) {
    const [rows] = await this.query(
      'SELECT YEAR(sale_date) as year, COALESCE(SUM(quantity), 0) as total_quantity, COALESCE(SUM(revenue), 0) as total_revenue FROM sales_data WHERE region_id = ? GROUP BY YEAR(sale_date) ORDER BY year',
      [regionId]
    );
    return rows;
  }

  async getProductTypeBreakdown(regionId) {
    const [rows] = await this.query(
      'SELECT product_type, COALESCE(SUM(quantity), 0) as total_quantity, COALESCE(SUM(revenue), 0) as total_revenue FROM sales_data WHERE region_id = ? GROUP BY product_type ORDER BY total_revenue DESC',
      [regionId]
    );
    return rows;
  }

  async bulkInsert(records) {
    if (!records.length) return 0;
    const placeholders = records.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const values = records.flatMap(r => [r.region_id, r.product_type, r.quantity, r.revenue, r.sale_date]);
    const [result] = await this.query(
      `INSERT INTO sales_data (region_id, product_type, quantity, revenue, sale_date) VALUES ${placeholders}`,
      values
    );
    return result.affectedRows;
  }
}

module.exports = SalesDataRepository;
