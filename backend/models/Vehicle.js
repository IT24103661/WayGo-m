const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    plateNumber: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    make:  { type: String, required: true },
    brand: { type: String, trim: true },
    model: { type: String, required: true },
    year:  { type: Number, required: true },
    type: {
        type: String,
        enum: ['Sedan', 'SUV', 'Van', 'Bus', 'Minivan', 'Luxury'],
        required: true
    },
    category: {
        type: String,
        enum: ['Economy', 'Luxury', 'Van', 'SUV'],
        default: 'Economy'
    },
    capacity: {
        type: Number,
        default: 4
    },
    color: { type: String },
    assignedDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    managedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Under Maintenance', 'Out of Service', 'Available', 'On Trip', 'Retired'],
        default: 'Available'
    },
    compliance: {
        licenseExpiry: { type: Date, default: null },
        insuranceExpiry: { type: Date, default: null },
        emissionTestExpiry: { type: Date, default: null }
    },
    mileage: {
        current: { type: Number, default: 0 },
        lastService: { type: Number, default: 0 },
        serviceInterval: { type: Number, default: 5000 }
    },
    lastServiceDate: { type: Date, default: null },
    insuranceExpiry: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
