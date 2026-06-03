const BaseRepository = require('./baseRepository');

class ProductRepository extends BaseRepository {
  constructor() {
    super('products');
  }

  async getCatalog() {
    const [rows] = await this.query('SELECT * FROM products WHERE status = ? ORDER BY name', ['active']);
    return rows;
  }

  async getByType(type) {
    const [rows] = await this.query('SELECT * FROM products WHERE type = ? AND status = ?', [type, 'active']);
    return rows;
  }

  async search(query) {
    const [rows] = await this.query(
      'SELECT * FROM products WHERE name LIKE ? OR brand LIKE ? OR model LIKE ?',
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    return rows;
  }
}

module.exports = ProductRepository;
