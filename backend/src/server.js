const app = require('./app');
const sequelize = require('./config/database');

const PORT = process.env.PORT || 5400;

async function start() {
  try {
    await sequelize.sync();
    console.log('Database connected & synced');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
