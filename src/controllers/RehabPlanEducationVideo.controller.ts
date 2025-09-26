import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandlerClass";
import { CreateRehabPlanEducationalVideoSchema, TCreateRehabPlanEducationalVideoRequest } from "../validationSchemas/rehabPlanEducationVideo.schema";
import RehabPlanEducationalVideoModel from "../models/RehabPlanEducationalVideo.model";
import { success } from "zod";

// Add a category
export const addRehabPlanEducationalVideoHandler = async (
    req: Request<{}, {}, TCreateRehabPlanEducationalVideoRequest>,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log("this is request body", req.body);
        const parsed = CreateRehabPlanEducationalVideoSchema.safeParse(req.body);

        if (!parsed.success) {
            const errorMessages = parsed.error.issues.map((issue: any) => issue.message).join(', ');
            throw new ErrorHandler(400, errorMessages);
        }

        const { planId, videoId } = parsed.data
        const newCategory = new RehabPlanEducationalVideoModel({ planId, video: videoId });
        await newCategory.save();

        res.status(201).json({
            success: true,
            message: "Educational Video added to Rehab Plan successfully",
        });

    } catch (error) {
        console.error('addRehabPlanEquipmentHandler error', error);
        next(error)
    }
}
export const getRehabPlanEducationalVideoById = async (
    req: Request<{ planId: string; }>,
    res: Response,
    next: NextFunction
) => {
    try {

        const { planId } = req.params;

        if (!planId) {
            throw new ErrorHandler(400, 'Plan ID is required');
        }
        const rehabPlanVideos = await RehabPlanEducationalVideoModel.findOne({ planId })
            .populate("video");
        res.status(200).json(
            {
                success: true,
                data: rehabPlanVideos
            }
        )

    } catch (error) {
        console.error('getExerciseBySessionId error:', error);
        next(error);
    }
}

// update category
