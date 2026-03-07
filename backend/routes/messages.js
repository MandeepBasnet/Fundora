const express = require('express');
const { protect } = require('../middleware/auth');
const {
  initiateConversation,
  getConversations,
  getMessages,
  toggleBlockContact,
  reportUser
} = require('../controllers/messageController');

const router = express.Router();

router.post('/initiate', protect, initiateConversation);
router.get('/conversations', protect, getConversations);
router.get('/:conversationId', protect, getMessages);
router.put('/:conversationId/block', protect, toggleBlockContact);
router.post('/:conversationId/report', protect, reportUser);

module.exports = router;
