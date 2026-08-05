const express = require('express');
const router = express.Router();
const {
  addVehicle,
  getCompanyVehicles,
  updateVehicle,
  deleteVehicle,
  addStaff,
  getCompanyStaff,
  deleteStaff,
  deleteBooking,
  getCompanyDashboard,
  getCompanyBookings,
  updateBookingStatus,
  addOffer,
  getCompanyOffers,
  deleteOffer,
  toggleOfferStatus,
  updateCompanyBranding,
  updateDriverLocation,
  getDriverLocations,
  getSelfDriveLocations,
  getDriverTrips,
  updateDriverTripStatus,
} = require('../controllers/companyAdminController');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes with authentication
router.use(protect);

// Driver location endpoint (PUT by driver, GET by company-admin or staff)
router.route('/driver-location')
  .put(authorize('driver', 'company-admin', 'employee', 'super-admin', 'customer'), updateDriverLocation)
  .get(authorize('company-admin', 'staff', 'driver', 'employee', 'super-admin', 'customer'), getDriverLocations);

// Traccar self-drive GPS endpoint
router.get('/selfdrive-locations', authorize('company-admin', 'staff', 'driver', 'employee', 'super-admin', 'customer'), getSelfDriveLocations);

// Driver trips endpoints
router.get('/driver/trips', authorize('driver', 'company-admin', 'employee', 'super-admin', 'customer'), getDriverTrips);
router.put('/driver/trips/:id/status', authorize('driver', 'company-admin', 'employee', 'super-admin', 'customer'), updateDriverTripStatus);

// Protect subsequent routes with Company Admin authorization
router.use(authorize('company-admin'));

router.route('/vehicles')
  .post(addVehicle)
  .get(getCompanyVehicles);

router.route('/vehicles/:id')
  .put(updateVehicle)
  .delete(deleteVehicle);

router.route('/staff')
  .post(addStaff)
  .get(getCompanyStaff);

router.route('/staff/:id')
  .delete(deleteStaff);

router.route('/offers')
  .post(addOffer)
  .get(getCompanyOffers);

router.route('/offers/:id')
  .delete(deleteOffer)
  .put(toggleOfferStatus);

router.get('/bookings', getCompanyBookings);
router.put('/bookings/:id/status', updateBookingStatus);
router.delete('/bookings/:id', deleteBooking);
router.get('/dashboard', getCompanyDashboard);
router.put('/branding', updateCompanyBranding);

module.exports = router;

