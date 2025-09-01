import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandlerClass";
import { TRehabPlanCategory } from "../types/rehaplanCategory.types";
import { rehabPlanCategoryParamsSchema, rehabPlanCategorySchema, TRehabPlanCategoryParamRequest, TRehabPlanCategoryUpdateRequest } from "../validationSchemas/rehabPlabCategory.schema";
import RehabPlanCategoryModel from "../models/rehabPlanCategory.model";

// Add a category
export const addRehabPlanCategoryHandler = async (
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
    const existingCategory = await RehabPlanCategoryModel.findOne({ 
      title: { $regex: new RegExp(`^${title}$`, 'i') } 
    });

    if(existingCategory) throw new ErrorHandler(409,'Exercise category already exists');
    
    const newCategory = new RehabPlanCategoryModel({ title, description });
    await newCategory.save();

    res.status(201).json({
      success: true,
      message: 'Exercise category added successfully',
    });

  } catch (error) {
    console.error('addExerciseCaegoryHandler error', error);
    next(error)
  }
}

// delete category
export const deleteRehabPlanCategoryHandler = async ( 
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

    const category = await RehabPlanCategoryModel.findByIdAndDelete(id);
    if (!category) throw new ErrorHandler(404, 'Exercise category not found');
    
    res.status(200).json({
      success: true,
      message: 'Exercise category deleted successfully',
    });

  } catch (error) {
    console.error('deleteExerciseCategoryHandler error', error);
    next(error);
  }
}

// update category
export const updateRehabPlanCategoryHandler = async (
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

   const categoryToUpdate = await RehabPlanCategoryModel.findById(id);
    if (!categoryToUpdate) {
      throw new ErrorHandler(404, 'Exercise category not found');
    }

    if (updateData.title) {
      // Check if another category (excluding the current one) already has this title (case-insensitive)
      const existingCategory = await RehabPlanCategoryModel.findOne({
        _id: { $ne: id }, // Ignore the current category we're updating
        title: { $regex: new RegExp(`^${updateData.title}$`, 'i') } // Exact match, case-insensitive
      });

      if (existingCategory) {
        throw new ErrorHandler(409, 'Exercise category with this title already exists');
      }
    }

    // Perform the update (only updates provided fields)
    const updatedCategory = await RehabPlanCategoryModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Exercise category updated successfully',
      data: updatedCategory
    });

  } catch (error) {
    console.error('updateExerciseCategoryHandler error', error);
    next(error);
  }
}

// Get all categories
export const getAllRehabPlabCategoriesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await RehabPlanCategoryModel.find();
    
    if (!categories || categories.length === 0) {
      throw new ErrorHandler(404, 'No exercise categories found');
    }
    
    res.status(200).json({
      success: true,
      message: 'Categories fetched successfully',
      categories
    });

  } catch (error) {
    console.error('getAllCategoriesHandler error', error);
    next(error);
  }
};
