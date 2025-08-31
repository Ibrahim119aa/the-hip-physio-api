// models/rehabPlan.model.ts
import mongoose from "mongoose";

const scheduleItemSchema = new mongoose.Schema(
  {
    week: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    day: { 
      type: Number, 
      required: true, 
      min: 1, max: 7 
    },
    sessions: [
      { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Session", 
        required: true 
      },
    ],
  },
  { _id: false }
);

const rehabPlanSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      required: true, 
      trim: true 
    },

    price: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    planType: { 
      type: String, 
      enum: ["paid", "free"], 
      required: true 
    },

    planDurationInWeeks: { 
      type: Number, 
      required: true, 
      min: 1 
    },

    // Either a number ≥ 0 or null. Using min with Number allows nulls.
    weekStart: { 
      type: Number, 
      min: 0, 
      default: null 
    },
    weekEnd: { 
      type: Number, 
      min: 0, 
      default: null 
    },
    openEnded: { 
      type: Boolean, 
      default: false 
    },

    // Optional textual phase label
    phase: { 
      type: String, 
      default: null, 
      trim: true 
    },

    category: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RehabPlanCategory",
        required: true,
      },
    ],

    schedule: {
      type: [scheduleItemSchema],
      default: [],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const RehabPlanModel =
  mongoose.models.RehabPlan || mongoose.model("RehabPlan", rehabPlanSchema);

export default RehabPlanModel;
