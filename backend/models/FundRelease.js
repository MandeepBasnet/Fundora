const mongoose = require('mongoose');

// Fund Release Schema (FN 5.5)
// Tracks individual fund releases tied to milestone approvals
const fundReleaseSchema = new mongoose.Schema({
  // Campaign and Milestone references
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: [true, 'Fund release must be linked to a campaign']
  },
  milestoneId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  milestoneOrder: {
    type: Number,
    required: false
  },
  milestoneTitle: {
    type: String,
    required: false
  },
  
  // Link to specific backer transactions being paid out
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }],

  // Financial Details (FN 5.4)
  grossAmount: {
    type: Number,
    required: true  // Amount before platform fee
  },
  platformFee: {
    type: Number,
    required: true  // 5% platform fee
  },
  amount: {
    type: Number,
    required: true  // Net amount to creator (gross - platformFee)
  },
  milestonePercentage: {
    type: Number,
    required: false
  },

  // Approval Details
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  releaseDate: {
    type: Date,
    default: Date.now
  },

  // Disbursement Details (FN 5.10)
  disbursementMethod: {
    type: String,
    enum: ['bank_transfer', 'esewa', 'khalti'],
    required: true
  },
  disbursementStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  transactionReference: {
    type: String,
    default: null
  },
  disbursedAt: {
    type: Date
  },

  // Overall Status
  status: {
    type: String,
    enum: ['approved', 'released', 'failed'],
    default: 'approved'
  }
}, {
  timestamps: true
});

// Indexes
fundReleaseSchema.index({ campaign: 1 });
fundReleaseSchema.index({ disbursementStatus: 1 });
fundReleaseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FundRelease', fundReleaseSchema);
