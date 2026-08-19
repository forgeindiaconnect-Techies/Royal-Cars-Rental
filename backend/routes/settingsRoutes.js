const express = require('express');
const router = express.Router();
const { getPublicSettings, updateSettings } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

// Public route to read contact settings across any browser/device
router.get('/public', getPublicSettings);

// Protected Super Admin route to save numbers
router.post('/', protect, authorize('super-admin'), updateSettings);
router.put('/', protect, authorize('super-admin'), updateSettings);

module.exports = router;
