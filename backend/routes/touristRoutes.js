const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  deleteProfile,
  getAvailableTours,
  createBooking,
  createFleetBooking,
  getMyBookings,
  getMyFleetBookings,
  cancelBooking,
  cancelFleetBooking,
  updateBooking,
  updateFleetBooking,
  deleteBooking,
  deleteFleetBooking,
  getTouristNotifications,
  markTouristNotificationRead,
  markAllTouristNotificationsRead,
  deleteTouristNotification,
  sendSOSAlert,
  getReviews,
  createReview,
  updateReview,
  deleteReview
} = require('../controllers/touristController');
const {
  createSupportRequest,
  getMySupportRequests,
  updateMySupportRequest,
  deleteMySupportRequest
} = require('../controllers/supportController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// All routes require user to be logged in and typically have 'tourist' role
// For now, protecting all routes. Add restrictTo('tourist') if needed.

router.use(protect);
// Optionally: router.use(restrictTo('tourist')); 

// 1. Profile Routes
router.route('/profile')
  .get(getProfile)
  .put(updateProfile)
  .delete(deleteProfile);

// 2. Tours & Bookings Routes
router.route('/tours')
  .get(getAvailableTours);

router.route('/bookings')
  .get(getMyBookings)
  .post(createBooking);

router.route('/bookings/:id')
  .put(updateBooking)
  .delete(deleteBooking);

router.route('/bookings/:id/cancel')
  .put(cancelBooking);

router.route('/fleet-bookings')
  .get(getMyFleetBookings)
  .post(createFleetBooking);

router.route('/fleet-bookings/:id')
  .put(updateFleetBooking)
  .delete(deleteFleetBooking);

router.route('/fleet-bookings/:id/cancel')
  .put(cancelFleetBooking);

router.route('/notifications')
  .get(getTouristNotifications);

router.route('/notifications/:id/read')
  .patch(markTouristNotificationRead);

router.route('/notifications/:id')
  .delete(deleteTouristNotification);

router.route('/notifications/read-all')
  .patch(markAllTouristNotificationsRead);

router.route('/sos')
  .post(sendSOSAlert);

// 2b. Tourist Support Routes
router.route('/support')
  .get(getMySupportRequests)
  .post(createSupportRequest);

router.route('/support/:requestId')
  .put(updateMySupportRequest)
  .delete(deleteMySupportRequest);

// 3. Reviews Routes
router.route('/reviews')
  .get(getReviews)
  .post(createReview);

router.route('/reviews/:id')
  .put(updateReview)
  .delete(deleteReview);

module.exports = router;

