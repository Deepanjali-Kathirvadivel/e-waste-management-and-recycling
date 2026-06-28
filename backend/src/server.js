const app = require('./app');
const sequelize = require('./config/database');
const whatsapp = require('./services/whatsapp.service');

const PORT = process.env.PORT || 5400;

async function start() {
  try {
    await sequelize.sync();
    console.log('Database connected & synced');

    whatsapp.init().then((ready) => {
      if (ready) {
        console.log('[WhatsApp] OTP delivery via WhatsApp is active.');
      } else {
        console.log('[WhatsApp] WhatsApp client not available. OTPs will use SMS fallback.');
      }
    });

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
