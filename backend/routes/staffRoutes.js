const express = require('express');
const router = express.Router();
const {
  getCompanyBookings,
  verifyDocuments,
  checkoutVehicle,
  checkinVehicle,
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes with Employee authorization
router.use(protect);
router.use(authorize('employee'));

router.get('/bookings', getCompanyBookings);
router.put('/bookings/:id/verify', verifyDocuments);
router.put('/bookings/:id/checkout', checkoutVehicle);
router.put('/bookings/:id/checkin', checkinVehicle);

module.exports = router;
