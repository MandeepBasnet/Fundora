const Flag = require('../models/Flag');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { 
  sendFlagReceivedEmail, 
  sendFlagResolutionEmail, 
  sendCreatorWarningEmail, 
  sendCampaignTerminatedEmail,
  sendFlagActionUpdateEmail,
  sendCreatorFlagAlertEmail
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
    const campaign = await Campaign.findById(campaignId).populate('creator', 'email name');
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
    
    // Auto-suspend if 5 or more active flags
    if (campaign.activeFlagCount >= 5 && campaign.status !== 'suspended' && campaign.status !== 'terminated') {
      campaign.status = 'suspended';
      
      // Notify creator of auto-suspension
      try {
        if (campaign.creator && campaign.creator.email) {
          await sendCreatorWarningEmail(
            campaign.creator.email, 
            'Automatic Suspension due to High Flag Volume', 
            `Your campaign "${campaign.title}" has received 5 or more active abuse reports and has been automatically suspended pending administrative review.`
          );
        }
      } catch (err) {
        console.error('Failed to send auto-suspension warning email', err);
      }
    }

    await campaign.save();

    // Send confirmation email to reporter
    try {
      if (req.user.email) {
        const totalUserFlags = await Flag.countDocuments({ reporter: reporterId });
        const userStats = {
          totalFlags: totalUserFlags,
          falseFlags: req.user.falseFlagCount || 0
        };
        await sendFlagReceivedEmail(req.user.email, campaign.title, userStats);
      }
    } catch (err) {
      console.error('Failed to send flag received email to reporter', err);
    }

    // Send alert email to creator
    try {
      if (campaign.creator && campaign.creator.email) {
        await sendCreatorFlagAlertEmail(campaign.creator.email, campaign.title, campaign.activeFlagCount);
      }
    } catch (err) {
      console.error('Failed to send flag alert email to creator', err);
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
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', error: error.message });
    }
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

      // Handle Progressive Penalties for Creator
      creator.warningCount += 1;
      const strikes = creator.warningCount;

      if (strikes === 1) {
        await sendCreatorWarningEmail(creator.email, 'Official Warning', adminComments);
      } else if (strikes === 2) {
        const suspendDate = new Date();
        suspendDate.setDate(suspendDate.getDate() + 7);
        creator.suspendedUntil = suspendDate;
        await sendCreatorWarningEmail(creator.email, '7-Day Account Suspension', adminComments);
      } else if (strikes === 3) {
        const suspendDate = new Date();
        suspendDate.setDate(suspendDate.getDate() + 30);
        creator.suspendedUntil = suspendDate;
        await sendCreatorWarningEmail(creator.email, '30-Day Account Suspension', adminComments);
      } else if (strikes >= 4) {
        creator.isBanned = true;
        await sendCreatorWarningEmail(creator.email, 'Permanent Ban', 'Your account has been permanently banned due to repeated severe violations.');
      }

      // Handle Campaign Status explicitly
      if (resolutionAction === 'suspended') {
        campaign.status = 'suspended';
      } else if (resolutionAction === 'terminated') {
        campaign.status = 'terminated';
        campaign.rejectionReason = adminComments; // Public reason
        
        // Auto-ban creator immediately for termination
        creator.isBanned = true;
        await sendCampaignTerminatedEmail(creator.email, campaign.title, adminComments);

        // Process Refunds for Backers
        try {
          const completedTransactions = await Transaction.find({
            campaign: campaign._id,
            status: 'completed'
          });

          for (const txn of completedTransactions) {
            txn.status = 'refunded';
            // Placeholder for actual gateway refund API call
            await txn.save();
          }
          console.log(`Successfully auto-refunded ${completedTransactions.length} transactions for campaign ${campaign._id}`);
        } catch (err) {
          console.error('Failed to process refunds upon campaign termination', err);
        }
      }

      await campaign.save();
      await creator.save();

      // Notify all parties
      try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@fundora.com';
        await sendFlagActionUpdateEmail([reporter.email, creator.email, adminEmail], campaign.title, 'Upheld', adminComments);
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

      // Notify all parties
      try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@fundora.com';
        await sendFlagActionUpdateEmail([reporter.email, creator.email, adminEmail], campaign.title, 'Dismissed', adminComments);
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

// @desc    Get user flag statistics for moderation panel
// @route   GET /api/flags/admin/users
// @access  Private/Admin
exports.getAdminUserFlagStats = async (req, res) => {
  try {
    const userStats = await Flag.aggregate([
      {
        $group: {
          _id: '$reporter',
          totalSubmitted: { $sum: 1 },
          lastReportDate: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $project: {
          _id: 1,
          name: '$userDetails.name',
          email: '$userDetails.email',
          totalSubmitted: 1,
          falseFlags: '$userDetails.falseFlagCount',
          status: {
            $cond: {
              if: { $gte: ['$userDetails.flaggingRestrictedUntil', new Date()] },
              then: 'restricted',
              else: 'active'
            }
          },
          lastReportDate: 1
        }
      },
      {
        $sort: { falseFlags: -1, totalSubmitted: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      count: userStats.length,
      data: userStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching user flag stats' });
  }
};

// @desc    Get campaign flag statistics for moderation panel
// @route   GET /api/flags/admin/campaigns
// @access  Private/Admin
exports.getAdminCampaignFlagStats = async (req, res) => {
  try {
    const campaignStats = await Flag.aggregate([
      {
        $group: {
          _id: '$campaign',
          totalFlags: { $sum: 1 },
          activeFlags: { 
            $sum: { $cond: [{ $in: ['$status', ['pending', 'under_review']] }, 1, 0] } 
          },
          dismissedFlags: {
            $sum: { $cond: [{ $eq: ['$status', 'dismissed'] }, 1, 0] }
          },
          upheldFlags: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          lastReportDate: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'campaigns',
          localField: '_id',
          foreignField: '_id',
          as: 'campaignDetails'
        }
      },
      {
        $unwind: '$campaignDetails'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'campaignDetails.creator',
          foreignField: '_id',
          as: 'creatorDetails'
        }
      },
      {
        $unwind: {
          path: '$creatorDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          title: '$campaignDetails.title',
          category: '$campaignDetails.category',
          status: '$campaignDetails.status',
          creator: {
            name: '$creatorDetails.name',
            email: '$creatorDetails.email'
          },
          totalFlags: 1,
          activeFlags: 1,
          dismissedFlags: 1,
          upheldFlags: 1,
          lastReportDate: 1
        }
      },
      {
        $sort: { totalFlags: -1, activeFlags: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      count: campaignStats.length,
      data: campaignStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching campaign flag stats' });
  }
};

// @desc    Restore a suspended campaign and dismiss pending flags
// @route   PATCH /api/flags/admin/campaigns/:id/restore
// @access  Private/Admin
exports.restoreCampaign = async (req, res) => {
  try {
    const campaignId = req.params.id;

    const campaign = await Campaign.findById(campaignId)
      .populate('creator', 'name email');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status !== 'suspended') {
      return res.status(400).json({ message: 'Only suspended campaigns can be restored' });
    }

    // Restore campaign status
    campaign.status = 'active';
    campaign.activeFlagCount = 0; // Reset active flags
    await campaign.save();

    // Bulk dismiss all pending/under_review flags for this campaign
    await Flag.updateMany(
      { 
        campaign: campaignId, 
        status: { $in: ['pending', 'under_review'] } 
      },
      { 
        $set: { 
          status: 'dismissed', 
          isMalicious: true,
          resolutionAction: 'dismissed',
          adminComments: 'Auto-dismissed during campaign restoration',
          resolvedAt: new Date(),
          resolvedBy: req.user._id
        } 
      }
    );

    // Look up users who had those flags and optionally penalize them
    const maliciousFlags = await Flag.find({ 
      campaign: campaignId, 
      status: 'dismissed',
      isMalicious: true,
      resolvedBy: req.user._id // Only the ones we just updated
    });

    for (const flag of maliciousFlags) {
      const reporter = await User.findById(flag.reporter);
      if (reporter) {
        reporter.falseFlagCount += 1;
        if (reporter.falseFlagCount >= 3) {
          const restrictDate = new Date();
          restrictDate.setDate(restrictDate.getDate() + 30);
          reporter.flaggingRestrictedUntil = restrictDate;
        }
        await reporter.save();
      }
    }

    // Notify creator of restoration (Optional but good UX)
    try {
      if (campaign.creator && campaign.creator.email) {
        await sendFlagActionUpdateEmail(
          [campaign.creator.email], 
          campaign.title, 
          'Campaign Restored', 
          'We have reviewed the recent reports against your campaign and determined them to be false flags. Your campaign has been restored to active status.'
        );
      }
    } catch (err) {
      console.error('Failed to send restoration email', err);
    }

    res.status(200).json({
      success: true,
      message: 'Campaign successfully restored and malicious flags dismissed',
      data: campaign
    });

  } catch (error) {
    console.error('Restore Campaign Error:', error);
    res.status(500).json({ message: 'Server error restoring campaign', error: error.message });
  }
};
