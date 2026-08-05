const express = require('express');
const router = express.Router();
const { registerCustomer, loginUser, getMe, registerCompany, forgotPassword, resetPassword, sendTestEmail, verifySubscriptionToken } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerCustomer);
router.post('/register-company', registerCompany);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/send-test-email', sendTestEmail);
router.get('/verify-subscription-token', verifySubscriptionToken);
router.get('/me', protect, getMe);

module.exports = router;
