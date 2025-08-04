import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  titlte: {
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
  exercises: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise'
  }],
  difficultyRating: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  userNotes: {
    type: String,
    trim: true
  },
  isComplete: {
    type: Boolean,
    default: false
  },
}, { timestamps: true})



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
