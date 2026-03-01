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

const crypto = require('crypto');

// Helper to create signature for eSewa
const createEsewaSignature = (message) => {
  const secret = process.env.ESEWA_SECRET_KEY;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(message);
  return hmac.digest('base64');
};

// Helper to decode base64
const decodeBase64 = (str) => {
  return Buffer.from(str, 'base64').toString('utf-8');
};

// @desc    Initiate payment gateway for fund release (Simulated B2B)
// @route   POST /api/admin/fund-releases/:id/initiate-payment
// @access  Private (Admin only)
const initiateDisbursementPayment = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const release = await FundRelease.findById(req.params.id).populate('campaign');
    
    if (!release) {
      return res.status(404).json({ message: 'Fund release not found' });
    }

    if (release.disbursementStatus === 'completed') {
      return res.status(400).json({ message: 'Funds already disbursed' });
    }

    const amount = release.amount;
    const transactionId = `DISB-${release._id.toString().slice(-6)}-${Date.now()}`;

    // Temporarily save tracking ID
    release.transactionReference = transactionId;
    await release.save();

    if (paymentMethod === 'esewa') {
      const productCode = process.env.ESEWA_PRODUCT_CODE;
      const signatureMessage = `total_amount=${amount},transaction_uuid=${transactionId},product_code=${productCode}`;
      const signature = createEsewaSignature(signatureMessage);

      // We override success/failure URLs to route back to admin disbursement verification
      return res.status(200).json({
        paymentMethod: 'esewa',
        formData: {
          amount: amount,
          failure_url: 'http://localhost:5173/admin/fund-disbursements?status=failure',
          product_delivery_charge: "0",
          product_service_charge: "0",
          product_code: productCode,
          signature: signature,
          signed_field_names: "total_amount,transaction_uuid,product_code",
          success_url: `http://localhost:5173/admin/fund-disbursements/verify-esewa/${release._id}`,
          tax_amount: "0",
          total_amount: amount,
          transaction_uuid: transactionId
        },
        formUrl: "https://rc-epay.esewa.com.np/api/epay/main/v2/form" 
      });

    } else if (paymentMethod === 'khalti') {
      const payload = {
        return_url: `http://localhost:5173/admin/fund-disbursements/verify-khalti/${release._id}`,
        website_url: "http://localhost:5173",
        amount: Math.round(amount * 100), // Khalti expects paisa (integer)
        purchase_order_id: transactionId,
        purchase_order_name: `Payout ${release.campaign.title.substring(0, 20)}`,
        customer_info: {
          name: req.user.name || "Admin Disburser",
          email: req.user.email || "admin@fundora.com",
          phone: "9800000001" 
        }
      };

      const response = await fetch(process.env.KHALTI_INITIATE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!data.pidx) {
        throw new Error(data.detail || 'Khalti initialization failed');
      }

      // Track pidx for verification
      release.transactionReference = data.pidx;
      await release.save();

      return res.status(200).json({
        paymentMethod: 'khalti',
        paymentUrl: data.payment_url,
        pidx: data.pidx
      });
    } else {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

  } catch (error) {
    console.error('Initiate disbursement payment error:', error);
    res.status(500).json({ message: 'Server error initializing disbursement payment' });
  }
};

// @desc    Verify eSewa Disbursement
// @route   POST /api/admin/fund-releases/verify-esewa
// @access  Private (Admin only)
const verifyDisbursementEsewa = async (req, res) => {
    try {
        const { data, releaseId } = req.body;
        if (!data || !releaseId) {
            return res.status(400).json({ message: 'Missing verification data' });
        }

        const decodedData = JSON.parse(decodeBase64(data));
        
        if (decodedData.status !== 'COMPLETE') {
            return res.status(400).json({ message: 'Payment failed or cancelled' });
        }

        const release = await FundRelease.findById(releaseId).populate({
            path: 'campaign',
            populate: { path: 'creator' }
        });

        if (!release) return res.status(404).json({ message: 'Release not found' });
        
        if (release.disbursementStatus === 'completed') {
            return res.status(200).json({ message: 'Already completed', release });
        }

        // Finalize Release
        release.disbursementStatus = 'completed';
        release.status = 'released';
        release.disbursementMethod = 'esewa';
        release.disbursedAt = new Date();
        await release.save();

        // Update underlying transactions payout status
        if (release.transactions && release.transactions.length > 0) {
            await Transaction.updateMany(
                { _id: { $in: release.transactions } },
                { $set: { payoutStatus: 'paid', payoutDate: new Date() } }
            );
        }

        // Notify Creator
        const Notification = require('../models/Notification');
        await Notification.create({
            recipient: release.campaign.creator._id,
            type: 'fund_disbursed',
            title: 'Funds Transferred Successfully',
            message: `NPR ${release.amount.toLocaleString()} has been transferred via eSewa. Ref: ${decodedData.transaction_code}`,
            campaign: release.campaign._id
        });

        // Send Email Receipt
        const emailService = require('../utils/emailService');
        await emailService.sendDisbursementReceiptEmail(release, release.campaign, release.campaign.creator);

        res.status(200).json({ message: 'Disbursement successful', release });
    } catch (error) {
        console.error('eSewa Verification Error:', error);
        res.status(500).json({ message: 'Disbursement verification failed' });
    }
};

// @desc    Verify Khalti Disbursement
// @route   POST /api/admin/fund-releases/verify-khalti
// @access  Private (Admin only)
const verifyDisbursementKhalti = async (req, res) => {
    try {
        const { pidx, releaseId } = req.body;
        if (!pidx || !releaseId) {
            return res.status(400).json({ message: 'Missing pidx or releaseId' });
        }

        const response = await fetch(process.env.KHALTI_LOOKUP_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pidx })
        });

        const data = await response.json();

        if (data.status !== 'Completed') {
            return res.status(400).json({ message: 'Payment not completed', status: data.status });
        }

        const release = await FundRelease.findById(releaseId).populate({
            path: 'campaign',
            populate: { path: 'creator' }
        });

        if (!release) return res.status(404).json({ message: 'Release not found' });
        
        if (release.disbursementStatus === 'completed') {
            return res.status(200).json({ message: 'Already completed', release });
        }

        // Finalize Release
        release.disbursementStatus = 'completed';
        release.status = 'released';
        release.disbursementMethod = 'khalti';
        release.disbursedAt = new Date();
        await release.save();

        // Update underlying transactions payout status
        if (release.transactions && release.transactions.length > 0) {
            await Transaction.updateMany(
                { _id: { $in: release.transactions } },
                { $set: { payoutStatus: 'paid', payoutDate: new Date() } }
            );
        }

        // Notify Creator
        const Notification = require('../models/Notification');
        await Notification.create({
            recipient: release.campaign.creator._id,
            type: 'fund_disbursed',
            title: 'Funds Transferred Successfully',
            message: `NPR ${release.amount.toLocaleString()} has been transferred via Khalti. Ref: ${data.transaction_id}`,
            campaign: release.campaign._id
        });

        // Send Email Receipt
        const emailService = require('../utils/emailService');
        await emailService.sendDisbursementReceiptEmail(release, release.campaign, release.campaign.creator);

        res.status(200).json({ message: 'Disbursement successful', release });
    } catch (error) {
        console.error('Khalti Verification Error:', error);
        res.status(500).json({ message: 'Disbursement verification failed' });
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

const Transaction = require('../models/Transaction');

// @desc    Get campaigns eligible for payouts (based on pending transactions)
// @route   GET /api/admin/fund-releases/eligible
// @access  Private (Admin only)
const getEligiblePayouts = async (req, res) => {
  try {
    // 1. Aggregate pending backer transactions
    const aggregatedPayouts = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          payoutStatus: 'pending'
        }
      },
      {
        $group: {
          _id: '$campaign',
          grossAvailable: { $sum: '$amount' },
          transactionIds: { $push: '$_id' }
        }
      }
    ]);

    // 2. Populate campaign and creator details
    const populatedPayouts = await Campaign.populate(aggregatedPayouts, {
      path: '_id',
      populate: [
        { path: 'creator', select: 'name email' },
        { path: 'milestones' }
      ]
    });

    const payouts = populatedPayouts.map(agg => {
      const camp = agg._id; // The populated campaign object
      if (!camp) return null; // Defensive check

      const isDonation = camp.fundingType === 'donation-based';
      const isMilestone = camp.fundingType === 'milestone-based';
      
      let platformFee = 0;
      let netAmount = 0;
      let grossAvailable = 0;

      if (isMilestone) {
        // For milestone campaigns, pending transactions don't accurately reflect payout availability
        // since approveMilestone doesn't strictly link them.
        // We calculate max releasable based on total funded vs released.
        grossAvailable = Math.max(0, camp.currentAmount - (camp.released_amount || 0));
        platformFee = Math.round(grossAvailable * 0.05); // Calculate total remaining theoretical fee
        netAmount = grossAvailable > 0 ? grossAvailable - platformFee : 0;
      } else {
        // For reward/donation, rely on aggregated un-paid transactions
        grossAvailable = agg.grossAvailable;
        platformFee = isDonation ? 0 : Math.round(grossAvailable * 0.05);
        netAmount = grossAvailable > 0 ? grossAvailable - platformFee : 0;
      }
      
      let pendingMilestonesCount = 0;
      if (isMilestone && camp.milestones) {
          pendingMilestonesCount = camp.milestones.filter(m => m.status !== 'approved' && m.status !== 'completed').length;
      }

      // Only return if there is actually a net amount to pay out
      if (netAmount <= 0) return null;

      return {
        campaignId: camp._id,
        title: camp.title,
        fundingType: camp.fundingType,
        totalFunded: camp.currentAmount, // Used for displaying Total Funded
        alreadyReleased: camp.released_amount || 0,
        grossAvailable: isMilestone ? camp.currentAmount - (camp.released_amount || 0) : agg.grossAvailable,
        platformFee,
        netAmount,
        creator: camp.creator,
        pendingMilestonesCount
      };
    }).filter(Boolean); // Remove nulls if any campaign was deleted or netAmount <= 0

    res.json(payouts);

  } catch (error) {
    console.error('Get eligible payouts error:', error);
    res.status(500).json({ message: 'Server error fetching eligible payouts' });
  }
};

// @desc    Release funds for campaigns (supports partial/sub-payments)
// @route   POST /api/admin/fund-releases/campaign/:id
// @access  Private (Admin only)
const releaseCampaignFunds = async (req, res) => {
  try {
    const campaignId = req.params.id;
    const campaign = await Campaign.findById(campaignId).populate('creator');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const overrideMilestone = req.body.overrideMilestone;
    const requestedAmount = req.body.amount ? parseFloat(req.body.amount) : null;

    if (campaign.fundingType === 'milestone-based' && !overrideMilestone) {
      return res.status(400).json({ message: 'Milestone campaigns must be released via milestone review, or explicitly overridden.' });
    }

    // 1. Fetch pending transactions as baseline available funds
    const pendingTransactions = await Transaction.find({
      campaign: campaignId,
      status: 'completed',
      payoutStatus: 'pending'
    });

    // 2. Determine max available
    let maxAvailable = 0;
    
    if (campaign.fundingType === 'milestone-based') {
       // Milestone campaigns calculate availability based on overall progress
       maxAvailable = Math.max(0, campaign.currentAmount - (campaign.released_amount || 0));
    } else {
       // Rewards/Donations base it strictly on untransferred transactions
       maxAvailable = pendingTransactions.reduce((acc, tx) => acc + tx.amount, 0);
    }
    
    if (maxAvailable <= 0) {
      return res.status(400).json({ message: 'No available funds to release' });
    }

    // Calculate gross amount taking into account user's custom amount override
    let grossAvailable = maxAvailable;

    if (requestedAmount && requestedAmount > 0) {
       // The requestedAmount typically represents the targeted Net Amount the admin typed in,
       // OR the admin wants to release a specific Gross Amount. 
       // Often, admin inputs "I want to release exactly X net".
       // Let's assume req.body.amount is the requested NET amount.
       const isDonation = campaign.fundingType === 'donation-based';
       const targetNet = requestedAmount;
       
       // gross = net / 0.95
       const targetGross = isDonation ? targetNet : Math.round(targetNet / 0.95);
       
       if (targetGross > maxAvailable) {
         return res.status(400).json({ 
           message: `Requested amount exceeds available limit. Max Net Releasable is NPR ${isDonation ? maxAvailable : Math.floor(maxAvailable * 0.95)}`
         });
       }
       grossAvailable = targetGross;
    }

    const isDonation = campaign.fundingType === 'donation-based';
    const platformFee = isDonation ? 0 : Math.round(grossAvailable * 0.05);
    const netAmount = grossAvailable - platformFee;

    // We only attach specific transaction IDs for non-milestone campaigns
    // For milestone campaigns, tracking individual transactions adds huge complexity during partial payouts
    let transactionIds = [];
    if (campaign.fundingType !== 'milestone-based') {
        transactionIds = pendingTransactions.map(tx => tx._id);
    }

    // 3. Create Fund Release Record
    const fundRelease = await FundRelease.create({
      campaign: campaign._id,
      grossAmount: grossAvailable,
      platformFee,
      amount: netAmount,
      approvedBy: req.user._id,
      disbursementMethod: campaign.disbursementMethod || 'esewa',
      disbursementStatus: 'pending',
      transactions: transactionIds
    });

    // 4. Mark Transactions as Processing
    if (transactionIds.length > 0) {
      await Transaction.updateMany(
        { _id: { $in: transactionIds } },
        { $set: { payoutStatus: 'processing' } }
      );
    }

    // Update Campaign (sync legacy field just in case)
    campaign.released_amount = (campaign.released_amount || 0) + grossAvailable;
    await campaign.save();

    // Create Notification
    const Notification = require('../models/Notification');
    await Notification.create({
      recipient: campaign.creator._id,
      type: 'funds_released',
      title: 'Funds Released for Campaign',
      message: `NPR ${netAmount.toLocaleString()} has been queued for disbursement (Platform Fee: NPR ${platformFee.toLocaleString()}).`,
      campaign: campaign._id
    });

    res.status(201).json({
      message: 'Funds released successfully',
      fundRelease
    });
  } catch (error) {
    console.error('Release campaign funds error:', error);
    res.status(500).json({ message: 'Server error releasing campaign funds' });
  }
};

// @desc    Rollback a fund release
// @route   POST /api/admin/fund-releases/:id/rollback
// @access  Private (Admin only)
const rollbackDisbursement = async (req, res) => {
  try {
    const release = await FundRelease.findById(req.params.id);

    if (!release) {
      return res.status(404).json({ message: 'Fund release not found' });
    }

    if (release.disbursementStatus === 'completed') {
      return res.status(400).json({ message: 'Cannot rollback a completed disbursement' });
    }

    const campaign = await Campaign.findById(release.campaign);
    if (!campaign) {
      return res.status(404).json({ message: 'Associated campaign not found' });
    }

    // Decrement the released_amount 
    // We adjust by grossAmount because in releaseCampaignFunds we incremented by grossAvailable
    campaign.released_amount = Math.max(0, (campaign.released_amount || 0) - release.grossAmount);
    await campaign.save();

    // Revert associated transactions if any
    if (release.transactions && release.transactions.length > 0) {
      await Transaction.updateMany(
        { _id: { $in: release.transactions } },
        { $set: { payoutStatus: 'pending' } }
      );
    }

    // Delete the fund release record
    await FundRelease.findByIdAndDelete(release._id);

    res.json({ message: 'Disbursement rolled back successfully' });
  } catch (error) {
    console.error('Rollback disbursement error:', error);
    res.status(500).json({ message: 'Server error rolling back disbursement' });
  }
};

module.exports = {
  getFundReleaseHistory,
  initiateDisbursementPayment,
  verifyDisbursementEsewa,
  verifyDisbursementKhalti,
  getAllFundReleases,
  getEligiblePayouts,
  releaseCampaignFunds,
  rollbackDisbursement
};
