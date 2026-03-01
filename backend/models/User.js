const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['backer', 'creator', 'admin'],
    default: 'backer'
  },
  profile: {
    bio: String,
    avatar: String,
    location: String,
    website: String,
    socialLinks: {
      twitter: String,
      facebook: String,
      instagram: String,
      linkedin: String
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: String,
    expiresAt: Date
  },
  passwordReset: {
    otp: String,
    otpExpiry: Date,
    token: String
  },
  refreshToken: [String],
  warningCount: {
    type: Number,
    default: 0
  },
  falseFlagCount: {
    type: Number,
    default: 0
  },
  flaggingRestrictedUntil: {
    type: Date
  },
  suspendedUntil: {
    type: Date
  },
  isBanned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Pre-save hook to hash password
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
