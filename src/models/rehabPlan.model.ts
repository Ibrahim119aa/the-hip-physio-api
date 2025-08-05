import mongoose from "mongoose";

// Defines a single day's workout within the plan
// const dailyScheduleSchema = new mongoose.Schema({
//   day: {
//     type: Number, // e.g., Day 1, Day 2, ...
//     required: true
//   },
//   exercises: [{
//     exercise: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Exercise',
//       required: true
//     },
//     // Allows overriding the default reps/sets from the Exercise library for this specific plan
//     reps: { type: String },
//     sets: { type: String }
//   }],
//   educationalVideos: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'EducationalVideo'
//   }]
// }, { _id: false });


// const rehabPlanSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true // e.g., "FAI Post Operative", "Hip Replacement Phase 1"
//   },
//   type: {
//     type: String,
//     enum: ['Paid', 'Free'],
//     required: true
//   },
//   description: String,
//   durationWeeks: {
//     type: Number,
//     required: true
//   },
  
//   // The structured, day-by-day content of the plan
//   schedule: [dailyScheduleSchema],
  
//   // Access control settings for users assigned to this plan
//   accessControl: {
//     restrictContent: {
//       // If true, user can only see content from this plan
//       type: Boolean,
//       default: true
//     },
//     allowedVideoCategories: [{
//       type: String
//     }],
//     canSkipAhead: {
//       // If false, user must complete days sequentially
//       type: Boolean,
//       default: false
//     }
//   }
// }, { timestamps: true });


// const rehabPlanSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true
//   },
//   description: String,
//   price: {
//     type: Number,
//     required: true
//   },
//   planType: {
//     type: String,
//     enum: ['Paid', 'Free'],
//     required: true
//   },
//   planDurationInWeeks: {
//     type: Number,
//     required: true
//   },
//   numberOfDailySessionsPerWeek: {
//     type: Number,
//     required: true
//   },
//   sessionIds: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Session'
//   }],
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   }
// }, { timestamps: true });

// const RehabPlanModel = mongoose.models.RehabPlan || mongoose.model('RehabPlan', rehabPlanSchema);

// export default RehabPlanModel;

const rehabPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  planType: {
    type: String,
    enum: ['Paid', 'Free'],
    required: true
  },
  planDurationInWeeks: {
    type: Number,
    required: true
  },

  // Structured weekly/daily schedule
  schedule: [
    {
      week: {
        type: Number,
        required: true
      },
      day: {
        type: Number,
        required: true
      },
      sessions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
      }]
    }
  ],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const RehabPlanModel = mongoose.models.RehabPlan || mongoose.model('RehabPlan', rehabPlanSchema);

export default RehabPlanModel;
