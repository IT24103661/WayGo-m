const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getOverview,
  getAnalytics,
  getStaff,
  createStaff,
  updateStaff,
  updateStaffStatus,
  deleteStaff,
  getRefundRequests,
  updateRefundRequest,
  getBans,
  getConflictUsers,
  createBan,
  updateBan,
  getConfig,
  updateConfig,
  getAuditLogs,
  getEmergencyAlerts,
  resolveEmergencyAlert,
  getSentimentReviews,
  getFlaggedDrivers
} = require('../controllers/adminModuleController');

router.use(protect);
router.use(authorizeRoles('SystemAdmin', 'Admin'));

router.get('/overview', getOverview);
router.get('/analytics', getAnalytics);

router.get('/staff', getStaff);
router.post('/staff', createStaff);
router.put('/staff/:id', updateStaff);
router.patch('/staff/:id/status', updateStaffStatus);
router.delete('/staff/:id', deleteStaff);

router.get('/conflicts/refunds', getRefundRequests);
router.patch('/conflicts/refunds/:id', updateRefundRequest);

router.get('/conflicts/bans', getBans);
router.get('/conflicts/users', getConflictUsers);
router.post('/conflicts/bans', createBan);
router.patch('/conflicts/bans/:id', updateBan);

router.get('/config', getConfig);
router.put('/config', updateConfig);

router.get('/audit-logs', getAuditLogs);
router.get('/emergency-alerts', getEmergencyAlerts);
router.patch('/emergency-alerts/:id/resolve', resolveEmergencyAlert);
router.get('/alerts/reviews', getSentimentReviews);
router.get('/alerts/flagged-drivers', getFlaggedDrivers);

module.exports = router;
