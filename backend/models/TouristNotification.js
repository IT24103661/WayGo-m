const mongoose = require('mongoose');

const touristNotificationSchema = new mongoose.Schema({
  tourist: {
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
  fleetManager: {
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
    enum: ['BOOKING_STATUS', 'BOOKING_ASSIGNED', 'BOOKING_UPDATED', 'BOOKING_DELETED'],
    default: 'BOOKING_UPDATED'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

touristNotificationSchema.index({ tourist: 1, createdAt: -1 });

module.exports = mongoose.model('TouristNotification', touristNotificationSchema);
