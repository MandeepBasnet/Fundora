const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getBackerDashboard, getCreatorDashboard } = require('../controllers/dashboardController');

// @route   GET /api/dashboard/backer
// @desc    Get aggregated data for backer dashboard
// @access  Private (Backer)
router.get('/backer', protect, authorize('backer', 'creator', 'admin'), getBackerDashboard);

// @route   GET /api/dashboard/creator
// @desc    Get aggregated data for creator dashboard
// @access  Private (Creator)
router.get('/creator', protect, authorize('creator'), getCreatorDashboard);

module.exports = router;
