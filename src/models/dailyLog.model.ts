const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dailyLogSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: Schema.Types.ObjectId,
    ref: 'RehabPlan',
    required: true
  },
  date: {
    type: Date, // The specific date this log entry is for
    required: true
  },
  planDay: {
    type: Number, // The day number within the plan (e.g., Day 4 of 28)
    required: true
  },
  sessionStatus: {
    type: String,
    enum: ['Completed', 'Missed', 'Incomplete'],
    default: 'Incomplete'
  },
  // User-reported feedback after a session
  irritabilityScore: {
    type: Number,
    min: 0,
    max: 10
  },
  difficultyRating: {
    type: String,
    enum: ['Too Easy', 'Just Right', 'Too Hard']
  },
  notes: {
    type: String,
    trim: true
  },
  // Weekly Psychological Check-in (can be added to the log on the 7th day)
  weeklyResilienceScore: {
    type: Number,
    min: 1,
    max: 5
  },
  // A field to track which exercises were actually completed by the user
  completedExercises: [{
    type: Schema.Types.ObjectId,
    ref: 'Exercise'
  }],
  // A field to track watch progress of educational videos for this user
  watchedVideos: [{
    video: { type: Schema.Types.ObjectId, ref: 'EducationalVideo' },
    watchPercentage: { type: Number, min: 0, max: 100, default: 0 }
  }]
}, { timestamps: true });

// Ensure a user can only have one log entry per date
dailyLogSchema.index({ user: 1, date: 1 }, { unique: true });

const DailyLogModel = mongoose.models.DailyLog || mongoose.model('DailyLog', dailyLogSchema);

export default DailyLogModel;