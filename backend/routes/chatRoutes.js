const express = require('express');
const router = express.Router();
const { sendMessage, getChatMessages } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .post(sendMessage)
  .get(getChatMessages);

module.exports = router;
