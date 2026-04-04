const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const jwt = require('jsonwebtoken');

// Map to track online users: userId (string) -> Set of socketIds
const onlineUsers = new Map();

const initializeSocket = (io) => {
  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error: Token missing'));
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Ensure ID is a string for consistent Map keys
      socket.user = { ...decoded, id: decoded.id.toString() };
      next();
    } catch (err) {
      console.error('Socket Auth Error:', err.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    
    // Add socket to user's set of active connections
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
      // Only emit 'online' status if this is the first connection for this user
      io.emit('user_status', { userId, status: 'online' });
    }
    onlineUsers.get(userId).add(socket.id);
    
    console.log(`User connected: ${userId} | Socket ID: ${socket.id} | Total Tabs: ${onlineUsers.get(userId).size}`);

    // Join personal room for private events/notifications
    socket.join(`user_${userId}`);

    // Handle sending a message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content } = data;
        
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        if (conversation.blockedBy.length > 0) {
          socket.emit('message_error', { message: 'Cannot send message to blocked contact' });
          return;
        }

        const message = await Message.create({
          conversationId,
          sender: userId,
          content,
          status: 'sent'
        });

        conversation.lastMessage = message._id;
        await conversation.save();

        const populatedMessage = await Message.findById(message._id).populate('sender', 'name profile.avatar');

        // Emit to everyone in the conversation room
        io.to(`conv_${conversationId}`).emit('receive_message', populatedMessage);

        // Notify recipient on all their active tabs
        const recipient = conversation.participants.find(p => p.toString() !== userId);
        const recipientId = recipient ? recipient.toString() : userId;
        
        io.to(`user_${recipientId}`).emit('new_message_notification', {
          conversationId,
          message: populatedMessage
        });

      } catch (error) {
        console.error('Socket send_message error:', error);
      }
    });

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv_${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv_${conversationId}`);
    });

    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conv_${conversationId}`).emit('typing_status', {
        conversationId,
        userId,
        isTyping
      });
    });

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

    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${userId} | Socket ID: ${socket.id} | Reason: ${reason}`);
      
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        
        // Only mark user as offline if all their tabs are closed
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_status', { userId, status: 'offline' });
          console.log(`User ${userId} is now completely offline`);
        } else {
          console.log(`User ${userId} still has ${userSockets.size} active tabs`);
        }
      }
    });
  });
};

module.exports = { initializeSocket, onlineUsers };
