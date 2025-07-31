import mongoose from "mongoose";
import { TExerciseCategoryDocument } from "../types/exerciseCategory.type";

const exerciseCategorySchema = new mongoose.Schema<TExerciseCategoryDocument>({
  title: {
    type: String, // e.g., "Hip Strengthening", "Core", "Mobility"
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, { timestamps: true });

const ExerciseCategoryModel = mongoose.models.ExerciseCategory || mongoose.model<TExerciseCategoryDocument>("ExerciseCategory", exerciseCategorySchema);

export default ExerciseCategoryModel;

