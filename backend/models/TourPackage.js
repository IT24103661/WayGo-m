const mongoose = require('mongoose');

const tourPackageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  flatPrice: {
    type: Number,
    required: true
  },
  durationDays: {
    type: Number,
    required: true
  },
  itineraryStops: {
    type: [String],
    default: []
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model('TourPackage', tourPackageSchema);
