const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const {
  submitMilestoneProof,
  getCampaignMilestones,
  getMilestoneDetail
} = require('../controllers/milestoneController');
const {
  getFundReleaseHistory
} = require('../controllers/fundReleaseController');

const upload = require('../middleware/uploadMiddleware');

// GET milestones for a campaign (public, proof restricted by role)
router.get('/:id/milestones', optionalAuth, getCampaignMilestones);

// GET single milestone detail
router.get('/:id/milestones/:milestoneId', optionalAuth, getMilestoneDetail);

// PUT submit proof for a milestone (creator only)
router.put('/:id/milestones/:milestoneId/submit', protect, submitMilestoneProof);

// GET fund release history for a campaign
router.get('/:id/fund-releases', protect, getFundReleaseHistory);

module.exports = router;
