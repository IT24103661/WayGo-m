const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
	addVehicle,
	getMaintenanceAlerts,
	getVehicles,
	getAvailableVehiclesForTrips,
	updateVehicle,
	deleteVehicle,
	getFleetBookings,
	updateFleetBooking,
	deleteFleetBooking,
	assignBookingToDriver,
	getNotifications,
	markNotificationRead,
	markAllNotificationsRead,
	getManagedDrivers,
	createManualDriver,
	updateManualDriver,
	deleteManualDriver,
	getAvailableDriversForTrips,
	getDriverSalaries,
	upsertDriverSalary,
	updateDriverSalary,
	deleteDriverSalary
} = require('../controllers/fleetController');

router.use(protect);
router.use(authorizeRoles('FleetManager'));

router.post('/vehicles', addVehicle);
router.get('/vehicles', getVehicles);
router.get('/vehicles/available', getAvailableVehiclesForTrips);
router.put('/vehicles/:vehicleId', updateVehicle);
router.delete('/vehicles/:vehicleId', deleteVehicle);
router.get('/bookings', getFleetBookings);
router.put('/bookings/:bookingId', updateFleetBooking);
router.delete('/bookings/:bookingId', deleteFleetBooking);
router.patch('/bookings/:bookingId/assign', assignBookingToDriver);
router.get('/maintenance-alerts', getMaintenanceAlerts);
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.get('/drivers', getManagedDrivers);
router.post('/drivers/manual', createManualDriver);
router.put('/drivers/manual/:driverId', updateManualDriver);
router.delete('/drivers/manual/:driverId', deleteManualDriver);
router.get('/drivers/available', getAvailableDriversForTrips);
router.get('/salaries', getDriverSalaries);
router.post('/salaries', upsertDriverSalary);
router.put('/salaries/:salaryId', updateDriverSalary);
router.delete('/salaries/:salaryId', deleteDriverSalary);

module.exports = router;
