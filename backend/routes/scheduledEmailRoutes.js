const express = require('express');
const router = express.Router();
const {
  createScheduledEmail,
  getScheduledEmails,
  cancelScheduledEmail,
  triggerScheduledEmailDispatch,
} = require('../controllers/scheduledEmailController');

router.route('/')
  .post(createScheduledEmail)
  .get(getScheduledEmails);

router.delete('/:id', cancelScheduledEmail);
router.post('/trigger', triggerScheduledEmailDispatch);

module.exports = router;
