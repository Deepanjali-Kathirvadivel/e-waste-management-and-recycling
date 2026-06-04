require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const routes = require('./routes');
const AppError = require('./utils/AppError');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Serve frontend static files
app.use(express.static(path.resolve(__dirname, '../../frontend')));

app.use('/api', routes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/product-types', async (req, res) => {
  const { ProductCatalog } = require('./models');
  const types = await ProductCatalog.findAll({ order: [['name', 'ASC']] });
  res.json({ types });
});

app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  if (process.env.NODE_ENV !== 'production') console.error(err);
  res.status(statusCode).json({ error: message, status: statusCode });
});

module.exports = app;
