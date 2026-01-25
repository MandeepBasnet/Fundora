const mongoose = require('mongoose');

const campaignUpdateSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Update title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Update content is required']
  },
  images: [{
    url: String,
    publicId: String
  }],
  video: {
    url: String,
    publicId: String
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for efficient queries
campaignUpdateSchema.index({ campaign: 1, createdAt: -1 });

module.exports = mongoose.model('CampaignUpdate', campaignUpdateSchema);
