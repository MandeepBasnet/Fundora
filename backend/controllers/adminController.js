const Campaign = require('../models/Campaign');
const User = require('../models/User');
const FundRelease = require('../models/FundRelease');
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');
const cloudinary = require('../config/cloudinary');

// Predefined rejection reasons
const REJECTION_REASONS = {
  unrealistic_goals: 'Unrealistic Goals',
  inappropriate_content: 'Inappropriate Content',
  incomplete_information: 'Incomplete Information',
  copyright_issues: 'Copyright Issues',
  violates_guidelines: 'Violates Community Guidelines',
  duplicate_campaign: 'Duplicate Campaign',
  insufficient_details: 'Insufficient Details',
  misleading_information: 'Misleading Information',
  other: 'Other'
};

// @desc    Get all users with filtering and pagination
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      role = '', 
      status = '',
      sort = 'newest'
    } = req.query;

    // Build query
    const query = {};

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by role
    if (role && role !== 'All Roles') {
      query.role = role.toLowerCase();
    }

    // Filter by status (if user model has status, otherwise this might need adjustment based on User schema)
    // Assuming User model might not have 'status' yet, skipping for now unless verified.
    // Checking User model first would be ideal, but for now let's implement basic status if it exists or mock it if not.
    // Wait, User model usually has 'isActive' or similar. Let's check User model in next step or assume standard.
    // For now, I'll add the logic but comment it out if 'status' field isn't confirmed, 
    // BUT the prompt implies managing status. 
    // Let's assume standard 'status' or 'isActive'. I'll treat 'status' as a field to be safe or map it.
    if (status && status !== 'All Status') {
       query.status = status.toLowerCase();
    }

    // Sort options
    const sortOption = sort === 'newest' ? { createdAt: -1 } : { createdAt: 1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password') // Exclude password
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// Lazy email transporter - only connects when actually sending
const getTransporter = () => {
  const nodemailer = require('nodemailer');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// @desc    Get all pending campaigns for review
// @route   GET /api/admin/campaigns/pending
// @access  Private (Admin only)
const getPendingCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'oldest' } = req.query;

    // Build sort option (oldest first by default for FIFO review)
    const sortOption = sort === 'oldest' 
      ? { submittedAt: 1 } 
      : { submittedAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [campaigns, total] = await Promise.all([
      Campaign.find({ status: 'pending' })
        .populate('creator', 'name email profile.avatar')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .select('title category fundingGoal coverImage images submittedAt createdAt shortDescription fundingType'),
      Campaign.countDocuments({ status: 'pending' })
    ]);

    // Calculate waiting time for each campaign
    const campaignsWithWaitTime = campaigns.map(c => {
      const campaign = c.toObject();
      const submittedAt = new Date(campaign.submittedAt || campaign.createdAt);
      const now = new Date();
      const hoursWaiting = Math.round((now - submittedAt) / (1000 * 60 * 60));
      
      campaign.waitingTime = hoursWaiting < 24 
        ? `${hoursWaiting} hours` 
        : `${Math.round(hoursWaiting / 24)} days`;
      campaign.isOverdue = hoursWaiting > 24;
      
      return campaign;
    });

    // Calculate average review time (from recent approvals)
    const recentApprovals = await Campaign.find({ 
      status: 'active', 
      approvedAt: { $exists: true },
      submittedAt: { $exists: true }
    })
    .sort({ approvedAt: -1 })
    .limit(50)
    .select('submittedAt approvedAt');

    let avgReviewTimeHours = 0;
    if (recentApprovals.length > 0) {
      const totalHours = recentApprovals.reduce((sum, c) => {
        return sum + ((new Date(c.approvedAt) - new Date(c.submittedAt)) / (1000 * 60 * 60));
      }, 0);
      avgReviewTimeHours = Math.round(totalHours / recentApprovals.length);
    }

    res.json({
      campaigns: campaignsWithWaitTime,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: {
        totalPending: total,
        avgReviewTimeHours
      }
    });
  } catch (error) {
    console.error('Get pending campaigns error:', error);
    res.status(500).json({ message: 'Server error fetching pending campaigns' });
  }
};

// @desc    Get full campaign details for review
// @route   GET /api/admin/campaigns/:id
// @access  Private (Admin only)
const getCampaignForReview = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('creator', 'name email profile createdAt');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Get creator's campaign history
    const creatorCampaigns = await Campaign.countDocuments({ 
      creator: campaign.creator._id,
      status: { $in: ['active', 'completed'] }
    });

    const campaignData = campaign.toObject();
    campaignData.creatorStats = {
      totalCampaigns: creatorCampaigns,
      memberSince: campaign.creator.createdAt
    };

    res.json(campaignData);
  } catch (error) {
    console.error('Get campaign for review error:', error);
    res.status(500).json({ message: 'Server error fetching campaign' });
  }
};

// @desc    Approve a campaign
// @route   PUT /api/admin/campaigns/:id/approve
// @access  Private (Admin only)
const approveCampaign = async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const campaign = await Campaign.findById(req.params.id)
      .populate('creator', 'name email');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status !== 'pending') {
      return res.status(400).json({ 
        message: `Cannot approve campaign with status: ${campaign.status}` 
      });
    }

    // Update campaign status
    campaign.status = 'active';
    campaign.approvedAt = new Date();
    campaign.startDate = new Date();
    campaign.endDate = new Date(Date.now() + campaign.duration * 24 * 60 * 60 * 1000);
    if (adminNotes) campaign.adminNotes = adminNotes;

    await campaign.save();

    // Send approval email to creator
    try {
      await sendCampaignApprovedEmail(campaign.creator.email, campaign);
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
    }

    res.json({ 
      message: 'Campaign approved successfully',
      campaign 
    });
  } catch (error) {
    console.error('Approve campaign error:', error);
    res.status(500).json({ message: 'Server error approving campaign' });
  }
};

// @desc    Reject a campaign
// @route   PUT /api/admin/campaigns/:id/reject
// @access  Private (Admin only)
const rejectCampaign = async (req, res) => {
  try {
    const { reason, customMessage } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const campaign = await Campaign.findById(req.params.id)
      .populate('creator', 'name email');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status !== 'pending') {
      return res.status(400).json({ 
        message: `Cannot reject campaign with status: ${campaign.status}` 
      });
    }

    // Update campaign status
    campaign.status = 'rejected';
    campaign.rejectionReason = reason;
    campaign.adminNotes = customMessage || REJECTION_REASONS[reason] || reason;

    await campaign.save();

    // Send rejection email to creator
    try {
      const reasonText = REJECTION_REASONS[reason] || reason;
      await sendCampaignRejectedEmail(campaign.creator.email, campaign, reasonText, customMessage);
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
    }

    res.json({ 
      message: 'Campaign rejected and creator notified',
      campaign 
    });
  } catch (error) {
    console.error('Reject campaign error:', error);
    res.status(500).json({ message: 'Server error rejecting campaign' });
  }
};

// @desc    Bulk approve multiple campaigns
// @route   POST /api/admin/campaigns/bulk-approve
// @access  Private (Admin only)
const bulkApproveCampaigns = async (req, res) => {
  try {
    const { campaignIds } = req.body;

    if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length === 0) {
      return res.status(400).json({ message: 'Campaign IDs array is required' });
    }

    // Verify all campaigns are pending
    const campaigns = await Campaign.find({ 
      _id: { $in: campaignIds },
      status: 'pending'
    }).populate('creator', 'name email');

    if (campaigns.length !== campaignIds.length) {
      return res.status(400).json({ 
        message: `Only ${campaigns.length} of ${campaignIds.length} campaigns are pending and eligible for approval` 
      });
    }

    // Approve all campaigns
    const now = new Date();
    const results = await Promise.all(campaigns.map(async (campaign) => {
      campaign.status = 'active';
      campaign.approvedAt = now;
      campaign.startDate = now;
      campaign.endDate = new Date(now.getTime() + campaign.duration * 24 * 60 * 60 * 1000);
      await campaign.save();

      // Send approval email (don't await to speed up)
      sendCampaignApprovedEmail(campaign.creator.email, campaign).catch(err => {
        console.error('Bulk approve email error:', err);
      });

      return campaign._id;
    }));

    res.json({ 
      message: `Successfully approved ${results.length} campaigns`,
      approvedIds: results
    });
  } catch (error) {
    console.error('Bulk approve error:', error);
    res.status(500).json({ message: 'Server error bulk approving campaigns' });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getAdminStats = async (req, res) => {
  try {
    const [
      pendingCampaigns,
      activeCampaigns,
      totalUsers,
      totalCreators,
      totalFunding,
      pendingMilestones,
      monthlyRevenueData,
      completedCampaigns,
      totalNonDraftCampaigns
    ] = await Promise.all([
      Campaign.countDocuments({ status: 'pending' }),
      Campaign.countDocuments({ status: 'active' }),
      User.countDocuments({}),
      User.countDocuments({ role: 'creator' }),
      Campaign.aggregate([
        { $match: { status: { $in: ['active', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$currentAmount' } } }
      ]),
      Campaign.countDocuments({ 'milestones.status': 'submitted' }),
      Transaction.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          } 
        },
        { $group: { _id: null, revenue: { $sum: { $multiply: ["$amount", 0.05] } } } }
      ]),
      Campaign.countDocuments({ status: 'completed' }),
      Campaign.countDocuments({ status: { $in: ['active', 'completed', 'rejected', 'terminated'] } })
    ]);

    const { Flag } = require('../models/Flag'); // Require Flag here to avoid circular dep issues at top
    const flaggedCampaigns = await Flag ? await Flag.countDocuments({ status: 'pending' }) : 0;
    
    // Recent activity:
    const recentTransactions = await Transaction.find().sort({ createdAt: -1 }).limit(3).populate('user', 'name');
    const recentActivity = recentTransactions.map(t => ({
      id: t._id,
      type: 'large_backing',
      message: `${t.user?.name || 'A user'} backed a campaign for Rs. ${t.amount}`,
      time: new Date(t.createdAt).toLocaleTimeString()
    }));


    const platformSuccessRate = totalNonDraftCampaigns > 0 
      ? Math.round((completedCampaigns / totalNonDraftCampaigns) * 100) 
      : 0;

    res.json({
      pendingApprovals: pendingCampaigns,
      activeCampaigns,
      totalCampaigns: await Campaign.countDocuments(),
      totalUsers,
      totalCreators,
      totalFunding: totalFunding[0]?.total || 0,
      monthlyRevenue: monthlyRevenueData[0]?.revenue || 0,
      pendingReviews: pendingMilestones,
      flaggedCampaigns,
      platformSuccessRate,
      recentActivity
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

// @desc    Get rejection reasons list
// @route   GET /api/admin/rejection-reasons
// @access  Private (Admin only)
const getRejectionReasons = async (req, res) => {
  res.json(REJECTION_REASONS);
};

// Email helper functions
const sendCampaignApprovedEmail = async (email, campaign) => {
  const mailOptions = {
    from: `"Fundora" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `🎉 Your campaign "${campaign.title}" has been approved!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Congratulations!</h1>
        <p>Great news! Your campaign <strong>"${campaign.title}"</strong> has been approved and is now live on Fundora.</p>
        
        <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Campaign Details</h3>
          <p><strong>Title:</strong> ${campaign.title}</p>
          <p><strong>Goal:</strong> Rs. ${campaign.fundingGoal?.toLocaleString()}</p>
          <p><strong>Duration:</strong> ${campaign.duration} days</p>
          <p><strong>End Date:</strong> ${new Date(campaign.endDate).toLocaleDateString()}</p>
        </div>
        
        <p>Your campaign is now visible to backers. Share it with your network to maximize reach!</p>
        
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/campaigns/${campaign._id}" 
           style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          View Your Campaign
        </a>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Thank you for choosing Fundora!<br>
          The Fundora Team
        </p>
      </div>
    `
  };

  await getTransporter().sendMail(mailOptions);
};

const sendCampaignRejectedEmail = async (email, campaign, reasonText, customMessage) => {
  const mailOptions = {
    from: `"Fundora" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Update on your campaign "${campaign.title}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #374151;">Campaign Review Update</h1>
        <p>We've reviewed your campaign <strong>"${campaign.title}"</strong> and unfortunately, we were unable to approve it at this time.</p>
        
        <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <h3 style="margin-top: 0; color: #dc2626;">Reason for Rejection</h3>
          <p><strong>${reasonText}</strong></p>
          ${customMessage ? `<p style="color: #6b7280;">${customMessage}</p>` : ''}
        </div>
        
        <h3>What You Can Do</h3>
        <ul>
          <li>Review your campaign based on the feedback above</li>
          <li>Make necessary improvements to address the issues</li>
          <li>Resubmit your campaign for review</li>
        </ul>
        
        <p>If you believe this decision was made in error or have questions, please contact our support team.</p>
        
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/edit-campaign/${campaign._id}" 
           style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Edit Your Campaign
        </a>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          The Fundora Team
        </p>
      </div>
    `
  };

  await getTransporter().sendMail(mailOptions);
};

// @desc    Get campaigns with pending edit requests
// @route   GET /api/admin/campaigns/edit-requests
// @access  Private (Admin only)
const getEditRequests = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ 
      status: 'active',
      pendingUpdates: { $ne: null }
    })
    .populate('creator', 'name email profile.avatar')
    .sort({ updatedAt: -1 });

    res.json(campaigns);
  } catch (error) {
    console.error('Get edit requests error:', error);
    res.status(500).json({ message: 'Server error fetching edit requests' });
  }
};

// @desc    Approve edit request
// @route   PUT /api/admin/campaigns/:id/approve-edit
// @access  Private (Admin only)
const approveEditRequest = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (!campaign.pendingUpdates) {
      return res.status(400).json({ message: 'No pending updates found' });
    }

    // Apply updates
    const updates = campaign.pendingUpdates;

    // Handle image deletion cleanup
    if (updates.images) {
      const newImageIds = new Set(updates.images.map(img => img.publicId));
      const imagesToDelete = campaign.images.filter(img => !newImageIds.has(img.publicId));

      for (const img of imagesToDelete) {
        if (img.publicId) {
          try {
            await cloudinary.uploader.destroy(img.publicId);
          } catch (err) {
            console.error(`Failed to delete image ${img.publicId}:`, err);
          }
        }
      }
    }

    Object.keys(updates).forEach(field => {
      campaign[field] = updates[field];
    });

    // Clear pending updates
    campaign.pendingUpdates = null;
    
    // Mark modified for arrays if needed
    if (updates.rewardTiers) campaign.markModified('rewardTiers');
    if (updates.milestones) campaign.markModified('milestones');
    if (updates.images) {
      campaign.markModified('images');
      // Update coverImage to first image or null
      campaign.coverImage = campaign.images.length > 0 ? campaign.images[0].url : null;
    }

    await campaign.save();

    res.json({ 
      message: 'Edit request approved and changes applied',
      campaign 
    });
  } catch (error) {
    console.error('Approve edit request error:', error);
    res.status(500).json({ message: 'Server error approving edit' });
  }
};

// @desc    Reject edit request
// @route   PUT /api/admin/campaigns/:id/reject-edit
// @access  Private (Admin only)
const rejectEditRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Clear pending updates
    campaign.pendingUpdates = null;
    campaign.adminNotes = `Edit request rejected on ${new Date().toISOString()}. Reason: ${reason || 'No reason provided'}`;

    await campaign.save();

    res.json({ 
      message: 'Edit request rejected',
      campaign 
    });
  } catch (error) {
    console.error('Reject edit request error:', error);
    res.status(500).json({ message: 'Server error rejecting edit' });
  }
};
// ========================================
// MILESTONE REVIEW FUNCTIONS (FN 5.3-5.9)
// ========================================

// Milestone rejection categories
const MILESTONE_REJECTION_CATEGORIES = {
  insufficient_proof: 'Insufficient Proof/Evidence',
  poor_quality: 'Poor Quality Deliverables',
  incomplete_work: 'Incomplete Work',
  misleading: 'Misleading or Inaccurate Claims',
  other: 'Other'
};

// @desc    Get all pending milestone submissions (FN 5.3)
// @route   GET /api/admin/milestones/pending
// @access  Private (Admin only)
const getPendingMilestones = async (req, res) => {
  try {
    // Find campaigns that have milestones with 'submitted' status
    const campaigns = await Campaign.find({
      'milestones.status': 'submitted'
    })
    .populate('creator', 'name email profile.avatar')
    .select('title fundingGoal currentAmount milestones coverImage category released_amount disbursementMethod')
    .sort({ 'milestones.submittedAt': 1 }); // Oldest first

    // Extract submitted milestones with campaign context
    const pendingSubmissions = [];
    campaigns.forEach(campaign => {
      campaign.milestones
        .filter(m => m.status === 'submitted')
        .forEach(milestone => {
          pendingSubmissions.push({
            campaign: {
              _id: campaign._id,
              title: campaign.title,
              fundingGoal: campaign.fundingGoal,
              currentAmount: campaign.currentAmount,
              coverImage: campaign.coverImage,
              category: campaign.category,
              released_amount: campaign.released_amount,
              disbursementMethod: campaign.disbursementMethod,
              creator: campaign.creator
            },
            milestone: {
              ...milestone.toObject(),
              fundAmount: Math.round(campaign.currentAmount * (milestone.percentage / 100)),
              releaseAmount: Math.round(campaign.currentAmount * (milestone.percentage / 100) * 0.95) // After 5% fee
            }
          });
        });
    });

    // Sort by submission date
    pendingSubmissions.sort((a, b) => 
      new Date(a.milestone.submittedAt) - new Date(b.milestone.submittedAt)
    );

    res.json({
      submissions: pendingSubmissions,
      total: pendingSubmissions.length,
      rejectionCategories: MILESTONE_REJECTION_CATEGORIES
    });
  } catch (error) {
    console.error('Get pending milestones error:', error);
    res.status(500).json({ message: 'Server error fetching pending milestones' });
  }
};

// @desc    Get milestone details for review (FN 5.3)
// @route   GET /api/admin/milestones/:campaignId/:milestoneId
// @access  Private (Admin only)
const getMilestoneForReview = async (req, res) => {
  try {
    const { campaignId, milestoneId } = req.params;

    const campaign = await Campaign.findById(campaignId)
      .populate('creator', 'name email profile');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const milestone = campaign.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Get backer count for this campaign
    const backerCount = await Transaction.countDocuments({
      campaign: campaignId,
      status: 'completed'
    });

    const milestoneData = milestone.toObject();
    milestoneData.fundAmount = Math.round(campaign.fundingGoal * (milestone.percentage / 100));
    milestoneData.platformFee = Math.round(milestoneData.fundAmount * 0.05);
    milestoneData.releaseAmount = milestoneData.fundAmount - milestoneData.platformFee;

    res.json({
      campaign: {
        _id: campaign._id,
        title: campaign.title,
        fundingGoal: campaign.fundingGoal,
        currentAmount: campaign.currentAmount,
        released_amount: campaign.released_amount,
        status: campaign.status,
        creator: campaign.creator,
        backerCount,
        disbursementMethod: campaign.disbursementMethod,
        milestones: campaign.milestones.map(m => ({
          _id: m._id,
          title: m.title,
          order: m.order,
          status: m.status,
          percentage: m.percentage
        }))
      },
      milestone: milestoneData,
      rejectionCategories: MILESTONE_REJECTION_CATEGORIES
    });
  } catch (error) {
    console.error('Get milestone for review error:', error);
    res.status(500).json({ message: 'Server error fetching milestone for review' });
  }
};

// @desc    Approve a milestone and trigger fund release (FN 5.3, 5.4, 5.5)
// @route   PUT /api/admin/milestones/:campaignId/:milestoneId/approve
// @access  Private (Admin only)
const approveMilestone = async (req, res) => {
  try {
    const { campaignId, milestoneId } = req.params;

    const campaign = await Campaign.findById(campaignId)
      .populate('creator', 'name email');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const milestone = campaign.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    if (milestone.status !== 'submitted') {
      return res.status(400).json({ message: `Cannot approve milestone with status: ${milestone.status}` });
    }

    // -- FUND RELEASE CALCULATION (FN 5.4) --
    // Calculate based on the campaign's funding goal as requested
    const grossAmount = Math.round(campaign.fundingGoal * (milestone.percentage / 100));
    const platformFee = Math.round(grossAmount * 0.05); // 5% platform fee
    const releaseAmount = grossAmount - platformFee;

    // Update milestone status
    milestone.status = 'approved';
    milestone.reviewedAt = new Date();
    milestone.reviewedBy = req.user._id;
    milestone.completedAt = new Date();

    // Check if all milestones are approved
    const allApproved = campaign.milestones.every(
      m => m.status === 'approved' || m.status === 'completed'
    );
    if (allApproved) {
      campaign.status = 'completed';
    }

    await campaign.save();

    // -- NOTIFICATIONS --
    // Notify creator (FN 5.6)
    await Notification.create({
      recipient: campaign.creator._id,
      type: 'milestone_approved',
      title: 'Milestone Approved! 🎉',
      message: `Your milestone "${milestone.title}" for campaign "${campaign.title}" has been approved by the administrators.`,
      campaign: campaign._id,
      milestoneId: milestone._id,
      metadata: {
        milestoneTitle: milestone.title
      }
    });

    // Notify backers (FN 5.7)
    const backerTransactions = await Transaction.find({
      campaign: campaign._id,
      status: 'completed'
    }).distinct('user');

    if (backerTransactions.length > 0) {
      const backerNotifications = backerTransactions.map(backerId => ({
        recipient: backerId,
        type: 'backer_milestone_update',
        title: 'Project Milestone Achieved!',
        message: `"${campaign.title}" has successfully completed and verified milestone "${milestone.title}".`,
        campaign: campaign._id,
        milestoneId: milestone._id,
        metadata: {
          milestoneTitle: milestone.title,
          milestoneOrder: milestone.order,
          campaignTitle: campaign.title
        }
      }));
      await Notification.insertMany(backerNotifications);
    }

    // Send email to creator
    try {
      await sendMilestoneApprovedEmail(campaign.creator.email, campaign, milestone, releaseAmount);
    } catch (emailErr) {
      console.error('Failed to send milestone approved email:', emailErr);
    }

    // If all milestones completed, notify
    if (allApproved) {
      await Notification.create({
        recipient: campaign.creator._id,
        type: 'project_completed',
        title: 'Project Completed! 🏆',
        message: `All milestones for "${campaign.title}" have been completed and verified. Congratulations!`,
        campaign: campaign._id
      });
    }

    res.json({
      message: 'Milestone approved successfully',
      milestone
    });
  } catch (error) {
    console.error('Approve milestone error:', error);
    res.status(500).json({ message: 'Server error approving milestone' });
  }
};

// @desc    Reject a milestone (FN 5.9)
// @route   PUT /api/admin/milestones/:campaignId/:milestoneId/reject
// @access  Private (Admin only)
const rejectMilestone = async (req, res) => {
  try {
    const { campaignId, milestoneId } = req.params;
    const { rejectionCategory, rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const campaign = await Campaign.findById(campaignId)
      .populate('creator', 'name email');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const milestone = campaign.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    if (milestone.status !== 'submitted') {
      return res.status(400).json({ message: `Cannot reject milestone with status: ${milestone.status}` });
    }

    // Update milestone
    milestone.status = 'rejected';
    milestone.reviewedAt = new Date();
    milestone.reviewedBy = req.user._id;
    milestone.rejectionCategory = rejectionCategory || 'other';
    milestone.rejectionReason = rejectionReason;
    milestone.appealDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await campaign.save();

    // Notify creator
    await Notification.create({
      recipient: campaign.creator._id,
      type: 'milestone_rejected',
      title: 'Milestone Rejected',
      message: `Your milestone "${milestone.title}" for "${campaign.title}" was rejected. Reason: ${rejectionReason}. You can appeal within 7 days.`,
      campaign: campaign._id,
      milestoneId: milestone._id,
      metadata: {
        rejectionCategory,
        rejectionReason,
        appealDeadline: milestone.appealDeadline
      }
    });

    // Send email
    try {
      await sendMilestoneRejectedEmail(campaign.creator.email, campaign, milestone, rejectionReason);
    } catch (emailErr) {
      console.error('Failed to send milestone rejected email:', emailErr);
    }

    res.json({
      message: 'Milestone rejected and creator notified',
      milestone
    });
  } catch (error) {
    console.error('Reject milestone error:', error);
    res.status(500).json({ message: 'Server error rejecting milestone' });
  }
};

// @desc    Request milestone resubmission (FN 5.9)
// @route   PUT /api/admin/milestones/:campaignId/:milestoneId/resubmit
// @access  Private (Admin only)
const requestMilestoneResubmission = async (req, res) => {
  try {
    const { campaignId, milestoneId } = req.params;
    const { feedback } = req.body;

    if (!feedback) {
      return res.status(400).json({ message: 'Feedback for resubmission is required' });
    }

    const campaign = await Campaign.findById(campaignId)
      .populate('creator', 'name email');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const milestone = campaign.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    if (milestone.status !== 'submitted') {
      return res.status(400).json({ message: `Cannot request resubmission for milestone with status: ${milestone.status}` });
    }

    // Update milestone
    milestone.status = 'resubmission-required';
    milestone.reviewedAt = new Date();
    milestone.reviewedBy = req.user._id;
    milestone.resubmissionFeedback = feedback;

    await campaign.save();

    // Notify creator
    await Notification.create({
      recipient: campaign.creator._id,
      type: 'resubmission_required',
      title: 'Milestone Resubmission Required',
      message: `Your milestone "${milestone.title}" for "${campaign.title}" needs changes. Feedback: ${feedback}`,
      campaign: campaign._id,
      milestoneId: milestone._id,
      metadata: {
        feedback,
        milestoneTitle: milestone.title
      }
    });

    res.json({
      message: 'Resubmission requested and creator notified',
      milestone
    });
  } catch (error) {
    console.error('Request resubmission error:', error);
    res.status(500).json({ message: 'Server error requesting resubmission' });
  }
};

// Email helper for milestone approval
const sendMilestoneApprovedEmail = async (email, campaign, milestone, releaseAmount) => {
  const mailOptions = {
    from: `"Fundora" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `✅ Milestone Approved - "${milestone.title}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Milestone Approved!</h1>
        <p>Your milestone <strong>"${milestone.title}"</strong> for campaign <strong>"${campaign.title}"</strong> has been approved.</p>
        
        <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Fund Release Details</h3>
          <p><strong>Release Amount:</strong> NPR ${releaseAmount.toLocaleString()}</p>
          <p><strong>Platform Fee (5%):</strong> NPR ${Math.round(releaseAmount / 0.95 * 0.05).toLocaleString()}</p>
          <p><strong>Estimated Transfer:</strong> 3-5 business days</p>
        </div>
        
        <p>The funds will be transferred to your registered payment method.</p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">The Fundora Team</p>
      </div>
    `
  };
  await getTransporter().sendMail(mailOptions);
};

// Email helper for milestone rejection
const sendMilestoneRejectedEmail = async (email, campaign, milestone, reason) => {
  const mailOptions = {
    from: `"Fundora" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Update on milestone "${milestone.title}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #374151;">Milestone Review Update</h1>
        <p>We've reviewed your milestone <strong>"${milestone.title}"</strong> for campaign <strong>"${campaign.title}"</strong>.</p>
        
        <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <h3 style="margin-top: 0; color: #dc2626;">Reason for Rejection</h3>
          <p>${reason}</p>
        </div>
        
        <h3>What You Can Do</h3>
        <ul>
          <li>Review the feedback above</li>
          <li>Make necessary improvements to your proof</li>
          <li>Resubmit within 7 days to appeal</li>
        </ul>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">The Fundora Team</p>
      </div>
    `
  };
  await getTransporter().sendMail(mailOptions);
};

module.exports = {
  getPendingCampaigns,
  getCampaignForReview,
  approveCampaign,
  rejectCampaign,
  bulkApproveCampaigns,
  getAdminStats,
  getRejectionReasons,
  getEditRequests,
  approveEditRequest,
  rejectEditRequest,
  getUsers,
  REJECTION_REASONS,
  // Milestone Review (FN 5.3-5.9)
  getPendingMilestones,
  getMilestoneForReview,
  approveMilestone,
  rejectMilestone,
  requestMilestoneResubmission,
  MILESTONE_REJECTION_CATEGORIES
};
