const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Booking = require('../models/Booking');
const FleetNotification = require('../models/FleetNotification');
const TouristNotification = require('../models/TouristNotification');
const DriverSalary = require('../models/DriverSalary');
const bcrypt = require('bcryptjs');

const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;
const PLATE_REGEX = /^[A-Z]{2,3}-\d{4}$/;
const CATEGORY_OPTIONS = ['Economy', 'Luxury', 'Van', 'SUV'];
const STATUS_OPTIONS = ['Active', 'Under Maintenance', 'Out of Service', 'Available', 'On Trip', 'Retired'];
const TYPE_OPTIONS = ['Sedan', 'SUV', 'Van', 'Bus', 'Minivan', 'Luxury'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const notifyTourist = async ({ touristId, bookingId, fleetManagerId, message, type }) => {
  if (!touristId) return;

  await TouristNotification.create({
    tourist: touristId,
    booking: bookingId || null,
    fleetManager: fleetManagerId || null,
    message,
    type: type || 'BOOKING_UPDATED'
  });
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

const normalizeVehiclePayload = (payload = {}) => {
  const category = payload.category;
  const normalizedType = payload.type
    || (category === 'Luxury' ? 'Luxury' : category === 'SUV' ? 'SUV' : category === 'Van' ? 'Van' : 'Sedan');

  return {
    plateNumber: String(payload.plateNumber || '').trim().toUpperCase(),
    make: String(payload.make || payload.brand || '').trim(),
    brand: String(payload.brand || payload.make || '').trim(),
    model: String(payload.model || '').trim(),
    category,
    status: payload.status,
    year: Number(payload.year),
    capacity: payload.capacity !== undefined ? Number(payload.capacity) : undefined,
    color: payload.color,
    type: normalizedType,
    compliance: payload.compliance,
    mileage: payload.mileage
  };
};

const validateVehiclePayload = (vehiclePayload) => {
  if (!vehiclePayload.plateNumber || !vehiclePayload.make || !vehiclePayload.model || !vehiclePayload.year || !vehiclePayload.category) {
    return 'plateNumber, make, model, year, and category are required.';
  }

  if (!PLATE_REGEX.test(vehiclePayload.plateNumber)) {
    return 'Plate number must follow format ABC-1234.';
  }

  const currentYear = new Date().getFullYear() + 1;
  if (Number.isNaN(vehiclePayload.year) || vehiclePayload.year < 1980 || vehiclePayload.year > currentYear) {
    return 'Please provide a valid vehicle year.';
  }

  if (!CATEGORY_OPTIONS.includes(vehiclePayload.category)) {
    return 'Invalid vehicle category.';
  }

  if (vehiclePayload.status && !STATUS_OPTIONS.includes(vehiclePayload.status)) {
    return 'Invalid vehicle status.';
  }

  if (vehiclePayload.type && !TYPE_OPTIONS.includes(vehiclePayload.type)) {
    return 'Invalid vehicle type.';
  }

  if (vehiclePayload.capacity !== undefined) {
    if (Number.isNaN(vehiclePayload.capacity) || vehiclePayload.capacity < 1 || vehiclePayload.capacity > 100) {
      return 'Vehicle capacity must be between 1 and 100.';
    }
  }

  return null;
};

exports.addVehicle = async (req, res) => {
  try {
    const vehiclePayload = normalizeVehiclePayload(req.body);

    const validationError = validateVehiclePayload(vehiclePayload);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const vehicle = await Vehicle.create({
      plateNumber: vehiclePayload.plateNumber,
      brand: vehiclePayload.brand,
      make: vehiclePayload.make,
      model: vehiclePayload.model,
      year: vehiclePayload.year,
      category: vehiclePayload.category,
      status: vehiclePayload.status || 'Active',
      compliance: vehiclePayload.compliance || {},
      mileage: vehiclePayload.mileage || {},
      capacity: vehiclePayload.capacity || 4,
      color: vehiclePayload.color || null,
      type: vehiclePayload.type,
      managedBy: req.user.userId
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle added successfully.',
      data: vehicle
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Plate number already exists.' });
    }
    return res.status(500).json({ message: 'Server error adding vehicle.' });
  }
};

exports.getMaintenanceAlerts = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ managedBy: req.user.userId }).sort({ updatedAt: -1 });
    const soon = new Date(Date.now() + DAYS_30_MS);

    const serviceDue = vehicles.filter((vehicle) => {
      const current = vehicle.mileage?.current ?? 0;
      const lastService = vehicle.mileage?.lastService ?? 0;
      const interval = vehicle.mileage?.serviceInterval ?? 0;
      return interval > 0 && (current - lastService) >= interval;
    });

    const complianceDue = vehicles.filter((vehicle) => {
      const { licenseExpiry, insuranceExpiry, emissionTestExpiry } = vehicle.compliance || {};
      const checks = [licenseExpiry, insuranceExpiry, emissionTestExpiry].filter(Boolean);
      return checks.some((date) => date <= soon);
    });

    return res.json({
      success: true,
      data: {
        serviceDue,
        complianceDue
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching maintenance alerts.' });
  }
};

exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ managedBy: req.user.userId }).sort({ updatedAt: -1 });
    return res.json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching vehicles.' });
  }
};

exports.getAvailableVehiclesForTrips = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({
      managedBy: req.user.userId,
      status: { $in: ['Available', 'Active'] }
    }).sort({ updatedAt: -1 });

    return res.json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching available vehicles.' });
  }
};

exports.assignBookingToDriver = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { driverId, vehicleId } = req.body;

    if (!driverId) {
      return res.status(400).json({ message: 'driverId is required.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (['Completed', 'Cancelled'].includes(booking.status)) {
      return res.status(400).json({ message: 'Completed or cancelled bookings cannot be assigned.' });
    }

    const driver = await User.findOne({ _id: driverId, role: 'Driver' });
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found.' });
    }

    let vehicle = null;

    if (vehicleId) {
      vehicle = await Vehicle.findOne({
        _id: vehicleId,
        managedBy: req.user.userId,
        status: { $in: ['Available', 'Active'] }
      });
    } else {
      vehicle = await Vehicle.findOne({
        managedBy: req.user.userId,
        status: { $in: ['Available', 'Active'] },
        $or: [
          { assignedDriver: driver._id },
          { assignedDriver: null }
        ]
      }).sort({ updatedAt: -1 });
    }

    if (!vehicle) {
      return res.status(404).json({ message: 'Available vehicle not found.' });
    }

    const isCurrentBookingVehicle = booking.assignedVehicle && String(booking.assignedVehicle) === String(vehicle._id);
    if (vehicle.assignedDriver && String(vehicle.assignedDriver) !== String(driverId) && !isCurrentBookingVehicle) {
      return res.status(400).json({ message: 'Vehicle is assigned to a different driver.' });
    }

    const previousDriverId = booking.assignedDriver ? String(booking.assignedDriver) : null;
    const previousVehicleId = booking.assignedVehicle ? String(booking.assignedVehicle) : null;

    booking.assignedDriver = driver._id;
    booking.assignedVehicle = vehicle._id;
    booking.status = 'Accepted';
    await booking.save();

    if (previousVehicleId && previousVehicleId !== String(vehicle._id)) {
      const previousVehicle = await Vehicle.findById(previousVehicleId);
      if (previousVehicle) {
        previousVehicle.assignedDriver = null;
        if (previousVehicle.status === 'On Trip') {
          previousVehicle.status = 'Available';
        }
        await previousVehicle.save();
      }
    }

    if (previousDriverId && previousDriverId !== String(driver._id)) {
      const previousDriver = await User.findOne({ _id: previousDriverId, role: 'Driver' });
      if (previousDriver) {
        const hasActiveBooking = await Booking.exists({
          _id: { $ne: booking._id },
          assignedDriver: previousDriver._id,
          status: { $in: ['Accepted', 'En Route'] }
        });

        if (!hasActiveBooking && previousDriver.status === 'On Trip') {
          previousDriver.status = 'Online';
          await previousDriver.save();
        }
      }
    }

    vehicle.assignedDriver = driver._id;
    vehicle.status = 'On Trip';
    await vehicle.save();

    driver.status = 'On Trip';
    await driver.save();

    await notifyTourist({
      touristId: booking.tourist,
      bookingId: booking._id,
      fleetManagerId: req.user.userId,
      message: `Your fleet booking has been accepted and assigned to ${driver.name} (${vehicle.plateNumber}). Contact: ${driver.phone || 'N/A'}.`,
      type: 'BOOKING_ASSIGNED'
    });

    return res.json({
      success: true,
      message: 'Booking assigned successfully.',
      data: booking
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error assigning booking.' });
  }
};

exports.getFleetBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { bookingType: 'Taxi' };

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('tourist', 'name email phone')
      .populate('assignedDriver', 'name email phone')
      .populate('assignedVehicle', 'plateNumber make model')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching fleet bookings.' });
  }
};

exports.updateFleetBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, pickupTime, pickupLocation, dropoffLocation, totalPrice } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Fleet booking not found.' });
    }

    if (booking.bookingType !== 'Taxi') {
      return res.status(400).json({ message: 'This booking is not a fleet booking.' });
    }

    const previousStatus = booking.status;
    let hasAnyUpdate = false;

    if (status !== undefined) {
      const allowed = ['Pending', 'Accepted', 'En Route', 'Completed', 'Cancelled'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: 'Invalid booking status.' });
      }
      if (booking.status !== status) {
        hasAnyUpdate = true;
      }
      booking.status = status;
    }

    if (pickupLocation !== undefined) {
      booking.pickupLocation = String(pickupLocation).trim();
      hasAnyUpdate = true;
    }

    if (dropoffLocation !== undefined) {
      booking.dropoffLocation = dropoffLocation ? String(dropoffLocation).trim() : null;
      hasAnyUpdate = true;
    }

    if (pickupTime !== undefined) {
      const parsedPickupTime = new Date(pickupTime);
      if (Number.isNaN(parsedPickupTime.getTime())) {
        return res.status(400).json({ message: 'pickupTime must be a valid date.' });
      }
      booking.pickupTime = parsedPickupTime;
      hasAnyUpdate = true;
    }

    if (totalPrice !== undefined) {
      const price = Number(totalPrice);
      if (Number.isNaN(price) || price < 0) {
        return res.status(400).json({ message: 'totalPrice must be a valid non-negative number.' });
      }
      booking.totalPrice = price;
      hasAnyUpdate = true;
    }

    const updated = await booking.save();

    if (status !== undefined && ['Completed', 'Cancelled'].includes(status) && previousStatus !== status) {
      await releaseBookingResources(booking);
    }

    if (hasAnyUpdate) {
      const actionMessage = status !== undefined && previousStatus !== booking.status
        ? `Your fleet booking status changed from ${previousStatus} to ${booking.status}.`
        : 'Your fleet booking details were updated by fleet operations.';

      await notifyTourist({
        touristId: booking.tourist,
        bookingId: booking._id,
        fleetManagerId: req.user.userId,
        message: actionMessage,
        type: status !== undefined && previousStatus !== booking.status ? 'BOOKING_STATUS' : 'BOOKING_UPDATED'
      });
    }

    return res.json({
      success: true,
      message: 'Fleet booking updated successfully.',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error updating fleet booking.' });
  }
};

exports.deleteFleetBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Fleet booking not found.' });
    }

    if (booking.bookingType !== 'Taxi') {
      return res.status(400).json({ message: 'This booking is not a fleet booking.' });
    }

    await notifyTourist({
      touristId: booking.tourist,
      bookingId: booking._id,
      fleetManagerId: req.user.userId,
      message: 'Your fleet booking was removed by fleet operations.',
      type: 'BOOKING_DELETED'
    });

    await releaseBookingResources(booking);

    await booking.deleteOne();

    return res.json({
      success: true,
      message: 'Fleet booking deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error deleting fleet booking.' });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findOne({ _id: vehicleId, managedBy: req.user.userId });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    const vehiclePayload = normalizeVehiclePayload({
      ...vehicle.toObject(),
      ...req.body
    });

    const validationError = validateVehiclePayload(vehiclePayload);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const updatableFields = [
      'plateNumber',
      'brand',
      'make',
      'model',
      'year',
      'category',
      'status',
      'capacity',
      'color',
      'type'
    ];

    updatableFields.forEach((key) => {
      if (vehiclePayload[key] !== undefined) {
        vehicle[key] = vehiclePayload[key];
      }
    });

    if (req.body.compliance && typeof req.body.compliance === 'object') {
      vehicle.compliance = { ...vehicle.compliance, ...req.body.compliance };
    }

    if (req.body.mileage && typeof req.body.mileage === 'object') {
      vehicle.mileage = { ...vehicle.mileage, ...req.body.mileage };
    }

    await vehicle.save();

    return res.json({
      success: true,
      message: 'Vehicle updated successfully.',
      data: vehicle
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Plate number already exists.' });
    }
    return res.status(500).json({ message: 'Server error updating vehicle.' });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const deleted = await Vehicle.findOneAndDelete({ _id: vehicleId, managedBy: req.user.userId });

    if (!deleted) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    return res.json({
      success: true,
      message: 'Vehicle deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error deleting vehicle.' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await FleetNotification.find({ fleetManager: req.user.userId })
      .populate('tourist', 'name email phone')
      .populate('booking', 'pickupLocation dropoffLocation pickupTime status totalPrice')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching notifications.' });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await FleetNotification.findOneAndUpdate(
      { _id: id, fleetManager: req.user.userId },
      { isRead: true },
      { returnDocument: 'after' }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    return res.json({ success: true, data: notification });
  } catch (error) {
    return res.status(500).json({ message: 'Server error updating notification.' });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const result = await FleetNotification.updateMany(
      { fleetManager: req.user.userId, isRead: false },
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
    return res.status(500).json({ message: 'Server error updating notifications.' });
  }
};

exports.getManagedDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'Driver' })
      .select('name email phone status managedByFleetManager')
      .sort({ name: 1 });

    const driverIdsWithVehicle = await Vehicle.distinct('assignedDriver', {
      assignedDriver: { $ne: null }
    });

    const withVehicleSet = new Set(driverIdsWithVehicle.map((id) => String(id)));

    const formattedDrivers = drivers.map((driver) => {
      const doc = driver.toObject();
      doc.hasVehicle = withVehicleSet.has(String(driver._id));
      doc.canManage = String(doc.managedByFleetManager || '') === String(req.user.userId);
      return doc;
    });

    return res.json({
      success: true,
      count: formattedDrivers.length,
      data: formattedDrivers
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching drivers.' });
  }
};

exports.createManualDriver = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      status = 'Offline'
    } = req.body;

    const safeName = String(name || '').trim();
    const safeEmail = String(email || '').trim().toLowerCase();
    const safePhone = String(phone || '').trim();
    const safePassword = String(password || '');

    if (!safeName || !safeEmail || !safePhone || !safePassword) {
      return res.status(400).json({ message: 'name, email, phone and password are required.' });
    }

    if (!EMAIL_REGEX.test(safeEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (safePassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    if (!['Online', 'Offline', 'On Trip'].includes(status)) {
      return res.status(400).json({ message: 'Invalid driver status.' });
    }

    const existing = await User.findOne({ email: safeEmail }).select('_id');
    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(safePassword, salt);

    const driver = await User.create({
      name: safeName,
      email: safeEmail,
      phone: safePhone,
      password: hashedPassword,
      role: 'Driver',
      status,
      managedByFleetManager: req.user.userId,
      vehicleDetails: {
        type: '',
        plateNumber: '',
        model: ''
      }
    });

    const safeDriver = driver.toObject();
    delete safeDriver.password;

    return res.status(201).json({
      success: true,
      message: 'Driver created successfully.',
      data: safeDriver
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }
    return res.status(500).json({ message: 'Server error creating driver.' });
  }
};

exports.updateManualDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { name, email, phone, status, password } = req.body;

    const driver = await User.findOne({
      _id: driverId,
      role: 'Driver',
      managedByFleetManager: req.user.userId
    });

    if (!driver) {
      return res.status(404).json({ message: 'Managed driver not found.' });
    }

    if (name !== undefined) {
      const safeName = String(name).trim();
      if (!safeName) {
        return res.status(400).json({ message: 'name cannot be empty.' });
      }
      driver.name = safeName;
    }

    if (email !== undefined) {
      const safeEmail = String(email).trim().toLowerCase();
      if (!EMAIL_REGEX.test(safeEmail)) {
        return res.status(400).json({ message: 'Please provide a valid email address.' });
      }

      if (safeEmail !== driver.email) {
        const existing = await User.findOne({ email: safeEmail }).select('_id');
        if (existing) {
          return res.status(400).json({ message: 'A user with this email already exists.' });
        }
      }
      driver.email = safeEmail;
    }

    if (phone !== undefined) {
      const safePhone = String(phone).trim();
      if (!safePhone) {
        return res.status(400).json({ message: 'phone cannot be empty.' });
      }
      driver.phone = safePhone;
    }

    if (status !== undefined) {
      if (!['Online', 'Offline', 'On Trip'].includes(status)) {
        return res.status(400).json({ message: 'Invalid driver status.' });
      }
      driver.status = status;
    }

    if (password !== undefined && String(password).length > 0) {
      const safePassword = String(password);
      if (safePassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
      }
      const salt = await bcrypt.genSalt(10);
      driver.password = await bcrypt.hash(safePassword, salt);
    }

    await driver.save();

    const safeDriver = driver.toObject();
    delete safeDriver.password;

    return res.json({
      success: true,
      message: 'Driver updated successfully.',
      data: safeDriver
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }
    return res.status(500).json({ message: 'Server error updating driver.' });
  }
};

exports.deleteManualDriver = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await User.findOne({
      _id: driverId,
      role: 'Driver',
      managedByFleetManager: req.user.userId
    }).select('_id');

    if (!driver) {
      return res.status(404).json({ message: 'Managed driver not found.' });
    }

    const assignedVehicle = await Vehicle.findOne({ assignedDriver: driver._id }).select('_id');
    if (assignedVehicle) {
      return res.status(400).json({ message: 'Cannot delete a driver who is assigned to a vehicle.' });
    }

    await User.deleteOne({ _id: driver._id });

    return res.json({
      success: true,
      message: 'Driver deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error deleting driver.' });
  }
};

exports.getAvailableDriversForTrips = async (req, res) => {
  try {
    const availableVehicleDriverIds = await Vehicle.distinct('assignedDriver', {
      managedBy: req.user.userId,
      status: 'Available',
      assignedDriver: { $ne: null }
    });

    const availableVehicleDriverSet = new Set(availableVehicleDriverIds.map((id) => String(id)));

    const drivers = await User.find({
      role: 'Driver',
      status: { $ne: 'On Trip' }
    })
      .select('name email phone status managedByFleetManager')
      .sort({ name: 1 });

    const data = drivers.map((driver) => {
      const doc = driver.toObject();
      doc.hasAvailableFleetVehicle = availableVehicleDriverSet.has(String(driver._id));
      return doc;
    });

    return res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching available drivers.' });
  }
};

exports.getDriverSalaries = async (req, res) => {
  try {
    const { month } = req.query;
    const query = { fleetManager: req.user.userId };
    if (month) query.month = month;

    const salaries = await DriverSalary.find(query)
      .populate('driver', 'name email phone')
      .sort({ month: -1, createdAt: -1 });

    return res.json({
      success: true,
      count: salaries.length,
      data: salaries
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching salaries.' });
  }
};

exports.upsertDriverSalary = async (req, res) => {
  try {
    const {
      driverId,
      month,
      baseSalary,
      bonus = 0,
      deductions = 0,
      paymentStatus = 'Pending',
      paymentDate = null,
      notes = ''
    } = req.body;

    if (!driverId || !month || baseSalary === undefined) {
      return res.status(400).json({ message: 'driverId, month and baseSalary are required.' });
    }

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(month))) {
      return res.status(400).json({ message: 'Month must follow YYYY-MM format.' });
    }

    if (!['Pending', 'Paid'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'paymentStatus must be Pending or Paid.' });
    }

    let parsedPaymentDate = null;
    if (paymentDate) {
      parsedPaymentDate = new Date(paymentDate);
      if (Number.isNaN(parsedPaymentDate.getTime())) {
        return res.status(400).json({ message: 'paymentDate must be a valid date.' });
      }
    }

    const selectedDriver = await User.findOne({ _id: driverId, role: 'Driver' }).select('_id');
    if (!selectedDriver) {
      return res.status(400).json({ message: 'Selected driver is invalid.' });
    }

    const base = Number(baseSalary);
    const bonusAmount = Number(bonus) || 0;
    const deductionAmount = Number(deductions) || 0;

    if (Number.isNaN(base) || base < 0) {
      return res.status(400).json({ message: 'baseSalary must be a positive number.' });
    }

    if (Number.isNaN(bonusAmount) || bonusAmount < 0 || Number.isNaN(deductionAmount) || deductionAmount < 0) {
      return res.status(400).json({ message: 'bonus and deductions must be non-negative numbers.' });
    }

    const netSalary = Math.max(0, base + bonusAmount - deductionAmount);
    const payload = {
      fleetManager: req.user.userId,
      driver: driverId,
      month,
      baseSalary: base,
      bonus: bonusAmount,
      deductions: deductionAmount,
      netSalary,
      paymentStatus,
      paymentDate: parsedPaymentDate,
      notes,
      paidAt: paymentStatus === 'Paid' ? (parsedPaymentDate || new Date()) : null
    };

    const created = await DriverSalary.create(payload);
    const salary = await DriverSalary.findById(created._id).populate('driver', 'name email phone');

    return res.json({
      success: true,
      message: 'Driver salary created successfully.',
      data: salary
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Duplicate salary key conflict detected. Please restart backend once so indexes sync, then try again.'
      });
    }
    return res.status(500).json({ message: 'Server error saving driver salary.' });
  }
};

exports.updateDriverSalary = async (req, res) => {
  try {
    const { salaryId } = req.params;
    const {
      month,
      baseSalary,
      bonus = 0,
      deductions = 0,
      paymentStatus = 'Pending',
      paymentDate = null,
      notes = ''
    } = req.body;

    const salary = await DriverSalary.findOne({ _id: salaryId, fleetManager: req.user.userId });
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found.' });
    }

    if (!month || baseSalary === undefined) {
      return res.status(400).json({ message: 'month and baseSalary are required.' });
    }

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(month))) {
      return res.status(400).json({ message: 'Month must follow YYYY-MM format.' });
    }

    if (!['Pending', 'Paid'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'paymentStatus must be Pending or Paid.' });
    }

    let parsedPaymentDate = null;
    if (paymentDate) {
      parsedPaymentDate = new Date(paymentDate);
      if (Number.isNaN(parsedPaymentDate.getTime())) {
        return res.status(400).json({ message: 'paymentDate must be a valid date.' });
      }
    }

    const base = Number(baseSalary);
    const bonusAmount = Number(bonus) || 0;
    const deductionAmount = Number(deductions) || 0;

    if (Number.isNaN(base) || base < 0) {
      return res.status(400).json({ message: 'baseSalary must be a positive number.' });
    }

    if (Number.isNaN(bonusAmount) || bonusAmount < 0 || Number.isNaN(deductionAmount) || deductionAmount < 0) {
      return res.status(400).json({ message: 'bonus and deductions must be non-negative numbers.' });
    }

    const netSalary = Math.max(0, base + bonusAmount - deductionAmount);
    salary.month = month;
    salary.baseSalary = base;
    salary.bonus = bonusAmount;
    salary.deductions = deductionAmount;
    salary.netSalary = netSalary;
    salary.paymentStatus = paymentStatus;
    salary.paymentDate = parsedPaymentDate;
    salary.notes = notes;
    salary.paidAt = paymentStatus === 'Paid' ? (parsedPaymentDate || new Date()) : null;

    await salary.save();

    const updated = await DriverSalary.findById(salary._id).populate('driver', 'name email phone');

    return res.json({
      success: true,
      message: 'Driver salary updated successfully.',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error updating driver salary.' });
  }
};

exports.deleteDriverSalary = async (req, res) => {
  try {
    const { salaryId } = req.params;

    const deleted = await DriverSalary.findOneAndDelete({
      _id: salaryId,
      fleetManager: req.user.userId
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Salary record not found.' });
    }

    return res.json({
      success: true,
      message: 'Salary record deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error deleting salary record.' });
  }
};
