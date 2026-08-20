const express = require('express');
const router = express.Router();
const {
  registerCustomer,
  loginUser,
  getMe,
  registerCompany,
  forgotPassword,
  resetPassword,
  sendTestEmail,
  verifySubscriptionToken,
  sendCustomerOTP,
  verifyCustomerOTP,
  sendDriverOTP,
  verifyDriverOTP,
  sendBookingOTP,
  verifyBookingOTP
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerCustomer);
router.post('/register-company', registerCompany);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/send-test-email', sendTestEmail);
router.get('/verify-subscription-token', verifySubscriptionToken);

// 🔒 CUSTOMER & DRIVER EMAIL OTP VERIFICATION ROUTES (BREVO API)
router.post('/customer/send-otp', sendCustomerOTP);
router.post('/customer/verify-otp', verifyCustomerOTP);

router.post('/driver/send-otp', sendDriverOTP);
router.post('/driver/verify-otp', verifyDriverOTP);

// 🔒 PURPOSE-BASED BOOKING, CASH, AND TRIP START OTP ROUTES
router.post('/booking/send-otp', sendBookingOTP);
router.post('/booking/verify-otp', verifyBookingOTP);

router.get('/me', protect, getMe);

module.exports = router;


