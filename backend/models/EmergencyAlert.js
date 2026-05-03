const mongoose = require('mongoose');

const emergencyAlertSchema = new mongoose.Schema({
  tourist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  accuracy: {
    type: Number,
    default: null,
    min: 0
  },
  emergencyType: {
    type: String,
    enum: ['Medical', 'Safety', 'Accident', 'Other'],
    default: 'Safety'
  },
  note: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['Active', 'Resolved'],
    default: 'Active',
    index: true
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EmergencyAlert', emergencyAlertSchema);
