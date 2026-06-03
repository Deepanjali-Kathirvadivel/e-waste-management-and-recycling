const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { loginValidator, changePasswordValidator } = require('../validators/authValidator');
const { updateProfileValidator } = require('../validators/profileValidator');
const { validate } = require('../middleware/validate');

router.post('/admin/login', loginValidator, validate, (req, res, next) => authController.adminLogin(req, res, next));
router.post('/login', loginValidator, validate, (req, res, next) => authController.staffLogin(req, res, next));
router.get('/me', authenticateToken, (req, res, next) => authController.me(req, res, next));
router.post('/change-password', authenticateToken, changePasswordValidator, validate, (req, res, next) => authController.changePassword(req, res, next));
router.put('/profile', authenticateToken, updateProfileValidator, validate, (req, res, next) => authController.updateProfile(req, res, next));
router.post('/refresh-token', (req, res, next) => authController.refreshToken(req, res, next));
router.post('/logout', authenticateToken, (req, res, next) => authController.logout(req, res, next));

module.exports = router;
