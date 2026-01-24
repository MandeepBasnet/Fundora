const express = require('express');
const router = express.Router();
const {
  getPendingCampaigns,
  getCampaignForReview,
  approveCampaign,
  rejectCampaign,
  bulkApproveCampaigns,
  getAdminStats,
  getRejectionReasons
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard stats
router.get('/stats', getAdminStats);

// Rejection reasons
router.get('/rejection-reasons', getRejectionReasons);

// Campaign approval routes
router.get('/campaigns/pending', getPendingCampaigns);
router.get('/campaigns/:id', getCampaignForReview);
router.put('/campaigns/:id/approve', approveCampaign);
router.put('/campaigns/:id/reject', rejectCampaign);
router.post('/campaigns/bulk-approve', bulkApproveCampaigns);

module.exports = router;
