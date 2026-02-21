const FundRelease = require('../models/FundRelease');
const Campaign = require('../models/Campaign');

// @desc    Get fund release history for a campaign (FN 5.5)
// @route   GET /api/campaigns/:id/fund-releases
// @access  Private (authenticated users)
const getFundReleaseHistory = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .select('title fundingGoal currentAmount released_amount creator');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const releases = await FundRelease.find({ campaign: req.params.id })
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      releases,
      summary: {
        campaignTitle: campaign.title,
        totalFunded: campaign.currentAmount,
        totalReleased: campaign.released_amount,
        totalRemaining: campaign.currentAmount - campaign.released_amount,
        fundingGoal: campaign.fundingGoal
      }
    });
  } catch (error) {
    console.error('Fund release history error:', error);
    res.status(500).json({ message: 'Server error fetching fund release history' });
  }
};

// @desc    Update disbursement status (FN 5.10)
// @route   PUT /api/admin/fund-releases/:id/status
// @access  Private (Admin only)
const updateDisbursementStatus = async (req, res) => {
  try {
    const { status, transactionReference } = req.body;
    
    const release = await FundRelease.findById(req.params.id);
    if (!release) {
      return res.status(404).json({ message: 'Fund release not found' });
    }

    const validTransitions = {
      'pending': ['processing'],
      'processing': ['completed', 'failed'],
      'failed': ['processing']
    };

    if (!validTransitions[release.disbursementStatus] || 
        !validTransitions[release.disbursementStatus].includes(status)) {
      return res.status(400).json({ 
        message: `Cannot transition from "${release.disbursementStatus}" to "${status}"` 
      });
    }

    release.disbursementStatus = status;
    if (transactionReference) {
      release.transactionReference = transactionReference;
    }
    if (status === 'completed') {
      release.disbursedAt = new Date();
      release.status = 'released';
    }
    if (status === 'failed') {
      release.status = 'failed';
    }

    await release.save();

    // If completed, create notification for creator
    if (status === 'completed') {
      const campaign = await Campaign.findById(release.campaign).populate('creator', 'name email');
      if (campaign) {
        const Notification = require('../models/Notification');
        await Notification.create({
          recipient: campaign.creator._id,
          type: 'fund_disbursed',
          title: 'Funds Transferred Successfully',
          message: `NPR ${release.amount.toLocaleString()} has been transferred to your ${release.disbursementMethod.replace('_', ' ')} account. Transaction ref: ${transactionReference || 'N/A'}`,
          campaign: campaign._id,
          milestoneId: release.milestoneId,
          metadata: {
            amount: release.amount,
            method: release.disbursementMethod,
            transactionReference: transactionReference
          }
        });
      }
    }

    res.json({ 
      message: `Disbursement status updated to "${status}"`,
      release 
    });
  } catch (error) {
    console.error('Update disbursement status error:', error);
    res.status(500).json({ message: 'Server error updating disbursement status' });
  }
};

// @desc    Get all fund releases (admin overview)
// @route   GET /api/admin/fund-releases
// @access  Private (Admin only)
const getAllFundReleases = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status) filter.disbursementStatus = status;

    const releases = await FundRelease.find(filter)
      .populate('campaign', 'title creator')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await FundRelease.countDocuments(filter);

    // Populate campaign creator details
    await Campaign.populate(releases, {
      path: 'campaign.creator',
      select: 'name email'
    });

    res.json({
      releases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all fund releases error:', error);
    res.status(500).json({ message: 'Server error fetching fund releases' });
  }
};

module.exports = {
  getFundReleaseHistory,
  updateDisbursementStatus,
  getAllFundReleases
};
