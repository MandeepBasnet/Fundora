const Transaction = require('../models/Transaction');

// @desc    Get financial reports and stats
// @route   GET /api/admin/financial-reports
// @access  Private (Admin only)
const getFinancialStats = async (req, res) => {
  try {
    const FundRelease = require('../models/FundRelease');

    // 1. Calculate Total Volume from completed transactions
    const txStats = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    const totalVolume = txStats.length > 0 ? txStats[0].totalVolume : 0;
    const txCount = txStats.length > 0 ? txStats[0].count : 0;

    // 2. Calculate Released, Processing, and Platform Fees directly from Fund Releases
    const releaseStats = await FundRelease.aggregate([
      {
        $group: {
          _id: null,
          totalReleased: {
            $sum: {
              $cond: [{ $eq: ['$disbursementStatus', 'completed'] }, '$amount', 0]
            }
          },
          platformFees: {
            $sum: {
              $cond: [{ $eq: ['$disbursementStatus', 'completed'] }, '$platformFee', 0]
            }
          },
          totalProcessing: {
            $sum: {
              $cond: [{ $in: ['$disbursementStatus', ['pending', 'processing']] }, '$amount', 0]
            }
          }
        }
      }
    ]);

    const totalReleased = releaseStats.length > 0 ? releaseStats[0].totalReleased : 0;
    const platformFees = releaseStats.length > 0 ? releaseStats[0].platformFees : 0;
    const totalProcessing = releaseStats.length > 0 ? releaseStats[0].totalProcessing : 0;

    // The rest is held by the platform (total volume minus what went to creators minus platform fees minuse processing)
    const totalHeld = Math.max(0, totalVolume - totalReleased - totalProcessing - platformFees);

    // 3. Fetch Recent Transactions with Payout Status (UI table)
    const transactions = await Transaction.find({ status: 'completed' })
        .populate('campaign', 'title')
        .populate('user', 'name email')
        .sort({ createdAt: -1 });

    res.json({
      stats: {
        totalVolume,
        totalHeld,
        totalReleased,
        totalProcessing,
        platformFees
      },
      transactions
    });
  } catch (error) {
    console.error('Financial stats error:', error);
    res.status(500).json({ message: 'Server error fetching financial reports' });
  }
};

module.exports = {
  getFinancialStats
};
