const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Import route modules
const authRoutes = require('./auth');
const propertyRoutes = require('./properties');
const bidRoutes = require('./bids');
const userRoutes = require('./users');
const searchRoutes = require('./search');
const uploadRoutes = require('./uploads');

// Mount routes
router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/bids', authenticateToken, bidRoutes);
router.use('/users', userRoutes);
router.use('/search', searchRoutes);
router.use('/uploads', authenticateToken, uploadRoutes);

module.exports = router;