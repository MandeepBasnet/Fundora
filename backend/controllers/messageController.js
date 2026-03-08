const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Transaction = require('../models/Transaction');
const Campaign = require('../models/Campaign');

// @desc    Initiate or get conversation
// @route   POST /api/messages/initiate
// @access  Private
exports.initiateConversation = async (req, res) => {
  try {
    const { campaignId } = req.body;
    const userId = req.user.id;

    // Verify campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    if (!campaign.creator) {
      return res.status(400).json({ success: false, message: 'Creator no longer exists.' });
    }

    const creatorId = campaign.creator.toString();

    // Verify user is a backer of this campaign
    const transaction = await Transaction.findOne({
      user: userId,
      campaign: campaignId,
      status: 'completed'
    });

    if (!transaction && req.user.role !== 'admin' && req.user.id !== creatorId) {
      return res.status(403).json({
        success: false,
        message: 'Only backers of this campaign can initiate a conversation with the creator.'
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, creatorId] },
      campaign: campaignId
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, creatorId],
        campaign: campaignId
      });
    }

    // Calculate Average Response Time (stub for now, can be complex logic)
    const avgResponseTimeMs = conversation.creatorResponseTimeMs || 3600000; // default 1 hr

    res.status(200).json({
      success: true,
      data: conversation,
      avgResponseTimeMs
    });
  } catch (error) {
    console.error('Error initiating conversation:', error);
    res.status(500).json({ success: false, message: 'Server Error', backendError: error.message, stack: error.stack });
  }
};

// @desc    Get user's conversations
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .populate('participants', 'name email profile.avatar')
      .populate('campaign', 'title coverImage')
      .populate({
        path: 'lastMessage',
        select: 'content sender createdAt status readBy'
      })
      .sort({ updatedAt: -1 });

    // Attach unread count locally
    const conversationsWithUnread = await Promise.all(conversations.map(async (conv) => {
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        sender: { $ne: req.user.id },
        'readBy.user': { $ne: req.user.id }
      });
      return { ...conv.toObject(), unreadCount };
    }));

    res.status(200).json({ success: true, data: conversationsWithUnread });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    // Verify participation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view these messages' });
    }

    // Fetch paginated messages
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name profile.avatar');

    // Mark messages as read
    const unreadMessages = messages.filter(
      (m) => m.sender.id !== req.user.id && !m.readBy.some((read) => read.user.toString() === req.user.id)
    );

    if (unreadMessages.length > 0) {
      await Message.updateMany(
        { _id: { $in: unreadMessages.map((m) => m._id) } },
        {
          $push: { readBy: { user: req.user.id, readAt: Date.now() } },
          $set: { status: 'read' }
        }
      );
      // The socket event for read receipt should ideally be fired here or from frontend
    }

    res.status(200).json({
      success: true,
      data: messages.reverse(), // Send chronological order to frontend
      pagination: {
        page,
        limit,
        total: await Message.countDocuments({ conversationId })
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Block or Unblock a contact
// @route   PUT /api/messages/:conversationId/block
// @access  Private
exports.toggleBlockContact = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const userIdStr = req.user.id.toString();
    const isBlocked = conversation.blockedBy.some((id) => id.toString() === userIdStr);

    if (isBlocked) {
      conversation.blockedBy = conversation.blockedBy.filter((id) => id.toString() !== userIdStr);
    } else {
      conversation.blockedBy.push(req.user.id);
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      isBlocked: !isBlocked,
      message: !isBlocked ? 'Contact blocked' : 'Contact unblocked'
    });
  } catch (error) {
    console.error('Error blocking contact:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const Flag = require('../models/Flag');

// @desc    Report a user/message
// @route   POST /api/messages/:conversationId/report
// @access  Private
exports.reportUser = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { reason, description, reportedUserId } = req.body;
    
    // Verify conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Creating a Flag record (reusing Flag schema which expects a campaign, but we can just use the conversation's campaign)
    const flag = await Flag.create({
      reporter: req.user.id,
      campaign: conversation.campaign, // Linking to campaign context
      reason: reason || 'Inappropriate Content in Messages',
      description: `Reported User ID: ${reportedUserId}. Message context: ${description}`,
      evidence: []
    });

    res.status(201).json({ success: true, message: 'User reported successfully' });
  } catch (error) {
    console.error('Error reporting user:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
