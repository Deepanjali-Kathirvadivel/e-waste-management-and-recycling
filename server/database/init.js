const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function initializeDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '1234'
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'greenera_db'}\``);
    await connection.query(`USE \`${process.env.DB_NAME || 'greenera_db'}\``);

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const statements = schema.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
        } catch (err) {
          console.error(`Error executing: ${statement.substring(0, 80)}...`);
          console.error(err.message);
        }
      }
    }

    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    await connection.query(
      `UPDATE admins SET password = ? WHERE username = 'admin'`,
      [hashedPassword]
    );

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

initializeDatabase();
