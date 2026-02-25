const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Link to the user who made the payment
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Transaction must belong to a user']
  },
  
  // Link to the campaign being funded
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: [true, 'Transaction must be for a campaign']
  },
  
  // Link to specific reward tier (optional)
  rewardTier: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },

  // Tracks if the backer has received/redeemed the physical or digital reward
  rewardRedeemed: {
    type: Boolean,
    default: false
  },

  // Payment Details
  amount: {
    type: Number,
    required: [true, 'Transaction amount is required'],
    min: [10, 'Amount must be at least NPR 10'] // eSewa/Khalti min limits usually low, Fundora min is 100 but kept flexible here
  },
  
  gateway: {
    type: String,
    required: [true, 'Payment gateway is required'],
    enum: ['esewa', 'khalti']
  },
  
  // Status of the transaction
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'refunded', 'expired'],
    default: 'pending'
  },
  
  // Unique ID sent to the gateway (e.g., predicted unique ID)
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  
  // ID returned/used by the gateway (pidx for Khalti, refId for eSewa)
  gatewayRefId: {
    type: String,
    default: null
  },
  
  // Full response from gateway for debugging/audit
  gatewayResponse: {
    type: Object,
    default: null
  },
  
  // Dates
  paidAt: {
    type: Date
  },

  // Payout Tracking (FN 4.7)
  payoutStatus: {
    type: String,
    enum: ['pending', 'processing', 'paid'],
    default: 'pending'
  },
  payoutDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ user: 1 });
transactionSchema.index({ campaign: 1 });

transactionSchema.index({ status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
