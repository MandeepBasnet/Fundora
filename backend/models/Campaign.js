const mongoose = require('mongoose');

// Predefined categories (FN 2.4)
const CAMPAIGN_CATEGORIES = [
  'Technology',
  'Art',
  'Music',
  'Film',
  'Games',
  'Education',
  'Community',
  'Innovation',
  'Health',
  'Environment'
];

// Funding types
const FUNDING_TYPES = ['reward-based', 'donation-based', 'milestone-based'];

// Campaign statuses
const CAMPAIGN_STATUSES = ['draft', 'pending', 'active', 'completed', 'cancelled', 'rejected'];

// Milestone statuses (for milestone-based campaigns)
const MILESTONE_STATUSES = ['pending', 'in-progress', 'completed', 'verified'];

// Reward Tier Schema (FN 2.5)
const rewardTierSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Reward tier title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Reward tier description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Reward amount is required'],
    min: [1, 'Amount must be at least NPR 1']
  },
  deliveryDate: {
    type: Date,
    required: [true, 'Estimated delivery date is required']
  },
  quantityLimit: {
    type: Number,
    default: null // null means unlimited
  },
  quantityClaimed: {
    type: Number,
    default: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { _id: true });

// Milestone Schema (FN 2.6)
const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Milestone title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Milestone description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  percentage: {
    type: Number,
    required: [true, 'Milestone percentage is required'],
    min: [1, 'Percentage must be at least 1%'],
    max: [100, 'Percentage cannot exceed 100%']
  },
  order: {
    type: Number,
    required: true
  },
  estimatedCompletionDate: {
    type: Date
  },
  status: {
    type: String,
    enum: MILESTONE_STATUSES,
    default: 'pending'
  },
  completedAt: {
    type: Date
  },
  proofSubmission: {
    url: String,
    publicId: String,
    description: String,
    submittedAt: Date
  }
}, { _id: true });

// Image Schema
const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  }
}, { _id: true });

// Main Campaign Schema
const campaignSchema = new mongoose.Schema({
  // Creator reference
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Campaign must have a creator']
  },

  // Basic Info (FN 2.1)
  title: {
    type: String,
    required: [true, 'Campaign title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Campaign description is required'],
    minlength: [100, 'Description must be at least 100 characters']
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Campaign category is required'],
    enum: {
      values: CAMPAIGN_CATEGORIES,
      message: 'Invalid category'
    }
  },

  // Funding Details (FN 2.1)
  fundingGoal: {
    type: Number,
    required: [true, 'Funding goal is required'],
    min: [1000, 'Minimum funding goal is NPR 1,000']
  },
  currentAmount: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    required: [true, 'Campaign duration is required'],
    min: [7, 'Minimum duration is 7 days'],
    max: [90, 'Maximum duration is 90 days']
  },
  fundingType: {
    type: String,
    required: [true, 'Funding type is required'],
    enum: {
      values: FUNDING_TYPES,
      message: 'Invalid funding type'
    }
  },

  // Dates
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },

  // Media (FN 2.3)
  images: {
    type: [imageSchema],
    validate: [
      {
        validator: function(v) {
          return v.length <= 5;
        },
        message: 'Maximum 5 images allowed per campaign'
      }
    ]
  },
  video: {
    url: String,
    publicId: String
  },
  coverImage: {
    type: String, // URL of the cover image (usually first image)
    default: null
  },

  // Status (FN 2.7, 2.8, 2.9)
  status: {
    type: String,
    enum: CAMPAIGN_STATUSES,
    default: 'draft'
  },

  // Reward Tiers (FN 2.5)
  rewardTiers: [rewardTierSchema],

  // Milestones (FN 2.6)
  milestones: [milestoneSchema],

  // Statistics
  backerCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },

  // Timestamps
  submittedAt: {
    type: Date
  },
  approvedAt: {
    type: Date
  },

  // Admin fields
  adminNotes: {
    type: String
  },
  rejectionReason: {
    type: String
  },
  
  // Edit Request (FN 2.10)
  pendingUpdates: {
    type: Object,
    default: null
  },
  
  // Deletion Request
  deletionRequested: {
    type: Boolean,
    default: false
  },
  deletionRequestedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
campaignSchema.index({ creator: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ category: 1 });
campaignSchema.index({ createdAt: -1 });
campaignSchema.index({ fundingGoal: 1 });
campaignSchema.index({ endDate: 1 });

// Virtual for funding progress percentage
campaignSchema.virtual('fundingProgress').get(function() {
  if (this.fundingGoal === 0) return 0;
  return Math.round((this.currentAmount / this.fundingGoal) * 100);
});

// Virtual for days remaining
campaignSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  const now = new Date();
  const diff = this.endDate - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Pre-save middleware to calculate endDate and validate milestones
campaignSchema.pre('save', async function() {
  // When campaign becomes active, set dates
  if (this.isModified('status') && this.status === 'active' && !this.startDate) {
    this.startDate = new Date();
    this.endDate = new Date(Date.now() + this.duration * 24 * 60 * 60 * 1000);
  }
  
  // Set cover image as first image if not set
  if (this.images && this.images.length > 0 && !this.coverImage) {
    this.coverImage = this.images[0].url;
  }
  
  // Validate milestones total percentage for milestone-based campaigns
  // Only validate if status is being submitted (not draft)
  if (this.fundingType === 'milestone-based' && 
      this.milestones && 
      this.milestones.length > 0 &&
      this.status !== 'draft') {
    const totalPercentage = this.milestones.reduce((sum, m) => sum + (m.percentage || 0), 0);
    if (totalPercentage !== 100) {
      const error = new Error('Milestone percentages must total 100%');
      error.name = 'ValidationError';
      throw error;
    }
  }
});

// Ensure virtuals are included when converting to JSON
campaignSchema.set('toJSON', { virtuals: true });
campaignSchema.set('toObject', { virtuals: true });

// Export constants for use in controllers/routes
module.exports = mongoose.model('Campaign', campaignSchema);
module.exports.CAMPAIGN_CATEGORIES = CAMPAIGN_CATEGORIES;
module.exports.FUNDING_TYPES = FUNDING_TYPES;
module.exports.CAMPAIGN_STATUSES = CAMPAIGN_STATUSES;
module.exports.MILESTONE_STATUSES = MILESTONE_STATUSES;
