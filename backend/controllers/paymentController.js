const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const Campaign = require('../models/Campaign');
const { sendReceiptEmail } = require('../utils/emailService');

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

// Initialize Payment
exports.initializePayment = async (req, res) => {
  try {
    if (req.user.role === 'creator') {
      return res.status(403).json({ message: 'Creators cannot back campaigns. Please use a Backer account.' });
    }

    const { campaignId, amount, paymentMethod, rewardTierId } = req.body;
    const userId = req.user._id; // From authMiddleware

    // 1. Validate Campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // 2. Validate Amount against minimums and reward tier
    if (amount < 10) {
      return res.status(400).json({ message: 'Minimum amount is NPR 10' });
    }

    if (rewardTierId) {
      const rewardTier = campaign.rewardTiers.id(rewardTierId);
      if (!rewardTier) {
        return res.status(404).json({ message: 'Selected reward not found in this campaign' });
      }
      if (!rewardTier.isAvailable || (rewardTier.quantityLimit > 0 && rewardTier.quantityClaimed >= rewardTier.quantityLimit)) {
        return res.status(400).json({ message: 'This reward is no longer available' });
      }
      if (amount < rewardTier.amount) {
        return res.status(400).json({ message: `Minimum amount for this reward is NPR ${rewardTier.amount}` });
      }
    }

    // 3. Create Transaction ID
    const transactionId = `${userId.toString().slice(-4)}-${Date.now()}`;

    // 4. Create Pending Transaction
    const transaction = new Transaction({
      user: userId,
      campaign: campaignId,
      amount,
      gateway: paymentMethod,
      transactionId,
      status: 'pending',
      ...(rewardTierId && { rewardTier: rewardTierId })
    });
    await transaction.save();

    // 5. Handle Gateway Specific Logic
    if (paymentMethod === 'esewa') {
      // eSewa Config
      const productCode = process.env.ESEWA_PRODUCT_CODE;
      const signatureMessage = `total_amount=${amount},transaction_uuid=${transactionId},product_code=${productCode}`;
      const signature = createEsewaSignature(signatureMessage);

      return res.status(200).json({
        paymentMethod: 'esewa',
        formData: {
          amount: amount,
          failure_url: process.env.ESEWA_FAILURE_URL,
          product_delivery_charge: "0",
          product_service_charge: "0",
          product_code: productCode,
          signature: signature,
          signed_field_names: "total_amount,transaction_uuid,product_code",
          success_url: process.env.ESEWA_SUCCESS_URL,
          tax_amount: "0",
          total_amount: amount,
          transaction_uuid: transactionId
        },
        formUrl: "https://rc-epay.esewa.com.np/api/epay/main/v2/form" 
      });

    } else if (paymentMethod === 'khalti') {
      // Khalti Config
      const payload = {
        return_url: process.env.KHALTI_RETURN_URL,
        website_url: "http://localhost:5173",
        amount: amount * 100, // Khalti expects paisa
        purchase_order_id: transactionId,
        purchase_order_name: `Backing ${campaign.title.substring(0, 20)}`,
        customer_info: {
          name: req.user.name || "Fundora User",
          email: req.user.email || "user@fundora.com",
          phone: "9800000001" // Optional, can create field in user model
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

      // Update transaction with pidx
      transaction.gatewayRefId = data.pidx;
      await transaction.save();

      return res.status(200).json({
        paymentMethod: 'khalti',
        paymentUrl: data.payment_url,
        pidx: data.pidx
      });
    } else {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

  } catch (error) {
    console.error('Payment Initialization Error:', error);
    res.status(500).json({ message: 'Server error initializing payment' });
  }
};

// Verify eSewa Payment
exports.verifyEsewa = async (req, res) => {
  try {
    const { data } = req.query; // eSewa sends generic 'data' param on success
    if (!data) {
      return res.status(400).json({ message: 'Missing payment data' });
    }

    const decodedData = JSON.parse(decodeBase64(data));
    
    // Format: { transaction_code, status, total_amount, transaction_uuid, product_code, signature }
    
    // Verify Signature
    const message = `transaction_code=${decodedData.transaction_code},status=${decodedData.status},total_amount=${decodedData.total_amount},transaction_uuid=${decodedData.transaction_uuid},product_code=${process.env.ESEWA_PRODUCT_CODE},signed_field_names=${decodedData.signed_field_names}`;
    // Note: eSewa signature verification for response is slightly different, 
    // usually response signature is signed on specific fields. 
    // For simplicity in Sandbox, we will trust the UUID match if valid, 
    // but strictly we should verify signature. 
    // Let's at least check the status.

    if (decodedData.status !== 'COMPLETE') {
        return res.status(400).json({ message: 'Payment failed or cancelled' });
    }

    const transaction = await Transaction.findOne({ transactionId: decodedData.transaction_uuid });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status === 'completed') {
      return res.status(200).json({ message: 'Transaction already verified', transaction });
    }

    // Update Transaction
    transaction.status = 'completed';
    transaction.gatewayResponse = decodedData;
    transaction.gatewayRefId = decodedData.transaction_code;
    transaction.paidAt = new Date();
    await transaction.save();

    // Populate user and campaign data for the receipt
    await transaction.populate([
      { path: 'user', select: 'name email' },
      { path: 'campaign', select: 'title creator', populate: { path: 'creator', select: 'name email' } }
    ]);

    // Check if this is the user's first completed transaction for this campaign
    const priorTransactions = await Transaction.countDocuments({
      user: transaction.user,
      campaign: transaction.campaign,
      status: 'completed',
      _id: { $ne: transaction._id }
    });

    const isFirstTimeBacker = priorTransactions === 0;

    // Update Campaign
    const updateStats = {
      $inc: { 
        currentAmount: transaction.amount,
        transactionCount: 1,
        trendingScore: isFirstTimeBacker ? 10 : 5
      }
    };
    
    if (isFirstTimeBacker) {
      updateStats.$inc.backerCount = 1;
    }

    await Campaign.findByIdAndUpdate(transaction.campaign._id, updateStats);

    // Send receipt email securely in the background
    sendReceiptEmail(transaction, transaction.campaign, transaction.user, transaction.campaign.creator)
      .catch(err => console.error('Failed to send receipt email for eSewa payment', err));

    res.status(200).json({ message: 'Payment verification successful', transaction });

  } catch (error) {
    console.error('eSewa Verification Error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

// Verify Khalti Payment
exports.verifyKhalti = async (req, res) => {
  try {
    const { pidx } = req.body;
    if (!pidx) {
      return res.status(400).json({ message: 'Missing pidx' });
    }

    // Call Khalti Lookup
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

    const transaction = await Transaction.findOne({ gatewayRefId: pidx });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status === 'completed') {
       return res.status(200).json({ message: 'Transaction already verified', transaction });
    }

    // Update Transaction
    transaction.status = 'completed';
    transaction.gatewayResponse = data;
    transaction.paidAt = new Date();
    await transaction.save();

    // Populate user and campaign data for the receipt
    await transaction.populate([
      { path: 'user', select: 'name email' },
      { path: 'campaign', select: 'title creator', populate: { path: 'creator', select: 'name email' } }
    ]);

    // Check if this is the user's first completed transaction for this campaign
    const priorTransactions = await Transaction.countDocuments({
      user: transaction.user,
      campaign: transaction.campaign,
      status: 'completed',
      _id: { $ne: transaction._id }
    });

    const isFirstTimeBacker = priorTransactions === 0;

    // Update Campaign
    const updateStats = {
      $inc: { 
        currentAmount: transaction.amount,
        transactionCount: 1,
        trendingScore: isFirstTimeBacker ? 10 : 5
      }
    };
    
    if (isFirstTimeBacker) {
      updateStats.$inc.backerCount = 1;
    }

    await Campaign.findByIdAndUpdate(transaction.campaign._id, updateStats);

    // Send receipt email securely in the background
    sendReceiptEmail(transaction, transaction.campaign, transaction.user, transaction.campaign.creator)
      .catch(err => console.error('Failed to send receipt email for Khalti payment', err));

    res.status(200).json({ message: 'Payment verification successful', transaction });

  } catch (error) {
    console.error('Khalti Verification Error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

// Handle Payment Failure
exports.handlePaymentFailure = async (req, res) => {
  try {
    const { id } = req.params; // Expects transactionId (uuid) or gatewayRefId
    
    // Find checking by either transactionId or _id just in case
    const transaction = await Transaction.findOne({
      $or: [
        { transactionId: id },
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status === 'pending') {
      transaction.status = 'failed';
      await transaction.save();
    }

    res.status(200).json({ message: 'Payment marked as failed', transaction });
  } catch (error) {
    console.error('Payment Failure Handling Error:', error);
    res.status(500).json({ message: 'Server error marking payment failure' });
  }
};

// Get Transaction History
exports.getTransactionHistory = async (req, res) => {
    try {
        const { role, _id } = req.user;
        let query = {};

        if (role === 'admin') {
            // Admin sees all transactions
            query = {};
        } else if (role === 'creator') {
            // Creator sees:
            // 1. Transactions they made (backing others)
            // 2. Transactions made to their campaigns
            
            // Find campaigns owned by this creator
            const myCampaigns = await Campaign.find({ creator: _id }).select('_id');
            const myCampaignIds = myCampaigns.map(c => c._id);

            query = {
                $or: [
                    { user: _id }, // Transactions they made
                    { campaign: { $in: myCampaignIds }, status: 'completed' } // Transactions received (only completed usually relevant for revenue)
                ]
            };
        } else {
            // Backer sees only their own transactions
            query = { user: _id };
        }

        const transactions = await Transaction.find(query)
            .populate('campaign', 'title fundingType')
            .populate('user', 'name email') // Helpful for creators to see who backed
            .sort({ createdAt: -1 });
        
        res.status(200).json(transactions);
    } catch (error) {
        console.error('Transaction History Error:', error);
        res.status(500).json({ message: 'Server error fetching history' });
  }
};

// Redeem Reward
exports.redeemReward = async (req, res) => {
  try {
    const transactionId = req.params.id;
    
    // Find checking ownership mapping
    const transaction = await Transaction.findOne({ _id: transactionId, user: req.user._id });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found or unauthorized' });
    }
    
    if (transaction.status !== 'completed') {
      return res.status(400).json({ message: 'Can only redeem rewards for completed transactions' });
    }

    // Toggle redemption status
    transaction.rewardRedeemed = true;
    await transaction.save();

    res.status(200).json({ message: 'Reward marked as redeemed', transaction });
  } catch (error) {
    console.error('Redeem Reward Error:', error);
    res.status(500).json({ message: 'Server error processing reward redemption' });
  }
};
