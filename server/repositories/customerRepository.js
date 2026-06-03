const BaseRepository = require('./baseRepository');

class CustomerRepository extends BaseRepository {
  constructor() {
    super('customers');
  }

  async search(query) {
    const [rows] = await this.query(
      'SELECT * FROM customers WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?',
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    return rows;
  }
}

module.exports = CustomerRepository;
