const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'greenera_db',
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
  });

  const hash = await bcrypt.hash('Admin@123', 10);
  console.log('Generated hash:', hash);

  await pool.query("DELETE FROM admins WHERE username = 'admin'");
  await pool.query("INSERT INTO admins (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)",
    ['admin', 'admin@greenera.com', hash, 'System Admin', 'super_admin']);
  console.log('Admin user created (admin / Admin@123)');

  await pool.query("DELETE FROM staff WHERE username = 'staff'");
  await pool.query("INSERT INTO staff (username, email, password, full_name, role, region_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ['staff', 'staff@greenera.com', hash, 'Staff User', 'assessor', 1, 'active']);
  console.log('Staff user created (staff / Admin@123)');

  await pool.end();
  console.log('Done! Restart the server and login.');
}

seed().catch(err => { console.error(err); process.exit(1); });
