const mongoose = require('mongoose');

const stayInventorySchema = new mongoose.Schema({
  propertyName: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  roomType: {
    type: String,
    enum: ['Standard', 'Deluxe', 'Family', 'Suite'],
    required: true
  },
  totalRooms: {
    type: Number,
    required: true,
    min: 1
  },
  reservations: {
    type: [
      {
        booking: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Booking',
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
        roomsAllocated: {
          type: Number,
          min: 1,
          required: true
        }
      }
    ],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  managedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, { timestamps: true });

stayInventorySchema.index({ managedBy: 1, propertyName: 1, roomType: 1, location: 1 });

module.exports = mongoose.model('StayInventory', stayInventorySchema);
