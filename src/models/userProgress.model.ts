import mongoose from "mongoose";
import { TUserProgressDocument } from "../types/userProgress.types";

const userProgressSchema = new mongoose.Schema<TUserProgressDocument>({
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

  // Tracks which specific exercises the user has completed and their feedback
  completedExercises: [{
    exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
    irritabilityScore: { type: Number, min: 0, max: 10 },
    completedAt: { type: Date, default: Date.now }
  }],

  

  // Tracks which sessions the user has completed and their feedback
  completedSessions: [{
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    difficultyRating: { type: String, enum: ['too easy', 'just right', 'too hard'] },
    completedAt: { type: Date, default: Date.now }
  }],

  currentWeek: {
    type: Number,
    default: 1
  },
  currentDay: {
    type: Number,
    default: 1
  },
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
userProgressSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Ensure a user has only one progress document per plan
userProgressSchema.index({ userId: 1, rehabPlanId: 1 }, { unique: true });

// Create the model
const UserProgressModel = mongoose.models.UserProgress || mongoose.model<TUserProgressDocument>('UserProgress', userProgressSchema);

export default UserProgressModel;


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

