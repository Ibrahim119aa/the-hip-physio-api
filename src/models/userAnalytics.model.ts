const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userAnalyticsSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Calculated as (completed sessions / assigned sessions) * 100
  complianceRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Average irritability score over the last 30 days
  averageIrritability: {
    type: Number,
    default: 0
  },
  // A score based on login frequency, session completion, etc.
  engagementScore: {
    type: Number,
    default: 0
  },
  // Total number of completed sessions
  completedSessions: {
    type: Number,
    default: 0
  },
  // Total number of missed sessions
  missedSessions: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const UserAnalyticsModel = mongoose.model.UserAnalytics || mongoose.model('UserAnalytics', userAnalyticsSchema);

export default UserAnalyticsModel