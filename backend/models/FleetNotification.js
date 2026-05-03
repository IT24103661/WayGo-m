const mongoose = require('mongoose');

const fleetNotificationSchema = new mongoose.Schema({
  fleetManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  tourist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['BOOKING_CREATED', 'SALARY_PAID'],
    default: 'BOOKING_CREATED'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

fleetNotificationSchema.index({ fleetManager: 1, createdAt: -1 });

module.exports = mongoose.model('FleetNotification', fleetNotificationSchema);
