const mongoose = require('mongoose');

const adminBanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['Tourist', 'Driver', 'TourManager', 'FleetManager'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  bannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  unbannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('AdminBan', adminBanSchema);
