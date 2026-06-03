const pool = require('../config/db');

const auditLog = (module) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async function (body) {
      const userId = req.user ? req.user.id : null;
      const userType = req.user ? req.user.userType : 'staff';
      const username = req.user ? req.user.username : 'anonymous';
      const action = `${req.method} ${req.originalUrl}`;
      const ip = req.ip || req.connection.remoteAddress;

      try {
        await pool.query(
          `INSERT INTO audit_logs (user_id, user_type, username, action, module, description, ip_address, user_agent, metadata)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId, userType, username, action, module,
            JSON.stringify({ method: req.method, params: req.params, query: req.query }),
            ip, req.headers['user-agent'] || null,
            JSON.stringify({ statusCode: res.statusCode })
          ]
        );
      } catch (err) {
        console.error('Audit log error:', err.message);
      }

      return originalJson(body);
    };
    next();
  };
};

module.exports = { auditLog };
