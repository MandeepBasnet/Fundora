const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const jwt = require('jsonwebtoken');

// Map to track online users: userId -> socketId
const onlineUsers = new Map();

const initializeSocket = (io) => {
  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    onlineUsers.set(userId, socket.id);
    console.log(`User connected: ${userId} with socket: ${socket.id}`);

    // Join personal room for private events/notifications
    socket.join(`user_${userId}`);

    // Emit online status to all users
    io.emit('user_status', { userId, status: 'online' });

    // Join a specific conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv_${conversationId}`);
      console.log(`User ${userId} joined conversation ${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv_${conversationId}`);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });

    // Handle typing events with 500ms debounce
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conv_${conversationId}`).emit('typing_status', {
        conversationId,
        userId,
        isTyping
      });
    });

    // Handle sending a message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content } = data;
        
        // Fetch conversation to verify participants
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        // Check if blocked
        if (conversation.blockedBy.length > 0) {
          socket.emit('message_error', { message: 'Cannot send message to blocked contact' });
          return;
        }

        // Save message to DB
        const message = await Message.create({
          conversationId,
          sender: userId,
          content,
          status: 'sent'
        });

        // Update conversation lastMessage & calculate average response time if needed
        conversation.lastMessage = message._id;
        await conversation.save();

        const populatedMessage = await Message.findById(message._id).populate('sender', 'name profile.avatar');

        // Emit to everyone in the conversation room
        io.to(`conv_${conversationId}`).emit('receive_message', populatedMessage);

        // Emit notifications to recipient if they are not in the room or offline
        const recipient = conversation.participants.find(p => p.toString() !== userId);
        const recipientId = recipient ? recipient.toString() : userId; // Fallback to self if same user
        const recipientSocketId = onlineUsers.get(recipientId);

        if (recipientSocketId) {
          // Send app notification badge event
          io.to(recipientSocketId).emit('new_message_notification', {
            conversationId,
            message: populatedMessage
          });
        }
      } catch (error) {
        console.error('Socket send_message error:', error);
      }
    });

    // Handle read receipts
    socket.on('mark_read', async ({ conversationId, messageIds }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { 
            $push: { readBy: { user: userId, readAt: Date.now() } },
            $set: { status: 'read' }
          }
        );
        socket.to(`conv_${conversationId}`).emit('messages_read', { conversationId, messageIds, readBy: userId });
      } catch (error) {
        console.error('Socket mark_read error:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
      onlineUsers.delete(userId);
      io.emit('user_status', { userId, status: 'offline' });
    });
  });
};

module.exports = { initializeSocket, onlineUsers };
