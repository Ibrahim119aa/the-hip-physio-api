import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema({
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
  }]
}, { timestamps: true });

// Create a text index for searching by name, category, and tags
exerciseSchema.index({ name: 'text', category: 'text', tags: 'text' });

const ExerciseModel = mongoose.models.Exercise || mongoose.model('Exercise', exerciseSchema);

export default ExerciseModel;