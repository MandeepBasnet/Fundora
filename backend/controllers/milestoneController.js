const Campaign = require('../models/Campaign');
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');

// @desc    Submit milestone proof (FN 5.1, 5.2)
// @route   PUT /api/campaigns/:id/milestones/:milestoneId/submit
// @access  Private (Creator/Owner only)
const submitMilestoneProof = async (req, res) => {
  try {
    const { id, milestoneId } = req.params;
    const { proofFiles, progressDescription, nextMilestoneEstimate } = req.body;

    // Find the campaign
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Verify ownership
    if (campaign.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the campaign creator can submit milestone proof' });
    }

    // Verify campaign has reached funding goal and ended (or is completed)
    if (campaign.status !== 'completed' && campaign.status !== 'active') {
      return res.status(400).json({ message: 'Campaign must be active or completed to submit milestone proof' });
    }

    // For active campaigns, verify they've reached their goal
    if (campaign.status === 'active' && campaign.currentAmount < campaign.fundingGoal) {
      return res.status(400).json({ message: 'Campaign must reach its funding goal before milestone proof can be submitted' });
    }

    // Find the milestone
    const milestone = campaign.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Verify sequential order - all previous milestones must be approved
    const sortedMilestones = [...campaign.milestones].sort((a, b) => a.order - b.order);
    for (const m of sortedMilestones) {
      if (m.order < milestone.order) {
        if (m.status !== 'approved' && m.status !== 'completed') {
          return res.status(400).json({ 
            message: `Previous milestone "${m.title}" must be approved before submitting proof for this milestone` 
          });
        }
      }
    }

    // Verify milestone is in a submittable state
    const submittableStatuses = ['pending', 'in-progress', 'rejected', 'resubmission-required'];
    if (!submittableStatuses.includes(milestone.status)) {
      return res.status(400).json({ 
        message: `Milestone is currently "${milestone.status}" and cannot accept new submissions` 
      });
    }

    // Validate submission completeness
    if (!proofFiles || proofFiles.length === 0) {
      return res.status(400).json({ message: 'At least one proof file is required' });
    }
    if (!progressDescription || progressDescription.trim().length === 0) {
      return res.status(400).json({ message: 'Progress description is required' });
    }

    // Track resubmission count
    const isResubmission = milestone.status === 'rejected' || milestone.status === 'resubmission-required';

    // Update milestone fields
    milestone.proofFiles = proofFiles;
    milestone.progressDescription = progressDescription.trim();
    milestone.nextMilestoneEstimate = nextMilestoneEstimate || null;
    milestone.submittedAt = new Date();
    milestone.status = 'submitted';
    
    if (isResubmission) {
      milestone.resubmissionCount = (milestone.resubmissionCount || 0) + 1;
    }

    // Clear previous rejection fields on resubmission
    milestone.rejectionReason = undefined;
    milestone.rejectionCategory = undefined;
    milestone.appealDeadline = undefined;
    milestone.resubmissionFeedback = undefined;

    await campaign.save();

    // Create notification for the creator (confirmation)
    await Notification.create({
      recipient: req.user._id,
      type: 'milestone_submitted',
      title: 'Milestone Proof Submitted',
      message: `Your proof for milestone "${milestone.title}" has been submitted successfully and is now pending admin review.`,
      campaign: campaign._id,
      milestoneId: milestone._id,
      metadata: {
        milestoneOrder: milestone.order,
        milestoneTitle: milestone.title,
        campaignTitle: campaign.title
      }
    });

    res.json({ 
      message: 'Milestone proof submitted successfully',
      milestone: milestone
    });
  } catch (error) {
    console.error('Submit milestone proof error:', error);
    res.status(500).json({ message: 'Server error submitting milestone proof' });
  }
};

// @desc    Get campaign milestones with status (FN 5.8)
// @route   GET /api/campaigns/:id/milestones
// @access  Public (but proof files only shown if approved)
const getCampaignMilestones = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .select('milestones title fundingGoal currentAmount released_amount status creator');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Sort milestones by order
    const milestones = [...campaign.milestones].sort((a, b) => a.order - b.order);

    // For public access, only show proof files for approved milestones
    const isCreator = req.user && campaign.creator.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    const mappedMilestones = milestones.map(m => {
      const milestone = m.toObject();
      
      // Only show proof files if approved/completed, or if user is creator/admin
      if (!isCreator && !isAdmin && !['approved', 'completed'].includes(milestone.status)) {
        milestone.proofFiles = [];
        milestone.progressDescription = null;
      }

      // Calculate fund amount for this milestone
      milestone.fundAmount = Math.round(campaign.currentAmount * (milestone.percentage / 100));
      
      return milestone;
    });

    res.json({
      milestones: mappedMilestones,
      campaignTitle: campaign.title,
      fundingGoal: campaign.fundingGoal,
      currentAmount: campaign.currentAmount,
      releasedAmount: campaign.released_amount,
      campaignStatus: campaign.status
    });
  } catch (error) {
    console.error('Get milestones error:', error);
    res.status(500).json({ message: 'Server error fetching milestones' });
  }
};

// @desc    Get single milestone detail
// @route   GET /api/campaigns/:id/milestones/:milestoneId
// @access  Public
const getMilestoneDetail = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .select('milestones title fundingGoal currentAmount released_amount status creator');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const milestone = campaign.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    const milestoneData = milestone.toObject();
    milestoneData.fundAmount = Math.round(campaign.currentAmount * (milestone.percentage / 100));

    // Restrict proof files for non-approved milestones (unless creator/admin)
    const isCreator = req.user && campaign.creator.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isCreator && !isAdmin && !['approved', 'completed'].includes(milestone.status)) {
      milestoneData.proofFiles = [];
      milestoneData.progressDescription = null;
    }

    res.json({
      milestone: milestoneData,
      campaignTitle: campaign.title
    });
  } catch (error) {
    console.error('Get milestone detail error:', error);
    res.status(500).json({ message: 'Server error fetching milestone detail' });
  }
};

module.exports = {
  submitMilestoneProof,
  getCampaignMilestones,
  getMilestoneDetail
};
