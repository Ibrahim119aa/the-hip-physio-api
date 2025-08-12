import { NextFunction, Response, Request} from "express";
import EducationalVideosCategoryModel from "../models/educationalVideosCategory.model";
import ErrorHandler from "../utils/errorHandlerClass";

export const createEducationalVideoCategoryHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description } = req.body;

    const existingCategory = await EducationalVideosCategoryModel.findOne({ 
      title: { 
        $regex: new RegExp(`^${title}$`, 'i')
      } 
    });

    if (existingCategory) throw new ErrorHandler(400, 'Category already exists')

    // Create a new category
    const newCategory = new EducationalVideosCategoryModel({ title, description });
    await newCategory.save();

    res.status(201).json({
      success: true,
      category: newCategory,
      message: 'Category created successfully', 
    });
  } catch (error) {
    console.error('createEducationalVideoCategory Error:', error);
    next(error)
  }
}

export const getAllEducationalVideoCategoriesHandler = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await EducationalVideosCategoryModel.find();

    res.status(200).json({
      success: true,
      categories,
    });

  } catch (error) {
    console.error('getAllEducationalVideoCategories Error:', error);
    next(error)
  }
}