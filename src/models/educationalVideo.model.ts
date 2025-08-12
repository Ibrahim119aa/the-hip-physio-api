import mongoose from "mongoose";

const educationalVideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EducationalVideosCategory',
  }]
}, { timestamps: true } );

const EducationalVideoModel = mongoose.models.EducationalVideo || mongoose.model('EducationalVideo', educationalVideoSchema);

export default EducationalVideoModel; 