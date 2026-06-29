const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');
const AppError = require('../utils/AppError');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next(new AppError('No token provided', 401));
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        { association: 'region', attributes: ['id', 'name'] },
        { association: 'facility', attributes: ['id', 'name'] },
      ],
    });
    if (!user || !user.is_active) {
      return next(new AppError('User not found or inactive', 401));
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token expired, please login again', 401));
    }
    return next(new AppError('Invalid or expired token', 401));
  }
};

const rbac = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('Insufficient permissions', 403));
  }
  next();
};

module.exports = { auth, rbac };
