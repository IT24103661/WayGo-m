const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
	updateStatus,
	getStatus,
	acceptRide,
	getAvailableJobs,
	getMyJobs,
	updateJobStatus,
	getMyVehicleProfile,
	updateMyVehicleProfile
} = require('../controllers/driverController');
const {
	createSupportRequest,
	getMySupportRequests,
	updateMySupportRequest,
	deleteMySupportRequest
} = require('../controllers/supportController');

router.use(protect);
router.use(authorizeRoles('Driver'));

// Driver Profile / Status
router.get('/status', getStatus);
router.patch('/status', updateStatus);
router.get('/profile/vehicle', getMyVehicleProfile);
router.put('/profile/vehicle', updateMyVehicleProfile);

// Jobs / Bookings CRUD
router.get('/jobs/available', getAvailableJobs);
router.get('/jobs/mine', getMyJobs);
router.patch('/bookings/:bookingId/accept', acceptRide);
router.patch('/bookings/:bookingId/status', updateJobStatus);

// Driver Support module
router.post('/support', createSupportRequest);
router.get('/support', getMySupportRequests);
router.put('/support/:requestId', updateMySupportRequest);
router.delete('/support/:requestId', deleteMySupportRequest);

module.exports = router;
