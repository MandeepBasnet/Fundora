const express = require('express');
const router = express.Router();
const {
  getCreatorFinances,
  getCreatorPayoutHistory
} = require('../controllers/financeController');
const { protect, authorize } = require('../middleware/auth');

// All finance routes require creator role
router.use(protect);
router.use(authorize('creator'));

router.get('/overview', getCreatorFinances);
router.get('/payouts', getCreatorPayoutHistory);

module.exports = router;
