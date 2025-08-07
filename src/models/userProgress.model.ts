import mongoose from "mongoose";

// Main Progress Tracking schema
const ProgressTrackingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to User model
    required: true
  },
  rehabPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RehabPlan', // Reference to RehabPlan model
    required: true
  },
  sessions: [{
    type: mongoose.Types. ObjectId,
    ref: 'Session'
  }], 
  progressPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  resiliencyScore: {
    type: Number,
    default: 0
  },
  streakCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update lastUpdated timestamp before saving
ProgressTrackingSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Create the model
const ProgressTracking = mongoose.model('ProgressTracking', ProgressTrackingSchema);

export default ProgressTracking;


// const ProgressTrackingSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   rehabPlanId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'RehabPlan',
//     required: true
//   },

//   // More granular tracking per session per day
//   completedSessions: [{
//     sessionId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Session',
//       required: true
//     },
//     week: {
//       type: Number,
//       required: true
//     },
//     day: {
//       type: Number,
//       required: true
//     },
//     completedAt: {
//       type: Date,
//       default: Date.now
//     },
//     completed: {
//       type: Boolean,
//       default: true
//     }
//   }],

//   // Overall progress and metrics
//   progressPercent: {
//     type: Number,
//     default: 0,
//     min: 0,
//     max: 100
//   },
//   resiliencyScore: {
//     type: Number,
//     default: 0
//   },
//   streakCount: {
//     type: Number,
//     default: 0,
//     min: 0
//   },

//   lastUpdated: {
//     type: Date,
//     default: Date.now
//   }
// }, { timestamps: true });

