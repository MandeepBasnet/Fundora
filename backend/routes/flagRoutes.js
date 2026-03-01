const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');
const {
  createFlag,
  getAdminFlags,
  resolveFlag,
  getAdminUserFlagStats,
  getAdminCampaignFlagStats,
  restoreCampaign
} = require('../controllers/flagController');

// @route   POST /api/flags
// @desc    Submit a new flag/report for a campaign
// @access  Private
router.post('/', protect, upload.array('evidence', 3), createFlag);

// @route   GET /api/flags/admin
// @desc    Get all flags for admin moderation panel
// @access  Private/Admin
router.get('/admin', protect, authorize('admin'), getAdminFlags);

// @route   PATCH /api/flags/admin/:id/resolve
// @desc    Admin resolves a flag (uphold or dismiss)
// @access  Private/Admin
router.patch('/admin/:id/resolve', protect, authorize('admin'), resolveFlag);

// @route   GET /api/flags/admin/users
// @desc    Get user flag statistics
// @access  Private/Admin
router.get('/admin/users', protect, authorize('admin'), getAdminUserFlagStats);

// @route   GET /api/flags/admin/campaigns
// @desc    Get campaign flag statistics
// @access  Private/Admin
router.get('/admin/campaigns', protect, authorize('admin'), getAdminCampaignFlagStats);

// @route   PATCH /api/flags/admin/campaigns/:id/restore
// @desc    Admin restores a suspended campaign
// @access  Private/Admin
router.patch('/admin/campaigns/:id/restore', protect, authorize('admin'), restoreCampaign);

module.exports = router;
