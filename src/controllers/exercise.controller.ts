import { NextFunction, Request, Response } from "express";
import ExerciseModel from "../models/excercise.model";
import ErrorHandler from "../utils/errorHandlerClass";
import { uploadVideoToCloudinary, uploadImageToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl } from "../utils/cloudinaryUpload";

// Add new exercise
export const addExerciseHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, reps, sets, category, tags, bodyPart, difficulty, estimatedDuration } = req.body;

    // Validate required fields
    if (!name || !description || !reps || !sets || !category || !bodyPart) {
      throw new ErrorHandler(400, 'Name, description, reps, sets, category, and body part are required');
    }

    // Check if video file is provided
    if (!req.videoFile) {
      throw new ErrorHandler(400, 'Video file is required');
    }

    // Check if exercise with same name already exists
    const existingExercise = await ExerciseModel.findOne({ name });
    if (existingExercise) {
      throw new ErrorHandler(409, 'Exercise with this name already exists');
    }

    // Upload video to Cloudinary
    const videoUrl = await uploadVideoToCloudinary(req.videoFile);

    // Upload thumbnail if provided, otherwise generate from video
    let thumbnailUrl = '';
    if (req.thumbnailFile) {
      thumbnailUrl = await uploadImageToCloudinary(req.thumbnailFile);
    } else {
      // Generate thumbnail from video (you can implement this later)
      thumbnailUrl = videoUrl.replace('.mp4', '_thumb.jpg'); // Placeholder
    }

    const newExercise = new ExerciseModel({
      name,
      description,
      videoUrl,
      thumbnailUrl,
      reps,
      sets,
      category,
      tags: tags || [],
      bodyPart,
      difficulty: difficulty || "Beginner",
      estimatedDuration
    });

    await newExercise.save();

    res.status(201).json({
      success: true,
      message: 'Exercise added successfully',
      data: newExercise
    });

  } catch (error) {
    console.error('addExerciseHandler error', error);
    next(error);
  }
};

// Update exercise
export const updateExerciseHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      throw new ErrorHandler(400, 'Exercise ID is required');
    }

    // Check if exercise exists
    const existingExercise = await ExerciseModel.findById(id);
    if (!existingExercise) {
      throw new ErrorHandler(404, 'Exercise not found');
    }

    // If name is being updated, check for duplicates
    if (updateData.name && updateData.name !== existingExercise.name) {
      const duplicateExercise = await ExerciseModel.findOne({ name: updateData.name });
      if (duplicateExercise) {
        throw new ErrorHandler(409, 'Exercise with this name already exists');
      }
    }

    // Handle file uploads if provided
    if (req.videoFile) {
      // Delete old video from Cloudinary
      if (existingExercise.videoUrl) {
        const publicId = extractPublicIdFromUrl(existingExercise.videoUrl);
        if (publicId) {
          await deleteFromCloudinary(publicId, 'video');
        }
      }

      // Upload new video
      const videoUrl = await uploadVideoToCloudinary(req.videoFile);
      updateData.videoUrl = videoUrl;
    }

    if (req.thumbnailFile) {
      // Delete old thumbnail from Cloudinary
      if (existingExercise.thumbnailUrl) {
        const publicId = extractPublicIdFromUrl(existingExercise.thumbnailUrl);
        if (publicId) {
          await deleteFromCloudinary(publicId, 'image');
        }
      }

      // Upload new thumbnail
      const thumbnailUrl = await uploadImageToCloudinary(req.thumbnailFile);
      updateData.thumbnailUrl = thumbnailUrl;
    }

    const updatedExercise = await ExerciseModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Exercise updated successfully',
      data: updatedExercise
    });

  } catch (error) {
    console.error('updateExerciseHandler error', error);
    next(error);
  }
};

// Delete exercise
export const deleteExerciseHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ErrorHandler(400, 'Exercise ID is required');
    }

    const exercise = await ExerciseModel.findById(id);
    if (!exercise) {
      throw new ErrorHandler(404, 'Exercise not found');
    }

    // Delete files from Cloudinary
    if (exercise.videoUrl) {
      const videoPublicId = extractPublicIdFromUrl(exercise.videoUrl);
      if (videoPublicId) {
        await deleteFromCloudinary(videoPublicId, 'video');
      }
    }

    if (exercise.thumbnailUrl) {
      const thumbnailPublicId = extractPublicIdFromUrl(exercise.thumbnailUrl);
      if (thumbnailPublicId) {
        await deleteFromCloudinary(thumbnailPublicId, 'image');
      }
    }

    // Delete exercise from database
    await ExerciseModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Exercise deleted successfully'
    });

  } catch (error) {
    console.error('deleteExerciseHandler error', error);
    next(error);
  }
};

// Get all exercises with filtering and search
export const getAllExercisesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      search, 
      category, 
      tags, 
      bodyPart, 
      phase, 
      type,
      difficulty,
      active,
      page = 1, 
      limit = 20 
    } = req.query;

    const query: any = {};

    // Text search
    if (search) {
      query.$text = { $search: search as string };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Tags filter (can be multiple tags)
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    // Body part filter
    if (bodyPart) {
      query.bodyPart = bodyPart;
    }

    // Phase filter
    if (phase) {
      const phaseStr = Array.isArray(phase) ? phase[0] : phase;
      query.tags = { $in: [new RegExp(phaseStr as string, 'i')] };
    }

    // Type filter (e.g., Mobility, Strengthening, Advanced Rehab)
    if (type) {
      query.category = { $regex: type, $options: 'i' };
    }

    // Difficulty filter
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Active filter
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const exercises = await ExerciseModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ExerciseModel.countDocuments(query);

    res.status(200).json({
      success: true,
      data: exercises,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });

  } catch (error) {
    console.error('getAllExercisesHandler error', error);
    next(error);
  }
};

// Get exercise by ID
export const getExerciseByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ErrorHandler(400, 'Exercise ID is required');
    }

    const exercise = await ExerciseModel.findById(id);
    if (!exercise) {
      throw new ErrorHandler(404, 'Exercise not found');
    }

    res.status(200).json({
      success: true,
      data: exercise
    });

  } catch (error) {
    console.error('getExerciseByIdHandler error', error);
    next(error);
  }
};

// Get all categories
export const getAllCategoriesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await ExerciseModel.distinct('category');
    
    res.status(200).json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('getAllCategoriesHandler error', error);
    next(error);
  }
};

// Get all tags
export const getAllTagsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tags = await ExerciseModel.distinct('tags');
    
    res.status(200).json({
      success: true,
      data: tags
    });

  } catch (error) {
    console.error('getAllTagsHandler error', error);
    next(error);
  }
};

// Get exercises by category
export const getExercisesByCategoryHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!category) {
      throw new ErrorHandler(400, 'Category is required');
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const exercises = await ExerciseModel.find({ category })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ExerciseModel.countDocuments({ category });

    res.status(200).json({
      success: true,
      data: exercises,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });

  } catch (error) {
    console.error('getExercisesByCategoryHandler error', error);
    next(error);
  }
};

// Search exercises
export const searchExercisesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      throw new ErrorHandler(400, 'Search query is required');
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const exercises = await ExerciseModel.find(
      { $text: { $search: q as string } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(Number(limit));

    const total = await ExerciseModel.countDocuments({ $text: { $search: q as string } });

    res.status(200).json({
      success: true,
      data: exercises,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });

  } catch (error) {
    console.error('searchExercisesHandler error', error);
    next(error);
  }
};

// Get exercises for dashboard (active exercises only)
export const getDashboardExercisesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bodyPart, category, tags, limit = 10 } = req.query;

    const query: any = { isActive: true };

    if (bodyPart) {
      query.bodyPart = bodyPart;
    }

    if (category) {
      query.category = category;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    const exercises = await ExerciseModel.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: exercises
    });

  } catch (error) {
    console.error('getDashboardExercisesHandler error', error);
    next(error);
  }
};

// Get all body parts
export const getAllBodyPartsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bodyParts = await ExerciseModel.distinct('bodyPart');
    
    res.status(200).json({
      success: true,
      data: bodyParts
    });

  } catch (error) {
    console.error('getAllBodyPartsHandler error', error);
    next(error);
  }
};

// Get exercises by body part
export const getExercisesByBodyPartHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bodyPart } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!bodyPart) {
      throw new ErrorHandler(400, 'Body part is required');
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const exercises = await ExerciseModel.find({ bodyPart, isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ExerciseModel.countDocuments({ bodyPart, isActive: true });

    res.status(200).json({
      success: true,
      data: exercises,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });

  } catch (error) {
    console.error('getExercisesByBodyPartHandler error', error);
    next(error);
  }
}; 