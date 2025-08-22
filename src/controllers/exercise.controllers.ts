import { NextFunction, Request, Response } from "express";

import ErrorHandler from "../utils/errorHandlerClass";
import { uploadVideoToCloudinary } from "../utils/cloudinaryUploads/uploadVideoToCloudinary";
import { uploadExerciseThumbnailToCloudinary } from "../utils/cloudinaryUploads/uploadExerciseThumbnailToCloudinary";
import { extractPublicIdFromUrl, testPublicIdExtraction } from "../utils/cloudinaryUploads/extractPublicIdFromUrl";
import { deleteFromCloudinary } from "../utils/cloudinaryUploads/deleteFromCloudinary";
import mongoose from "mongoose";
import ExerciseModel from "../models/exercise.model";
import { createExerciseSchema, exerciseCategoryParamSchema, ExerciseParamsSchema, TExerciseParams, TExerciseRequest, TUpdateExerciseRequest, updateExerciseSchema } from "../validationSchemas/excercise.schema";

  type TUploadedVideoUrl = {
    url: string;
    duration: number;
  };

  // Add new exercise with atomicity
  export const addExerciseHandler = async (
    req: Request<{}, {}, TExerciseRequest>, 
    res: Response, 
    next: NextFunction
  ) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    let uploadedVideoUrl: TUploadedVideoUrl | null = null;
    let uploadedThumbnailUrl = '';
    
    try {
      console.log('Starting addExerciseHandler...');
      const parsedBody = createExerciseSchema.safeParse(req.body);
      
      if(!parsedBody.success) {
        const errorMessages = parsedBody.error.issues.map((issue: any) => issue.message).join(', ');
        throw new ErrorHandler(400, errorMessages);
      } 

    // Check if video file is provided
    if (!req.videoFile) {
      throw new ErrorHandler(400, 'Video file is required');
    }

    // console.log('Video file received:', {
    //   filename: req.videoFile.originalname,
    //   size: req.videoFile.size,
    //   mimetype: req.videoFile.mimetype
    // });

    // Check if exercise with same name already exists
    const existingExercise = await ExerciseModel.findOne({ 
      name: { $regex: new RegExp(`^${parsedBody.data.name}$`,'i')}
    }).session(session);
    
    if (existingExercise) {
      throw new ErrorHandler(409, 'Exercise with this name already exists');
    }

    console.log('Uploading video to Cloudinary...');
    // Upload video to Cloudinary
    uploadedVideoUrl = await uploadVideoToCloudinary(req.videoFile);

    // Upload thumbnail if provided, otherwise generate from video
    if (req.thumbnailFile) {
      console.log('Uploading thumbnail to Cloudinary...');
      uploadedThumbnailUrl = await uploadExerciseThumbnailToCloudinary(req.thumbnailFile);
    } else {
      console.log('Generating thumbnail from video...');;
      
      // Generate thumbnail from video (you can implement this later)
      uploadedThumbnailUrl = uploadedVideoUrl.url
        .replace('/upload/', '/upload/so_2/')
        .replace('.mp4', '.jpg');
      // uploadedThumbnailUrl = uploadedVideoUrl.url.replace('.mp4', '_thumb.jpg'); // Placeholder
    }

    const newExercise = new ExerciseModel({
      name: parsedBody.data.name,
      description: parsedBody.data.description,
      videoUrl: uploadedVideoUrl.url,
      thumbnailUrl: uploadedThumbnailUrl,
      reps: parsedBody.data.reps,
      sets: parsedBody.data.sets,
      category: new mongoose.Types.ObjectId(parsedBody.data.category),
      categoryName: parsedBody.data.categoryName,
      tags: parsedBody.data.tags ? parsedBody.data.tags.split(',').map((tag: string) => tag.trim()) : [],
      bodyPart: parsedBody.data.bodyPart,
      difficulty: parsedBody.data.difficulty,
      estimatedDuration: uploadedVideoUrl.duration,
      createdBy: req.userId 
    });

    // console.log('Saving exercise to database...');
    await newExercise.save({ session });
    // console.log('Exercise saved successfully');

    // Commit the transaction
    await session.commitTransaction();
    // console.log('Transaction committed successfully');

    res.status(201).json({
      success: true,
      message: 'Exercise added successfully',
      data: newExercise
    });

  } catch (error) {
    console.error('addExerciseHandler error:', error);
    
    // Abort the transaction
    await session.abortTransaction();
    console.error('Transaction aborted due to error');
    
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
          const videoPublicId = extractPublicIdFromUrl(uploadedVideoUrl.url);
          if (videoPublicId) {
            await deleteFromCloudinary(videoPublicId, 'video');
            console.log('Successfully cleaned up video file');
          } else {
            console.log('Could not extract public ID from video URL');
          }
        }
        
        // Clean up thumbnail file if it was uploaded (not a placeholder)
        if (uploadedThumbnailUrl && uploadedThumbnailUrl !== uploadedVideoUrl?.url.replace('.mp4', '_thumb.jpg')) {
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

export const updateExerciseHandler = async (req: Request<TExerciseParams, {}, TUpdateExerciseRequest>, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  console.log('startedupdating');
  
  let uploadedVideoUrl: TUploadedVideoUrl | null = null;
  let uploadedThumbnailUrl = '';

  try {
    const parsedParams = ExerciseParamsSchema.safeParse(req.params);
    const parsedbody = updateExerciseSchema.safeParse(req.body);

    if(!parsedParams.success) {
      const erroMessages = parsedParams.error.issues.map((issue: any) => issue.message).join(", ");
      throw new ErrorHandler(400, erroMessages);
    }

    if(!parsedbody.success) {
      const erroMessages = parsedbody.error.issues.map((issue: any) => issue.message).join(", ");
      throw new ErrorHandler(400, erroMessages);
    }
    
    const { id } = parsedParams.data;
    const updateData = parsedbody.data;

    if (!id) throw new ErrorHandler(400, 'Exercise ID is required');

    const existingExercise = await ExerciseModel.findById(id).session(session);
    if (!existingExercise) throw new ErrorHandler(404, 'Exercise not found');

    // Check for duplicate name
    if (updateData.name && updateData.name !== existingExercise.name) {
      const duplicateExercise = await ExerciseModel.findOne({ name: updateData.name }).session(session);
      if (duplicateExercise) throw new ErrorHandler(409, 'Exercise with this name already exists');
    }

    // Handle video upload (if provided)
    if (req.videoFile) {
      // Delete old video
      if (existingExercise.videoUrl) {
        const publicId = extractPublicIdFromUrl(existingExercise.videoUrl);
        if (publicId) await deleteFromCloudinary(publicId, 'video');
      }

      // Upload new video
      uploadedVideoUrl = await uploadVideoToCloudinary(req.videoFile);
      updateData.videoUrl = uploadedVideoUrl.url;
      updateData.estimatedDuration = uploadedVideoUrl.duration;
    }

    // Handle thumbnail (upload new or generate from video)
    if (req.thumbnailFile) {
      // Delete old thumbnail
      if (existingExercise.thumbnailUrl) {
        const publicId = extractPublicIdFromUrl(existingExercise.thumbnailUrl);
        if (publicId) await deleteFromCloudinary(publicId, 'image');
      }

      // Upload new thumbnail
      uploadedThumbnailUrl = await uploadExerciseThumbnailToCloudinary(req.thumbnailFile);
      updateData.thumbnailUrl = uploadedThumbnailUrl;
    } else if (updateData.videoUrl) {
      // Generate thumbnail from video URL (only if videoUrl is updated)
      updateData.thumbnailUrl = updateData.videoUrl
        .replace('/upload/', '/upload/so_2/')
        .replace('.mp4', '.jpg');
    } // else: keep existing thumbnail

    const updatedExercise = await ExerciseModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true, session }
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
    
    // Cleanup uploaded files on failure
    if (uploadedVideoUrl || uploadedThumbnailUrl) {
      try {
        if (uploadedVideoUrl) {
          const videoPublicId = extractPublicIdFromUrl(uploadedVideoUrl.url);
          if (videoPublicId) await deleteFromCloudinary(videoPublicId, 'video');
        }
        if (uploadedThumbnailUrl) {
          const thumbnailPublicId = extractPublicIdFromUrl(uploadedThumbnailUrl);
          if (thumbnailPublicId) await deleteFromCloudinary(thumbnailPublicId, 'image');
        }
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError);
      }
    }

    next(error);
  } finally {
    session.endSession();
  }
};

// Delete exercise
export const deleteExerciseHandler = async (
  req: Request<{}, {}, TExerciseParams>,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const parsedParams = ExerciseParamsSchema.safeParse(req.params);

    if(!parsedParams.success) {
      const erroMessages = parsedParams.error.issues.map((issue: any) => issue.message).join(", ");
      throw new ErrorHandler(400, erroMessages);
    }

    const { id } = parsedParams.data;

    if (!id) throw new ErrorHandler(400, 'Exercise ID is required');

    const exercise = await ExerciseModel.findById(id).session(session);
    if (!exercise) throw new ErrorHandler(404, 'Exercise not found');

    // Delete associated Cloudinary resources
    const deletePromises: Promise<any>[] = [];

    if (exercise.videoUrl) {
      const videoPublicId = extractPublicIdFromUrl(exercise.videoUrl);
      if (videoPublicId) {
        deletePromises.push(deleteFromCloudinary(videoPublicId, 'video'));
      }
    }

    if (exercise.thumbnailUrl) {
      // Only delete thumbnail if it's not auto-generated (Cloudinary `so_2`)
      const isGenerated = exercise.thumbnailUrl.includes('/upload/so_');
      if (!isGenerated) {
        const thumbPublicId = extractPublicIdFromUrl(exercise.thumbnailUrl);
        if (thumbPublicId) {
          deletePromises.push(deleteFromCloudinary(thumbPublicId, 'image'));
        }
      }
    }

    // Run deletions in parallel
    await Promise.all(deletePromises);

    // Delete the document
    const deleted = await ExerciseModel.findByIdAndDelete(id).session(session);
    if (!deleted) throw new ErrorHandler(500, 'Exercise deletion failed');

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Exercise deleted successfully',
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('deleteExerciseHandler error:', error);
    next(error);
  } finally {
    session.endSession();
  }
};

// Delete exercise
// export const deleteExerciseHandler = async (req: Request, res: Response, next: NextFunction) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const { id } = req.params;

//     if (!id) {
//       throw new ErrorHandler(400, 'Exercise ID is required');
//     }

//     const exercise = await ExerciseModel.findById(id).session(session);
//     if (!exercise) throw new ErrorHandler(404, 'Exercise not found');

//     // Delete files from Cloudinary
//     if (exercise.videoUrl) {
//       const videoPublicId = extractPublicIdFromUrl(exercise.videoUrl);
//       if (videoPublicId) {
//         await deleteFromCloudinary(videoPublicId, 'video');
//       }
//     }

//     if (exercise.thumbnailUrl) {
//       const thumbnailPublicId = extractPublicIdFromUrl(exercise.thumbnailUrl);
//       if (thumbnailPublicId) {
//         await deleteFromCloudinary(thumbnailPublicId, 'image');
//       }
//     }

//     // Delete exercise from database
//     const exerciseDeleted = await ExerciseModel.findByIdAndDelete(id).session(session);
//     if(!exerciseDeleted) throw new ErrorHandler(404, 'Exercise not found');

//     await session.commitTransaction();

//     res.status(200).json({
//       success: true,
//       message: 'Exercise deleted successfully'
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     console.error('deleteExerciseHandler error', error);
//     next(error);
//   } finally {
//     session.endSession();
//   }
// };

// Get all exercises with filtering and search
export const getAllExercisesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exercises = await ExerciseModel.find()
      .populate({
        path: 'category',
        select: 'title'
      })
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: exercises,
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
export const getExercisesByCategoryHandler = async (req: Request<TExerciseParams>, res: Response, next: NextFunction) => {
  try {
    const parsedParams = exerciseCategoryParamSchema.safeParse(req.params);
    
    if (!parsedParams.success) {
      const erroMessages = parsedParams.error.issues.map((issue: any) => issue.message).join(", ");
      throw new ErrorHandler(400, erroMessages);
    }
    const { category } = parsedParams.data;

    if (!category) {
      throw new ErrorHandler(400, 'Category is required');
    }

      const exercisesByCategory = await ExerciseModel.aggregate([
      // Match exercises by category
      { $match: { category: new mongoose.Types.ObjectId(category) } },
      
      // Lookup to get category details
      {
        $lookup: {
          from: 'exercisecategories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      
      // Unwind the categoryDetails array
      { $unwind: '$categoryDetails' },
      
      // Project only the fields we need
      {
        $project: {
          name: 1,
          description: 1,
          videoUrl: 1,
          thumbnailUrl: 1,
          reps: 1,
          sets: 1,
          tags: 1,
          bodyPart: 1,
          difficulty: 1,
          estimatedDuration: 1,
          createdAt: 1,
          categoryName: '$categoryDetails.title',
          categoryDescription: '$categoryDetails.description'
        }
      },
      
      // Sort by creation date
      { $sort: { createdAt: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: exercisesByCategory
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
    console.log('bodyPart', bodyPart);
    
    const exercises = await ExerciseModel.find({
      bodyPart: { $regex: new RegExp(`^${bodyPart}$`, 'i') },
      isActive: true 
    })
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