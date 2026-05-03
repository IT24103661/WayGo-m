const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Tour = require('../models/Tour');
const Vehicle = require('../models/Vehicle');
const DriverSalary = require('../models/DriverSalary');
const PlatformConfig = require('../models/PlatformConfig');
const RefundRequest = require('../models/RefundRequest');
const AdminBan = require('../models/AdminBan');
const AdminAuditLog = require('../models/AdminAuditLog');
const EmergencyAlert = require('../models/EmergencyAlert');
const Review = require('../models/Review');

const STAFF_ROLES = ['TourManager', 'FleetManager'];
const BAN_TARGET_ROLES = ['Tourist', 'Driver', 'TourManager', 'FleetManager'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const clampNumber = (value, min, max) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  if (num < min || num > max) return null;
  return num;
};

const logAdminAction = async ({ actor, action, targetType, targetId = null, before = null, after = null, meta = null }) => {
  try {
    await AdminAuditLog.create({ actor, action, targetType, targetId: targetId ? String(targetId) : null, before, after, meta });
  } catch (error) {
    // Audit logging should never break primary admin flows.
  }
};

const getOrCreateConfig = async () => {
  let config = await PlatformConfig.findOne({ singletonKey: 'global' });
  if (!config) {
    config = await PlatformConfig.create({ singletonKey: 'global' });
  }
  return config;
};

exports.getOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalBookings,
      activeTours,
      activeVehicles,
      pendingRefunds,
      pendingSalaries,
      recentActivity
    ] = await Promise.all([
      User.countDocuments(),
      Booking.countDocuments(),
      Tour.countDocuments({ isActive: true }),
      Vehicle.countDocuments({ status: { $in: ['Active', 'Available', 'On Trip'] } }),
      RefundRequest.countDocuments({ status: 'Pending' }),
      DriverSalary.countDocuments({ paymentStatus: 'Pending' }),
      AdminAuditLog.find().sort({ createdAt: -1 }).limit(8).populate('actor', 'name role')
    ]);

    const revenueRows = await Booking.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: '$bookingType', total: { $sum: { $ifNull: ['$totalPrice', 0] } } } }
    ]);

    const revenue = {
      Taxi: 0,
      Tour: 0
    };
    revenueRows.forEach((row) => {
      if (row._id === 'Taxi' || row._id === 'Tour') {
        revenue[row._id] = row.total || 0;
      }
    });

    return res.json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          bookings: totalBookings,
          activeTours,
          activeVehicles,
          pendingRefunds,
          pendingSalaries
        },
        revenue: {
          taxi: revenue.Taxi,
          tour: revenue.Tour,
          combined: revenue.Taxi + revenue.Tour
        },
        recentActivity: recentActivity.map((item) => ({
          id: item._id,
          actor: item.actor?.name || 'System',
          actorRole: item.actor?.role || null,
          action: item.action,
          targetType: item.targetType,
          createdAt: item.createdAt
        }))
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching admin overview.' });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const bookings = await Booking.find({ createdAt: { $gte: monthStart } }).select('bookingType totalPrice pickupLocation dropoffLocation createdAt status');

    const monthlyMap = new Map();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, {
        month: MONTH_NAMES[d.getMonth()],
        taxiRevenue: 0,
        tourRevenue: 0,
        taxiBookings: 0,
        tourBookings: 0
      });
    }

    const routeMap = new Map();

    bookings.forEach((booking) => {
      const date = new Date(booking.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const bucket = monthlyMap.get(key);
      if (bucket) {
        if (booking.bookingType === 'Taxi') {
          bucket.taxiBookings += 1;
          bucket.taxiRevenue += Number(booking.totalPrice || 0);
        } else if (booking.bookingType === 'Tour') {
          bucket.tourBookings += 1;
          bucket.tourRevenue += Number(booking.totalPrice || 0);
        }
      }

      if (booking.bookingType === 'Taxi') {
        const from = String(booking.pickupLocation || '').trim();
        const to = String(booking.dropoffLocation || '').trim() || 'Unknown';
        if (from) {
          const routeKey = `${from} -> ${to}`;
          routeMap.set(routeKey, (routeMap.get(routeKey) || 0) + 1);
        }
      }
    });

    const topRoutes = [...routeMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([route, count]) => ({ route, count }));

    const [activeUsers, completedBookings, cancelledBookings] = await Promise.all([
      User.countDocuments({ updatedAt: { $gte: new Date(Date.now() - (24 * 60 * 60 * 1000)) } }),
      Booking.countDocuments({ status: 'Completed' }),
      Booking.countDocuments({ status: 'Cancelled' })
    ]);

    return res.json({
      success: true,
      data: {
        monthly: [...monthlyMap.values()],
        topRoutes,
        summary: {
          activeUsers,
          completedBookings,
          cancelledBookings
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching analytics.' });
  }
};

exports.getStaff = async (req, res) => {
  try {
    const { role, status, q = '', page = 1, limit = 10 } = req.query;
    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || 10));

    const query = {
      role: { $in: STAFF_ROLES }
    };

    if (role && STAFF_ROLES.includes(role)) {
      query.role = role;
    }

    if (status && ['Active', 'Inactive'].includes(status)) {
      query.adminStatus = status;
    }

    if (q && String(q).trim()) {
      const rx = new RegExp(String(q).trim(), 'i');
      query.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }

    const [rows, total] = await Promise.all([
      User.find(query)
        .select('name email phone role adminStatus createdAt')
        .sort({ createdAt: -1 })
        .skip((normalizedPage - 1) * normalizedLimit)
        .limit(normalizedLimit),
      User.countDocuments(query)
    ]);

    return res.json({
      success: true,
      data: rows,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / normalizedLimit))
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching staff.' });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const { name, email, phone, role, status = 'Active', password } = req.body;

    if (!name || !email || !phone || !role) {
      return res.status(400).json({ message: 'name, email, phone, and role are required.' });
    }

    if (!STAFF_ROLES.includes(role)) {
      return res.status(400).json({ message: 'role must be TourManager or FleetManager.' });
    }

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: 'status must be Active or Inactive.' });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() }).select('_id');
    if (existing) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    const tempPassword = String(password || 'ChangeMe@123');
    const hashed = await bcrypt.hash(tempPassword, 10);

    const created = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      phone: String(phone).trim(),
      role,
      adminStatus: status,
      password: hashed
    });

    await logAdminAction({
      actor: req.user.userId,
      action: 'STAFF_CREATE',
      targetType: 'User',
      targetId: created._id,
      after: { name: created.name, email: created.email, role: created.role, adminStatus: created.adminStatus }
    });

    return res.status(201).json({
      success: true,
      message: 'Staff member created successfully.',
      data: {
        _id: created._id,
        name: created.name,
        email: created.email,
        phone: created.phone,
        role: created.role,
        adminStatus: created.adminStatus,
        createdAt: created.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error creating staff member.' });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    const user = await User.findById(id);
    if (!user || !STAFF_ROLES.includes(user.role)) {
      return res.status(404).json({ message: 'Staff member not found.' });
    }

    const before = {
      name: user.name,
      email: user.email,
      phone: user.phone
    };

    if (name !== undefined) user.name = String(name).trim();
    if (phone !== undefined) user.phone = String(phone).trim();

    if (email !== undefined) {
      const normalizedEmail = String(email).toLowerCase().trim();
      const duplicate = await User.findOne({ _id: { $ne: user._id }, email: normalizedEmail }).select('_id');
      if (duplicate) {
        return res.status(400).json({ message: 'Email already exists.' });
      }
      user.email = normalizedEmail;
    }

    await user.save();

    await logAdminAction({
      actor: req.user.userId,
      action: 'STAFF_UPDATE',
      targetType: 'User',
      targetId: user._id,
      before,
      after: { name: user.name, email: user.email, phone: user.phone }
    });

    return res.json({
      success: true,
      message: 'Staff member updated successfully.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        adminStatus: user.adminStatus,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error updating staff member.' });
  }
};

exports.updateStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: 'status must be Active or Inactive.' });
    }

    const user = await User.findById(id);
    if (!user || !STAFF_ROLES.includes(user.role)) {
      return res.status(404).json({ message: 'Staff member not found.' });
    }

    const before = { adminStatus: user.adminStatus };
    user.adminStatus = status;
    await user.save();

    await logAdminAction({
      actor: req.user.userId,
      action: 'STAFF_STATUS_UPDATE',
      targetType: 'User',
      targetId: user._id,
      before,
      after: { adminStatus: user.adminStatus }
    });

    return res.json({
      success: true,
      message: 'Staff status updated successfully.',
      data: {
        _id: user._id,
        adminStatus: user.adminStatus
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error updating staff status.' });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user || !STAFF_ROLES.includes(user.role)) {
      return res.status(404).json({ message: 'Staff member not found.' });
    }

    const before = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      adminStatus: user.adminStatus
    };

    await User.findByIdAndDelete(id);

    await logAdminAction({
      actor: req.user.userId,
      action: 'STAFF_DELETE',
      targetType: 'User',
      targetId: id,
      before,
      after: null
    });

    return res.json({
      success: true,
      message: 'Staff member deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error deleting staff member.' });
  }
};

exports.getRefundRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
      query.status = status;
    }

    const rows = await RefundRequest.find(query)
      .populate('tourist', 'name email')
      .populate('booking', 'bookingType pickupLocation dropoffLocation')
      .populate('decidedBy', 'name')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching refund requests.' });
  }
};

exports.updateRefundRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, decisionNote = '' } = req.body;

    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be Pending, Approved, or Rejected.' });
    }

    const refund = await RefundRequest.findById(id);
    if (!refund) {
      return res.status(404).json({ message: 'Refund request not found.' });
    }

    const before = { status: refund.status, decisionNote: refund.decisionNote };

    refund.status = status;
    refund.decisionNote = String(decisionNote || '').trim();
    refund.decidedBy = req.user.userId;
    refund.decidedAt = new Date();
    await refund.save();

    await logAdminAction({
      actor: req.user.userId,
      action: 'REFUND_DECISION',
      targetType: 'RefundRequest',
      targetId: refund._id,
      before,
      after: { status: refund.status, decisionNote: refund.decisionNote }
    });

    return res.json({
      success: true,
      message: 'Refund request updated successfully.',
      data: refund
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error updating refund request.' });
  }
};

exports.getBans = async (req, res) => {
  try {
    const { active } = req.query;
    const query = {};

    if (active === 'true') query.active = true;
    if (active === 'false') query.active = false;

    const rows = await AdminBan.find(query)
      .populate('user', 'name email role')
      .populate('bannedBy', 'name')
      .populate('unbannedBy', 'name')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching bans.' });
  }
};

exports.getConflictUsers = async (req, res) => {
  try {
    const { q = '', role = '' } = req.query;
    const query = {
      role: { $in: BAN_TARGET_ROLES }
    };

    const normalizedRole = String(role || '').trim();
    if (normalizedRole && BAN_TARGET_ROLES.includes(normalizedRole)) {
      query.role = normalizedRole;
    }

    const search = String(q || '').trim();
    if (search) {
      const rx = new RegExp(search, 'i');
      query.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }

    const rows = await User.find(query)
      .select('name email phone role adminStatus')
      .sort({ name: 1 })
      .limit(500);

    return res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching users for conflicts.' });
  }
};

exports.createBan = async (req, res) => {
  try {
    const { userId = null, name, role, reason } = req.body;

    if (!name || !role || !reason) {
      return res.status(400).json({ message: 'name, role, and reason are required.' });
    }

    if (!['Tourist', 'Driver', 'TourManager', 'FleetManager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role for ban.' });
    }

    const created = await AdminBan.create({
      user: userId || null,
      name: String(name).trim(),
      role,
      reason: String(reason).trim(),
      active: true,
      bannedBy: req.user.userId
    });

    if (userId) {
      await User.findByIdAndUpdate(userId, { adminStatus: 'Inactive' });
    }

    await logAdminAction({
      actor: req.user.userId,
      action: 'BAN_CREATE',
      targetType: 'AdminBan',
      targetId: created._id,
      after: { name: created.name, role: created.role, reason: created.reason, active: created.active }
    });

    return res.status(201).json({
      success: true,
      message: 'Ban created successfully.',
      data: created
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error creating ban.' });
  }
};

exports.updateBan = async (req, res) => {
  try {
    const { id } = req.params;
    const { active, reason } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({ message: 'active must be boolean.' });
    }

    const ban = await AdminBan.findById(id);
    if (!ban) {
      return res.status(404).json({ message: 'Ban record not found.' });
    }

    const before = { active: ban.active, reason: ban.reason };

    ban.active = active;
    if (reason !== undefined) {
      ban.reason = String(reason || '').trim();
    }
    ban.unbannedBy = active ? null : req.user.userId;
    await ban.save();

    if (ban.user) {
      await User.findByIdAndUpdate(ban.user, { adminStatus: active ? 'Inactive' : 'Active' });
    }

    await logAdminAction({
      actor: req.user.userId,
      action: 'BAN_UPDATE',
      targetType: 'AdminBan',
      targetId: ban._id,
      before,
      after: { active: ban.active, reason: ban.reason }
    });

    return res.json({
      success: true,
      message: 'Ban updated successfully.',
      data: ban
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error updating ban.' });
  }
};

exports.getConfig = async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    return res.json({ success: true, data: config });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching platform config.' });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    const before = config.toObject();
    const payload = req.body || {};

    if (payload.commission) {
      const taxi = clampNumber(payload.commission.taxi, 0, 50);
      const tour = clampNumber(payload.commission.tour, 0, 50);
      const refund = clampNumber(payload.commission.refund, 0, 20);
      if (taxi === null || tour === null || refund === null) {
        return res.status(400).json({ message: 'Invalid commission values.' });
      }
      config.commission = { taxi, tour, refund };
    }

    if (payload.fare) {
      const baseFare = clampNumber(payload.fare.baseFare, 0, 100000);
      const perKm = clampNumber(payload.fare.perKm, 0, 100000);
      const waitPerMin = clampNumber(payload.fare.waitPerMin, 0, 100000);
      const surgeMultiplier = clampNumber(payload.fare.surgeMultiplier, 1, 5);
      const airportSurcharge = clampNumber(payload.fare.airportSurcharge, 0, 100000);
      if ([baseFare, perKm, waitPerMin, surgeMultiplier, airportSurcharge].some((v) => v === null)) {
        return res.status(400).json({ message: 'Invalid fare values.' });
      }
      config.fare = { baseFare, perKm, waitPerMin, surgeMultiplier, airportSurcharge };
    }

    if (payload.tour) {
      const depositPct = clampNumber(payload.tour.depositPct, 0, 100);
      const cancellationHrs = clampNumber(payload.tour.cancellationHrs, 0, 720);
      const maxGroupSize = clampNumber(payload.tour.maxGroupSize, 1, 100);
      if ([depositPct, cancellationHrs, maxGroupSize].some((v) => v === null)) {
        return res.status(400).json({ message: 'Invalid tour policy values.' });
      }
      config.tour = { depositPct, cancellationHrs, maxGroupSize };
    }

    if (payload.toggles && typeof payload.toggles === 'object') {
      const keys = ['surgeEnabled', 'maintenanceMode', 'newRegistrations', 'driverSelfRegister', 'smsNotifications', 'emailReports'];
      keys.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(payload.toggles, key) && typeof payload.toggles[key] === 'boolean') {
          config.toggles[key] = payload.toggles[key];
        }
      });
    }

    config.updatedBy = req.user.userId;
    await config.save();

    await logAdminAction({
      actor: req.user.userId,
      action: 'CONFIG_UPDATE',
      targetType: 'PlatformConfig',
      targetId: config._id,
      before,
      after: config.toObject()
    });

    return res.json({
      success: true,
      message: 'Platform config updated successfully.',
      data: config
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error updating platform config.' });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const query = {};

    if (req.query.action) {
      query.action = String(req.query.action).trim();
    }

    const [rows, total] = await Promise.all([
      AdminAuditLog.find(query)
        .populate('actor', 'name email role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AdminAuditLog.countDocuments(query)
    ]);

    return res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching audit logs.' });
  }
};

exports.getEmergencyAlerts = async (req, res) => {
  try {
    const { status = '', page = 1, limit = 20 } = req.query;
    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const query = {};
    if (['Active', 'Resolved'].includes(String(status))) {
      query.status = String(status);
    }

    const [rows, total] = await Promise.all([
      EmergencyAlert.find(query)
        .populate('tourist', 'name email phone')
        .populate('resolvedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip((normalizedPage - 1) * normalizedLimit)
        .limit(normalizedLimit),
      EmergencyAlert.countDocuments(query)
    ]);

    return res.json({
      success: true,
      data: rows,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / normalizedLimit))
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching emergency alerts.' });
  }
};

exports.resolveEmergencyAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await EmergencyAlert.findById(id);

    if (!alert) {
      return res.status(404).json({ message: 'Emergency alert not found.' });
    }

    const before = { status: alert.status, resolvedAt: alert.resolvedAt };
    alert.status = 'Resolved';
    alert.resolvedBy = req.user.userId;
    alert.resolvedAt = new Date();
    await alert.save();

    await logAdminAction({
      actor: req.user.userId,
      action: 'EMERGENCY_SOS_RESOLVED',
      targetType: 'EmergencyAlert',
      targetId: alert._id,
      before,
      after: { status: alert.status, resolvedAt: alert.resolvedAt }
    });

    return res.json({
      success: true,
      message: 'Emergency alert marked as resolved.',
      data: alert
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error resolving emergency alert.' });
  }
};

exports.getSentimentReviews = async (req, res) => {
  try {
    const { sentiment = '', page = 1, limit = 20 } = req.query;
    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const query = {};
    if (['Positive', 'Neutral', 'Negative'].includes(String(sentiment))) {
      query.sentimentLabel = String(sentiment);
    }

    const [rows, total] = await Promise.all([
      Review.find(query)
        .populate('tourist', 'name email')
        .populate('driver', 'name email isFlagged')
        .sort({ createdAt: -1 })
        .skip((normalizedPage - 1) * normalizedLimit)
        .limit(normalizedLimit),
      Review.countDocuments(query)
    ]);

    return res.json({
      success: true,
      data: rows,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / normalizedLimit))
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching sentiment reviews.' });
  }
};

exports.getFlaggedDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'Driver', isFlagged: true })
      .select('name email phone status isFlagged updatedAt')
      .sort({ updatedAt: -1 });

    return res.json({
      success: true,
      count: drivers.length,
      data: drivers
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching flagged drivers.' });
  }
};
