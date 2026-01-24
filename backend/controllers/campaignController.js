const Campaign = require('../models/Campaign');
const { CAMPAIGN_CATEGORIES, CAMPAIGN_STATUSES } = require('../models/Campaign');

// @desc    Create a new campaign (as draft)
// @route   POST /api/campaigns
// @access  Private (Creator)
const createCampaign = async (req, res) => {
  try {
    const {
      title,
      description,
      shortDescription,
      category,
      fundingGoal,
      duration,
      fundingType,
      rewardTiers,
      milestones
    } = req.body;

    // Create campaign with creator set to current user
    const campaign = await Campaign.create({
      creator: req.user._id,
      title,
      description,
      shortDescription,
      category,
      fundingGoal,
      duration,
      fundingType,
      rewardTiers: rewardTiers || [],
      milestones: milestones || [],
      status: 'draft'
    });

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Create campaign error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Server error creating campaign' });
  }
};

// @desc    Update a campaign
// @route   PUT /api/campaigns/:id
// @access  Private (Creator/Owner only)
const updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check ownership
    if (campaign.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this campaign' });
    }

    // List of fields allowed to be updated
    const updateFields = [
      'title', 'description', 'shortDescription', 'category',
      'fundingGoal', 'duration', 'fundingType',
      'rewardTiers', 'milestones', 'images', 'video', 'coverImage'
    ];

    // Identify changes
    const updates = {};
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Special handling for active campaigns (Submit Edit Request)
    if (campaign.status === 'active') {
      // Store changes in pendingUpdates for admin approval
      campaign.pendingUpdates = updates;
      await campaign.save();
      
      return res.json({ 
        message: 'Edit request submitted for administrator approval.',
        campaign,
        isPendingReview: true
      });
    }

    // Direct update for draft campaigns
    Object.keys(updates).forEach(field => {
      campaign[field] = updates[field];
    });

    campaign.markModified('rewardTiers');
    campaign.markModified('milestones');
    campaign.markModified('images');

    const updatedCampaign = await campaign.save();
    res.json(updatedCampaign);
  } catch (error) {
    console.error('Update campaign error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Server error updating campaign' });
  }
};

// @desc    Get a single campaign by ID
// @route   GET /api/campaigns/:id
// @access  Public (but drafts only visible to owner)
const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('creator', 'name email profile.avatar');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Draft campaigns only visible to owner
    if (campaign.status === 'draft') {
      if (!req.user || campaign.creator._id.toString() !== req.user._id.toString()) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
    }

    // Increment view count for non-owners
    if (!req.user || campaign.creator._id.toString() !== req.user._id.toString()) {
      campaign.viewCount += 1;
      await campaign.save();
    }

    res.json(campaign);
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ message: 'Server error fetching campaign' });
  }
};

// @desc    Get current user's campaigns
// @route   GET /api/campaigns/my
// @access  Private
const getMyCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ creator: req.user._id })
      .sort({ createdAt: -1 })
      .select('-description'); // Exclude long description for list view

    res.json(campaigns);
  } catch (error) {
    console.error('Get my campaigns error:', error);
    res.status(500).json({ message: 'Server error fetching campaigns' });
  }
};

// @desc    Get all active/approved campaigns
// @route   GET /api/campaigns
// @access  Public
const getAllCampaigns = async (req, res) => {
  try {
    const {
      category,
      fundingType,
      status = 'active',
      sort = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    // Build query
    const query = {};
    
    // Only show active campaigns to public (or pending for admins)
    if (req.user?.role === 'admin') {
      if (status) query.status = status;
    } else {
      query.status = 'active';
    }

    if (category) query.category = category;
    if (fundingType) query.fundingType = fundingType;

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'most-funded':
        sortOption = { currentAmount: -1 };
        break;
      case 'ending-soon':
        sortOption = { endDate: 1 };
        break;
      case 'most-backed':
        sortOption = { backerCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate('creator', 'name profile.avatar')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-description'),
      Campaign.countDocuments(query)
    ]);

    res.json({
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all campaigns error:', error);
    res.status(500).json({ message: 'Server error fetching campaigns' });
  }
};

// @desc    Submit campaign for approval
// @route   PUT /api/campaigns/:id/submit
// @access  Private (Creator/Owner only)
const submitCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check ownership
    if (campaign.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Can only submit draft campaigns
    if (campaign.status !== 'draft') {
      return res.status(400).json({ 
        message: `Can only submit draft campaigns. Current status: ${campaign.status}` 
      });
    }

    // Validate required fields for submission
    const errors = [];
    if (!campaign.title || campaign.title.length < 5) {
      errors.push('Title must be at least 5 characters');
    }
    if (!campaign.description || campaign.description.length < 100) {
      errors.push('Description must be at least 100 characters');
    }
    if (!campaign.category) {
      errors.push('Category is required');
    }
    if (!campaign.fundingGoal || campaign.fundingGoal < 1000) {
      errors.push('Funding goal must be at least NPR 1,000');
    }
    if (!campaign.duration || campaign.duration < 7 || campaign.duration > 90) {
      errors.push('Duration must be between 7 and 90 days');
    }
    if (!campaign.fundingType) {
      errors.push('Funding type is required');
    }
    if (campaign.images.length === 0) {
      errors.push('At least one image is required');
    }
    if (campaign.fundingType === 'reward-based' && campaign.rewardTiers.length === 0) {
      errors.push('At least one reward tier is required for reward-based campaigns');
    }
    if (campaign.fundingType === 'milestone-based' && campaign.milestones.length === 0) {
      errors.push('At least one milestone is required for milestone-based campaigns');
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join('. ') });
    }

    // Update status to pending
    campaign.status = 'pending';
    campaign.submittedAt = new Date();
    
    await campaign.save();

    res.json({ message: 'Campaign submitted for approval', campaign });
  } catch (error) {
    console.error('Submit campaign error:', error);
    res.status(500).json({ message: 'Server error submitting campaign' });
  }
};

// @desc    Delete a draft campaign
// @route   DELETE /api/campaigns/:id
// @access  Private (Creator/Owner only)
const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check ownership
    if (campaign.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Can only delete draft campaigns (FN 2.9)
    if (campaign.status !== 'draft') {
      return res.status(400).json({ 
        message: 'Only draft campaigns can be deleted. For active campaigns, please request cancellation.' 
      });
    }

    // TODO: Delete associated images from Cloudinary
    // for (const image of campaign.images) {
    //   await cloudinary.uploader.destroy(image.publicId);
    // }

    await Campaign.findByIdAndDelete(req.params.id);

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ message: 'Server error deleting campaign' });
  }
};

// @desc    Request campaign cancellation
// @route   PUT /api/campaigns/:id/cancel
// @access  Private (Creator/Owner only)
const requestCancellation = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check ownership
    if (campaign.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Can only cancel active or pending campaigns
    if (!['active', 'pending'].includes(campaign.status)) {
      return res.status(400).json({ 
        message: `Cannot cancel ${campaign.status} campaigns` 
      });
    }

    // If no backers, can cancel directly; otherwise needs admin approval
    if (campaign.backerCount === 0) {
      campaign.status = 'cancelled';
      campaign.adminNotes = 'Cancelled by creator (no backers)';
      await campaign.save();
      return res.json({ message: 'Campaign cancelled successfully', campaign });
    }

    // With backers, set a flag for admin review (in real app, would create a cancellation request)
    campaign.adminNotes = `Cancellation requested by creator on ${new Date().toISOString()}. Reason: ${req.body.reason || 'Not provided'}`;
    await campaign.save();

    res.json({ 
      message: 'Cancellation request submitted. Admin will review and process refunds to backers.',
      campaign 
    });
  } catch (error) {
    console.error('Cancel campaign error:', error);
    res.status(500).json({ message: 'Server error cancelling campaign' });
  }
};

// @desc    Add media to campaign
// @route   POST /api/campaigns/:id/media
// @access  Private (Creator/Owner only)
const addCampaignMedia = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check ownership
    if (campaign.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Handle multiple image uploads (from upload.array('images', 5))
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      // Check limit
      if (campaign.images.length + req.files.length > 5) {
        return res.status(400).json({ message: 'Maximum 5 images allowed per campaign' });
      }

      for (const file of req.files) {
        campaign.images.push({
          url: file.path,
          publicId: file.filename
        });
      }
    }

    // Handle video upload
    if (req.files && req.files.video) {
      const videoFile = Array.isArray(req.files.video) ? req.files.video[0] : req.files.video;
      campaign.video = {
        url: videoFile.path,
        publicId: videoFile.filename
      };
    }

    // Single file upload (for simpler upload flow)
    if (req.file) {
      const resourceType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
      
      if (resourceType === 'video') {
        campaign.video = {
          url: req.file.path,
          publicId: req.file.filename
        };
      } else {
        if (campaign.images.length >= 5) {
          return res.status(400).json({ message: 'Maximum 5 images allowed per campaign' });
        }
        campaign.images.push({
          url: req.file.path,
          publicId: req.file.filename
        });
      }
    }

    campaign.markModified('images');
    await campaign.save();

    res.json({ 
      message: 'Media uploaded successfully',
      images: campaign.images,
      video: campaign.video
    });
  } catch (error) {
    console.error('Add media error:', error);
    res.status(500).json({ message: 'Server error uploading media' });
  }
};

// @desc    Get campaign categories
// @route   GET /api/campaigns/categories
// @access  Public
const getCategories = async (req, res) => {
  res.json(CAMPAIGN_CATEGORIES);
};

module.exports = {
  createCampaign,
  updateCampaign,
  getCampaignById,
  getMyCampaigns,
  getAllCampaigns,
  submitCampaign,
  deleteCampaign,
  requestCancellation,
  addCampaignMedia,
  getCategories
};
