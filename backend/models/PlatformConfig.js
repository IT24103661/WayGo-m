const mongoose = require('mongoose');

const platformConfigSchema = new mongoose.Schema({
  singletonKey: {
    type: String,
    default: 'global',
    unique: true,
    index: true
  },
  commission: {
    taxi: { type: Number, default: 10, min: 0, max: 50 },
    tour: { type: Number, default: 12, min: 0, max: 50 },
    refund: { type: Number, default: 5, min: 0, max: 20 }
  },
  fare: {
    baseFare: { type: Number, default: 150, min: 0 },
    perKm: { type: Number, default: 85, min: 0 },
    waitPerMin: { type: Number, default: 5, min: 0 },
    surgeMultiplier: { type: Number, default: 1.5, min: 1, max: 5 },
    airportSurcharge: { type: Number, default: 500, min: 0 }
  },
  tour: {
    depositPct: { type: Number, default: 20, min: 0, max: 100 },
    cancellationHrs: { type: Number, default: 48, min: 0, max: 720 },
    maxGroupSize: { type: Number, default: 20, min: 1, max: 100 }
  },
  toggles: {
    surgeEnabled: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    newRegistrations: { type: Boolean, default: true },
    driverSelfRegister: { type: Boolean, default: false },
    smsNotifications: { type: Boolean, default: true },
    emailReports: { type: Boolean, default: true }
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('PlatformConfig', platformConfigSchema);
