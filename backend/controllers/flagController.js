const Flag = require('../models/Flag');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const { 
  sendFlagReceivedEmail, 
  sendFlagResolutionEmail, 
  sendCreatorWarningEmail, 
  sendCampaignTerminatedEmail 
} = require('../utils/emailService');

// @desc    Create a new flag/report
// @route   POST /api/flags
// @access  Private
exports.createFlag = async (req, res) => {
  try {
    const { campaignId, reason, description } = req.body;
    const reporterId = req.user._id;

    // Check if user is restricted from flagging
    if (req.user.flaggingRestrictedUntil && new Date(req.user.flaggingRestrictedUntil) > new Date()) {
      return res.status(403).json({ message: 'Your account is temporarily restricted from submitting reports.' });
    }

    // Verify campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Prevent duplicate active flags
    const existingFlag = await Flag.findOne({
      campaign: campaignId,
      reporter: reporterId,
      status: { $in: ['pending', 'under_review'] }
    });

    if (existingFlag) {
      return res.status(400).json({ message: "You've already reported this campaign and it is currently under review." });
    }

    // Handle evidence uploads
    const evidence = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        evidence.push({
          url: file.path,
          publicId: file.filename
        });
      });
    }

    // Create flag
    const flag = await Flag.create({
      reporter: reporterId,
      campaign: campaignId,
      reason,
      description,
      evidence
    });

    // Update campaign active block count
    campaign.activeFlagCount += 1;
    await campaign.save();

    // Send confirmation email
    try {
      if (req.user.email) {
        await sendFlagReceivedEmail(req.user.email, campaign.title);
      }
    } catch (err) {
      console.error('Failed to send flag received email', err);
    }

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Thank you for keeping the community safe.',
      flag: {
        id: flag._id,
        status: flag.status
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while submitting report', error: error.message });
  }
};

// @desc    Get all flags for moderation panel
// @route   GET /api/flags/admin
// @access  Private/Admin
exports.getAdminFlags = async (req, res) => {
  try {
    const { status, sort } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };

    const flags = await Flag.find(query)
      .populate('campaign', 'title category creator status activeFlagCount')
      .populate('reporter', 'name email falseFlagCount warningCount')
      .populate('resolvedBy', 'name')
      .sort(sortOption);

    res.status(200).json({
      success: true,
      count: flags.length,
      data: flags
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching flags' });
  }
};

// @desc    Resolve a flag (Uphold or Dismiss)
// @route   PATCH /api/flags/admin/:id/resolve
// @access  Private/Admin
exports.resolveFlag = async (req, res) => {
  try {
    const { resolutionAction, adminComments, isMalicious } = req.body;
    const flagId = req.params.id;

    const flag = await Flag.findById(flagId)
      .populate('campaign')
      .populate('reporter');

    if (!flag) {
      return res.status(404).json({ message: 'Flag not found' });
    }

    if (flag.status === 'resolved' || flag.status === 'dismissed') {
      return res.status(400).json({ message: 'This flag has already been resolved' });
    }

    const campaign = flag.campaign;
    const creator = await User.findById(campaign.creator);
    const reporter = flag.reporter;

    flag.resolutionAction = resolutionAction;
    flag.adminComments = adminComments;
    flag.resolvedAt = new Date();
    flag.resolvedBy = req.user._id;

    if (['warned', 'corrections_requested', 'suspended', 'terminated'].includes(resolutionAction)) {
      // UPHOLD FLAG
      flag.status = 'resolved';

      // Decrement active flags
      campaign.activeFlagCount = Math.max(0, campaign.activeFlagCount - 1);

      if (resolutionAction === 'suspended') {
        campaign.status = 'suspended';
        creator.warningCount += 1;
        await sendCreatorWarningEmail(creator.email, 'Suspension', adminComments);
      } else if (resolutionAction === 'terminated') {
        campaign.status = 'terminated';
        creator.warningCount += 1; // Can represent strikes
        await sendCampaignTerminatedEmail(creator.email, campaign.title, adminComments);
      } else if (resolutionAction === 'warned') {
        creator.warningCount += 1;
        await sendCreatorWarningEmail(creator.email, 'Warning', adminComments);
      }

      await campaign.save();
      await creator.save();

      // Notify reporter
      try {
        await sendFlagResolutionEmail(reporter.email, campaign.title, 'Upheld', adminComments);
      } catch (e) {
        console.error('Email error', e);
      }

    } else if (resolutionAction === 'none' || resolutionAction === null || resolutionAction === 'dismissed') {
      // DISMISS FLAG
      flag.status = 'dismissed';
      flag.isMalicious = isMalicious || false;
      
      campaign.activeFlagCount = Math.max(0, campaign.activeFlagCount - 1);
      await campaign.save();

      // Handle malicious flags
      if (isMalicious) {
        reporter.falseFlagCount += 1;
        if (reporter.falseFlagCount >= 3) {
          // Restrict flagging for 30 days
          const restrictDate = new Date();
          restrictDate.setDate(restrictDate.getDate() + 30);
          reporter.flaggingRestrictedUntil = restrictDate;
        }
        await reporter.save();
      }

      // Notify reporter
      try {
        await sendFlagResolutionEmail(reporter.email, campaign.title, 'Dismissed', adminComments);
      } catch (e) {
        console.error('Email error', e);
      }
    } else {
      return res.status(400).json({ message: 'Invalid resolution action' });
    }

    await flag.save();

    res.status(200).json({
      success: true,
      message: `Flag successfully marked as ${flag.status}`,
      data: flag
    });

  } catch (error) {
    console.error('Resolve Error:', error);
    res.status(500).json({ message: 'Server error resolving flag', error: error.message });
  }
};
