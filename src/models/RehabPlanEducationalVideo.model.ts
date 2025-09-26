import mongoose from "mongoose";

const rehabPlanEducationalVideoSchema = new mongoose.Schema({
    // Admin-filled fields (required at creation)

    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RehabPlan',
        required: true
    },
    video: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EducationalVideo'
    }],

}, { timestamps: true });

const RehabPlanEducationalVideoModel = mongoose.models.RehabPlanEducationalVideo || mongoose.model('RehabPlanEducationalVideo', rehabPlanEducationalVideoSchema);

export default RehabPlanEducationalVideoModel;