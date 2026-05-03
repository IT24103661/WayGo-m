const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  targetType: {
    type: String,
    required: true,
    trim: true
  },
  targetId: {
    type: String,
    default: null,
    trim: true
  },
  before: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  after: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { timestamps: true });

adminAuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
