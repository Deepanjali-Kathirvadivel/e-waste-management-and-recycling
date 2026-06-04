module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'green_era_jwt_secret_key_2024_secure',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
};
