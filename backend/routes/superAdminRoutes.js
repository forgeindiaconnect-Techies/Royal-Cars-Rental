const express = require('express');
const router  = express.Router();
const {
  onboardCompany,
  getCompanies,
  getCompanyStats,
  updateCompany,
  sendKycReminder,
  toggleCompanyStatus,
  getPlatformStats,
  approveCompany,
  deleteCompany,
  rejectCompany,
  uploadKycDocs,
  testEmailDispatch,
  sendSubscriptionEmail,
} = require('../controllers/superAdminController');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes — Super Admin only
router.use(protect);
router.use(authorize('super-admin'));

router.post('/send-subscription-email',          sendSubscriptionEmail);
router.post('/test-email',                       testEmailDispatch);
router.post('/companies',                         uploadKycDocs, onboardCompany);
router.get('/companies',                          getCompanies);
router.get('/companies/:id/stats',                getCompanyStats);
router.put('/companies/:id',                      uploadKycDocs, updateCompany);
router.delete('/companies/:id',                   deleteCompany);
router.post('/companies/:id/reject',              rejectCompany);
router.post('/companies/:id/send-kyc-reminder',   sendKycReminder);
router.put('/companies/:id/toggle',               toggleCompanyStatus);
router.put('/companies/:id/approve',              approveCompany);
router.get('/dashboard',                          getPlatformStats);

module.exports = router;

