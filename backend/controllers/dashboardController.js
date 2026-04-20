const Campaign = require('../models/Campaign');
const Transaction = require('../models/Transaction');

// @desc    Get Backer Dashboard Data
// @route   GET /api/dashboard/backer
// @access  Private (Backer)
const getBackerDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all completed transactions for this user
    const userTransactions = await Transaction.find({ user: userId, status: 'completed' })
      .populate({
        path: 'campaign',
        select: 'title category currentAmount fundingGoal endDate coverImage images creator',
        populate: {
          path: 'creator',
          select: 'name profile'
        }
      })
      .sort({ createdAt: -1 });

    // Calculate Total Backed and Unique Campaigns
    let totalBacked = 0;
    const uniqueCampaignIds = new Set();
    const activeCampaignsMap = new Map();
    const categoryCounts = {};

    userTransactions.forEach(t => {
      totalBacked += t.amount;
      if (t.campaign && t.campaign._id) {
        if (t.campaign.category) {
          categoryCounts[t.campaign.category] = (categoryCounts[t.campaign.category] || 0) + 1;
        }
        uniqueCampaignIds.add(t.campaign._id.toString());
        
        // Group by campaign to show "Active Campaigns" the user backed
        if (!activeCampaignsMap.has(t.campaign._id.toString())) {
          activeCampaignsMap.set(t.campaign._id.toString(), {
            id: t.campaign._id,
            title: t.campaign.title,
            creator: t.campaign.creator?.name || 'Unknown',
            image: t.campaign.coverImage || (t.campaign.images?.length > 0 ? t.campaign.images[0].url : ''),
            amountBacked: t.amount,
            progress: t.campaign.fundingGoal > 0 ? Math.round((t.campaign.currentAmount / t.campaign.fundingGoal) * 100) : 0,
            daysLeft: t.campaign.endDate ? Math.max(0, Math.ceil((new Date(t.campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24))) : 0
          });
        } else {
          // Add to already backed amount
          const existing = activeCampaignsMap.get(t.campaign._id.toString());
          existing.amountBacked += t.amount;
        }
      }
    });

    // Recent Transactions (limit 5)
    const recentTransactions = userTransactions.slice(0, 5).map(t => ({
      id: t._id,
      description: `Supported ${t.campaign?.title || 'a campaign'}`,
      amount: t.amount,
      date: new Date(t.createdAt).toLocaleDateString()
    }));

    // Recommended Campaigns (Active campaigns not backed by user)
    const recommendedQuery = {
      status: 'active',
      _id: { $nin: Array.from(uniqueCampaignIds) }
    };

    const backedCategories = Object.keys(categoryCounts);
    let recommended = [];

    if (backedCategories.length > 0) {
      recommended = await Campaign.find({
        ...recommendedQuery,
        category: { $in: backedCategories }
      })
      .sort({ trendingScore: -1, backerCount: -1, createdAt: -1 })
      .limit(4)
      .select('title category coverImage images');
    }

    if (recommended.length < 4) {
      const excludedIds = [
        ...Array.from(uniqueCampaignIds),
        ...recommended.map(c => c._id.toString())
      ];
      
      const extraRecommended = await Campaign.find({
        status: 'active',
        _id: { $nin: excludedIds }
      })
      .sort({ trendingScore: -1, backerCount: -1, createdAt: -1 })
      .limit(4 - recommended.length)
      .select('title category coverImage images');

      recommended = [...recommended, ...extraRecommended];
    }

    const formattedRecommended = recommended.map(c => ({
      id: c._id,
      title: c.title,
      category: c.category,
      image: c.coverImage || (c.images?.length > 0 ? c.images[0].url : '')
    }));

    res.json({
      totalBacked,
      campaignsBacked: uniqueCampaignIds.size,
      activeCampaigns: Array.from(activeCampaignsMap.values()),
      recentTransactions,
      recommended: formattedRecommended
    });

  } catch (error) {
    console.error('getBackerDashboard Error:', error);
    res.status(500).json({ message: 'Server error fetching backer dashboard data' });
  }
};

// @desc    Get Creator Dashboard Data
// @route   GET /api/dashboard/creator
// @access  Private (Creator)
const getCreatorDashboard = async (req, res) => {
  try {
    const creatorId = req.user._id;

    // 1. Get all campaigns by this creator
    const campaigns = await Campaign.find({ creator: creatorId });
    const campaignIds = campaigns.map(c => c._id);

    // 2. Aggregate stats
    let totalRaised = 0;
    let totalBackers = 0;
    let totalViews = 0;

    campaigns.forEach(c => {
      if (['active', 'completed'].includes(c.status)) {
        totalRaised += c.currentAmount || 0;
        totalBackers += c.backerCount || 0;
        totalViews += c.viewCount || 0;
      }
    });

    // 3. Find primary active campaign (most recently updated active, or latest overall)
    let primaryCampaign = campaigns.filter(c => c.status === 'active').sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (!primaryCampaign && campaigns.length > 0) {
      primaryCampaign = campaigns.sort((a, b) => b.updatedAt - a.updatedAt)[0];
    }

    let pendingMilestones = [];
    let completedMilestones = [];
    let availableForRelease = 0;
    let pendingMilestonesAmount = 0;

    if (primaryCampaign) {
      if (primaryCampaign.milestones && primaryCampaign.milestones.length > 0) {
        primaryCampaign.milestones.forEach(m => {
          const mAmount = Math.round(primaryCampaign.currentAmount * (m.percentage / 100));
          if (m.status === 'approved' || m.status === 'completed') {
            completedMilestones.push({
              id: m._id,
              title: m.title,
              description: m.description,
              fundAmount: mAmount,
              completedDate: m.completedAt || m.reviewedAt || m.updatedAt
            });
            // Approximate available for release (minus what is already released)
            // Note: Exact available amount is usually currentAmount - released_amount.
          } else {
            pendingMilestones.push({
              id: m._id,
              title: m.title,
              description: m.description,
              fundAmount: mAmount,
              deadline: m.estimatedCompletionDate || new Date(Date.now() + 30*24*60*60*1000)
            });
            pendingMilestonesAmount += mAmount;
          }
        });
      }
      
      // Calculate available funds generically based on gross amount and released
      // Actual logic might have a platform fee deduction - let's approximate matching frontend mock
      const estimatedFee = primaryCampaign.currentAmount * 0.05; 
      const netRaised = primaryCampaign.currentAmount - estimatedFee;
      availableForRelease = Math.max(0, netRaised - primaryCampaign.released_amount);
    }

    // 4. Recent Backers
    const recentTransactions = await Transaction.find({ 
      campaign: { $in: campaignIds },
      status: 'completed'
    })
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

    const recentBackers = recentTransactions.map(t => ({
      name: t.user?.name || 'Anonymous',
      amount: t.amount,
      date: new Date(t.createdAt).toLocaleDateString()
    }));

    // 5. Milestone Chart Data
    const milestoneChartData = [];
    if (primaryCampaign && primaryCampaign.milestones) {
      const nowMs = Date.now();
      const startMs = primaryCampaign.startDate ? new Date(primaryCampaign.startDate).getTime() : nowMs;

      // Sort carefully by order
      const sortedMilestones = [...primaryCampaign.milestones].sort((a, b) => a.order - b.order);
      
      sortedMilestones.forEach((m, idx) => {
        const estMs = new Date(m.estimatedCompletionDate || nowMs + 30*24*60*60*1000).getTime();
        const endMs = (m.completedAt || m.reviewedAt) ? new Date(m.completedAt || m.reviewedAt).getTime() : estMs;
        
        // Start from previous milestone's end or campaign start
        const prevMs = idx > 0 ? new Date(sortedMilestones[idx - 1].estimatedCompletionDate || startMs).getTime() : startMs;
        
        const startDay = Math.max(0, Math.floor((prevMs - startMs) / (1000 * 60 * 60 * 24)));
        const endDay = Math.floor((endMs - startMs) / (1000 * 60 * 60 * 24));
        const durationDay = Math.max(1, endDay - startDay);

        let status = 'active';
        if (m.status === 'completed' || m.status === 'approved') status = 'completed';
        else if (estMs < nowMs) status = 'delayed';

        milestoneChartData.push({
          name: m.title.length > 20 ? m.title.substring(0, 20) + '...' : m.title,
          startDay, // Empty bar before Gantt segment
          duration: durationDay, // The actual bar
          status
        });
      });
    }

    res.json({
      totalRaised,
      backers: totalBackers,
      views: totalViews,
      goal: primaryCampaign ? primaryCampaign.fundingGoal : 0,
      campaignTitle: primaryCampaign ? primaryCampaign.title : 'No Active Campaign',
      pendingMilestones,
      completedMilestones,
      recentBackers,
      milestoneChartData,
      fundsOverview: {
        totalRaised: primaryCampaign ? primaryCampaign.currentAmount : 0,
        availableForRelease,
        pendingMilestones: pendingMilestonesAmount
      }
    });

  } catch (error) {
    console.error('getCreatorDashboard Error:', error);
    res.status(500).json({ message: 'Server error fetching creator dashboard data' });
  }
};

module.exports = {
  getBackerDashboard,
  getCreatorDashboard
};
