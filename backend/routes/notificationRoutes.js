const express = require('express');
const router = express.Router();
const { createNotification, getMyNotifications } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// Protect all routes — notifications require authentication
router.use(protect);

router.route('/')
  .post(createNotification)
  .get(getMyNotifications);

module.exports = router;
