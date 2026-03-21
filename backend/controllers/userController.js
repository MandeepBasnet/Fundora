const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile: user.profile,
      isVerified: user.isVerified
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    // Don't update email indiscriminately if it requires verification logic
    // user.email = req.body.email || user.email; 
    
    // Handle specific profile fields that might come in as flat fields from FormData
    const profileUpdates = {};
    if (req.body.bio) profileUpdates.bio = req.body.bio;
    if (req.body.location) profileUpdates.location = req.body.location;
    if (req.body.website) profileUpdates.website = req.body.website;
    
    // Handle social links - only add if there are actual values
    const socialLinksInput = {
        twitter: req.body.twitter || undefined,
        facebook: req.body.facebook || undefined,
        instagram: req.body.instagram || undefined,
        linkedin: req.body.linkedin || undefined
    };
    
    // Filter out undefined values
    const filteredSocialLinks = Object.fromEntries(
        Object.entries(socialLinksInput).filter(([_, v]) => v !== undefined && v !== '')
    );
    
    if (Object.keys(filteredSocialLinks).length > 0) {
        profileUpdates.socialLinks = {
            ...(user.profile?.socialLinks || {}),
            ...filteredSocialLinks
        };
    }

    // If request implies nested profile object (JSON request), merge that too
    if (req.body.profile) {
        Object.assign(profileUpdates, req.body.profile);
    }

    // Handle File Upload (Cloudinary)
    if (req.file) {
        profileUpdates.avatar = req.file.path;
    }

    if (Object.keys(profileUpdates).length > 0) {
        user.profile = {
            ...(user.profile?.toObject ? user.profile.toObject() : user.profile || {}),
            ...profileUpdates
        };
        // Mark profile as modified so Mongoose saves the subdocument changes
        user.markModified('profile');
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profile: updatedUser.profile,
      token: req.body.token // Just echoing back or maintaining session relies on client
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id);

    if (user && (await user.comparePassword(currentPassword))) {
        user.password = newPassword; // Pre-save hook will hash this
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } else {
        res.status(401).json({ message: 'Invalid current password' });
    }
};

// @desc    Toggle saving a campaign
// @route   POST /api/users/save-campaign/:id
// @access  Private
const toggleSaveCampaign = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const campaignId = req.params.id;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure array exists
    if (!user.savedCampaigns) {
      user.savedCampaigns = [];
    }

    const index = user.savedCampaigns.indexOf(campaignId);
    let isSaved = false;

    if (index === -1) {
      // Not saved, so save it
      user.savedCampaigns.push(campaignId);
      isSaved = true;
    } else {
      // Already saved, so unsave it
      user.savedCampaigns.splice(index, 1);
    }

    await user.save();
    res.json({ message: isSaved ? 'Campaign saved' : 'Campaign removed from saved lists', isSaved });
  } catch (error) {
    console.error('Toggle save campaign error:', error);
    res.status(500).json({ message: 'Server error toggling saved campaign' });
  }
};

// @desc    Get user's saved campaigns
// @route   GET /api/users/saved-campaigns
// @access  Private
const getSavedCampaigns = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedCampaigns',
      select: 'title shortDescription currentAmount fundingGoal coverImage images category status daysRemaining endDate rewardTiers',
      match: { status: 'active' } // Only show active saved campaigns, or maybe all depending on requirement
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filter out nulls if any campaigns were deleted
    const validCampaigns = user.savedCampaigns.filter(c => c != null);

    res.json(validCampaigns);
  } catch (error) {
    console.error('Get saved campaigns error:', error);
    res.status(500).json({ message: 'Server error fetching saved campaigns' });
  }
};

module.exports = {
  getMe,
  updateProfile,
  changePassword,
  toggleSaveCampaign,
  getSavedCampaigns
};
