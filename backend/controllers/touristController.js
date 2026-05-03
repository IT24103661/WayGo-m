const Booking = require('../models/Booking');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const TourPackage = require('../models/TourPackage');
const Tour = require('../models/Tour');
const Review = require('../models/Review');
const FleetNotification = require('../models/FleetNotification');
const TouristNotification = require('../models/TouristNotification');
const EmergencyAlert = require('../models/EmergencyAlert');
const AdminAuditLog = require('../models/AdminAuditLog');
const Sentiment = require('sentiment');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;
const sentimentAnalyzer = new Sentiment();

const cleanText = (value) => String(value || '').trim();

const validatePickupTime = (value, fieldName = 'pickupTime') => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { ok: false, message: `${fieldName} must be a valid date.` };
  }
  if (parsed.getTime() < Date.now() + 5 * 60 * 1000) {
    return { ok: false, message: `${fieldName} must be at least 5 minutes in the future.` };
  }
  return { ok: true, value: parsed };
};

const normalizeLocation = (value) => cleanText(value).toLowerCase();

const toDayStart = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isPastByDay = (date) => {
  return toDayStart(date).getTime() < toDayStart(new Date()).getTime();
};

const releaseBookingResources = async (booking) => {
  if (!booking) return;

  if (booking.assignedVehicle) {
    const vehicle = await Vehicle.findById(booking.assignedVehicle);
    if (vehicle) {
      vehicle.assignedDriver = null;
      vehicle.status = 'Available';
      await vehicle.save();
    }
  }

  if (booking.assignedDriver) {
    const driver = await User.findOne({ _id: booking.assignedDriver, role: 'Driver' });
    if (driver) {
      const hasOtherActiveBooking = await Booking.exists({
        _id: { $ne: booking._id },
        assignedDriver: driver._id,
        status: { $in: ['Accepted', 'En Route'] }
      });

      if (!hasOtherActiveBooking) {
        driver.status = 'Online';
        await driver.save();
      }
    }
  }
};

const notifyFleetManagersForBooking = async ({ booking, touristId, message }) => {
  const fleetManagers = await User.find({ role: 'FleetManager' }).select('_id');
  if (fleetManagers.length === 0) return;

  const notifications = fleetManagers.map((manager) => ({
    fleetManager: manager._id,
    booking: booking._id,
    tourist: touristId,
    message,
    type: 'BOOKING_CREATED'
  }));

  await FleetNotification.insertMany(notifications);
};

const sanitizePackageOptions = (packageOptions = {}) => {
  const safeAdults = Number(packageOptions.adults);
  const safeChildren = Number(packageOptions.children);
  const safeNights = Number(packageOptions.nights);
  const safeRoomCount = Number(packageOptions.roomCount);

  return {
    tourTitle: String(packageOptions.tourTitle || '').trim(),
    checkInDate: packageOptions.checkInDate ? new Date(packageOptions.checkInDate) : null,
    checkOutDate: packageOptions.checkOutDate ? new Date(packageOptions.checkOutDate) : null,
    adults: Number.isFinite(safeAdults) && safeAdults > 0 ? safeAdults : 1,
    children: Number.isFinite(safeChildren) && safeChildren >= 0 ? safeChildren : 0,
    nights: Number.isFinite(safeNights) && safeNights > 0 ? safeNights : 1,
    roomType: ['Standard', 'Deluxe', 'Family', 'Suite'].includes(packageOptions.roomType)
      ? packageOptions.roomType
      : 'Standard',
    roomCount: Number.isFinite(safeRoomCount) && safeRoomCount > 0 ? safeRoomCount : 1,
    mealPlan: ['No Meals', 'Breakfast', 'Half Board', 'Full Board'].includes(packageOptions.mealPlan)
      ? packageOptions.mealPlan
      : 'No Meals',
    dietPreference: String(packageOptions.dietPreference || '').trim(),
    extras: {
      airportPickup: Boolean(packageOptions.extras?.airportPickup),
      privateGuide: Boolean(packageOptions.extras?.privateGuide),
      activityAddons: Array.isArray(packageOptions.extras?.activityAddons)
        ? packageOptions.extras.activityAddons.map((item) => String(item || '').trim()).filter(Boolean)
        : []
    },
    pricing: {
      tourBase: Number(packageOptions.pricing?.tourBase) || 0,
      roomCost: Number(packageOptions.pricing?.roomCost) || 0,
      mealCost: Number(packageOptions.pricing?.mealCost) || 0,
      extrasCost: Number(packageOptions.pricing?.extrasCost) || 0,
      finalTotal: Number(packageOptions.pricing?.finalTotal) || 0
    }
  };
};

const deriveSentimentLabel = (score) => {
  if (score > 0) return 'Positive';
  if (score < 0) return 'Negative';
  return 'Neutral';
};

const getSentimentPayload = (text) => {
  const result = sentimentAnalyzer.analyze(String(text || ''));
  const score = Number.isFinite(result?.score) ? result.score : 0;
  return {
    sentimentScore: score,
    sentimentLabel: deriveSentimentLabel(score)
  };
};

const updateDriverFlagStatus = async (driverId) => {
  if (!driverId) return;

  const driver = await User.findOne({ _id: driverId, role: 'Driver' }).select('_id isFlagged');
  if (!driver) return;

  const latestThree = await Review.find({ driver: driver._id })
    .sort({ createdAt: -1 })
    .limit(3)
    .select('sentimentLabel');

  const shouldFlag = latestThree.length >= 3 && latestThree.every((item) => item.sentimentLabel === 'Negative');
  if (driver.isFlagged !== shouldFlag) {
    driver.isFlagged = shouldFlag;
    await driver.save();
  }
};

// ==========================================
// 1. TOURIST PROFILE MANAGEMENT (CRUD)
// ==========================================

// @desc    Get tourist profile (Read)
// @route   GET /api/tourist/profile
// @access  Private (Tourist only)
exports.getProfile = async (req, res) => {
  try {
    const tourist = await User.findById(req.user.userId).select('-password');
    if (!tourist) return res.status(404).json({ message: 'Tourist not found' });
    res.json(tourist);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update tourist profile (Update)
// @route   PUT /api/tourist/profile
// @access  Private (Tourist only)
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const tourist = await User.findById(req.user.userId);

    if (!tourist) return res.status(404).json({ message: 'Tourist not found' });

    if (name !== undefined) {
      const nextName = cleanText(name);
      if (nextName.length < 2 || nextName.length > 80) {
        return res.status(400).json({ message: 'Name must be between 2 and 80 characters.' });
      }
      tourist.name = nextName;
    }

    if (email !== undefined) {
      const nextEmail = cleanText(email).toLowerCase();
      if (!EMAIL_REGEX.test(nextEmail) || nextEmail.length > 120) {
        return res.status(400).json({ message: 'Enter a valid email address.' });
      }

      const existing = await User.findOne({ email: nextEmail, _id: { $ne: tourist._id } }).select('_id');
      if (existing) {
        return res.status(400).json({ message: 'Email already in use by another account.' });
      }
      tourist.email = nextEmail;
    }

    if (phone !== undefined) {
      const nextPhone = cleanText(phone);
      if (!PHONE_REGEX.test(nextPhone)) {
        return res.status(400).json({ message: 'Phone number must contain exactly 10 digits (numbers only).' });
      }
      tourist.phone = nextPhone;
    }

    const updatedTourist = await tourist.save();
    
    // Don't return the password
    const result = updatedTourist.toObject();
    delete result.password;
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete tourist account (Delete)
// @route   DELETE /api/tourist/profile
// @access  Private (Tourist only)
exports.deleteProfile = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.userId);
    res.json({ message: 'Tourist account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ==========================================
// 2. TOUR BOOKINGS MANAGEMENT (CRUD)
// ==========================================

// @desc    Get all available tours for booking (Read)
// @route   GET /api/tourist/tours
// @access  Public or Private
exports.getAvailableTours = async (req, res) => {
  try {
    const tours = await Tour.find({ isActive: true })
      .select('title description destination durationDays price rating totalReviews images')
      .sort({ createdAt: -1 });

    if (tours.length > 0) {
      return res.json(tours);
    }

    const packages = await TourPackage.find({})
      .select('title description durationDays flatPrice')
      .sort({ createdAt: -1 });

    const mapped = packages.map((pkg) => ({
      _id: pkg._id,
      title: pkg.title,
      description: pkg.description,
      destination: 'Sri Lanka',
      durationDays: pkg.durationDays,
      price: pkg.flatPrice,
      rating: 0,
      totalReviews: 0,
      images: []
    }));

    return res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create a new booking (Create)
// @route   POST /api/tourist/bookings
// @access  Private (Tourist only)
exports.createBooking = async (req, res) => {
  try {
    const { tourId, date, members = 1, pickupLocation, dropoffLocation, totalPrice, packageOptions } = req.body;

    const pickup = cleanText(pickupLocation);
    const dropoff = dropoffLocation === undefined || dropoffLocation === null ? '' : cleanText(dropoffLocation);

    if (!pickup) {
      return res.status(400).json({ message: 'pickupLocation is required.' });
    }
    if (pickup.length < 3 || pickup.length > 180) {
      return res.status(400).json({ message: 'pickupLocation must be between 3 and 180 characters.' });
    }
    if (dropoff && dropoff.length > 180) {
      return res.status(400).json({ message: 'dropoffLocation must be 180 characters or fewer.' });
    }

    const pickupValidation = date ? validatePickupTime(date, 'date') : { ok: true, value: new Date(Date.now() + 10 * 60 * 1000) };
    if (!pickupValidation.ok) {
      return res.status(400).json({ message: pickupValidation.message });
    }
    const pickupTime = pickupValidation.value;

    let tour = null;
    if (tourId && typeof tourId === 'string' && /^[a-f\d]{24}$/i.test(tourId)) {
      tour = await Tour.findById(tourId).select('_id price');
    }

    const parsedMembers = Number(members);
    if (!Number.isFinite(parsedMembers) || parsedMembers < 1 || parsedMembers > 20) {
      return res.status(400).json({ message: 'members must be a number between 1 and 20.' });
    }
    const safeMembers = parsedMembers;

    const calculatedPrice = tour
      ? Number(tour.price) * safeMembers
      : (Number(totalPrice) > 0 ? Number(totalPrice) : 12500);

    const sanitizedOptions = sanitizePackageOptions(packageOptions || {});
    if (sanitizedOptions.checkInDate && Number.isNaN(sanitizedOptions.checkInDate.getTime())) {
      return res.status(400).json({ message: 'packageOptions.checkInDate must be a valid date.' });
    }
    if (sanitizedOptions.checkOutDate && Number.isNaN(sanitizedOptions.checkOutDate.getTime())) {
      return res.status(400).json({ message: 'packageOptions.checkOutDate must be a valid date.' });
    }
    if (sanitizedOptions.checkInDate && sanitizedOptions.checkOutDate && sanitizedOptions.checkOutDate <= sanitizedOptions.checkInDate) {
      return res.status(400).json({ message: 'packageOptions.checkOutDate must be after checkInDate.' });
    }
    if (sanitizedOptions.checkInDate && isPastByDay(sanitizedOptions.checkInDate)) {
      return res.status(400).json({ message: 'packageOptions.checkInDate cannot be in the past.' });
    }
    if (sanitizedOptions.checkOutDate && isPastByDay(sanitizedOptions.checkOutDate)) {
      return res.status(400).json({ message: 'packageOptions.checkOutDate cannot be in the past.' });
    }

    const finalPrice = sanitizedOptions.pricing.finalTotal > 0
      ? sanitizedOptions.pricing.finalTotal
      : calculatedPrice;
    if (!Number.isFinite(finalPrice) || finalPrice <= 0 || finalPrice > 5000000) {
      return res.status(400).json({ message: 'totalPrice must be greater than 0 and less than or equal to 5,000,000.' });
    }

    const newBooking = await Booking.create({
      tourist: req.user.userId,
      bookingType: 'Tour',
      tourPackage: tour ? tour._id : null,
      pickupLocation: pickup,
      dropoffLocation: null,
      pickupTime,
      totalPrice: finalPrice,
      packageOptions: sanitizedOptions,
      status: 'Pending'
    });

    // Notify fleet managers that a new tourist booking was created.
    const tourist = await User.findById(req.user.userId).select('name');
    const fleetManagers = await User.find({ role: 'FleetManager' }).select('_id');

    if (fleetManagers.length > 0) {
      const message = `New booking by ${tourist?.name || 'Tourist'}: ${newBooking.pickupLocation}${newBooking.dropoffLocation ? ` -> ${newBooking.dropoffLocation}` : ''}`;
      const notifications = fleetManagers.map((manager) => ({
        fleetManager: manager._id,
        booking: newBooking._id,
        tourist: req.user.userId,
        message,
        type: 'BOOKING_CREATED'
      }));
      await FleetNotification.insertMany(notifications);
    }

    const populated = await Booking.findById(newBooking._id)
      .populate('tourPackage', 'title destination durationDays price')
      .populate('assignedDriver', 'name email phone')
      .populate('assignedVehicle', 'plateNumber make model');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create a fleet booking (Taxi)
// @route   POST /api/tourist/fleet-bookings
// @access  Private (Tourist only)
exports.createFleetBooking = async (req, res) => {
  try {
    const { pickupLocation, dropoffLocation, pickupTime, totalPrice } = req.body;

    if (!pickupLocation || !dropoffLocation || !pickupTime) {
      return res.status(400).json({ message: 'pickupLocation, dropoffLocation and pickupTime are required.' });
    }

    const pickup = cleanText(pickupLocation);
    const dropoff = cleanText(dropoffLocation);
    if (pickup.length < 3 || pickup.length > 180 || dropoff.length < 3 || dropoff.length > 180) {
      return res.status(400).json({ message: 'pickupLocation and dropoffLocation must be between 3 and 180 characters.' });
    }
    if (normalizeLocation(pickup) === normalizeLocation(dropoff)) {
      return res.status(400).json({ message: 'pickupLocation and dropoffLocation cannot be the same.' });
    }

    const pickupValidation = validatePickupTime(pickupTime);
    if (!pickupValidation.ok) {
      return res.status(400).json({ message: pickupValidation.message });
    }
    const parsedPickupTime = pickupValidation.value;

    const price = Number(totalPrice);
    if (!Number.isFinite(price) || price <= 0 || price > 5000000) {
      return res.status(400).json({ message: 'totalPrice must be greater than 0 and less than or equal to 5,000,000.' });
    }

    const newBooking = await Booking.create({
      tourist: req.user.userId,
      bookingType: 'Taxi',
      pickupLocation: pickup,
      dropoffLocation: dropoff,
      pickupTime: parsedPickupTime,
      totalPrice: price,
      status: 'Pending'
    });

    const tourist = await User.findById(req.user.userId).select('name');
    await notifyFleetManagersForBooking({
      booking: newBooking,
      touristId: req.user.userId,
      message: `New fleet booking by ${tourist?.name || 'Tourist'}: ${newBooking.pickupLocation} -> ${newBooking.dropoffLocation}`
    });

    return res.status(201).json(newBooking);
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get tourist fleet bookings (Taxi only)
// @route   GET /api/tourist/fleet-bookings
// @access  Private (Tourist only)
exports.getMyFleetBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      tourist: req.user.userId,
      bookingType: 'Taxi'
    })
      .populate('assignedDriver', 'name email phone')
      .populate('assignedVehicle', 'plateNumber make model')
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update tourist fleet booking (Taxi only)
// @route   PUT /api/tourist/fleet-bookings/:id
// @access  Private (Tourist only)
exports.updateFleetBooking = async (req, res) => {
  try {
    const { pickupLocation, dropoffLocation, pickupTime, totalPrice } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: 'Fleet booking not found' });
    if (booking.bookingType !== 'Taxi') {
      return res.status(400).json({ message: 'This booking is not a fleet booking.' });
    }
    if (booking.tourist.toString() !== req.user.userId.toString()) {
      return res.status(401).json({ message: 'Not authorized to modify this fleet booking' });
    }
    if (booking.status === 'Cancelled' || booking.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot modify a completed or cancelled fleet booking' });
    }

    if (pickupLocation !== undefined) {
      const pickup = cleanText(pickupLocation);
      if (pickup.length < 3 || pickup.length > 180) {
        return res.status(400).json({ message: 'pickupLocation must be between 3 and 180 characters.' });
      }
      booking.pickupLocation = pickup;
    }
    if (dropoffLocation !== undefined) {
      const dropoff = cleanText(dropoffLocation);
      if (dropoff.length < 3 || dropoff.length > 180) {
        return res.status(400).json({ message: 'dropoffLocation must be between 3 and 180 characters.' });
      }
      booking.dropoffLocation = dropoff;
    }
    if (normalizeLocation(booking.pickupLocation) === normalizeLocation(booking.dropoffLocation)) {
      return res.status(400).json({ message: 'pickupLocation and dropoffLocation cannot be the same.' });
    }

    if (pickupTime) {
      const pickupValidation = validatePickupTime(pickupTime);
      if (!pickupValidation.ok) {
        return res.status(400).json({ message: pickupValidation.message });
      }
      booking.pickupTime = pickupValidation.value;
    }
    if (totalPrice !== undefined) {
      const price = Number(totalPrice);
      if (!Number.isFinite(price) || price <= 0 || price > 5000000) {
        return res.status(400).json({ message: 'totalPrice must be greater than 0 and less than or equal to 5,000,000.' });
      }
      booking.totalPrice = price;
    }

    const updated = await booking.save();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Cancel tourist fleet booking (Taxi only)
// @route   PUT /api/tourist/fleet-bookings/:id/cancel
// @access  Private (Tourist only)
exports.cancelFleetBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: 'Fleet booking not found' });
    if (booking.bookingType !== 'Taxi') {
      return res.status(400).json({ message: 'This booking is not a fleet booking.' });
    }
    if (booking.tourist.toString() !== req.user.userId.toString()) {
      return res.status(401).json({ message: 'Not authorized to cancel this fleet booking' });
    }

    booking.status = 'Cancelled';
    await booking.save();
    await releaseBookingResources(booking);

    return res.json({ message: 'Fleet booking canceled successfully', booking });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete tourist fleet booking permanently (Taxi only)
// @route   DELETE /api/tourist/fleet-bookings/:id
// @access  Private (Tourist only)
exports.deleteFleetBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: 'Fleet booking not found' });
    if (booking.bookingType !== 'Taxi') {
      return res.status(400).json({ message: 'This booking is not a fleet booking.' });
    }
    if (booking.tourist.toString() !== req.user.userId.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this fleet booking' });
    }

    await releaseBookingResources(booking);
    await booking.deleteOne();
    return res.json({ message: 'Fleet booking deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get tourist notifications
// @route   GET /api/tourist/notifications
// @access  Private (Tourist only)
exports.getTouristNotifications = async (req, res) => {
  try {
    const notifications = await TouristNotification.find({ tourist: req.user.userId })
      .populate({
        path: 'booking',
        select: 'pickupLocation dropoffLocation pickupTime status totalPrice assignedDriver assignedVehicle',
        populate: [
          { path: 'assignedDriver', select: 'name phone email' },
          { path: 'assignedVehicle', select: 'plateNumber make model' }
        ]
      })
      .populate('fleetManager', 'name email')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Mark tourist notification as read
// @route   PATCH /api/tourist/notifications/:id/read
// @access  Private (Tourist only)
exports.markTouristNotificationRead = async (req, res) => {
  try {
    const notification = await TouristNotification.findOneAndUpdate(
      { _id: req.params.id, tourist: req.user.userId },
      { isRead: true },
      { returnDocument: 'after' }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    return res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Mark all tourist notifications as read
// @route   PATCH /api/tourist/notifications/read-all
// @access  Private (Tourist only)
exports.markAllTouristNotificationsRead = async (req, res) => {
  try {
    const result = await TouristNotification.updateMany(
      { tourist: req.user.userId, isRead: false },
      { $set: { isRead: true } }
    );

    return res.json({
      success: true,
      message: 'All notifications marked as read.',
      data: {
        modifiedCount: result.modifiedCount || 0
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete tourist notification
// @route   DELETE /api/tourist/notifications/:id
// @access  Private (Tourist only)
exports.deleteTouristNotification = async (req, res) => {
  try {
    const notification = await TouristNotification.findOneAndDelete({
      _id: req.params.id,
      tourist: req.user.userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    return res.json({
      success: true,
      message: 'Notification deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get tourist's personal bookings (Read)
// @route   GET /api/tourist/bookings
// @access  Private (Tourist only)
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ tourist: req.user.userId })
      .populate('tourPackage')
      .populate('assignedDriver', 'name email phone')
      .populate('assignedVehicle', 'plateNumber make model')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Cancel a booking (Update/Delete)
// @route   PUT /api/tourist/bookings/:id/cancel
// @access  Private (Tourist only)
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.tourist.toString() !== req.user.userId.toString()) {
      return res.status(401).json({ message: 'Not authorized to cancel this booking' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    res.json({ message: 'Booking canceled successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update a booking (Modify)
// @route   PUT /api/tourist/bookings/:id
// @access  Private (Tourist only)
exports.updateBooking = async (req, res) => {
  try {
    const { pickupLocation, dropoffLocation, pickupTime, totalPrice, packageOptions } = req.body;
    let booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.tourist.toString() !== req.user.userId.toString()) {
      return res.status(401).json({ message: 'Not authorized to modify this booking' });
    }
    
    // Only allow modifing pending bookings usually, but let's just do it
    if (booking.status === 'Cancelled' || booking.status === 'Completed') {
        return res.status(400).json({ message: 'Cannot modify a completed or cancelled booking' });
    }

    if (pickupLocation !== undefined) {
      const pickup = cleanText(pickupLocation);
      if (pickup.length < 3 || pickup.length > 180) {
        return res.status(400).json({ message: 'pickupLocation must be between 3 and 180 characters.' });
      }
      booking.pickupLocation = pickup;
    }

    if (dropoffLocation !== undefined) {
      const dropoff = cleanText(dropoffLocation);
      if (dropoff && (dropoff.length < 3 || dropoff.length > 180)) {
        return res.status(400).json({ message: 'dropoffLocation must be between 3 and 180 characters when provided.' });
      }
      booking.dropoffLocation = dropoff || null;
    }

    if (
      booking.bookingType === 'Taxi' &&
      booking.dropoffLocation &&
      normalizeLocation(booking.pickupLocation) === normalizeLocation(booking.dropoffLocation)
    ) {
      return res.status(400).json({ message: 'pickupLocation and dropoffLocation cannot be the same.' });
    }

    if (pickupTime) {
      const pickupValidation = validatePickupTime(pickupTime);
      if (!pickupValidation.ok) {
        return res.status(400).json({ message: pickupValidation.message });
      }
      booking.pickupTime = pickupValidation.value;
    }

    if (totalPrice !== undefined && Number(totalPrice) > 0) {
      booking.totalPrice = Number(totalPrice);
    } else if (totalPrice !== undefined) {
      return res.status(400).json({ message: 'totalPrice must be a positive number.' });
    }

    if (packageOptions && typeof packageOptions === 'object') {
      const nextOptions = sanitizePackageOptions({
        ...(booking.packageOptions || {}),
        ...packageOptions,
        extras: {
          ...((booking.packageOptions && booking.packageOptions.extras) || {}),
          ...(packageOptions.extras || {})
        },
        pricing: {
          ...((booking.packageOptions && booking.packageOptions.pricing) || {}),
          ...(packageOptions.pricing || {})
        }
      });

      if (nextOptions.checkInDate && Number.isNaN(nextOptions.checkInDate.getTime())) {
        return res.status(400).json({ message: 'packageOptions.checkInDate must be a valid date.' });
      }
      if (nextOptions.checkOutDate && Number.isNaN(nextOptions.checkOutDate.getTime())) {
        return res.status(400).json({ message: 'packageOptions.checkOutDate must be a valid date.' });
      }
      if (nextOptions.checkInDate && nextOptions.checkOutDate && nextOptions.checkOutDate <= nextOptions.checkInDate) {
        return res.status(400).json({ message: 'packageOptions.checkOutDate must be after checkInDate.' });
      }
      if (nextOptions.checkInDate && isPastByDay(nextOptions.checkInDate)) {
        return res.status(400).json({ message: 'packageOptions.checkInDate cannot be in the past.' });
      }
      if (nextOptions.checkOutDate && isPastByDay(nextOptions.checkOutDate)) {
        return res.status(400).json({ message: 'packageOptions.checkOutDate cannot be in the past.' });
      }
      booking.packageOptions = nextOptions;
    }

    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a booking permanently
// @route   DELETE /api/tourist/bookings/:id
// @access  Private (Tourist only)
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.tourist.toString() !== req.user.userId.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this booking' });
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


// ==========================================
// REVIEWS MANAGEMENT (CRUD)
// ==========================================

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ tourist: req.user.userId }).sort('-createdAt');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { tourName, rating, score, text, driverId = null } = req.body;

    const safeTourName = cleanText(tourName || 'General Tour');
    const safeText = cleanText(text);
    const incomingScore = rating !== undefined ? rating : score;
    const safeRating = Number(incomingScore);

    if (!Number.isInteger(safeRating) || safeRating < 1 || safeRating > 5) {
      return res.status(400).json({ message: 'rating/score must be an integer between 1 and 5.' });
    }
    if (!safeText || safeText.length < 10 || safeText.length > 1000) {
      return res.status(400).json({ message: 'text must be between 10 and 1000 characters.' });
    }
    if (safeTourName.length > 120) {
      return res.status(400).json({ message: 'tourName should be 120 characters or fewer.' });
    }

    let driver = null;
    if (driverId) {
      if (!/^[a-f\d]{24}$/i.test(String(driverId))) {
        return res.status(400).json({ message: 'driverId must be a valid ID when provided.' });
      }
      driver = await User.findOne({ _id: driverId, role: 'Driver' }).select('_id');
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found for provided driverId.' });
      }
    }

    const sentimentPayload = getSentimentPayload(safeText);

    const review = await Review.create({
      tourist: req.user.userId,
      driver: driver ? driver._id : null,
      tourName: safeTourName,
      rating: safeRating,
      text: safeText,
      sentimentScore: sentimentPayload.sentimentScore,
      sentimentLabel: sentimentPayload.sentimentLabel
    });

    if (driver) {
      await updateDriverFlagStatus(driver._id);
    }
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.tourist.toString() !== req.user.userId.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    if (req.body.rating !== undefined || req.body.score !== undefined) {
      const incomingScore = req.body.rating !== undefined ? req.body.rating : req.body.score;
      const safeRating = Number(incomingScore);
      if (!Number.isInteger(safeRating) || safeRating < 1 || safeRating > 5) {
        return res.status(400).json({ message: 'rating/score must be an integer between 1 and 5.' });
      }
      review.rating = safeRating;
    }
    if (req.body.text !== undefined) {
      const safeText = cleanText(req.body.text);
      if (!safeText || safeText.length < 10 || safeText.length > 1000) {
        return res.status(400).json({ message: 'text must be between 10 and 1000 characters.' });
      }
      review.text = safeText;
      const sentimentPayload = getSentimentPayload(safeText);
      review.sentimentScore = sentimentPayload.sentimentScore;
      review.sentimentLabel = sentimentPayload.sentimentLabel;
    }
    if (req.body.tourName !== undefined) {
      const safeTourName = cleanText(req.body.tourName || 'General Tour');
      if (safeTourName.length > 120) {
        return res.status(400).json({ message: 'tourName should be 120 characters or fewer.' });
      }
      review.tourName = safeTourName;
    }
    
    await review.save();
    if (review.driver) {
      await updateDriverFlagStatus(review.driver);
    }
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.tourist.toString() !== req.user.userId.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    const driverId = review.driver;
    await review.deleteOne();
    if (driverId) {
      await updateDriverFlagStatus(driverId);
    }
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ==========================================
// EMERGENCY SOS
// ==========================================

// @desc    Trigger emergency SOS alert
// @route   POST /api/tourist/sos
// @access  Private (Tourist only)
exports.sendSOSAlert = async (req, res) => {
  try {
    const { latitude, longitude, accuracy, emergencyType = 'Safety', note = '' } = req.body || {};

    const lat = Number(latitude);
    const lng = Number(longitude);
    const acc = accuracy === undefined || accuracy === null ? null : Number(accuracy);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({ message: 'latitude must be a valid number between -90 and 90.' });
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ message: 'longitude must be a valid number between -180 and 180.' });
    }
    if (acc !== null && (!Number.isFinite(acc) || acc < 0 || acc > 100000)) {
      return res.status(400).json({ message: 'accuracy must be between 0 and 100000 meters when provided.' });
    }

    const safeType = ['Medical', 'Safety', 'Accident', 'Other'].includes(String(emergencyType))
      ? String(emergencyType)
      : 'Safety';
    const safeNote = cleanText(note).slice(0, 500);

    const oneMinuteAgo = new Date(Date.now() - (60 * 1000));
    const hasRecentActiveAlert = await EmergencyAlert.exists({
      tourist: req.user.userId,
      status: 'Active',
      createdAt: { $gte: oneMinuteAgo }
    });

    if (hasRecentActiveAlert) {
      return res.status(429).json({ message: 'An SOS alert was sent recently. Please wait a moment before sending another.' });
    }

    const alert = await EmergencyAlert.create({
      tourist: req.user.userId,
      latitude: lat,
      longitude: lng,
      accuracy: acc,
      emergencyType: safeType,
      note: safeNote,
      status: 'Active'
    });

    await AdminAuditLog.create({
      actor: req.user.userId,
      action: 'EMERGENCY_SOS_CREATED',
      targetType: 'EmergencyAlert',
      targetId: String(alert._id),
      after: {
        latitude: alert.latitude,
        longitude: alert.longitude,
        accuracy: alert.accuracy,
        emergencyType: alert.emergencyType,
        status: alert.status
      },
      meta: {
        source: 'tourist-sos'
      }
    });

    return res.status(201).json({
      success: true,
      message: 'SOS alert sent to WayGo Admin. Contact local emergency services immediately if needed.',
      data: {
        id: alert._id,
        status: alert.status,
        createdAt: alert.createdAt,
        emergencyHotline: '119'
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error sending SOS alert.' });
  }
};
