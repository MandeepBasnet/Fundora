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
  getUsers,
  // Milestone Review (FN 5.3-5.9)
  getPendingMilestones,
  getMilestoneForReview,
  approveMilestone,
  rejectMilestone,
  requestMilestoneResubmission
} = require('../controllers/adminController');
const { getFinancialStats } = require('../controllers/payoutController');
const { 
  getAllFundReleases, 
  initiateDisbursementPayment,
  verifyDisbursementEsewa,
  verifyDisbursementKhalti,
  getEligiblePayouts,
  releaseCampaignFunds
} = require('../controllers/fundReleaseController');
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

// Milestone Review Routes (FN 5.3-5.9)
router.get('/milestones/pending', getPendingMilestones);
router.get('/milestones/:campaignId/:milestoneId', getMilestoneForReview);
router.put('/milestones/:campaignId/:milestoneId/approve', approveMilestone);
router.put('/milestones/:campaignId/:milestoneId/reject', rejectMilestone);
router.put('/milestones/:campaignId/:milestoneId/resubmit', requestMilestoneResubmission);

// Fund Release Routes (FN 5.5, 5.10)
router.get('/fund-releases/eligible', getEligiblePayouts);
router.get('/fund-releases', getAllFundReleases);
router.post('/fund-releases/campaign/:id', releaseCampaignFunds);
router.post('/fund-releases/:id/initiate-payment', initiateDisbursementPayment);
router.post('/fund-releases/verify-esewa', verifyDisbursementEsewa);
router.post('/fund-releases/verify-khalti', verifyDisbursementKhalti);

module.exports = router;
