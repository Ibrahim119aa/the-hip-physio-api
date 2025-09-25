import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandlerClass";
import { TRehabPlanCategory } from "../types/rehaplanCategory.types";
import { rehabPlanCategoryParamsSchema, rehabPlanCategorySchema, TRehabPlanCategoryParamRequest, TRehabPlanCategoryUpdateRequest } from "../validationSchemas/rehabPlabCategory.schema";
import RehabPlanEquipmentModel from "../models/rehabPlanEquipments";

// Add a category
export const addRehabPlanEquipmentHandler = async (
    req: Request<{}, {}, TRehabPlanCategory>,
    res: Response,
    next: NextFunction
) => {
    try {
        const parsed = rehabPlanCategorySchema.safeParse(req.body);

        if (!parsed.success) {
            const errorMessages = parsed.error.issues.map((issue: any) => issue.message).join(', ');
            throw new ErrorHandler(400, errorMessages);
        }

        const { title, description } = parsed.data
        const existingCategory = await RehabPlanEquipmentModel.findOne({
            title: { $regex: new RegExp(`^${title}$`, 'i') }
        });

        if (existingCategory) throw new ErrorHandler(409, 'Equipments already exists');

        const newCategory = new RehabPlanEquipmentModel({ title, description });
        await newCategory.save();

        res.status(201).json({
            success: true,
            message: 'Equipments added successfully',
        });

    } catch (error) {
        console.error('addRehabPlanEquipmentHandler error', error);
        next(error)
    }
}

// delete category
export const deleteRehabPlanEquipmentHandler = async (
    req: Request<TRehabPlanCategoryParamRequest, {}, {}>,
    res: Response,
    next: NextFunction
) => {
    try {

        const parsedParams = rehabPlanCategoryParamsSchema.safeParse(req.params);
        if (!parsedParams.success) {
            const errorMessages = parsedParams.error.issues.map((issue: any) => issue.message).join(', ');
            throw new ErrorHandler(400, errorMessages);
        }

        const { id } = parsedParams.data;

        const category = await RehabPlanEquipmentModel.findByIdAndDelete(id);
        if (!category) throw new ErrorHandler(404, 'Equipments not found');

        res.status(200).json({
            success: true,
            message: 'Equipments deleted successfully',
        });

    } catch (error) {
        console.error('deleteRehabPlanEquipmentHandler error', error);
        next(error);
    }
}

// update category
export const updateRehabPlanEquipmentHandler = async (
    req: Request<TRehabPlanCategoryParamRequest, {}, TRehabPlanCategoryUpdateRequest>,
    res: Response,
    next: NextFunction
) => {
    try {

        const parsedParams = rehabPlanCategoryParamsSchema.safeParse(req.params);
        const parsedBody = rehabPlanCategorySchema.safeParse(req.body);

        if (!parsedParams.success) {
            const errorMessages = parsedParams.error.issues.map(issue => issue.message).join(', ');
            throw new ErrorHandler(400, errorMessages);
        }

        if (!parsedBody.success) {
            const errorMessages = parsedBody.error.issues.map(issue => issue.message).join(', ');
            throw new ErrorHandler(400, errorMessages);
        }

        const { id } = parsedParams.data;
        const updateData = parsedBody.data;

        const categoryToUpdate = await RehabPlanEquipmentModel.findById(id);
        if (!categoryToUpdate) {
            throw new ErrorHandler(404, 'Equipments not found');
        }

        if (updateData.title) {
            // Check if another category (excluding the current one) already has this title (case-insensitive)
            const existingCategory = await RehabPlanEquipmentModel.findOne({
                _id: { $ne: id }, // Ignore the current category we're updating
                title: { $regex: new RegExp(`^${updateData.title}$`, 'i') } // Exact match, case-insensitive
            });

            if (existingCategory) {
                throw new ErrorHandler(409, 'Equipments with this title already exists');
            }
        }

        // Perform the update (only updates provided fields)
        const updatedCategory = await RehabPlanEquipmentModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Equipments updated successfully',
            data: updatedCategory
        });

    } catch (error) {
        console.error('updateExerciseCategoryHandler error', error);
        next(error);
    }
}

// Get all categories
export const getAllRehabPlabEqupmentsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const equipments = await RehabPlanEquipmentModel.find();

        if (!equipments || equipments.length === 0) {
            throw new ErrorHandler(404, 'No Equipments found');
        }

        res.status(200).json({
            success: true,
            message: 'Equipments fetched successfully',
            equipments
        });

    } catch (error) {
        console.error('getAllRehabPlabEqupmentsHandler error', error);
        next(error);
    }
};
