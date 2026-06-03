const pool = require('../config/db');

class BaseRepository {
  constructor(tableName) {
    this.table = tableName;
  }

  async findAll(options = {}) {
    let sql = `SELECT * FROM ${this.table} WHERE 1=1`;
    const params = [];

    if (options.where) {
      for (const [key, value] of Object.entries(options.where)) {
        sql += ` AND ${key} = ?`;
        params.push(value);
      }
    }

    if (options.search && options.searchFields) {
      const searchConditions = options.searchFields.map(f => `${f} LIKE ?`).join(' OR ');
      sql += ` AND (${searchConditions})`;
      options.searchTerms.forEach(() => params.push(`%${options.search}%`));
    }

    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy} ${options.orderDir || 'ASC'}`;
    }

    if (options.limit) {
      sql += ` LIMIT ?`;
      params.push(options.limit);
      if (options.offset) {
        sql += ` OFFSET ?`;
        params.push(options.offset);
      }
    }

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.query(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.join(', ');
    const [result] = await pool.query(
      `INSERT INTO ${this.table} (${columns}) VALUES (${placeholders})`,
      values
    );
    return { id: result.insertId, ...data };
  }

  async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const [result] = await pool.query(
      `UPDATE ${this.table} SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    return result.affectedRows > 0;
  }

  async delete(id) {
    const [result] = await pool.query(`DELETE FROM ${this.table} WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  async count(options = {}) {
    let sql = `SELECT COUNT(*) as total FROM ${this.table} WHERE 1=1`;
    const params = [];
    if (options.where) {
      for (const [key, value] of Object.entries(options.where)) {
        sql += ` AND ${key} = ?`;
        params.push(value);
      }
    }
    const [rows] = await pool.query(sql, params);
    return rows[0].total;
  }

  async paginate(options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT * FROM ${this.table} ORDER BY ${options.orderBy || 'created_at'} ${options.orderDir || 'DESC'} LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const total = await this.count({ where: options.where });

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async query(sql, params = []) {
    return await pool.query(sql, params);
  }
}

module.exports = BaseRepository;
