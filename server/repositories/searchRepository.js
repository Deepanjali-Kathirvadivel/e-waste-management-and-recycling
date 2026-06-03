const pool = require('../config/db');

class SearchRepository {
  async globalSearch(query, typeFilter = null) {
    const searchTerm = `%${query}%`;
    const results = {};

    const queries = {
      products: typeFilter && typeFilter !== 'product' ? null :
        "SELECT id, name as title, 'product' as type, type as subtype FROM products WHERE name LIKE ? OR brand LIKE ? LIMIT 5",
      assessments: typeFilter && typeFilter !== 'assessment' ? null :
        "SELECT a.id, a.assessment_code as title, 'assessment' as type, a.status as subtype FROM assessments a WHERE a.assessment_code LIKE ? LIMIT 5",
      staff: typeFilter && typeFilter !== 'staff' ? null :
        "SELECT id, full_name as title, 'staff' as type, role as subtype FROM staff WHERE full_name LIKE ? OR username LIKE ? LIMIT 5",
      regions: typeFilter && typeFilter !== 'region' ? null :
        "SELECT id, name as title, 'region' as type FROM regions WHERE name LIKE ? LIMIT 5",
      customers: typeFilter && typeFilter !== 'customer' ? null :
        "SELECT id, name as title, 'customer' as type FROM customers WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? LIMIT 5",
      recommendations: typeFilter && typeFilter !== 'recommendation' ? null :
        "SELECT id, title, 'recommendation' as type FROM recommendations WHERE title LIKE ? OR description LIKE ? LIMIT 5",
      facilities: typeFilter && typeFilter !== 'facility' ? null :
        "SELECT id, name as title, 'facility' as type, type as subtype FROM collection_centers WHERE name LIKE ? LIMIT 5",
      logistics: typeFilter && typeFilter !== 'logistics' ? null :
        "SELECT id, route_name as title, 'logistics' as type FROM logistics_data WHERE route_name LIKE ? LIMIT 5"
    };

    for (const [key, sql] of Object.entries(queries)) {
      if (!sql) continue;
      const [rows] = await pool.query(sql, [searchTerm, searchTerm]);
      results[key] = rows;
    }

    const [counts] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM products WHERE name LIKE ? OR brand LIKE ?) as products,
        (SELECT COUNT(*) FROM assessments WHERE assessment_code LIKE ?) as assessments,
        (SELECT COUNT(*) FROM staff WHERE full_name LIKE ? OR username LIKE ?) as staff,
        (SELECT COUNT(*) FROM regions WHERE name LIKE ?) as regions,
        (SELECT COUNT(*) FROM customers WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?) as customers,
        (SELECT COUNT(*) FROM recommendations WHERE title LIKE ? OR description LIKE ?) as recommendations,
        (SELECT COUNT(*) FROM collection_centers WHERE name LIKE ?) as facilities,
        (SELECT COUNT(*) FROM logistics_data WHERE route_name LIKE ?) as logistics
    `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);

    results._counts = counts[0];

    return results;
  }
}

module.exports = SearchRepository;
