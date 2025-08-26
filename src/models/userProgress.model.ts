// import mongoose from "mongoose";
// import { TUserProgressDocument } from "../types/userProgress.types";

// const userProgressSchema = new mongoose.Schema<TUserProgressDocument>({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User', // Reference to User model
//     required: true
//   },
//   rehabPlanId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'RehabPlan', // Reference to RehabPlan model
//     required: true
//   },

//   // Tracks which specific exercises the user has completed and their feedback
//   completedExercises: [{
//     sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
//     exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
//     irritabilityScore: { type: Number, min: 0, max: 10 },
//     completedAt: { type: Date, default: Date.now }
//   }],

//   // Tracks which sessions the user has completed and their feedback
//   completedSessions: [{
//     sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
//     difficultyRating: { type: String, enum: ['too easy', 'just right', 'too hard'] },
//     completedAt: { type: Date, default: Date.now }
//   }],

//   currentWeek: {
//     type: Number,
//     default: 1
//   },
//   currentDay: {
//     type: Number,
//     default: 1
//   },
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
//   streakCountWeekly: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   streakCountMonthly: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
// }, {
//   timestamps: true
// });

// // Ensure a user has only one progress document per plan
// userProgressSchema.index({ userId: 1, rehabPlanId: 1 }, { unique: true });

// // Create the model
// const UserProgressModel = mongoose.models.UserProgress || mongoose.model<TUserProgressDocument>('UserProgress', userProgressSchema);

// export default UserProgressModel;


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
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
    irritabilityScore: { type: Number, min: 0, max: 10 },
    completedAtUTC: { type: Date, required: true },
    completedAtLocal: { type: String, required: true }, // ISO 8601 with offset
    timezone: { type: String, required: true },         // IANA timezone string
    dayKey: { type: String, required: true }            // 'YYYY-MM-DD' in user's local time
  }],

  // Tracks which sessions the user has completed and their feedback
  completedSessions: [{
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    difficultyRating: { type: String, enum: ['too easy', 'just right', 'too hard'] },
    completedAtUTC: { type: Date, required: true },
    completedAtLocal: { type: String, required: true },
    timezone: { type: String, required: true },
    dayKey: { type: String, required: true }
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
  streakCountWeekly: {
    type: Number,
    default: 0,
    min: 0
  },
  streakCountMonthly: {
    type: Number,
    default: 0,
    min: 0
  },
}, {
  timestamps: true
});

// Ensure a user has only one progress document per plan
userProgressSchema.index({ userId: 1, rehabPlanId: 1 }, { unique: true });
userProgressSchema.index({ userId: 1, 'completedExercises.dayKey': 1 });
userProgressSchema.index({ userId: 1, 'completedSessions.dayKey': 1 });

// Create the model
const UserProgressModel = mongoose.models.UserProgress || mongoose.model<TUserProgressDocument>('UserProgress', userProgressSchema);

export default UserProgressModel;