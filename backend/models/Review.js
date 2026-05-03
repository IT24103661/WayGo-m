const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    tourist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    },
    tourName: {
        type: String,
        required: true,
        default: 'General Tour'
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    text: {
        type: String,
        required: true
    },
    sentimentScore: {
        type: Number,
        default: 0
    },
    sentimentLabel: {
        type: String,
        enum: ['Positive', 'Neutral', 'Negative'],
        default: 'Neutral',
        index: true
    },
    helpful: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
