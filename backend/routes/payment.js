const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth'); // Correctly destructure protect

// Initialize Payment (Protected)
router.post('/initiate', protect, paymentController.initializePayment);

// Verify eSewa (Public callback or Protected if handling on frontend first - eSewa redirects to frontend usually)
// However, our controller logic for verifyEsewa expects 'data' from query string. 
// Frontend typically sends this to backend.
router.get('/verify-esewa', paymentController.verifyEsewa);

// Verify Khalti (Protected)
router.post('/verify-khalti', protect, paymentController.verifyKhalti);

// Transaction History (Protected)
router.get('/history', protect, paymentController.getTransactionHistory);

// Redeem Reward (Protected)
router.put('/transactions/:id/redeem', protect, paymentController.redeemReward);

module.exports = router;
