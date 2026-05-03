const Booking = require('../models/Booking');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');

const VALID_STATUSES = ['Online', 'Offline', 'On Trip'];
const VEHICLE_PLATE_REGEX = /^[A-Z]{2,3}-\d{4}$/;
const VEHICLE_TYPES = ['Sedan', 'SUV', 'Van', 'Bus', 'Minivan', 'Luxury'];
const VEHICLE_CATEGORIES = ['Economy', 'Luxury', 'Van', 'SUV'];

exports.updateStatus = async (req, res) => {
  try {
    const { status, location } = req.body;

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const updates = {};
    if (status) {
      updates.status = status;
    }

    if (location) {
      const { coordinates, type } = location;
      if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        return res.status(400).json({ message: 'Location coordinates must be [lng, lat].' });
      }
      updates.location = {
        type: type || 'Point',
        coordinates
      };
    }

    const driver = await User.findByIdAndUpdate(req.user.userId, updates, { returnDocument: 'after' }).select('-password');

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found.' });
    }

    return res.json({
      message: 'Driver status updated.',
      data: driver
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error updating driver status.' });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const driver = await User.findById(req.user.userId).select('status');
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found.' });
    }

    return res.json({
      message: 'Driver status fetched.',
      data: {
        status: driver.status || 'Offline'
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching driver status.' });
  }
};

exports.acceptRide = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.status !== 'Pending') {
      return res.status(400).json({ message: 'This booking is no longer available.' });
    }

    const driver = await User.findById(req.user.userId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found.' });
    }

    if (driver.status !== 'Online') {
      return res.status(400).json({ message: 'You must be online to accept a job.' });
    }

    if (booking.bookingType === 'Tour' && !driver.isTourCertified) {
      return res.status(403).json({ message: 'Tour certification is required to accept this trip.' });
    }

    booking.status = 'Accepted';
    booking.assignedDriver = driver._id;

    if (!booking.assignedVehicle) {
      const vehicle = await Vehicle.findOne({
        assignedDriver: driver._id,
        status: 'Available'
      });

      if (vehicle) {
        booking.assignedVehicle = vehicle._id;
        vehicle.status = 'On Trip';
        await vehicle.save();
      }
    }

    await booking.save();

    driver.status = 'On Trip';
    await driver.save();

    return res.json({
      message: 'Booking accepted.',
      data: booking
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error accepting booking.' });
  }
};

// --- Added CRUD Operations for Driver ---

exports.getAvailableJobs = async (req, res) => {
  try {
    // A driver sees pending bookings that don't have a driver yet
    // Normally, this might be filtered by geographic location or permissions
    const driver = await User.findById(req.user.userId);
    
    let query = { status: 'Pending', assignedDriver: null };
    
    // If not tour certified, driver can only see 'Taxi' bookings
    if (!driver.isTourCertified) {
      query.bookingType = 'Taxi';
    }

    const availableJobs = await Booking.find(query).populate('tourist', 'name email phone');
    return res.json({ data: availableJobs });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching available jobs.' });
  }
};

exports.getMyJobs = async (req, res) => {
  try {
    const myJobs = await Booking.find({ assignedDriver: req.user.userId })
      .populate('tourist', 'name email phone')
      .populate('assignedVehicle', 'plateNumber make model')
      .sort({ createdAt: -1 });
    
    return res.json({ data: myJobs });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching your jobs.' });
  }
};

exports.updateJobStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body; // e.g. 'En Route', 'Completed'

    const validBookingStatuses = ['Accepted', 'En Route', 'Completed', 'Cancelled'];
    if (!validBookingStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid booking status.' });
    }

    const booking = await Booking.findOne({ _id: bookingId, assignedDriver: req.user.userId });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or not assigned to you.' });
    }

    booking.status = status;
    await booking.save();

    // If job is completed or cancelled, free up the driver & vehicle
    if (status === 'Completed' || status === 'Cancelled') {
      const driver = await User.findById(req.user.userId);
      if (driver) {
        driver.status = 'Online';
        await driver.save();
      }

      if (booking.assignedVehicle) {
        const vehicle = await Vehicle.findById(booking.assignedVehicle);
        if (vehicle) {
          vehicle.status = 'Available';
          await vehicle.save();
        }
      }
    }

    return res.json({ message: `Job marked as ${status}.`, data: booking });
  } catch (error) {
    return res.status(500).json({ message: 'Server error updating job status.' });
  }
};

exports.getMyVehicleProfile = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ assignedDriver: req.user.userId });
    if (!vehicle) {
      return res.status(404).json({ message: 'No vehicle is assigned to this driver yet.' });
    }

    return res.json({ data: vehicle });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching vehicle profile.' });
  }
};

exports.updateMyVehicleProfile = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ assignedDriver: req.user.userId });
    if (!vehicle) {
      return res.status(404).json({ message: 'No vehicle is assigned to this driver yet.' });
    }

    const {
      plateNumber,
      make,
      brand,
      model,
      year,
      type,
      category,
      capacity,
      color
    } = req.body;

    if (plateNumber !== undefined) {
      const normalizedPlate = String(plateNumber).trim().toUpperCase();
      if (!VEHICLE_PLATE_REGEX.test(normalizedPlate)) {
        return res.status(400).json({ message: 'Plate number must follow format ABC-1234.' });
      }
      vehicle.plateNumber = normalizedPlate;
    }

    if (make !== undefined) vehicle.make = String(make).trim();
    if (brand !== undefined) vehicle.brand = String(brand).trim();
    if (model !== undefined) vehicle.model = String(model).trim();

    if (year !== undefined) {
      const y = Number(year);
      const maxYear = new Date().getFullYear() + 1;
      if (!Number.isFinite(y) || y < 1980 || y > maxYear) {
        return res.status(400).json({ message: `Year must be between 1980 and ${maxYear}.` });
      }
      vehicle.year = y;
    }

    if (type !== undefined) {
      if (!VEHICLE_TYPES.includes(type)) {
        return res.status(400).json({ message: 'Invalid vehicle type.' });
      }
      vehicle.type = type;
    }

    if (category !== undefined) {
      if (!VEHICLE_CATEGORIES.includes(category)) {
        return res.status(400).json({ message: 'Invalid vehicle category.' });
      }
      vehicle.category = category;
    }

    if (capacity !== undefined) {
      const cap = Number(capacity);
      if (!Number.isFinite(cap) || cap < 1 || cap > 60) {
        return res.status(400).json({ message: 'Capacity must be between 1 and 60.' });
      }
      vehicle.capacity = cap;
    }

    if (color !== undefined) vehicle.color = String(color).trim();

    await vehicle.save();

    return res.json({
      message: 'Vehicle profile updated successfully.',
      data: vehicle
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Plate number is already in use.' });
    }
    return res.status(500).json({ message: 'Server error updating vehicle profile.' });
  }
};
