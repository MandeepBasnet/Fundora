const mongoose = require('mongoose');

const flagEvidenceSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true }
}, { _id: false });

const flagSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter is required']
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: [true, 'Campaign is required']
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    enum: [
      'Fraud/Scam', 
      'Misleading Information', 
      'Inappropriate Content', 
      'Copyright Violation', 
      'No Progress Updates', 
      'Spam', 
      'Other'
    ]
  },
  description: {
    type: String,
    required: [true, 'Detailed description is required'],
    minlength: [100, 'Description must be at least 100 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  evidence: [flagEvidenceSchema], // Up to 3 images typically checked in controller
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed'],
    default: 'pending'
  },
  resolutionAction: {
    type: String,
    enum: ['warned', 'corrections_requested', 'suspended', 'terminated', 'none', null],
    default: null
  },
  adminComments: {
    type: String
  },
  isMalicious: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index to prevent duplicate active flags by the same user on the same campaign (FN 6.2)
// Using a partial index so that multiple 'resolved' or 'dismissed' flags might be theoretically possible? 
// actually the requirement says: "user already flagged this campaign with status pending/under_review".
// We will enforce the unique constraint (campaign_id, user_id, active_flag) at the DB level via a partial index, or we just do a regular query check in controller.
// A regular compound index is good for performance.
flagSchema.index({ campaign: 1, reporter: 1 });
flagSchema.index({ status: 1 });
flagSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Flag', flagSchema);
