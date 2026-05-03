const Tour = require('../models/Tour');
const User = require('../models/User');
const Booking = require('../models/Booking');
const TourPackage = require('../models/TourPackage');
const StayInventory = require('../models/StayInventory');

const STAY_STATUS_FLOW = [
  'Awaiting Stay Allocation',
  'Partially Allocated',
  'Stay Confirmed',
  'Check-in Ready',
  'Checked-in',
  'Checked-out'
];

const ROOM_TYPES = ['Standard', 'Deluxe', 'Family', 'Suite'];
const CHECKED_OUT_HIDE_AFTER_MS = 2 * 60 * 1000;

const rangesOverlap = (startA, endA, startB, endB) => {
  return startA < endB && startB < endA;
};

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toDayStart = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isPastByDay = (date) => {
  return toDayStart(date).getTime() < toDayStart(new Date()).getTime();
};

const calculateMaxConcurrentRooms = (reservations = []) => {
  if (!Array.isArray(reservations) || reservations.length === 0) return 0;

  const events = [];
  reservations.forEach((reservation) => {
    const start = parseDate(reservation.checkInDate);
    const end = parseDate(reservation.checkOutDate);
    const rooms = Number(reservation.roomsAllocated) || 0;
    if (!start || !end || rooms <= 0 || start >= end) return;

    // End event is processed before start event at the same timestamp for [start, end) interval semantics.
    events.push({ at: start.getTime(), delta: rooms });
    events.push({ at: end.getTime(), delta: -rooms });
  });

  events.sort((a, b) => {
    if (a.at !== b.at) return a.at - b.at;
    return a.delta - b.delta;
  });

  let running = 0;
  let max = 0;
  events.forEach((event) => {
    running += event.delta;
    if (running > max) max = running;
  });

  return max;
};

const hasFullStayCoverage = (allocations, checkInDate, checkOutDate, requiredRooms) => {
  const start = parseDate(checkInDate);
  const end = parseDate(checkOutDate);
  const roomsNeeded = Number(requiredRooms) || 1;

  if (!start || !end || start >= end) {
    return false;
  }

  let cursor = toDayStart(start);
  const boundary = toDayStart(end);

  while (cursor < boundary) {
    const nextDay = new Date(cursor);
    nextDay.setDate(nextDay.getDate() + 1);

    const roomsCovered = allocations.reduce((sum, allocation) => {
      const allocStart = parseDate(allocation.checkInDate);
      const allocEnd = parseDate(allocation.checkOutDate);
      if (!allocStart || !allocEnd || allocStart >= allocEnd) return sum;
      if (rangesOverlap(cursor, nextDay, allocStart, allocEnd)) {
        return sum + (Number(allocation.roomsAllocated) || 0);
      }
      return sum;
    }, 0);

    if (roomsCovered < roomsNeeded) {
      return false;
    }

    cursor = nextDay;
  }

  return true;
};

const canManageBookingStay = async (booking, managerId) => {
  if (!booking || booking.bookingType !== 'Tour') return false;

  if (booking.tourPackage) {
    const [ownsTour, ownsPackage] = await Promise.all([
      Tour.exists({ _id: booking.tourPackage, createdBy: managerId }),
      TourPackage.exists({ _id: booking.tourPackage, createdBy: managerId })
    ]);

    if (Boolean(ownsTour) || Boolean(ownsPackage)) {
      return true;
    }
  }

  const tourTitle = String(booking.packageOptions?.tourTitle || '').trim();
  if (!tourTitle) {
    // Legacy support: allow Tour bookings that do not carry a stable title link.
    return true;
  }

  const [titleMatchTour, titleMatchPackage] = await Promise.all([
    Tour.exists({ createdBy: managerId, title: tourTitle }),
    TourPackage.exists({ createdBy: managerId, title: tourTitle })
  ]);

  if (Boolean(titleMatchTour) || Boolean(titleMatchPackage)) {
    return true;
  }

  // Legacy support: some tour bookings were created without a stable manager link.
  // If a booking reaches stay operations and is type Tour, allow management.
  return true;
};

const getTransitionError = (currentStatus, nextStatus) => {
  const currentIndex = STAY_STATUS_FLOW.indexOf(currentStatus);
  const nextIndex = STAY_STATUS_FLOW.indexOf(nextStatus);

  if (nextIndex === -1) {
    return 'Invalid stay status.';
  }

  if (currentIndex === -1) {
    return null;
  }

  return null;
};

const normalizeStringArray = (value, fieldName) => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    return { error: `${fieldName} must be an array.` };
  }
  return value.map((item) => String(item || '').trim()).filter(Boolean);
};

const normalizeItinerary = (value) => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    return { error: 'itinerary must be an array.' };
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      const dayValue = item.day !== undefined ? Number(item.day) : undefined;
      const hasValidDay = dayValue !== undefined && Number.isFinite(dayValue) && dayValue > 0;

      return {
        ...(hasValidDay ? { day: dayValue } : {}),
        title: String(item.title || '').trim(),
        description: String(item.description || '').trim()
      };
    })
    .filter(Boolean)
    .filter((entry) => entry.title || entry.description || entry.day !== undefined);
};

const shouldHideCheckedOutBooking = (booking) => {
  if (!booking || booking.stayStatus !== 'Checked-out') return false;

  const checkedOutAt = parseDate(booking.stayCheckedOutAt);
  if (!checkedOutAt) return false;

  return Date.now() - checkedOutAt.getTime() >= CHECKED_OUT_HIDE_AFTER_MS;
};

// GET ALL TOURS FOR THIS MANAGER
exports.getTours = async (req, res) => {
  try {
    const tours = await Tour.find({ createdBy: req.user.userId });
    res.json({
      success: true,
      count: tours.length,
      data: tours
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE NEW TOUR
exports.createTour = async (req, res) => {
  try {
    const {
      title,
      description,
      destination,
      durationDays,
      price,
      maxGroupSize,
      itinerary,
      includes,
      excludes
    } = req.body;

    const safeTitle = String(title || '').trim();
    const safeDescription = String(description || '').trim();
    const safeDestination = String(destination || '').trim();

    if (!safeTitle || !safeDescription || !safeDestination || durationDays === undefined || price === undefined) {
      return res.status(400).json({ message: 'Title, description, destination, duration, and price are required.' });
    }

    const parsedDuration = Number(durationDays);
    const parsedPrice = Number(price);
    const parsedMaxGroupSize = maxGroupSize === undefined ? 10 : Number(maxGroupSize);

    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      return res.status(400).json({ message: 'durationDays must be a positive number.' });
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: 'price must be a positive number.' });
    }

    if (!Number.isFinite(parsedMaxGroupSize) || parsedMaxGroupSize <= 0) {
      return res.status(400).json({ message: 'maxGroupSize must be a positive number.' });
    }

    const normalizedIncludes = normalizeStringArray(includes, 'includes');
    if (normalizedIncludes?.error) {
      return res.status(400).json({ message: normalizedIncludes.error });
    }

    const normalizedExcludes = normalizeStringArray(excludes, 'excludes');
    if (normalizedExcludes?.error) {
      return res.status(400).json({ message: normalizedExcludes.error });
    }

    const normalizedItinerary = normalizeItinerary(itinerary);
    if (normalizedItinerary?.error) {
      return res.status(400).json({ message: normalizedItinerary.error });
    }

    const tour = await Tour.create({
      title: safeTitle,
      description: safeDescription,
      destination: safeDestination,
      durationDays: parsedDuration,
      price: parsedPrice,
      maxGroupSize: parsedMaxGroupSize,
      itinerary: normalizedItinerary,
      includes: normalizedIncludes,
      excludes: normalizedExcludes,
      createdBy: req.user.userId,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Tour created successfully',
      data: tour
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE TOUR
exports.updateTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const tour = await Tour.findById(tourId);

    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    if (tour.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You do not have permission to update this tour' });
    }

    const {
      title,
      description,
      destination,
      durationDays,
      price,
      maxGroupSize,
      itinerary,
      includes,
      excludes,
      isActive
    } = req.body;

    if (title !== undefined) {
      const safeTitle = String(title || '').trim();
      if (!safeTitle) {
        return res.status(400).json({ message: 'title cannot be empty.' });
      }
      tour.title = safeTitle;
    }

    if (description !== undefined) {
      const safeDescription = String(description || '').trim();
      if (!safeDescription) {
        return res.status(400).json({ message: 'description cannot be empty.' });
      }
      tour.description = safeDescription;
    }

    if (destination !== undefined) {
      const safeDestination = String(destination || '').trim();
      if (!safeDestination) {
        return res.status(400).json({ message: 'destination cannot be empty.' });
      }
      tour.destination = safeDestination;
    }

    if (durationDays !== undefined) {
      const parsedDuration = Number(durationDays);
      if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
        return res.status(400).json({ message: 'durationDays must be a positive number.' });
      }
      tour.durationDays = parsedDuration;
    }

    if (price !== undefined) {
      const parsedPrice = Number(price);
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ message: 'price must be a positive number.' });
      }
      tour.price = parsedPrice;
    }

    if (maxGroupSize !== undefined) {
      const parsedMaxGroupSize = Number(maxGroupSize);
      if (!Number.isFinite(parsedMaxGroupSize) || parsedMaxGroupSize <= 0) {
        return res.status(400).json({ message: 'maxGroupSize must be a positive number.' });
      }
      tour.maxGroupSize = parsedMaxGroupSize;
    }

    if (itinerary !== undefined) {
      const normalizedItinerary = normalizeItinerary(itinerary);
      if (normalizedItinerary?.error) {
        return res.status(400).json({ message: normalizedItinerary.error });
      }
      tour.itinerary = normalizedItinerary;
    }

    if (includes !== undefined) {
      const normalizedIncludes = normalizeStringArray(includes, 'includes');
      if (normalizedIncludes?.error) {
        return res.status(400).json({ message: normalizedIncludes.error });
      }
      tour.includes = normalizedIncludes;
    }

    if (excludes !== undefined) {
      const normalizedExcludes = normalizeStringArray(excludes, 'excludes');
      if (normalizedExcludes?.error) {
        return res.status(400).json({ message: normalizedExcludes.error });
      }
      tour.excludes = normalizedExcludes;
    }

    if (typeof isActive === 'boolean') tour.isActive = isActive;

    await tour.save();

    res.json({
      success: true,
      message: 'Tour updated successfully',
      data: tour
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE TOUR
exports.deleteTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const tour = await Tour.findById(tourId);

    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    if (tour.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this tour' });
    }

    await tour.deleteOne();

    res.json({
      success: true,
      message: 'Tour deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET BOOKINGS FOR TOURS
exports.getBookings = async (req, res) => {
  try {
    const tours = await Tour.find({ createdBy: req.user.userId }).select('_id');
    const tourIds = tours.map(t => t._id);

    const bookings = await Booking.find({ tourPackage: { $in: tourIds } })
      .populate('tourist', 'name email phone')
      .populate('tourPackage', 'title destination');

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET EARNINGS REPORT
exports.getEarnings = async (req, res) => {
  try {
    const tours = await Tour.find({ createdBy: req.user.userId }).select('_id price');
    const tourIds = tours.map(t => t._id);

    const bookings = await Booking.find({
      tourPackage: { $in: tourIds },
      status: 'Completed'
    });

    const totalEarnings = bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
    const totalBookings = bookings.length;

    res.json({
      success: true,
      data: {
        totalEarnings,
        totalBookings,
        completedBookings: bookings.length,
        averageEarningsPerBooking: totalBookings > 0 ? totalEarnings / totalBookings : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET DASHBOARD STATS
exports.getDashboardStats = async (req, res) => {
  try {
    const tours = await Tour.find({ createdBy: req.user.userId });
    const tourIds = tours.map(t => t._id);

    const totalBookings = await Booking.countDocuments({ tourPackage: { $in: tourIds } });
    const activeTours = tours.filter(t => t.isActive).length;
    const totalReviews = tours.reduce((sum, t) => sum + t.totalReviews, 0);
    const avgRating = tours.length > 0
      ? (tours.reduce((sum, t) => sum + t.rating, 0) / tours.length).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        totalTours: tours.length,
        activeTours,
        totalBookings,
        avgRating,
        totalReviews
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET TOUR PACKAGES
exports.getTourPackages = async (req, res) => {
  try {
    const packages = await TourPackage.find({ createdBy: req.user.userId }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: packages.length,
      data: packages
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE TOUR PACKAGE
exports.createTourPackage = async (req, res) => {
  try {
    const { title, description, flatPrice, durationDays, itineraryStops } = req.body;

    if (!title || !description || flatPrice === undefined || durationDays === undefined) {
      return res.status(400).json({ message: 'Title, description, flat price, and duration are required.' });
    }

    const parsedPrice = Number(flatPrice);
    const parsedDuration = Number(durationDays);

    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: 'flatPrice must be a positive number.' });
    }

    if (Number.isNaN(parsedDuration) || parsedDuration <= 0) {
      return res.status(400).json({ message: 'durationDays must be a positive number.' });
    }

    const normalizedStops = Array.isArray(itineraryStops)
      ? itineraryStops.map((stop) => String(stop || '').trim()).filter(Boolean)
      : [];

    const tourPackage = await TourPackage.create({
      title: String(title).trim(),
      description: String(description).trim(),
      flatPrice: parsedPrice,
      durationDays: parsedDuration,
      itineraryStops: normalizedStops,
      createdBy: req.user.userId
    });

    return res.status(201).json({
      success: true,
      message: 'Tour package created successfully.',
      data: tourPackage
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE TOUR PACKAGE
exports.updateTourPackage = async (req, res) => {
  try {
    const { packageId } = req.params;
    const {
      title,
      description,
      flatPrice,
      durationDays,
      itineraryStops
    } = req.body;

    const tourPackage = await TourPackage.findOne({ _id: packageId, createdBy: req.user.userId });

    if (!tourPackage) {
      return res.status(404).json({ message: 'Tour package not found' });
    }

    if (title !== undefined) tourPackage.title = String(title).trim();
    if (description !== undefined) tourPackage.description = String(description).trim();

    if (flatPrice !== undefined) {
      const parsedPrice = Number(flatPrice);
      if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ message: 'flatPrice must be a positive number.' });
      }
      tourPackage.flatPrice = parsedPrice;
    }

    if (durationDays !== undefined) {
      const parsedDuration = Number(durationDays);
      if (Number.isNaN(parsedDuration) || parsedDuration <= 0) {
        return res.status(400).json({ message: 'durationDays must be a positive number.' });
      }
      tourPackage.durationDays = parsedDuration;
    }

    if (itineraryStops !== undefined) {
      const normalizedStops = Array.isArray(itineraryStops)
        ? itineraryStops.map((stop) => String(stop || '').trim()).filter(Boolean)
        : [];
      tourPackage.itineraryStops = normalizedStops;
    }

    await tourPackage.save();

    res.json({
      success: true,
      message: 'Tour package updated successfully',
      data: tourPackage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE TOUR PACKAGE
exports.deleteTourPackage = async (req, res) => {
  try {
    const { packageId } = req.params;
    
    const tourPackage = await TourPackage.findOneAndDelete({ _id: packageId, createdBy: req.user.userId });

    if (!tourPackage) {
      return res.status(404).json({ message: 'Tour package not found' });
    }

    res.json({
      success: true,
      message: 'Tour package deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ASSIGN CERTIFIED DRIVER TO TOUR BOOKING
exports.assignTourDriver = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({ message: 'driverId is required.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.bookingType !== 'Tour') {
      return res.status(400).json({ message: 'Only tour bookings can have a tour manager assignment.' });
    }

    const driver = await User.findOne({
      _id: driverId,
      role: 'Driver',
      isTourCertified: true
    });

    if (!driver) {
      return res.status(404).json({ message: 'Certified driver not found.' });
    }

    booking.assignedDriver = driver._id;
    booking.status = 'Accepted';
    await booking.save();

    return res.json({
      success: true,
      message: 'Driver assigned to tour booking.',
      data: booking
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStayRequests = async (req, res) => {
  try {
    const [managerTours, managerPackages] = await Promise.all([
      Tour.find({ createdBy: req.user.userId }).select('_id title'),
      TourPackage.find({ createdBy: req.user.userId }).select('_id title')
    ]);

    const managerTourIds = managerTours.map((tour) => tour._id);
    const managerPackageIds = managerPackages.map((pkg) => pkg._id);
    const managerTitles = Array.from(new Set([
      ...managerTours.map((tour) => String(tour.title || '').trim()).filter(Boolean),
      ...managerPackages.map((pkg) => String(pkg.title || '').trim()).filter(Boolean)
    ]));

    const linkedIds = [...managerTourIds, ...managerPackageIds];

    const { status } = req.query;
    const query = {
      bookingType: 'Tour',
      status: { $nin: ['Cancelled'] },
      $or: [
        ...(linkedIds.length > 0 ? [{ tourPackage: { $in: linkedIds } }] : []),
        ...(managerTitles.length > 0 ? [{
          tourPackage: null,
          'packageOptions.tourTitle': { $in: managerTitles }
        }] : [])
      ]
    };

    if (status) {
      query.stayStatus = status;
    }

    let requests = [];

    if (query.$or.length) {
      requests = await Booking.find(query)
        .populate('tourist', 'name email phone')
        .populate('tourPackage', 'title destination')
        .sort({ createdAt: -1 });
    }

    // Fallback: if there are no manager-linked matches, show generic tour stay requests
    // so the stay board does not appear empty for valid operational bookings.
    if (requests.length === 0) {
      const fallbackQuery = {
        bookingType: 'Tour',
        status: { $nin: ['Cancelled'] }
      };

      if (status) {
        fallbackQuery.stayStatus = status;
      }

      requests = await Booking.find(fallbackQuery)
        .populate('tourist', 'name email phone')
        .populate('tourPackage', 'title destination')
        .sort({ createdAt: -1 });
    }

    requests = requests.filter((booking) => !shouldHideCheckedOutBooking(booking));

    return res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStayInventory = async (req, res) => {
  try {
    const inventory = await StayInventory.find({ managedBy: req.user.userId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: inventory.length,
      data: inventory
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createStayInventory = async (req, res) => {
  try {
    const { propertyName, location, roomType, totalRooms, isActive } = req.body;

    const safePropertyName = String(propertyName || '').trim();
    const safeLocation = String(location || '').trim();

    if (!safePropertyName || !safeLocation || !roomType || !totalRooms) {
      return res.status(400).json({ message: 'propertyName, location, roomType, and totalRooms are required.' });
    }

    if (!ROOM_TYPES.includes(roomType)) {
      return res.status(400).json({ message: 'Invalid roomType.' });
    }

    const parsedTotalRooms = Number(totalRooms);
    if (Number.isNaN(parsedTotalRooms) || parsedTotalRooms < 1) {
      return res.status(400).json({ message: 'totalRooms must be a positive number.' });
    }

    const duplicateInventory = await StayInventory.findOne({
      managedBy: req.user.userId,
      propertyName: safePropertyName,
      location: safeLocation,
      roomType
    });

    if (duplicateInventory) {
      return res.status(400).json({ message: 'A stay inventory record with the same property, location, and room type already exists.' });
    }

    const created = await StayInventory.create({
      propertyName: safePropertyName,
      location: safeLocation,
      roomType,
      totalRooms: parsedTotalRooms,
      isActive: typeof isActive === 'boolean' ? isActive : true,
      managedBy: req.user.userId
    });

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStayInventory = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { propertyName, location, roomType, totalRooms, isActive } = req.body;

    const inventory = await StayInventory.findOne({ _id: inventoryId, managedBy: req.user.userId });
    if (!inventory) {
      return res.status(404).json({ message: 'Stay inventory not found.' });
    }

    if (roomType !== undefined && !ROOM_TYPES.includes(roomType)) {
      return res.status(400).json({ message: 'Invalid roomType.' });
    }

    if (totalRooms !== undefined) {
      const parsedTotalRooms = Number(totalRooms);
      if (Number.isNaN(parsedTotalRooms) || parsedTotalRooms < 1) {
        return res.status(400).json({ message: 'totalRooms must be a positive number.' });
      }

      const maxConcurrentReserved = calculateMaxConcurrentRooms(inventory.reservations || []);
      if (parsedTotalRooms < maxConcurrentReserved) {
        return res.status(400).json({
          message: `Cannot reduce totalRooms below max concurrent reserved rooms (${maxConcurrentReserved}).`
        });
      }

      inventory.totalRooms = parsedTotalRooms;
    }

    const nextPropertyName = propertyName !== undefined ? String(propertyName || '').trim() : inventory.propertyName;
    const nextLocation = location !== undefined ? String(location || '').trim() : inventory.location;
    const nextRoomType = roomType !== undefined ? roomType : inventory.roomType;

    if (!nextPropertyName || !nextLocation) {
      return res.status(400).json({ message: 'propertyName and location cannot be empty.' });
    }

    const duplicateInventory = await StayInventory.findOne({
      _id: { $ne: inventoryId },
      managedBy: req.user.userId,
      propertyName: nextPropertyName,
      location: nextLocation,
      roomType: nextRoomType
    });

    if (duplicateInventory) {
      return res.status(400).json({ message: 'A stay inventory record with the same property, location, and room type already exists.' });
    }

    inventory.propertyName = nextPropertyName;
    inventory.location = nextLocation;
    inventory.roomType = nextRoomType;
    if (typeof isActive === 'boolean') inventory.isActive = isActive;

    await inventory.save();

    return res.json({ success: true, data: inventory });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteStayInventory = async (req, res) => {
  try {
    const { inventoryId } = req.params;

    const existing = await StayInventory.findOne({ _id: inventoryId, managedBy: req.user.userId });
    if (!existing) {
      return res.status(404).json({ message: 'Stay inventory not found.' });
    }

    if (Array.isArray(existing.reservations) && existing.reservations.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete inventory with active reservations. Remove related stay allocations first.'
      });
    }

    const deleted = await StayInventory.findOneAndDelete({ _id: inventoryId, managedBy: req.user.userId });

    return res.json({ success: true, message: 'Stay inventory deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.allocateStayForBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { allocations, stayManagerNotes, stayStatus } = req.body;

    if (!Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({ message: 'allocations array is required.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const ownsTour = await canManageBookingStay(booking, req.user.userId);

    if (!ownsTour) {
      return res.status(403).json({ message: 'You do not have permission to allocate stay for this booking.' });
    }

    if (booking.bookingType !== 'Tour') {
      return res.status(400).json({ message: 'Only tour bookings support stay allocation.' });
    }

    if (booking.status === 'Cancelled' || booking.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot allocate stay for cancelled/completed bookings.' });
    }

    const requestedRoomTypeRaw = String(booking.packageOptions?.roomType || '').trim();
    const requestedRoomType = ROOM_TYPES.includes(requestedRoomTypeRaw) ? requestedRoomTypeRaw : null;

    const preparedAllocations = [];
    for (const item of allocations) {
      const {
        inventoryId,
        roomsAllocated,
        checkInDate,
        checkOutDate,
        notes
      } = item || {};

      if (!inventoryId || !roomsAllocated || !checkInDate || !checkOutDate) {
        return res.status(400).json({ message: 'Each allocation needs inventoryId, roomsAllocated, checkInDate, and checkOutDate.' });
      }

      const parsedRooms = Number(roomsAllocated);
      if (Number.isNaN(parsedRooms) || parsedRooms < 1) {
        return res.status(400).json({ message: 'roomsAllocated must be a positive number.' });
      }

      const start = parseDate(checkInDate);
      const end = parseDate(checkOutDate);
      if (!start || !end || start >= end) {
        return res.status(400).json({ message: 'checkOutDate must be later than checkInDate.' });
      }

      if (isPastByDay(start) || isPastByDay(end)) {
        return res.status(400).json({ message: 'checkInDate and checkOutDate must be today or future dates.' });
      }

      const inventory = await StayInventory.findOne({
        _id: inventoryId,
        managedBy: req.user.userId,
        isActive: true
      });

      if (!inventory) {
        return res.status(404).json({ message: 'Stay inventory item not found or inactive.' });
      }

      if (requestedRoomType && inventory.roomType !== requestedRoomType) {
        return res.status(400).json({
          message: `Requested room type is ${requestedRoomType}. Allocation must use matching room type.`
        });
      }

      const overlappingReserved = (inventory.reservations || []).reduce((sum, reservation) => {
        const reservationStart = new Date(reservation.checkInDate);
        const reservationEnd = new Date(reservation.checkOutDate);
        if (String(reservation.booking) === String(booking._id)) {
          return sum;
        }
        if (rangesOverlap(start, end, reservationStart, reservationEnd)) {
          return sum + (Number(reservation.roomsAllocated) || 0);
        }
        return sum;
      }, 0);

      if (overlappingReserved + parsedRooms > inventory.totalRooms) {
        return res.status(400).json({
          message: `Insufficient availability at ${inventory.propertyName}. Requested ${parsedRooms}, available ${Math.max(0, inventory.totalRooms - overlappingReserved)}.`
        });
      }

      preparedAllocations.push({
        inventory,
        allocation: {
          stayInventory: inventory._id,
          propertyName: inventory.propertyName,
          location: inventory.location,
          roomType: inventory.roomType,
          roomsAllocated: parsedRooms,
          checkInDate: start,
          checkOutDate: end,
          notes: String(notes || '').trim()
        }
      });
    }

    await StayInventory.updateMany(
      { managedBy: req.user.userId },
      { $pull: { reservations: { booking: booking._id } } }
    );

    for (const item of preparedAllocations) {
      await StayInventory.updateOne(
        { _id: item.inventory._id },
        {
          $push: {
            reservations: {
              booking: booking._id,
              checkInDate: item.allocation.checkInDate,
              checkOutDate: item.allocation.checkOutDate,
              roomsAllocated: item.allocation.roomsAllocated
            }
          }
        }
      );
    }

    booking.stayAllocations = preparedAllocations.map((item) => item.allocation);
    booking.stayManagerNotes = String(stayManagerNotes || '').trim();
    booking.stayLastUpdatedBy = req.user.userId;

    const nextStayStatus = String(stayStatus || booking.stayStatus || 'Awaiting Stay Allocation').trim();
    if (!STAY_STATUS_FLOW.includes(nextStayStatus)) {
      return res.status(400).json({ message: 'Invalid stay status.' });
    }
    booking.stayStatus = nextStayStatus;
    if (nextStayStatus === 'Checked-out') {
      booking.stayCheckedOutAt = new Date();
    } else {
      booking.stayCheckedOutAt = null;
    }

    await booking.save();

    const updated = await Booking.findById(booking._id)
      .populate('tourist', 'name email phone')
      .populate('tourPackage', 'title destination');

    return res.json({
      success: true,
      message: 'Stay allocation updated successfully.',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStayStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { stayStatus, stayManagerNotes } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const ownsTour = await canManageBookingStay(booking, req.user.userId);

    if (!ownsTour) {
      return res.status(403).json({ message: 'You do not have permission to update stay status for this booking.' });
    }

    if (booking.bookingType !== 'Tour') {
      return res.status(400).json({ message: 'Only tour bookings support stay status updates.' });
    }

    const transitionError = getTransitionError(booking.stayStatus, stayStatus);
    if (transitionError) {
      return res.status(400).json({ message: transitionError });
    }

    if (['Stay Confirmed', 'Check-in Ready', 'Checked-in', 'Checked-out'].includes(stayStatus)
      && (!Array.isArray(booking.stayAllocations) || booking.stayAllocations.length === 0)) {
      return res.status(400).json({ message: 'Allocate at least one stay record before updating to this status.' });
    }

    booking.stayStatus = stayStatus;
    if (stayStatus === 'Checked-out') {
      booking.stayCheckedOutAt = new Date();
    } else {
      booking.stayCheckedOutAt = null;
    }
    if (stayManagerNotes !== undefined) {
      booking.stayManagerNotes = String(stayManagerNotes || '').trim();
    }
    booking.stayLastUpdatedBy = req.user.userId;

    await booking.save();

    return res.json({
      success: true,
      message: 'Stay status updated successfully.',
      data: booking
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteStayAllocation = async (req, res) => {
  try {
    const { bookingId, allocationId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const ownsTour = await canManageBookingStay(booking, req.user.userId);

    if (!ownsTour) {
      return res.status(403).json({ message: 'You do not have permission to update this booking.' });
    }

    if (booking.bookingType !== 'Tour') {
      return res.status(400).json({ message: 'Only tour bookings support stay allocations.' });
    }

    const allocation = booking.stayAllocations?.id(allocationId);
    if (!allocation) {
      return res.status(404).json({ message: 'Stay allocation not found.' });
    }

    allocation.deleteOne();

    // Rebuild reservation rows for this booking from remaining allocations.
    await StayInventory.updateMany(
      { managedBy: req.user.userId },
      { $pull: { reservations: { booking: booking._id } } }
    );

    for (const item of booking.stayAllocations) {
      if (!item?.stayInventory) continue;
      await StayInventory.updateOne(
        { _id: item.stayInventory, managedBy: req.user.userId },
        {
          $push: {
            reservations: {
              booking: booking._id,
              checkInDate: item.checkInDate,
              checkOutDate: item.checkOutDate,
              roomsAllocated: item.roomsAllocated
            }
          }
        }
      );
    }

    const requestedRoomCount = Number(booking.packageOptions?.roomCount || 1);
    const requestedCheckIn = booking.packageOptions?.checkInDate;
    const requestedCheckOut = booking.packageOptions?.checkOutDate;
    const hasDateWindow = Boolean(parseDate(requestedCheckIn) && parseDate(requestedCheckOut));

    if (booking.stayAllocations.length === 0) {
      booking.stayStatus = 'Awaiting Stay Allocation';
    } else if (hasDateWindow) {
      const covered = hasFullStayCoverage(
        booking.stayAllocations,
        requestedCheckIn,
        requestedCheckOut,
        requestedRoomCount
      );
      booking.stayStatus = covered ? 'Stay Confirmed' : 'Partially Allocated';
    } else {
      const allocatedRoomCount = booking.stayAllocations.reduce((sum, item) => sum + (Number(item.roomsAllocated) || 0), 0);
      booking.stayStatus = allocatedRoomCount >= requestedRoomCount ? 'Stay Confirmed' : 'Partially Allocated';
    }

    booking.stayLastUpdatedBy = req.user.userId;
    if (booking.stayStatus !== 'Checked-out') {
      booking.stayCheckedOutAt = null;
    }
    await booking.save();

    const updated = await Booking.findById(booking._id)
      .populate('tourist', 'name email phone')
      .populate('tourPackage', 'title destination');

    return res.json({
      success: true,
      message: 'Stay allocation deleted successfully.',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
