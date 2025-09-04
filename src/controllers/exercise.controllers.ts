import { NextFunction, Request, Response } from "express";
import fs from "fs/promises";

import ErrorHandler from "../utils/errorHandlerClass";
import { uploadVideoToCloudinary } from "../utils/cloudinaryUploads/uploadVideoToCloudinary";
import { extractPublicIdFromUrl, testPublicIdExtraction } from "../utils/cloudinaryUploads/extractPublicIdFromUrl";
import { deleteFromCloudinary } from "../utils/cloudinaryUploads/deleteFromCloudinary";
import mongoose from "mongoose";
import ExerciseModel from "../models/exercise.model";
import { createExerciseSchema, exerciseCategoryParamSchema, ExerciseParamsSchema, TExerciseParams, TExerciseRequest, TUpdateExerciseRequest, updateExerciseSchema } from "../validationSchemas/excercise.schema";
import { uploadThumbnailToCloudinary } from "../utils/cloudinaryUploads/uploadThumbnailToCloudinary";


export type UploadVideoResult = { url: string; duration: number; publicId: string };
export type UploadThumbResult = { url: string; publicId: string };

const safeUnlink = async (p?: string) => {
  if (!p) return;
  try { await fs.unlink(p); } catch { /* ignore */ }
};

export const addExerciseHandler = async (
  req: Request<{}, {}, any>,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();

  // temp local paths from Multer diskStorage (for final cleanup)
  const files = req.files as { [k: string]: Express.Multer.File[] } | undefined;
  const videoFile = files?.video?.[0];
  const thumbFile = files?.thumbnail?.[0];
  const videoTemp = (videoFile as any)?.path as string | undefined;
  const thumbTemp = (thumbFile as any)?.path as string | undefined;

  let uploadedVideo: UploadVideoResult | null = null;
  let uploadedThumb: UploadThumbResult | null = null;
  let thumbWasUploaded = false;

  try {
    console.log("Starting addExerciseHandler...");

    // 0) Validate (fast; safe outside tx)
    const parsed = createExerciseSchema.safeParse(req.body);
    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map(i => i.message).join(", ");
      throw new ErrorHandler(400, errorMessages);
    }
    if (!videoFile) throw new ErrorHandler(400, "Video file is required");

    // 1) Do SLOW external I/O BEFORE starting the transaction
    console.log("Uploading video to Cloudinary...");
    const subFolder = "exercises";
    uploadedVideo = await uploadVideoToCloudinary(videoFile, subFolder);

    if (thumbFile) {
      console.log("Uploading thumbnail to Cloudinary...");
      uploadedThumb = await uploadThumbnailToCloudinary(thumbFile, subFolder);
      thumbWasUploaded = true;
    }

    const thumbnailUrl = uploadedThumb
      ? uploadedThumb.url
      : uploadedVideo.url.replace("/upload/", "/upload/so_2/").replace(".mp4", ".jpg");

    // 2) Keep the transaction DB-only and QUICK
    await session.withTransaction(async () => {
      // IMPORTANT: pass the SAME session to every DB op inside
      const existing = await ExerciseModel.findOne({
        name: { $regex: new RegExp(`^${parsed.data.name}$`, "i") },
      }).session(session);

      if (existing) {
        throw new ErrorHandler(409, "Exercise with this name already exists");
      }

      // Create using the session
      await ExerciseModel.create([{
        name: parsed.data.name,
        description: parsed.data.description,
        videoUrl: uploadedVideo!.url,
        thumbnailUrl,
        reps: parsed.data.reps,
        sets: parsed.data.sets,
        category: new mongoose.Types.ObjectId(parsed.data.category),
        tags: parsed.data.tags
          ? parsed.data.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
          : [],
        bodyPart: parsed.data.bodyPart,
        difficulty: parsed.data.difficulty,
        estimatedDuration: uploadedVideo!.duration,
        createdBy: req.adminId, // ensure this exists on req
      }], { session });
    });

    res.status(201).json({
      success: true,
      message: "Exercise added successfully",
      // If you want to return the created doc, you can re-read it (outside tx) by name/id.
    });

  } catch (error: any) {
    console.error("addExerciseHandler error:", error);

    // Cloudinary rollback only if DB part failed
    try {
      if (uploadedVideo?.publicId) {
        await deleteFromCloudinary(uploadedVideo.publicId, "video");
        console.log("Rolled back video on Cloudinary");
      }
      if (thumbWasUploaded && uploadedThumb?.publicId) {
        await deleteFromCloudinary(uploadedThumb.publicId, "image");
        console.log("Rolled back thumbnail on Cloudinary");
      }
    } catch (cleanupErr) {
      console.error("Cloudinary cleanup failed (ignored):", cleanupErr);
    }

    next(error);
  } finally {
    session.endSession();
    await Promise.all([safeUnlink(videoTemp), safeUnlink(thumbTemp)]);
  }
};


// Add new exercise with atomicity
// export const addExerciseHandler = async (
//   req: Request<{}, {}, any>,
//   res: Response,
//   next: NextFunction
// ) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   // temp local paths from Multer diskStorage (for final cleanup)
//   const files = req.files as { [k: string]: Express.Multer.File[] } | undefined;
//   const videoFile = files?.video?.[0];
//   const thumbFile = files?.thumbnail?.[0];
//   const videoTemp = (videoFile as any)?.path as string | undefined;
//   const thumbTemp = (thumbFile as any)?.path as string | undefined;

//   let uploadedVideo: UploadVideoResult | null = null;
//   let uploadedThumb: UploadThumbResult | null = null;
//   let thumbWasUploaded = false;

//   try {
//     console.log("Starting addExerciseHandler...");
//     const parsed = createExerciseSchema.safeParse(req.body);
//     if (!parsed.success) {
//       const errorMessages = parsed.error.issues.map(i => i.message).join(", ");
//       throw new ErrorHandler(400, errorMessages);
//     }

//     if (!videoFile) throw new ErrorHandler(400, "Video file is required");

//     const existing = await ExerciseModel.findOne({
//       name: { $regex: new RegExp(`^${parsed.data.name}$`, "i") },
//     }).session(session);
//     if (existing) throw new ErrorHandler(409, "Exercise with this name already exists");

//     console.log("Uploading video to Cloudinary...");
//     const subFolder = "exercises"
//     uploadedVideo = await uploadVideoToCloudinary(videoFile, subFolder);

//     if (thumbFile) {
//       console.log("Uploading thumbnail to Cloudinary...");
//       uploadedThumb = await uploadThumbnailToCloudinary(thumbFile, subFolder);
//       thumbWasUploaded = true;
//     }

//     const thumbnailUrl = uploadedThumb
//       ? uploadedThumb.url
//       : uploadedVideo.url.replace("/upload/", "/upload/so_2/").replace(".mp4", ".jpg");

//       console.log('uploadedVideo', uploadedVideo);
//       console.log('user ID', req.userId);
      

//     const newExercise = new ExerciseModel({
//       name: parsed.data.name,
//       description: parsed.data.description,
//       videoUrl: uploadedVideo.url,
//       thumbnailUrl,
//       reps: parsed.data.reps,
//       sets: parsed.data.sets,
//       category: new mongoose.Types.ObjectId(parsed.data.category),
//       tags: parsed.data.tags
//         ? parsed.data.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
//         : [],
//       bodyPart: parsed.data.bodyPart,
//       difficulty: parsed.data.difficulty,
//       estimatedDuration: uploadedVideo.duration,
//       createdBy: req.adminId,
//     });

//     await newExercise.save({ session });
//     await session.commitTransaction();

//     res.status(201).json({
//       success: true,
//       message: "Exercise added successfully",
//       data: newExercise,
//     });
//   } catch (error) {
//     console.error("addExerciseHandler error:", error);
//     await session.abortTransaction();
//     console.error("Transaction aborted due to error");

//     // Cloudinary rollback (only if we actually uploaded)
//     try {
//       if (uploadedVideo?.publicId) {
//         await deleteFromCloudinary(uploadedVideo.publicId, "video");
//         console.log("Rolled back video on Cloudinary");
//       }
//       if (thumbWasUploaded && uploadedThumb?.publicId) {
//         await deleteFromCloudinary(uploadedThumb.publicId, "image");
//         console.log("Rolled back thumbnail on Cloudinary");
//       }
//     } catch (cleanupErr) {
//       console.error("Cloudinary cleanup failed (ignored):", cleanupErr);
//     }

//     next(error);
//   } finally {
//     session.endSession();
//     // local temp cleanup (always)
//     await Promise.all([safeUnlink(videoTemp), safeUnlink(thumbTemp)]);
//   }
// };

export const updateExerciseHandler = async (
  req: Request<TExerciseParams, {}, TUpdateExerciseRequest>,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const files = req.files as { [k: string]: Express.Multer.File[] } | undefined;
  const incomingVideoFile: Express.Multer.File | undefined =
    (req as any).videoFile ?? files?.video?.[0];
  const incomingThumbFile: Express.Multer.File | undefined =
    (req as any).thumbnailFile ?? files?.thumbnail?.[0];

  const videoTempPath = (incomingVideoFile as any)?.path as string | undefined;
  const thumbTempPath = (incomingThumbFile as any)?.path as string | undefined;

  let newVideo: UploadVideoResult | null = null;
  let newThumb: UploadThumbResult | null = null;

  try {
    const parsedParams = ExerciseParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      const message = parsedParams.error.issues.map(i => i.message).join(", ");
      throw new ErrorHandler(400, message);
    }

    const parsedBody = updateExerciseSchema.safeParse(req.body);
    if (!parsedBody.success) {
      const message = parsedBody.error.issues.map(i => i.message).join(", ");
      throw new ErrorHandler(400, message);
    }

    const { id } = parsedParams.data;
    const updatePayload = parsedBody.data;

    const existing = await ExerciseModel.findById(id).session(session);
    if (!existing) throw new ErrorHandler(404, "Exercise not found");

    // Duplicate name check
    if (updatePayload.name && updatePayload.name.trim().toLowerCase() !== existing.name.trim().toLowerCase()) {
      const duplicate = await ExerciseModel.findOne({
        _id: { $ne: existing._id },
        name: { $regex: new RegExp(`^${updatePayload.name}$`, "i") },
      }).session(session);
      if (duplicate) throw new ErrorHandler(409, "Exercise with this name already exists");
    }

    // 1) Upload new assets first
    const subFolder = "exercises"
    if (incomingVideoFile) newVideo = await uploadVideoToCloudinary(incomingVideoFile, subFolder);
    if (incomingThumbFile) newThumb = await uploadThumbnailToCloudinary(incomingThumbFile, subFolder);

    // 2) Build patch
    const patch: any = { ...updatePayload };

    if (newVideo) {
      patch.videoUrl = newVideo.url;
      patch.estimatedDuration = newVideo.duration;

      // Only derive a new thumb if we DON'T already have one AND none was provided/overridden
      const payloadHasThumbUrl = typeof updatePayload.thumbnailUrl === "string" && updatePayload.thumbnailUrl.trim().length > 0;
      if (!newThumb && !payloadHasThumbUrl && !existing.thumbnailUrl) {
        patch.thumbnailUrl = newVideo.url
          .replace("/upload/", "/upload/so_2/")
          .replace(".mp4", ".jpg");
      }
    }

    if (newThumb) {
      patch.thumbnailUrl = newThumb.url;
    }

    const updated = await ExerciseModel.findByIdAndUpdate(
      id,
      patch,
      { new: true, runValidators: true, session }
    );
    if (!updated) throw new ErrorHandler(404, "Exercise not updated");

    await session.commitTransaction();

    // 3) Post-commit cleanup
    (async () => {
      try {
        // Delete old video only if we uploaded a new video
        if (newVideo && existing.videoUrl) {
          const oldVideoPublicId = extractPublicIdFromUrl(existing.videoUrl);
          if (oldVideoPublicId) await deleteFromCloudinary(oldVideoPublicId, "video");
        }

        // Decide if the thumbnail was actually replaced
        const payloadThumbnailChanged =
          typeof updatePayload.thumbnailUrl === "string" &&
          updatePayload.thumbnailUrl.trim().length > 0 &&
          updatePayload.thumbnailUrl !== existing.thumbnailUrl;

        const thumbnailWasReplaced = !!newThumb || payloadThumbnailChanged;
        // Note: auto-derived only happens when there was NO existing thumb, so no deletion needed in that branch.

        if (thumbnailWasReplaced && existing.thumbnailUrl) {
          const oldThumbPublicId = extractPublicIdFromUrl(existing.thumbnailUrl);
          if (oldThumbPublicId) await deleteFromCloudinary(oldThumbPublicId, "image");
        }
      } catch (cleanupErr) {
        console.error("post-commit cleanup failed (ignored):", cleanupErr);
      }
    })();

    res.status(200).json({
      success: true,
      message: "Exercise updated successfully",
      data: updated,
    });
  } catch (error) {
    await session.abortTransaction();

    try {
      if (newVideo?.publicId) await deleteFromCloudinary(newVideo.publicId, "video");
      if (newThumb?.publicId) await deleteFromCloudinary(newThumb.publicId, "image");
    } catch (rollbackErr) {
      console.error("rollback cleanup failed (ignored):", rollbackErr);
    }

    next(error);
  } finally {
    session.endSession();
    await Promise.all([safeUnlink(videoTempPath), safeUnlink(thumbTempPath)]);
  }
};

// export const updateExerciseHandler = async (req: Request<TExerciseParams, {}, TUpdateExerciseRequest>, res: Response, next: NextFunction) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   console.log('startedupdating');
  
//   let uploadedVideoUrl: TUploadedVideoUrl | null = null;
//   let uploadedThumbnailUrl = '';

//   try {
//     const parsedParams = ExerciseParamsSchema.safeParse(req.params);
//     const parsedbody = updateExerciseSchema.safeParse(req.body);

//     if(!parsedParams.success) {
//       const erroMessages = parsedParams.error.issues.map((issue: any) => issue.message).join(", ");
//       throw new ErrorHandler(400, erroMessages);
//     }

//     if(!parsedbody.success) {
//       const erroMessages = parsedbody.error.issues.map((issue: any) => issue.message).join(", ");
//       throw new ErrorHandler(400, erroMessages);
//     }
    
//     const { id } = parsedParams.data;
//     const updateData = parsedbody.data;

//     if (!id) throw new ErrorHandler(400, 'Exercise ID is required');

//     const existingExercise = await ExerciseModel.findById(id).session(session);
//     if (!existingExercise) throw new ErrorHandler(404, 'Exercise not found');

//     // Check for duplicate name
//     if (updateData.name && updateData.name !== existingExercise.name) {
//       const duplicateExercise = await ExerciseModel.findOne({ name: updateData.name }).session(session);
//       if (duplicateExercise) throw new ErrorHandler(409, 'Exercise with this name already exists');
//     }

//     // Handle video upload (if provided)
//     if (req.videoFile) {
//       // Delete old video
//       if (existingExercise.videoUrl) {
//         const publicId = extractPublicIdFromUrl(existingExercise.videoUrl);
//         if (publicId) await deleteFromCloudinary(publicId, 'video');
//       }

//       // Upload new video
//       uploadedVideoUrl = await uploadVideoToCloudinary(req.videoFile);
//       updateData.videoUrl = uploadedVideoUrl.url;
//       updateData.estimatedDuration = uploadedVideoUrl.duration;
//     }

//     // Handle thumbnail (upload new or generate from video)
//     if (req.thumbnailFile) {
//       // Delete old thumbnail
//       if (existingExercise.thumbnailUrl) {
//         const publicId = extractPublicIdFromUrl(existingExercise.thumbnailUrl);
//         if (publicId) await deleteFromCloudinary(publicId, 'image');
//       }

//       // Upload new thumbnail
//       uploadedThumbnailUrl = await uploadThumbnailToCloudinary(req.thumbnailFile);
//       updateData.thumbnailUrl = uploadedThumbnailUrl;
//     } else if (updateData.videoUrl) {
//       // Generate thumbnail from video URL (only if videoUrl is updated)
//       updateData.thumbnailUrl = updateData.videoUrl
//         .replace('/upload/', '/upload/so_2/')
//         .replace('.mp4', '.jpg');
//     } // else: keep existing thumbnail

//     const updatedExercise = await ExerciseModel.findByIdAndUpdate(
//       id,
//       updateData,
//       { new: true, runValidators: true, session }
//     );

//     if (!updatedExercise) throw new ErrorHandler(404, 'Exercise not updated');
//     await session.commitTransaction();

//     res.status(200).json({
//       success: true,
//       message: 'Exercise updated successfully',
//       data: updatedExercise
//     });

//   } catch (error) {
//     await session.abortTransaction();
    
//     // Cleanup uploaded files on failure
//     if (uploadedVideoUrl || uploadedThumbnailUrl) {
//       try {
//         if (uploadedVideoUrl) {
//           const videoPublicId = extractPublicIdFromUrl(uploadedVideoUrl.url);
//           if (videoPublicId) await deleteFromCloudinary(videoPublicId, 'video');
//         }
//         if (uploadedThumbnailUrl) {
//           const thumbnailPublicId = extractPublicIdFromUrl(uploadedThumbnailUrl);
//           if (thumbnailPublicId) await deleteFromCloudinary(thumbnailPublicId, 'image');
//         }
//       } catch (cleanupError) {
//         console.error('Cleanup failed:', cleanupError);
//       }
//     }

//     next(error);
//   } finally {
//     session.endSession();
//   }
// };

// Delete exercise
export const deleteExerciseHandler = async (
  req: Request<TExerciseParams, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1) Validate params
    const parsedParams = ExerciseParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      const erroMessages = parsedParams.error.issues.map(i => i.message).join(", ");
      throw new ErrorHandler(400, erroMessages);
    }

    const { id } = parsedParams.data;
    if (!id) throw new ErrorHandler(400, "Exercise ID is required");

    // 2) Fetch within session
    const exercise = await ExerciseModel.findById(id).session(session);
    if (!exercise) throw new ErrorHandler(404, "Exercise not found");

    // 3) Pre-compute what we *might* delete later (post-commit)
    const publicIdsToDelete: Array<{ id: string; type: "video" | "image" }> = [];

    if (exercise.videoUrl) {
      const videoPublicId = extractPublicIdFromUrl(exercise.videoUrl);
      if (videoPublicId) publicIdsToDelete.push({ id: videoPublicId, type: "video" });
    }

    if (exercise.thumbnailUrl) {
      // Only delete if it's NOT the auto-derived thumbnail (e.g., /upload/so_2/)
      const isAutoDerived = exercise.thumbnailUrl.includes("/upload/so_");
      if (!isAutoDerived) {
        const thumbPublicId = extractPublicIdFromUrl(exercise.thumbnailUrl);
        if (thumbPublicId) publicIdsToDelete.push({ id: thumbPublicId, type: "image" });
      }
    }

    // Optionally: prevent deletion if referenced elsewhere (uncomment if needed)
    // const usedInSession = await SessionModel.exists({ exercises: exercise._id }).session(session);
    // if (usedInSession) throw new ErrorHandler(409, "Exercise is in use by one or more sessions");

    // 4) Delete the document within the transaction
    const deleted = await ExerciseModel.findByIdAndDelete(id).session(session);
    if (!deleted) throw new ErrorHandler(500, "Exercise deletion failed");

    // 5) Commit DB change first
    await session.commitTransaction();

    // 6) Post-commit, best-effort Cloudinary cleanup (parallel)
    (async () => {
      try {
        await Promise.all(
          publicIdsToDelete.map(({ id: pubId, type }) =>
            deleteFromCloudinary(pubId, type)
          )
        );
        console.log("deleteExerciseHandler: Cloudinary assets cleaned up");
      } catch (cleanupErr) {
        console.error("deleteExerciseHandler: Cloudinary cleanup failed (ignored):", cleanupErr);
      }
    })();

    // 7) Respond
    res.status(200).json({
      success: true,
      message: "Exercise deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("deleteExerciseHandler error:", error);
    next(error);
  } finally {
    session.endSession();
  }
};


// export const deleteExerciseHandler = async (
//   req: Request<{}, {}, TExerciseParams>,
//   res: Response,
//   next: NextFunction
// ) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const parsedParams = ExerciseParamsSchema.safeParse(req.params);

//     if(!parsedParams.success) {
//       const erroMessages = parsedParams.error.issues.map((issue: any) => issue.message).join(", ");
//       throw new ErrorHandler(400, erroMessages);
//     }

//     const { id } = parsedParams.data;

//     if (!id) throw new ErrorHandler(400, 'Exercise ID is required');

//     const exercise = await ExerciseModel.findById(id).session(session);
//     if (!exercise) throw new ErrorHandler(404, 'Exercise not found');

//     // Delete associated Cloudinary resources
//     const deletePromises: Promise<any>[] = [];

//     if (exercise.videoUrl) {
//       const videoPublicId = extractPublicIdFromUrl(exercise.videoUrl);
//       if (videoPublicId) {
//         deletePromises.push(deleteFromCloudinary(videoPublicId, 'video'));
//       }
//     }

//     if (exercise.thumbnailUrl) {
//       // Only delete thumbnail if it's not auto-generated (Cloudinary `so_2`)
//       const isGenerated = exercise.thumbnailUrl.includes('/upload/so_');
//       if (!isGenerated) {
//         const thumbPublicId = extractPublicIdFromUrl(exercise.thumbnailUrl);
//         if (thumbPublicId) {
//           deletePromises.push(deleteFromCloudinary(thumbPublicId, 'image'));
//         }
//       }
//     }

//     // Run deletions in parallel
//     await Promise.all(deletePromises);

//     // Delete the document
//     const deleted = await ExerciseModel.findByIdAndDelete(id).session(session);
//     if (!deleted) throw new ErrorHandler(500, 'Exercise deletion failed');

//     await session.commitTransaction();

//     res.status(200).json({
//       success: true,
//       message: 'Exercise deleted successfully',
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     console.error('deleteExerciseHandler error:', error);
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

// // Search exercises
// export const searchExercisesHandler = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { q, page = 1, limit = 20 } = req.query;
    
//     if (!q || typeof q !== 'string') {
//       throw new ErrorHandler(400, 'Search query is required');
//     }
    
//     const sanitizeQuery = (input: string) => input.replace(/["]/g, '');
//     const cleanQuery = sanitizeQuery(q);
//     const processedQuery = cleanQuery.includes(' ') ? `"${cleanQuery}"` : cleanQuery;

//     const skip = (Number(page) - 1) * Number(limit);

//     const exercises = await ExerciseModel.find(
//       { $text: { $search: processedQuery } },
//       { score: { $meta: "textScore" } }
//     )
//       .sort({ score: { $meta: "textScore" } })
//       .skip(skip)
//       .limit(Number(limit));

//     const total = await ExerciseModel.countDocuments({ $text: { $search: processedQuery } });

//     res.status(200).json({
//       success: true,
//       data: exercises,
//       pagination: {
//         currentPage: Number(page),
//         totalPages: Math.ceil(total / Number(limit)),
//         totalItems: total,
//         itemsPerPage: Number(limit)
//       }
//     });

//   } catch (error) {
//     console.error('searchExercisesHandler error', error);
//     next(error);
//   }
// };

// // Get exercises for dashboard (active exercises only)
// export const getDashboardExercisesHandler = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { bodyPart, category, tags, limit = 10 } = req.query;

//     const query: any = { isActive: true };

//     if (bodyPart) {
//       query.bodyPart = bodyPart;
//     }

//     if (category) {
//       query.category = category;
//     }

//     if (tags) {
//       const tagArray = Array.isArray(tags) ? tags : [tags];
//       query.tags = { $in: tagArray };
//     }

//     const exercises = await ExerciseModel.find(query)
//       .sort({ createdAt: -1 })
//       .limit(Number(limit));

//     res.status(200).json({
//       success: true,
//       data: exercises
//     });

//   } catch (error) {
//     console.error('getDashboardExercisesHandler error', error);
//     next(error);
//   }
// };

// // Get all body parts
// export const getAllBodyPartsHandler = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const bodyParts = await ExerciseModel.distinct('bodyPart');
    
//     res.status(200).json({
//       success: true,
//       data: bodyParts
//     });

//   } catch (error) {
//     console.error('getAllBodyPartsHandler error', error);
//     next(error);
//   }
// };

// // Get exercises by body part
// export const getExercisesByBodyPartHandler = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { bodyPart } = req.params;
//     const { page = 1, limit = 20 } = req.query;

//     if (!bodyPart) {
//       throw new ErrorHandler(400, 'Body part is required');
//     }

//     const skip = (Number(page) - 1) * Number(limit);
//     console.log('bodyPart', bodyPart);
    
//     const exercises = await ExerciseModel.find({
//       bodyPart: { $regex: new RegExp(`^${bodyPart}$`, 'i') },
//       isActive: true 
//     })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(Number(limit));

//     const total = await ExerciseModel.countDocuments({ bodyPart, isActive: true });

//     res.status(200).json({
//       success: true,
//       data: exercises,
//       pagination: {
//         currentPage: Number(page),
//         totalPages: Math.ceil(total / Number(limit)),
//         totalItems: total,
//         itemsPerPage: Number(limit)
//       }
//     });

//   } catch (error) {
//     console.error('getExercisesByBodyPartHandler error', error);
//     next(error);
//   }
// }; 