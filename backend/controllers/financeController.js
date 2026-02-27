const Transaction = require('../models/Transaction');
const FundRelease = require('../models/FundRelease');
const Campaign = require('../models/Campaign');

// @desc    Get Creator Financial Overview (Aggregated Metrics)
// @route   GET /api/finances/overview
// @access  Private (Creator only)
exports.getCreatorFinances = async (req, res) => {
  try {
    const creatorId = req.user._id;

    // 1. Find all campaigns owned by this creator
    const campaigns = await Campaign.find({ creator: creatorId }).select('_id fundingType');
    const campaignIds = campaigns.map(c => c._id);

    if (campaignIds.length === 0) {
      return res.status(200).json({
        availableBalance: 0,
        pendingBalance: 0,
        totalWithdrawn: 0
      });
    }

    // 2. Aggregate Transactions to find Gross Received
    const transactionsAgg = await Transaction.aggregate([
      {
        $match: {
          campaign: { $in: campaignIds },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$payoutStatus', // Group by 'pending', 'processing', 'paid'
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    let grossReceived = 0;
    let pendingPayoutsGross = 0;
    
    transactionsAgg.forEach(group => {
      grossReceived += group.totalAmount;
      // Pending payouts are transactions that are completed but not yet released ('pending' payoutStatus)
      if (group._id === 'pending') {
        pendingPayoutsGross += group.totalAmount;
      }
    });

    // Simplified deduction: Assuming 5% fee on all for now (could refine by checking fundingType)
    // Actually, let's look at the FundReleases to get the exact exact withdrawn.
    
    // 3. Aggregate Fund Releases
    const releasesAgg = await FundRelease.aggregate([
      {
        $match: {
          campaign: { $in: campaignIds }
        }
      },
      {
        $group: {
          _id: '$status', // 'approved', 'released'
          totalNet: { $sum: '$amount' }, // The actual amount creator gets after fees
          totalGross: { $sum: '$grossAmount' }
        }
      }
    ]);

    let totalWithdrawn = 0;
    
    releasesAgg.forEach(group => {
      if (group._id === 'released') {
        totalWithdrawn += group.totalNet;
      }
    });

    // 4. Calculate Available Balance
    // This requires us to calculate the net of the pending transactions.
    // For simplicity, pendingBalance = (Gross Pending - 5% fee)
    // Note: If donation-based, fee is 0.
    
    let pendingBalance = 0;
    let availableBalance = 0; // Not used directly in our simplified schema unless we have a specific 'cleared' state not yet released

    // Calculate pending explicitly based on campaign type
    for (const campaign of campaigns) {
      const campTxs = await Transaction.aggregate([
        {
          $match: {
            campaign: campaign._id,
            status: 'completed',
            payoutStatus: 'pending'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      const campGross = campTxs.length > 0 ? campTxs[0].total : 0;
      const isDonation = campaign.fundingType === 'donation-based';
      const fee = isDonation ? 0 : Math.round(campGross * 0.05);
      pendingBalance += (campGross - fee);
    }
    
    // Available balance could conceptually be funds moved from 'pendingBalance' to 'ready to withdraw'
    // But in Fundora, admins push the funds. So available is effectively the pending balance.
    availableBalance = pendingBalance;

    res.status(200).json({
      availableBalance,
      pendingBalance,
      totalWithdrawn
    });

  } catch (error) {
    console.error('Error fetching creator finances:', error);
    res.status(500).json({ message: 'Server error fetching financial overview' });
  }
};

// @desc    Get Creator Payout History (Fund Releases)
// @route   GET /api/finances/payouts
// @access  Private (Creator only)
exports.getCreatorPayoutHistory = async (req, res) => {
  try {
    const creatorId = req.user._id;

    // Find all campaigns owned by this creator
    const campaigns = await Campaign.find({ creator: creatorId }).select('_id');
    const campaignIds = campaigns.map(c => c._id);

    const payouts = await FundRelease.find({
      campaign: { $in: campaignIds },
      status: 'released' // Only show them completed/released payouts
    })
    .populate('campaign', 'title')
    .sort({ disbursedAt: -1, createdAt: -1 });

    res.status(200).json(payouts);

  } catch (error) {
    console.error('Error fetching creator payouts:', error);
    res.status(500).json({ message: 'Server error fetching payout history' });
  }
};
