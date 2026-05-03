const mongoose = require('mongoose');

const ISSUE_TYPES = {
  SYSTEM_SUPPORT: 'SystemSupport',
  URGENT_DISPATCH: 'UrgentDispatch',
  APP_FEEDBACK: 'AppFeedback'
};

const supportRequestSchema = new mongoose.Schema({
  issueType: {
    type: String,
    enum: Object.values(ISSUE_TYPES),
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // System Support fields
  subject: {
    type: String,
    trim: true,
    required: function requiredSubject() {
      return this.issueType === ISSUE_TYPES.SYSTEM_SUPPORT;
    }
  },
  description: {
    type: String,
    trim: true,
    required: function requiredDescription() {
      return this.issueType === ISSUE_TYPES.SYSTEM_SUPPORT;
    }
  },

  // Urgent Dispatch fields
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: function requiredVehicle() {
      return this.issueType === ISSUE_TYPES.URGENT_DISPATCH;
    }
  },
  currentLocationText: {
    type: String,
    trim: true,
    required: function requiredCurrentLocationText() {
      return this.issueType === ISSUE_TYPES.URGENT_DISPATCH;
    }
  },
  currentLocation: {
    lat: {
      type: Number
    },
    lng: {
      type: Number
    }
  },
  emergencyType: {
    type: String,
    trim: true,
    required: function requiredEmergencyType() {
      return this.issueType === ISSUE_TYPES.URGENT_DISPATCH;
    }
  },

  // App Feedback field
  message: {
    type: String,
    trim: true,
    required: function requiredMessage() {
      return this.issueType === ISSUE_TYPES.APP_FEEDBACK;
    }
  },

  status: {
    type: String,
    required: true,
    default: function defaultStatus() {
      if (this.issueType === ISSUE_TYPES.URGENT_DISPATCH) {
        return 'Unresolved';
      }
      if (this.issueType === ISSUE_TYPES.SYSTEM_SUPPORT) {
        return 'Open';
      }
      return 'Open';
    },
    validate: {
      validator: function validateStatus(value) {
        const statusByIssueType = {
          [ISSUE_TYPES.SYSTEM_SUPPORT]: ['Open', 'In Progress', 'Resolved'],
          [ISSUE_TYPES.URGENT_DISPATCH]: ['Unresolved', 'Handled'],
          [ISSUE_TYPES.APP_FEEDBACK]: ['Open', 'Resolved']
        };
        return statusByIssueType[this.issueType]?.includes(value);
      },
      message: 'Invalid status value for this issue type.'
    }
  },
  priority: {
    type: String,
    enum: ['Normal', 'High'],
    default: function defaultPriority() {
      return this.issueType === ISSUE_TYPES.URGENT_DISPATCH ? 'High' : 'Normal';
    }
  },
  routedToRole: {
    type: String,
    default: function defaultRoutedRole() {
      if (this.issueType === ISSUE_TYPES.SYSTEM_SUPPORT) return 'Support_Team';
      if (this.issueType === ISSUE_TYPES.URGENT_DISPATCH) return 'Fleet_Manager';
      return 'Product_Team';
    }
  }
}, {
  timestamps: true
});

supportRequestSchema.index({ issueType: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('SupportRequest', supportRequestSchema);
