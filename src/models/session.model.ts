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
  irritabilityScore: {
    type: Number,
    min: 0,
    max: 10,
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


  // irritability_rating: Number, // Assuming range 0-10 is validated elsewhere

 
// const sessionSchema = new mongoose.Schema({
//   rehabPlan: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'RehabPlan',
//     required: true
//   },
//   dayNumber: { // e.g., 1, 2, 3, etc.
//     type: Number,
//     required: true
//   },
//   categories: [{
//     name: { // e.g., "Warm-Up"
//       type: String,
//       required: true
//     },
//     exercises: [{
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Exercise'
//     }]
//   }],
// }, { timestamps: true});
