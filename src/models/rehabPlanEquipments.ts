import mongoose from "mongoose";
import { TRehabPlanCategoryDocument } from "../types/rehaplanCategory.types";

const rehabPlanEquipmentSchema = new mongoose.Schema<TRehabPlanCategoryDocument>({
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

const RehabPlanEquipmentModel = mongoose.models.RehabPlanEquipment || mongoose.model<TRehabPlanCategoryDocument>("RehabPlanEquipment", rehabPlanEquipmentSchema);

export default RehabPlanEquipmentModel;

