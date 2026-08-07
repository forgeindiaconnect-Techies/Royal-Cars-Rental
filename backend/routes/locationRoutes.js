const express = require('express');
const router = express.Router();
const { getLocations, createLocation, updateLocation, deleteLocation } = require('../controllers/locationController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getLocations)
  .post(protect, authorize('super-admin'), createLocation);

router.route('/:id')
  .put(protect, authorize('super-admin'), updateLocation)
  .delete(protect, authorize('super-admin'), deleteLocation);

module.exports = router;
