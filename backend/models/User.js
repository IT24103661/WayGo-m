const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },
    role: {
        type: String,
        enum: ['Tourist', 'Driver', 'TourManager', 'FleetManager', 'SystemAdmin'],
        default: 'Tourist',
        required: true
    },
    adminStatus: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
        index: true
    },
    phone: {
        type: String,
        required: true
    },
    managedByFleetManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    },
    company: {
        type: String,
        trim: true,
        default: ''
    },
    depot: {
        type: String,
        trim: true,
        default: ''
    },
    region: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: ['Online', 'Offline', 'On Trip'],
        default: 'Offline'
    },
    vehicleDetails: {
        type: {
            type: String,
            trim: true
        },
        plateNumber: {
            type: String,
            trim: true
        },
        model: {
            type: String,
            trim: true
        }
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    isTourCertified: {
        type: Boolean,
        default: false
    },
    isFlagged: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true
});

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);