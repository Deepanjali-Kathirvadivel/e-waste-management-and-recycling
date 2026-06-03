const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const { auditLog } = require('./middleware/audit');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/reports', express.static(path.join(__dirname, 'reports')));

const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

const authRoutes = require('./routes/authRoutes');
const staffRoutes = require('./routes/staffRoutes');
const adminRoutes = require('./routes/adminRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const reusabilityRoutes = require('./routes/reusabilityRoutes');
const regionRoutes = require('./routes/regionRoutes');
const forecastRoutes = require('./routes/forecastRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const logisticsRoutes = require('./routes/logisticsRoutes');
const sustainabilityRoutes = require('./routes/sustainabilityRoutes');
const profitRoutes = require('./routes/profitRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const searchRoutes = require('./routes/searchRoutes');
const productRoutes = require('./routes/productRoutes');
const scenarioSimulationRoutes = require('./routes/scenarioSimulationRoutes');
const environmentalImpactRoutes = require('./routes/environmentalImpactRoutes');

app.use('/api/auth', auditLog('auth'), authRoutes);
app.use('/api/admin/staff', auditLog('staff'), staffRoutes);
app.use('/api/admin', auditLog('admin'), adminRoutes);
app.use('/api/assessments', auditLog('assessment'), assessmentRoutes);
app.use('/api/reusability', auditLog('reusability'), reusabilityRoutes);
app.use('/api/regions', auditLog('region'), regionRoutes);
app.use('/api/forecast', auditLog('forecast'), forecastRoutes);
app.use('/api/facilities', auditLog('facility'), facilityRoutes);
app.use('/api/logistics', auditLog('logistics'), logisticsRoutes);
app.use('/api/sustainability', auditLog('sustainability'), sustainabilityRoutes);
app.use('/api/profit', auditLog('profit'), profitRoutes);
app.use('/api/recommendations', auditLog('recommendation'), recommendationRoutes);
app.use('/api/reports', auditLog('report'), reportRoutes);
app.use('/api/notifications', auditLog('notification'), notificationRoutes);
app.use('/api/audit-logs', auditLog('audit'), auditLogRoutes);
app.use('/api/search', auditLog('search'), searchRoutes);
app.use('/api/products', auditLog('product'), productRoutes);
app.use('/api/scenario-simulations', auditLog('scenario_simulation'), scenarioSimulationRoutes);
app.use('/api/environmental-impact', auditLog('environmental_impact'), environmentalImpactRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Frontend-compatible route aliases
const authController = require('./controllers/authController');
const { authenticateToken } = require('./middleware/auth');
app.post('/api/admin/login', (req, res, next) => authController.adminLogin(req, res, next));
app.get('/api/profile', authenticateToken, (req, res, next) => authController.me(req, res, next));
app.put('/api/profile', authenticateToken, (req, res, next) => authController.updateProfile(req, res, next));
app.put('/api/profile/change-password', authenticateToken, (req, res, next) => authController.changePassword(req, res, next));

app.use(errorHandler);

module.exports = app;
