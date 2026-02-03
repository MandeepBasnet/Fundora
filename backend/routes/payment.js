const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth'); // Assuming auth middleware exists

// Initialize Payment (Protected)
router.post('/initiate', auth, paymentController.initializePayment);

// Verify eSewa (Public callback or Protected if handling on frontend first - eSewa redirects to frontend usually)
// However, our controller logic for verifyEsewa expects 'data' from query string. 
// Frontend typically sends this to backend.
router.get('/verify-esewa', paymentController.verifyEsewa);

// Verify Khalti (Protected)
router.post('/verify-khalti', auth, paymentController.verifyKhalti);

// Transaction History (Protected)
router.get('/history', auth, paymentController.getTransactionHistory);

module.exports = router;
