const mongoose = require('mongoose');

// Notification types for milestone and fund release events
const NOTIFICATION_TYPES = [
  'milestone_submitted',         // Creator submitted proof
  'milestone_under_review',      // Admin started reviewing
  'milestone_approved',          // Admin approved milestone
  'milestone_rejected',          // Admin rejected milestone
  'funds_released',              // Funds released to creator
  'resubmission_required',       // Admin requested resubmission
  'backer_milestone_update',     // Backer notified of milestone progress
  'project_completed',           // All milestones completed
  'fund_disbursed',              // Fund transfer completed
  'new_comment'                  // New comment on campaign
];

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification must have a recipient']
  },
  type: {
    type: String,
    enum: NOTIFICATION_TYPES,
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true
  },

  // Related references
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  milestoneId: {
    type: mongoose.Schema.Types.ObjectId
  },

  // Extra data (amounts, dates, references, etc.)
  metadata: {
    type: Object,
    default: {}
  },

  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
