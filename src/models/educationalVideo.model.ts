import mongoose from "mongoose";

const educationalVideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // Duration in minutes
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  category: {
    type: String, // e.g., "Recovery Tips", "Irritability Management"
    required: true,
    trim: true
  }
}, { timestamps: true } );

const EducationalVideoModel = mongoose.models.EducationalVideo || mongoose.model('EducationalVideo', educationalVideoSchema);

export default EducationalVideoModel; 