const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/aiController');

// Public recommendation endpoint
router.post('/recommend', getRecommendations);

module.exports = router;
