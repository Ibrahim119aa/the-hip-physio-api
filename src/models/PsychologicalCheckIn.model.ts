import mongoose from "mongoose";
import { TPsychologicalCheckInDocument } from "../types/test";

const WeeklyPsychologicalCheckInSchema = new mongoose.Schema<TPsychologicalCheckInDocument>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rehabPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RehabPlan',
    required: true
  },
  week: {
    type: Number,
    required: true
  },
  resilienceScore: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comments: {
    type: String,
    trim: true
  },
  // Optional: Reference to exercises if you want to correlate
  exercisesCompleted: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise'
  }],
  // Timestamp of when the check-in was submitted
  submittedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Index for fast lookups of user's check-in history
WeeklyPsychologicalCheckInSchema.index({ userId: 1, rehabPlanId: 1, week: 1 }, { unique: true });

const WeeklyPsychologicalCheckInModel = mongoose.models.PsychologicalCheckIn ||
  mongoose.model<TPsychologicalCheckInDocument>('PsychologicalCheckIn', WeeklyPsychologicalCheckInSchema);

export default WeeklyPsychologicalCheckInModel;