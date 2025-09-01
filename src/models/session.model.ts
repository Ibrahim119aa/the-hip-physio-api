import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  // Admin-filled fields (required at creation)
  title: {
    type: String,
    required: true
  },
  rehabPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RehabPlan',
    required: true
  },
  weekNumber: {
    type: Number,
    required: true
  },
  dayNumber: {
    type: Number,
    required: true
  },
  exercises: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise'
  }],

  // User-filled fields (not required initially)
  difficultyRating: {
    type: String,
    enum: ['too easy', 'just right', 'too hard'],
    required: false
  },
  userNotes: {
    type: String,
    trim: true,
    required: false
  },
  isComplete: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const SessionModel = mongoose.models.Session || mongoose.model('Session', sessionSchema);

export default SessionModel;