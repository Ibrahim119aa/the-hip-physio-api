import mongoose from "mongoose";

const rehabPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
    enum: ['paid', 'free'],
    required: true
  },
  planDurationInWeeks: {
    type: Number,
    required: true
  },

  weekStart: { type: Number, default: null},                  // e.g. 0, 12, 28
  weekEnd:   { type: Number, default: null },                 // e.g. 12, 28, 42 (nullable)
  openEnded: { type: Boolean, default: false },               // true → render “ 28- 42+”
  
  phase: {
    type: String,
    required: true
  },
  category: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RehabPlanCategory',
    required: true
  }],
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
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const RehabPlanModel = mongoose.models.RehabPlan || mongoose.model('RehabPlan', rehabPlanSchema);

export default RehabPlanModel;


  // metadata: {
  //   app_plan_id: String(plan._id),
  //   app_plan_name: plan.name,
  //   app_phase: plan.phase,
  //   week_start: String(plan.weekStart ?? ''),
  //   week_end: String(plan.weekEnd ?? ''),
  //   open_ended: String(!!plan.openEnded),
  //   badge: plan.weekStart != null
  //     ? `Week ${plan.weekStart}-${plan.openEnded ? `${plan.weekEnd}+` : plan.weekEnd}`
  //     : `${plan.planDurationInWeeks}-Weeks`,
  // },