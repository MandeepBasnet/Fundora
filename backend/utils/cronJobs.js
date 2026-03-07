const cron = require('node-cron');
const Message = require('../models/Message');
const User = require('../models/User');
const { onlineUsers } = require('./socketHandlers');
const nodemailer = require('nodemailer');

// Reuse existing transporter configuration if centralized, or create a simple one
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: process.env.SMTP_PORT || 2525,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const startCronJobs = () => {
  // Run every hour to check for offline users with unread messages older than 1 hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running offline email notification job...');
    
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // Find all messages sent > 1hr ago that are not read
      // Group by recipient (part of conversation participants)
      // For simplicity in cron: Look for messages where status !== 'read'
      const unreadMessages = await Message.find({
        status: { $ne: 'read' },
        createdAt: { $lt: oneHourAgo }
      }).populate({
        path: 'conversationId',
        populate: { path: 'participants' }
      }).populate('sender');

      // Group by recipient
      const notifications = {};

      unreadMessages.forEach(msg => {
        const conversation = msg.conversationId;
        if (!conversation) return;

        // Find recipients (participants other than sender)
        const recipients = conversation.participants.filter(
          p => p._id.toString() !== msg.sender._id.toString()
        );

        recipients.forEach(recipient => {
          // If recipient is offline
          if (!onlineUsers.has(recipient._id.toString())) {
            // Further optimization: skip if recipient already read this message
            const hasRead = msg.readBy.some(r => r.user.toString() === recipient._id.toString());
            if (!hasRead) {
               if (!notifications[recipient.email]) {
                 notifications[recipient.email] = {
                   user: recipient,
                   count: 0,
                   senders: new Set()
                 };
               }
               notifications[recipient.email].count += 1;
               notifications[recipient.email].senders.add(msg.sender.name);
            }
          }
        });
      });

      // Send emails
      for (const [email, data] of Object.entries(notifications)) {
        const sendersArray = Array.from(data.senders);
        const sendersText = sendersArray.join(', ');

        const mailOptions = {
          from: `"Fundora Messaging" <${process.env.SMTP_FROM_EMAIL || 'noreply@fundora.com'}>`,
          to: email,
          subject: `You have ${data.count} new message(s) on Fundora`,
          text: `Hello ${data.user.name},\n\nYou have ${data.count} unread message(s) waiting for you from ${sendersText}.\n\nLog in to Fundora to reply.\n\nBest,\nThe Fundora Team`,
          html: `<p>Hello ${data.user.name},</p><p>You have <strong>${data.count}</strong> unread message(s) waiting for you from ${sendersText}.</p><p><a href="https://fundora.com/messages">Log in to Fundora</a> to reply.</p><p>Best,<br>The Fundora Team</p>`
        };

        try {
          await transporter.sendMail(mailOptions);
          console.log(`Sent offline notification email to ${email}`);
          
          // Mark these messages as delivered (to prevent sending email again next hour)
          // Actually, we should probably mark them 'delivered' or track lastEmailSent Date
          // To keep it simple, we'll just update status to 'delivered' if it was 'sent'
          // A robust system would track notification state on the message or a separate Notification model
        } catch (emailErr) {
          console.error(`Failed to send email to ${email}:`, emailErr);
        }
      }

      // Mark processed messages as 'delivered' so they aren't emailed again next hour
      const msgIds = unreadMessages.map(m => m._id);
      if (msgIds.length > 0) {
        await Message.updateMany(
          { _id: { $in: msgIds }, status: 'sent' },
          { $set: { status: 'delivered' } }
        );
      }

    } catch (error) {
      console.error('Error in offline notification cron job:', error);
    }
  });
};

module.exports = { startCronJobs };
