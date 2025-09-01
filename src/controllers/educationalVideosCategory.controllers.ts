import { Request, Response, NextFunction } from "express";
import EducationalVideosCategoryModel from "../models/educationalVideosCategory.model";
import ErrorHandler from "../utils/errorHandlerClass";
import { CreateEducationalVideoCategorySchema, EducationalVideoCategoryParamsSchema, TCreateEducationalVideoCategoryRequest, TEducationalVideoCategoryParams, TUpdateEducationalVideoCategoryRequest, UpdateEducationalVideoCategorySchema } from "../validationSchemas/educationalVideoCategories.schema";


// ----- Create -----
export const createEducationalVideoCategoryHandler = async (
  req: Request<{}, {}, TCreateEducationalVideoCategoryRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsedBody = CreateEducationalVideoCategorySchema.safeParse(req.body);

    if(!parsedBody.success) {
      const errorMessages= parsedBody.error.issues.map((issue) => issue.message).join(", ");
      throw new ErrorHandler(400, errorMessages);
    }

    const { title, description } = parsedBody.data;

    // Case-insensitive unique title check
    const exists = await EducationalVideosCategoryModel.findOne({
      title: { $regex: new RegExp(`^${title}$`, "i") },
    });
    if (exists) throw new ErrorHandler(400, "Category already exists");

    const newCategory = await EducationalVideosCategoryModel.create({
      title,
      description: description ?? "",
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category: newCategory,
    });
  } catch (error) {
    console.error("createEducationalVideoCategory Error:", error);
    next(error);
  }
};

// ----- Read: All -----
export const getAllEducationalVideoCategoriesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await EducationalVideosCategoryModel.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("getAllEducationalVideoCategories Error:", error);
    next(error);
  }
};

// ----- Read: One by ID -----
export const getEducationalVideoCategoryByIdHandler = async (
  req: Request<TEducationalVideoCategoryParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsedParams = EducationalVideoCategoryParamsSchema.safeParse(req.params);
    
    if (!parsedParams.success) {
      const errorMessages= parsedParams.error.issues.map((issue) => issue.message).join(", ");
      throw new ErrorHandler(400, errorMessages);
    };

    const { id } = parsedParams.data;
    const category = await EducationalVideosCategoryModel.findById(id);
    if (!category) throw new ErrorHandler(404, "Category not found");

    res.status(200).json({ success: true, category });
  } catch (error) {
    console.error("getEducationalVideoCategoryById Error:", error);
    next(error);
  }
};

// ----- Update (PUT) -----
export const updateEducationalVideoCategoryHandler = async (
  req: Request<TEducationalVideoCategoryParams, {}, TUpdateEducationalVideoCategoryRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsedParams = EducationalVideoCategoryParamsSchema.safeParse(req.params);

    if (!parsedParams.success){
      const errorMessages= parsedParams.error.issues.map((issue) => issue.message).join(", ");
      throw new ErrorHandler(400, errorMessages);
    };

    const parsedBody = UpdateEducationalVideoCategorySchema.safeParse(req.body);
    if (!parsedBody.success){
      const errorMessages= parsedBody.error.issues.map((issue) => issue.message).join(", ");
      throw new ErrorHandler(400, errorMessages);
    }

    const { id } = parsedParams.data;
    const { title, description } = parsedBody.data;

    const category = await EducationalVideosCategoryModel.findById(id);
    if (!category) throw new ErrorHandler(404, "Category not found");

    // If title changing, check uniqueness (case-insensitive)
    if (typeof title === "string" && title.length > 0) {
      const duplicate = await EducationalVideosCategoryModel.findOne({
        _id: { $ne: id },
        title: { $regex: new RegExp(`^${title}$`, "i") },
      });
      if (duplicate) throw new ErrorHandler(400, "Another category with this title already exists");
      category.title = title;
    }

    if (typeof description === "string") {
      category.description = description;
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("updateEducationalVideoCategory Error:", error);
    next(error);
  }
};

// ----- Delete -----
export const deleteEducationalVideoCategoryHandler = async (
  req: Request<TEducationalVideoCategoryParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsedParams = EducationalVideoCategoryParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      const errorMessages= parsedParams.error.issues.map((issue) => issue.message).join(", ");
      throw new ErrorHandler(400, errorMessages);
    }

    const { id } = parsedParams.data;
    const category = await EducationalVideosCategoryModel.findByIdAndDelete(id);
    if (!category) throw new ErrorHandler(404, "Category not found");

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      category,
    });
  } catch (error) {
    console.error("deleteEducationalVideoCategory Error:", error);
    next(error);
  }
};

