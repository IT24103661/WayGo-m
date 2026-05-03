const mongoose = require('mongoose');

const driverSalarySchema = new mongoose.Schema({
  fleetManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
    index: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
    index: true
  },
  employeeRole: {
    type: String,
    enum: ['Driver', 'TourManager', 'FleetManager'],
    default: 'Driver',
    index: true
  },
  month: {
    type: String,
    required: true,
    match: /^\d{4}-(0[1-9]|1[0-2])$/
  },
  baseSalary: {
    type: Number,
    required: true,
    min: 0
  },
  performanceValue: {
    type: Number,
    default: 0,
    min: 0
  },
  performanceRate: {
    type: Number,
    default: 0,
    min: 0
  },
  performancePay: {
    type: Number,
    default: 0,
    min: 0
  },
  bonus: {
    type: Number,
    default: 0,
    min: 0
  },
  deductions: {
    type: Number,
    default: 0,
    min: 0
  },
  netSalary: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending'
  },
  paymentDate: {
    type: Date,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

driverSalarySchema.index({ fleetManager: 1, employee: 1, employeeRole: 1, month: 1 });
driverSalarySchema.index({ fleetManager: 1, driver: 1, month: 1 });

module.exports = mongoose.model('DriverSalary', driverSalarySchema);
