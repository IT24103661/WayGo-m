const mongoose = require('mongoose');

const customQuoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedRoute: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Quoted', 'Accepted'],
    default: 'Pending'
  },
  quotedPrice: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('CustomQuote', customQuoteSchema);
