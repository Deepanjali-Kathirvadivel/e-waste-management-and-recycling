const authService = require('../services/authService');

class AuthController {
  async adminLogin(req, res, next) {
    try {
      const { username, password } = req.body;
      const result = await authService.adminLogin(username, password);
      res.json(result);
    } catch (err) {
      if (err.message === 'Invalid credentials' || err.message === 'Account is inactive') {
        return res.status(401).json({ message: err.message });
      }
      next(err);
    }
  }

  async staffLogin(req, res, next) {
    try {
      const { username, password } = req.body;
      const result = await authService.staffLogin(username, password);
      res.json(result);
    } catch (err) {
      if (err.message === 'Invalid credentials' || err.message === 'Account is inactive or suspended') {
        return res.status(401).json({ message: err.message });
      }
      next(err);
    }
  }

  async me(req, res, next) {
    try {
      const profile = await authService.getProfile(req.user.id, req.user.userType);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user.id, req.user.userType, currentPassword, newPassword);
      res.json(result);
    } catch (err) {
      if (err.message === 'User not found' || err.message === 'Current password is incorrect') {
        return res.status(400).json({ message: err.message });
      }
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const profile = await authService.updateProfile(req.user.id, req.user.userType, req.body);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { userId, userType } = req.body;
      const token = await authService.refreshAccessToken(userId, userType);
      res.json({ token });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res) {
    res.json({ message: 'Logged out successfully' });
  }
}

module.exports = new AuthController();
