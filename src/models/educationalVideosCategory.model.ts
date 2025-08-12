import mongoose from "mongoose";

const educationalVideosCategorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, { timestamps: true });

const EducationalVideosCategoryModel = mongoose.models.EducationalVideosCategory || mongoose.model("EducationalVideosCategory", educationalVideosCategorySchema);

export default EducationalVideosCategoryModel;

