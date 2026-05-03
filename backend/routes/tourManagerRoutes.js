const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getTours,
  createTour,
  updateTour,
  deleteTour,
  getBookings,
  getEarnings,
  getDashboardStats,
  createTourPackage,
  getTourPackages,
  updateTourPackage,
  deleteTourPackage,
  assignTourDriver,
  getStayRequests,
  allocateStayForBooking,
  updateStayStatus,
  deleteStayAllocation,
  getStayInventory,
  createStayInventory,
  updateStayInventory,
  deleteStayInventory
} = require('../controllers/tourManagerController');

// All routes require authentication
router.use(protect);
router.use(authorizeRoles('TourManager'));

// Tours
router.get('/tours', getTours);
router.post('/tours', createTour);
router.put('/tours/:tourId', updateTour);
router.delete('/tours/:tourId', deleteTour);

// Bookings
router.get('/bookings', getBookings);

// Revenue & Stats
router.get('/earnings', getEarnings);
router.get('/stats', getDashboardStats);

// High-value tour manager flows
router.get('/packages', getTourPackages);
router.post('/packages', createTourPackage);
router.put('/packages/:packageId', updateTourPackage);
router.delete('/packages/:packageId', deleteTourPackage);

router.patch('/tours/:bookingId/assign-driver', assignTourDriver);

// Stay operations
router.get('/stay/requests', getStayRequests);
router.patch('/stay/bookings/:bookingId/allocate', allocateStayForBooking);
router.patch('/stay/bookings/:bookingId/status', updateStayStatus);
router.delete('/stay/bookings/:bookingId/allocations/:allocationId', deleteStayAllocation);
router.get('/stay/inventory', getStayInventory);
router.post('/stay/inventory', createStayInventory);
router.put('/stay/inventory/:inventoryId', updateStayInventory);
router.delete('/stay/inventory/:inventoryId', deleteStayInventory);

module.exports = router;
