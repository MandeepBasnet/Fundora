const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} = require('../controllers/notificationController');

// All routes require authentication
router.use(protect);

// GET current user's notifications
router.get('/', getMyNotifications);

// GET unread notification count
router.get('/unread-count', getUnreadCount);

// PUT mark all notifications as read
router.put('/read-all', markAllAsRead);

// PUT mark single notification as read
router.put('/:id/read', markAsRead);

module.exports = router;
