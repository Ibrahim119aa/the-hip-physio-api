import { NextFunction, Request, Response } from "express";
import ExerciseModel from "../models/excercise.model";
import ErrorHandler from "../utils/errorHandlerClass";
import { uploadVideoToCloudinary } from "../utils/cloudinaryUploads/uploadVideoToCloudinary";
import { uploadImageToCloudinary } from "../utils/cloudinaryUploads/uploadImageToCloudinary";
import { extractPublicIdFromUrl, testPublicIdExtraction } from "../utils/cloudinaryUploads/extractPublicIdFromUrl";
import { deleteFromCloudinary } from "../utils/cloudinaryUploads/deleteFromCloudinary";
import mongoose from "mongoose";

// Add new exercise with atomicity
export const addExerciseHandler = async (req: Request, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  let uploadedVideoUrl = '';
  let uploadedThumbnailUrl = '';
  
  try {
    console.log('Starting addExerciseHandler...');
    const { name, description, reps, sets, category, tags, bodyPart, difficulty, estimatedDuration } = req.body;

    // Validate required fields
    if (!name || !description || !reps || !sets || !category || !bodyPart) {
      throw new ErrorHandler(400, 'Name, description, reps, sets, category, and body part are required');
    }

    // Check if video file is provided
    if (!req.videoFile) {
      throw new ErrorHandler(400, 'Video file is required');
    }

    console.log('Video file received:', {
      filename: req.videoFile.originalname,
      size: req.videoFile.size,
      mimetype: req.videoFile.mimetype
    });

    // Check if exercise with same name already exists
    const existingExercise = await ExerciseModel.findOne({ name }).session(session);
    if (existingExercise) {
      throw new ErrorHandler(409, 'Exercise with this name already exists');
    }

    console.log('Uploading video to Cloudinary...');
    // Upload video to Cloudinary
    uploadedVideoUrl = await uploadVideoToCloudinary(req.videoFile);
    console.log('Video uploaded successfully:', uploadedVideoUrl);

    // Upload thumbnail if provided, otherwise generate from video
    if (req.thumbnailFile) {
      console.log('Uploading thumbnail to Cloudinary...');
      uploadedThumbnailUrl = await uploadImageToCloudinary(req.thumbnailFile);
      console.log('Thumbnail uploaded successfully:', uploadedThumbnailUrl);
    } else {
      // Generate thumbnail from video (you can implement this later)
      uploadedThumbnailUrl = uploadedVideoUrl.replace('.mp4', '_thumb.jpg'); // Placeholder
    }

    const newExercise = new ExerciseModel({
      name,
      description,
      videoUrl: uploadedVideoUrl,
      thumbnailUrl: uploadedThumbnailUrl,
      reps,
      sets,
      category,
      tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
      bodyPart,
      difficulty: difficulty || "Beginner",
      estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
      createdBy: req.userId 
    });

    console.log('Saving exercise to database...');
    await newExercise.save({ session });
    console.log('Exercise saved successfully');

    // Commit the transaction
    await session.commitTransaction();
    console.log('Transaction committed successfully');

    res.status(201).json({
      success: true,
      message: 'Exercise added successfully',
      data: newExercise
    });

  } catch (error) {
    console.error('addExerciseHandler error:', error);
    
    // Abort the transaction
    await session.abortTransaction();
    console.log('Transaction aborted due to error');
    
    // Clean up uploaded files if any files were uploaded (regardless of error type)
    if (uploadedVideoUrl || uploadedThumbnailUrl) {
      console.log('Cleaning up uploaded files due to error...');
      
      // Test public ID extraction
      console.log('Testing public ID extraction:');
      testPublicIdExtraction();
      
      try {
        // Always clean up video file if it was uploaded
        if (uploadedVideoUrl) {
          console.log('Attempting to clean up video file:', uploadedVideoUrl);
          const videoPublicId = extractPublicIdFromUrl(uploadedVideoUrl);
          if (videoPublicId) {
            await deleteFromCloudinary(videoPublicId, 'video');
            console.log('Successfully cleaned up video file');
          } else {
            console.log('Could not extract public ID from video URL');
          }
        }
        
        // Clean up thumbnail file if it was uploaded (not a placeholder)
        if (uploadedThumbnailUrl && uploadedThumbnailUrl !== uploadedVideoUrl.replace('.mp4', '_thumb.jpg')) {
          console.log('Attempting to clean up thumbnail file:', uploadedThumbnailUrl);
          const thumbnailPublicId = extractPublicIdFromUrl(uploadedThumbnailUrl);
          if (thumbnailPublicId) {
            await deleteFromCloudinary(thumbnailPublicId, 'image');
            console.log('Successfully cleaned up thumbnail file');
          } else {
            console.log('Could not extract public ID from thumbnail URL');
          }
        }
      } catch (cleanupError) {
        console.error('Error cleaning up files:', cleanupError);
        // Don't throw cleanup errors as they're not critical
      }
    } else {
      console.log('No files to clean up');
    }
    
    next(error);
  } finally {
    // End the session
    session.endSession();
  }
};

// Update exercise
export const updateExerciseHandler = async (req: Request, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  session.startTransaction();
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
    if (!updatedExercise) throw new ErrorHandler(404, 'Exercise not updated');
    
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Exercise updated successfully',
      data: updatedExercise
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('updateExerciseHandler error', error);
    next(error);
  }
  finally {
    session.endSession();
  }
};

// Delete exercise
export const deleteExerciseHandler = async (req: Request, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;

    if (!id) {
      throw new ErrorHandler(400, 'Exercise ID is required');
    }

    const exercise = await ExerciseModel.findById(id).session(session);
    if (!exercise) throw new ErrorHandler(404, 'Exercise not found');

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
    const excerciseDeleted = await ExerciseModel.findByIdAndDelete(id).session(session);
    if(!excerciseDeleted) throw new ErrorHandler(404, 'Exercise not found');

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Exercise deleted successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('deleteExerciseHandler error', error);
    next(error);
  } finally {
    session.endSession();
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
    
    if (!q || typeof q !== 'string') {
      throw new ErrorHandler(400, 'Search query is required');
    }
    
    const sanitizeQuery = (input: string) => input.replace(/["]/g, '');
    const cleanQuery = sanitizeQuery(q);
    const processedQuery = cleanQuery.includes(' ') ? `"${cleanQuery}"` : cleanQuery;
    
    const skip = (Number(page) - 1) * Number(limit);

    const exercises = await ExerciseModel.find(
      { $text: { $search: processedQuery } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(Number(limit));

    const total = await ExerciseModel.countDocuments({ $text: { $search: processedQuery } });

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