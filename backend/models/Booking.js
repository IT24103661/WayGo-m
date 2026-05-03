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
    },
    packageOptions: {
        tourTitle: {
            type: String,
            default: ''
        },
        checkInDate: {
            type: Date,
            default: null
        },
        checkOutDate: {
            type: Date,
            default: null
        },
        adults: {
            type: Number,
            default: 1
        },
        children: {
            type: Number,
            default: 0
        },
        nights: {
            type: Number,
            default: 1
        },
        roomType: {
            type: String,
            enum: ['Standard', 'Deluxe', 'Family', 'Suite'],
            default: 'Standard'
        },
        roomCount: {
            type: Number,
            default: 1
        },
        mealPlan: {
            type: String,
            enum: ['No Meals', 'Breakfast', 'Half Board', 'Full Board'],
            default: 'No Meals'
        },
        dietPreference: {
            type: String,
            default: ''
        },
        extras: {
            airportPickup: {
                type: Boolean,
                default: false
            },
            privateGuide: {
                type: Boolean,
                default: false
            },
            activityAddons: {
                type: [String],
                default: []
            }
        },
        pricing: {
            tourBase: {
                type: Number,
                default: 0
            },
            roomCost: {
                type: Number,
                default: 0
            },
            mealCost: {
                type: Number,
                default: 0
            },
            extrasCost: {
                type: Number,
                default: 0
            },
            finalTotal: {
                type: Number,
                default: 0
            }
        }
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Refunded'],
        default: 'Pending'
    },
    stayStatus: {
        type: String,
        enum: [
            'Awaiting Stay Allocation',
            'Partially Allocated',
            'Stay Confirmed',
            'Check-in Ready',
            'Checked-in',
            'Checked-out'
        ],
        default: 'Awaiting Stay Allocation'
    },
    stayAllocations: {
        type: [
            {
                stayInventory: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'StayInventory',
                    default: null
                },
                propertyName: {
                    type: String,
                    trim: true,
                    required: true
                },
                location: {
                    type: String,
                    trim: true,
                    required: true
                },
                roomType: {
                    type: String,
                    enum: ['Standard', 'Deluxe', 'Family', 'Suite'],
                    required: true
                },
                roomsAllocated: {
                    type: Number,
                    min: 1,
                    required: true
                },
                checkInDate: {
                    type: Date,
                    required: true
                },
                checkOutDate: {
                    type: Date,
                    required: true
                },
                notes: {
                    type: String,
                    trim: true,
                    default: ''
                }
            }
        ],
        default: []
    },
    stayManagerNotes: {
        type: String,
        trim: true,
        default: ''
    },
    stayLastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    stayCheckedOutAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);