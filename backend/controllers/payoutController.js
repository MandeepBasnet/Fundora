const Transaction = require('../models/Transaction');

// @desc    Get financial reports and stats
// @route   GET /api/admin/financial-reports
// @access  Private (Admin only)
const getFinancialStats = async (req, res) => {
  try {
    // 1. Calculate Aggregate Stats
    const stats = await Transaction.aggregate([
      { 
        $match: { status: 'completed' } 
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: '$amount' },
          totalHeld: { 
            $sum: { 
              $cond: [{ $eq: ['$payoutStatus', 'pending'] }, '$amount', 0] 
            }
          },
          totalReleased: { 
            $sum: { 
              $cond: [{ $eq: ['$payoutStatus', 'paid'] }, '$amount', 0] 
            }
          },
          totalProcessing: { 
            $sum: { 
              $cond: [{ $eq: ['$payoutStatus', 'processing'] }, '$amount', 0] 
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // 2. Fetch Recent Transactions with Payout Status
    const transactions = await Transaction.find({ status: 'completed' })
        .populate('campaign', 'title')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(50); // Limit for performance, maybe add pagination later

    const result = stats.length > 0 ? stats[0] : { totalVolume: 0, totalHeld: 0, totalReleased: 0, totalProcessing: 0, count: 0 };

    res.json({
      stats: {
        totalVolume: result.totalVolume,
        totalHeld: result.totalHeld, // Funds waiting to be released to creators
        totalReleased: result.totalReleased, // Funds already paid out
        totalProcessing: result.totalProcessing,
        platformFees: Math.round(result.totalVolume * 0.05) // Mock 5% fee calculation
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
