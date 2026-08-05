const express = require('express');
const router = express.Router();
const {
  searchVehicles,
  createBooking,
  uploadDocuments,
  getCustomerBookings,
  guestBooking,
  getPublicCompanies,
} = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/vehicles', searchVehicles);
router.post('/guest-booking', guestBooking);
router.get('/companies', getPublicCompanies);

// Protected routes (Customer role only)
router.post('/bookings', protect, authorize('customer'), createBooking);
router.put('/bookings/:id/documents', protect, authorize('customer'), uploadDocuments);
router.get('/bookings', protect, authorize('customer'), getCustomerBookings);

module.exports = router;
