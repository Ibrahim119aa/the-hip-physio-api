import { NextFunction, Request, Response } from "express";
import ExerciseCategoryModel from "../models/exerciseCategory.model";
import { ExerciseCategoryParamsSchema, exerciseCategorySchema, ExerciseCategoryUpdateSchema, TExerciseCategoryRequest, TExerciseCategoryUpdateRequest } from "../validationSchemas/exerciseCategory.schema";
import ErrorHandler from "../utils/errorHandlerClass";
import { TExerciseParams } from "../validationSchemas/excercise.schema";

// Add a category
export const addExerciseCategoryHandler = async (
  req: Request<{}, {}, TExerciseCategoryRequest>, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const parsed = exerciseCategorySchema.safeParse(req.body);

    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map(issue => issue.message).join(', ');
      throw new ErrorHandler(400, errorMessages);
    }

    const { title, description } = parsed.data
    const existingCategory = await ExerciseCategoryModel.findOne({ 
      title: { $regex: new RegExp(`^${title}$`, 'i') } 
    });

    if(existingCategory) throw new ErrorHandler(409,'Exercise category already exists');
    
    const newCategory = new ExerciseCategoryModel({ title, description });
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
export const deleteExerciseCategoryHandler = async ( 
  req: Request<TExerciseParams, {}, {}>,
  res: Response, 
  next: NextFunction
) => {
  try {
    
    const parsedParams = ExerciseCategoryParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      const errorMessages = parsedParams.error.issues.map(issue => issue.message).join(', ');
      throw new ErrorHandler(400, errorMessages);
    }

    const { id } = parsedParams.data;

    const category = await ExerciseCategoryModel.findByIdAndDelete(id);
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
export const updateExerciseCategoryHandler = async (
  req: Request<TExerciseParams, {}, TExerciseCategoryUpdateRequest>,
  res: Response,
  next: NextFunction
) => {
  try {

    const parsedParams = ExerciseCategoryParamsSchema.safeParse(req.params);
    const parsedBody = ExerciseCategoryUpdateSchema.safeParse(req.body);
    
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

   const categoryToUpdate = await ExerciseCategoryModel.findById(id);
    if (!categoryToUpdate) {
      throw new ErrorHandler(404, 'Exercise category not found');
    }

    if (updateData.title) {
      // Check if another category (excluding the current one) already has this title (case-insensitive)
      const existingCategory = await ExerciseCategoryModel.findOne({
        _id: { $ne: id }, // Ignore the current category we're updating
        title: { $regex: new RegExp(`^${updateData.title}$`, 'i') } // Exact match, case-insensitive
      });

      if (existingCategory) {
        throw new ErrorHandler(409, 'Exercise category with this title already exists');
      }
    }

    // Perform the update (only updates provided fields)
    const updatedCategory = await ExerciseCategoryModel.findByIdAndUpdate(
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
export const getAllCategoriesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await ExerciseCategoryModel.find();
    
    res.status(200).json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('getAllCategoriesHandler error', error);
    next(error);
  }
};
