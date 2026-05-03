const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    tourist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Links exactly to the Tourist who made the request
        required: true
    },
    bookingType: {
        type: String,
        enum: ['Taxi', 'Tour'], // WayGo handles both immediate rides and planned tours!
        required: true
    },
    tourPackage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour', // If they booked a tour, we link it here
        default: null
    },
    assignedDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Links to the specific Driver taking the job
        default: null
    },
    assignedVehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle', // Links to the specific vehicle from the Fleet Manager's list
        default: null
    },
    pickupLocation: {
        type: String,
        required: true
    },
    dropoffLocation: {
        type: String,
        default: null
    },
    pickupTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'En Route', 'Completed', 'Cancelled'],
        default: 'Pending' // Every new booking starts as pending until a driver accepts
    },
    totalPrice: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);