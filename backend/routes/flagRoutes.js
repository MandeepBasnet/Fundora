const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');
const {
  createFlag,
  getAdminFlags,
  resolveFlag
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

module.exports = router;
