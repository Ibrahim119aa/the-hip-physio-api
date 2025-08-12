import mongoose from "mongoose";
import { TEducationalVideoDocument } from "../types/educationalVideos.types";

const educationVideoSchema = new mongoose.Schema<TEducationalVideoDocument>({
  title: {
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
    required: true,
  },
  thumbnailUrl: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: false
  },
  category: [{
    type: String,
    required: true,
  }],
  tags: {
    type: [String],
    required: true,
  },
}, { timestamps: true });

// creating index
educationVideoSchema.index(
  { title: "text", description: "text", tags: "text" },
  { name: "education_video_search_index" }
);

const EducationVideosModel = mongoose.models.EducationVideos || mongoose.model<TEducationalVideoDocument>("EducationVideos", educationVideoSchema);

export default EducationVideosModel;
