import mongoose from "mongoose";

// Sub-schema for exercises within a session
const ExerciseProgressSchema = new mongoose.Schema({
  exerciseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise', // Reference to Exercise model
    required: true
  },
  irritabilityScore: {
    type: Number,
    min: 0,
    max: 10,
    required: true
  }
});

// Sub-schema for sessions
const SessionProgressSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session', // Reference to Session model
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null // Will be set when session is completed
  },
  difficultyRating: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  exercises: [ExerciseProgressSchema] // Array of exercise progress
});

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
  sessions: [SessionProgressSchema],
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

module.exports = ProgressTracking;

// suggested schema
// {
//   _id: ObjectId,
//   userId: ObjectId,
//   rehabPlanId: ObjectId,
//   sessions: [
//     {
//       sessionId: ObjectId,
//       isCompleted: Boolean,
//       completedAt: Date,
//       difficultyRating: String, // "easy", "medium", "hard"
//       exercises: [
//         {
//           exerciseId: ObjectId,
//           irritabilityScore: Number // 0-10
//         }
//       ]
//     }
//   ],
//   progressPercent: Number, // Based on sessions completed
//   resiliencyScore: Number, // Custom metric you define
//   streakCount: Number, // Tracks for this plan
//   lastUpdated: Date
// }
