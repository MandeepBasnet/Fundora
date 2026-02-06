const express = require('express');
const router = express.Router();
const {
  getPendingCampaigns,
  getCampaignForReview,
  approveCampaign,
  rejectCampaign,
  bulkApproveCampaigns,
  getAdminStats,
  getRejectionReasons,
  getEditRequests,
  approveEditRequest,
  rejectEditRequest,
  getUsers
} = require('../controllers/adminController');
const { getFinancialStats } = require('../controllers/payoutController');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard stats
router.get('/stats', getAdminStats);

// Financial Reports (FN 4.7)
router.get('/financial-reports', getFinancialStats);

// Rejection reasons
router.get('/rejection-reasons', getRejectionReasons);

// Edit request routes
router.get('/campaigns/edit-requests', getEditRequests);
router.put('/campaigns/:id/approve-edit', approveEditRequest);
router.put('/campaigns/:id/reject-edit', rejectEditRequest);

// Campaign approval routes
router.get('/campaigns/pending', getPendingCampaigns);
router.get('/campaigns/:id', getCampaignForReview);
router.put('/campaigns/:id/approve', approveCampaign);
router.put('/campaigns/:id/reject', rejectCampaign);
router.post('/campaigns/bulk-approve', bulkApproveCampaigns);

// User Management Routes (FN 4.8)
router.get('/users', getUsers);

module.exports = router;
