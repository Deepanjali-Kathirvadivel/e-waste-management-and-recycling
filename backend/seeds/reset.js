require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const sequelize = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function reset() {
  const dbPath = path.resolve(__dirname, '../data/database.sqlite');
  try {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('Deleted existing database file');
    }
  } catch (err) {
    console.log('No existing database file found');
  }
  console.log('Run "npm run seed" to recreate database with demo data');
  process.exit(0);
}

reset();
