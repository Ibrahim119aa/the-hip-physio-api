import mongoose from "mongoose";
import { TRehabPlanCategoryDocument } from "../types/rehaplanCategory.types";

const rehabPlanCategorySchema = new mongoose.Schema<TRehabPlanCategoryDocument>({
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

const RehabPlanCategoryModel = mongoose.models.RehabPlanCategory || mongoose.model<TRehabPlanCategoryDocument>("RehabPlanCategory", rehabPlanCategorySchema);

export default RehabPlanCategoryModel;

