const fs = require('fs');

const f = 'backend/controllers/touristController.js';
let content = fs.readFileSync(f, 'utf8');

const additional = `
// ==========================================
// REVIEWS MANAGEMENT (CRUD)
// ==========================================
const Review = require('../models/Review');

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ tourist: req.user.userId }).sort('-createdAt');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { tourName, rating, text } = req.body;
    const review = await Review.create({
      tourist: req.user.userId,
      tourName: tourName || 'General Tour',
      rating,
      text
    });
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.tourist.toString() !== req.user.userId.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    if (req.body.rating) review.rating = req.body.rating;
    if (req.body.text) review.text = req.body.text;
    if (req.body.tourName) review.tourName = req.body.tourName;
    
    await review.save();
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.tourist.toString() !== req.user.userId.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await review.deleteOne();
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
`;

if(!content.includes('REVIEWS MANAGEMENT (CRUD)')) {
  fs.writeFileSync(f, content + "\n" + additional);
}
