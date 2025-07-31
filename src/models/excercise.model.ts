import mongoose from "mongoose";
import { TExerciseDocument } from "../types/excercise.types";

export const exerciseSchema = new mongoose.Schema<TExerciseDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    required: true // URL to the video file (e.g., S3, Cloudinary)
  },
  thumbnailUrl: {
    type: String,
    required: false // Optional: URL to a video thumbnail
  },
  reps: {
    type: String, // Flexible for "10-12" or "As many as possible"
    required: true
  },
  sets: {
    type: String, // Flexible for "3" or "2-3"
    required: true
  },
  category: {
    type: String, // e.g., "Hip / Strengthening", "Core", "Mobility"
    required: true,
    trim: true
  },
  tags: [{
    type: String, // e.g., ["Phase 1", "Pilates", "Hip Bursitis Recovery"]
    trim: true
  }],
  bodyPart: {
    type: String, // e.g., "Hip", "Knee", "Core"
    required: true,
    trim: true
  },
  difficulty: {
    type: String, // e.g., "Beginner", "Intermediate", "Advanced"
    enum: ["Beginner", "Intermediate", "Advanced"],
    default: "Beginner"
  },
  estimatedDuration: {
    type: Number, // Duration in minutes
    required: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Create a text index for searching by name, category, and tags
exerciseSchema.index({ name: 'text', category: 'text', tags: 'text' });

const ExerciseModel = mongoose.models.Exercise || mongoose.model('Exercise', exerciseSchema);

export default ExerciseModel;