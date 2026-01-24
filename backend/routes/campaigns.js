const express = require('express');
const router = express.Router();
const {
  createCampaign,
  updateCampaign,
  getCampaignById,
  getMyCampaigns,
  getAllCampaigns,
  submitCampaign,
  deleteCampaign,
  requestCancellation,
  addCampaignMedia,
  getCategories,
  getCampaignComments,
  addComment
} = require('../controllers/campaignController');
const { protect, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/categories', getCategories);
router.get('/', optionalAuth, getAllCampaigns);

// Protected routes - must be before /:id to avoid conflicts
router.get('/my', protect, getMyCampaigns);
router.post('/', protect, createCampaign);

// Campaign-specific routes
router.get('/:id', optionalAuth, getCampaignById);
router.put('/:id', protect, updateCampaign);
router.delete('/:id', protect, deleteCampaign);

// Campaign actions
router.put('/:id/submit', protect, submitCampaign);
router.put('/:id/cancel', protect, requestCancellation);

// Media upload routes
router.post('/:id/media', protect, upload.single('media'), addCampaignMedia);
router.post('/:id/images', protect, upload.array('images', 5), addCampaignMedia);

// Comment routes
router.get('/:id/comments', getCampaignComments);
router.post('/:id/comments', protect, addComment);

module.exports = router;
