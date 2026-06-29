const router = require('express').Router();
const ctrl = require('../../controllers/auth.controller');
const { auth } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { loginSchema, forgotPasswordSchema } = require('../../validators/auth.validator');

router.post('/login', validate(loginSchema), ctrl.login);
router.post('/admin-login', validate(loginSchema), ctrl.adminLogin);
router.post('/forgot-password', validate(forgotPasswordSchema), ctrl.forgotPassword);
router.get('/me', auth, ctrl.me);
router.post('/logout', auth, ctrl.logout);

module.exports = { route: '/auth', router };
