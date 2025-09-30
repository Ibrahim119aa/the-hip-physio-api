import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandlerClass";
import { CreateRehabPlanEducationalVideoSchema, TCreateRehabPlanEducationalVideoRequest } from "../validationSchemas/rehabPlanEducationVideo.schema";
import RehabPlanEducationalVideoModel from "../models/RehabPlanEducationalVideo.model";
import { success } from "zod";
import UserModel from "../models/user.model";
import { TUserDocument } from "../types/user.type";
import jwt from "jsonwebtoken";
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
export const getRehabPlanEducationalVideosByUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // 🔹 1) Extract token
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return res.status(401).json({ message: "Authorization header missing" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Token missing" });
        }


        // 🔹 2) Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as { userId: string };


        const userId = decoded.userId;

        // 🔹 3) Get the user and purchased plans
        const user = await UserModel.findById(userId).lean<TUserDocument>();
        if (!user) throw new ErrorHandler(404, "User not found");

        if (!user.purchasedPlans || user.purchasedPlans.length === 0) {
            return res.status(200).json({
                success: true,
                message: "User has no purchased plans",
                data: [],
            });
        }

        // Helper to normalize IDs
        const idOf = (v: any) =>
            v && typeof v === "object" ? v._id ?? v.id ?? v : v;
        const idStr = (v: any) => String(idOf(v));

        // 🔹 4) Fetch educational videos for each purchased plan
        const results: any[] = [];


        for (const purchasedPlan of user.purchasedPlans) {
            const planId = idStr(purchasedPlan);


            const rehabPlanVideos = await RehabPlanEducationalVideoModel.findOne({
                planId,
            }).populate("video");
            if (rehabPlanVideos) {
                results.push(rehabPlanVideos);
            }
        }


        const allVideos = results.flatMap((r) =>
            Array.isArray(r.video) ? r.video : [r.video]
        );


        return res.status(200).json({
            success: true,
            message: "Educational videos across all purchased plans",
            data: allVideos,
        });
    } catch (error) {
        console.error("getRehabPlanEducationalVideos error:", error);
        next(error);
    }
};

// update category
