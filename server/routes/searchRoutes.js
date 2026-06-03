const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res, next) => searchController.globalSearch(req, res, next));

module.exports = router;
