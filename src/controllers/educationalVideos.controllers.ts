import mongoose from "mongoose";
import EducationalVideoModel from "../models/educationalVideo.model";
import { Request, Response, NextFunction} from 'express';
import { createEducationalVideoSchema, EducationalVideoParamsSchema, TCreateEducationalVideoRequest,  TEduVideoParams, TUpdateEducationalVideoRequest, updateEducationalVideoSchema } from "../validationSchemas/educationalVideo.schema";
import ErrorHandler from "../utils/errorHandlerClass";
import { extractPublicIdFromUrl, testPublicIdExtraction } from "../utils/cloudinaryUploads/extractPublicIdFromUrl";
import { deleteFromCloudinary } from "../utils/cloudinaryUploads/deleteFromCloudinary";
import { uploadVideoToCloudinary } from "../utils/cloudinaryUploads/uploadVideoToCloudinary";
import fs from 'fs/promises';
import z from "zod";
import { uploadThumbnailToCloudinary } from "../utils/cloudinaryUploads/uploadThumbnailToCloudinary";


// ---------- Helpers ----------
const safeUnlink = async (p?: string) => {
  if (!p) return;
  try { await fs.unlink(p); } catch { /* ignore */ }
};


// CREATE 
export const addEducationalVideoHandler = async (
  req: Request<{}, {}, TCreateEducationalVideoRequest>,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  const files = req.files as { [k: string]: Express.Multer.File[] } | undefined;
  const videoFile = files?.video?.[0];
  const thumbFile = files?.thumbnail?.[0];

  const videoTemp = (videoFile as any)?.path as string | undefined;
  const thumbTemp = (thumbFile as any)?.path as string | undefined;

  let uploadedVideo: { url: string; duration: number; publicId: string } | null = null;
  let uploadedThumb: { url: string; publicId: string } | null = null;
  let thumbWasUploaded = false;

  try {
    const parsedBody = createEducationalVideoSchema.safeParse(req.body);
    
    if(!parsedBody.success) {
      const errorMessages= parsedBody.error.issues.map((issue) => issue.message).join(", ");
      throw new ErrorHandler(400, errorMessages);
    }
    
    if (!videoFile) throw new ErrorHandler(400, "Video file is required");

    // Duplicate title (case-insensitive)
    const exists = await EducationalVideoModel.findOne({
      title: { $regex: new RegExp(`^${parsedBody.data.title}$`, "i") },
    }).session(session);
    if (exists) throw new ErrorHandler(409, "A video with this title already exists");

    // Upload video
    const subFolder = "educational-videos";
    uploadedVideo = await uploadVideoToCloudinary(videoFile, subFolder);

    // Optional thumbnail
    if (thumbFile) {
      uploadedThumb = await uploadThumbnailToCloudinary(thumbFile, subFolder); // reuse same util
      thumbWasUploaded = true;
    }

    const thumbnailUrl = uploadedThumb
      ? uploadedThumb.url
      : uploadedVideo.url.replace("/upload/", "/upload/so_2/").replace(".mp4", ".jpg");
    
    const doc = new EducationalVideoModel({
      title: parsedBody.data.title,
      description: parsedBody.data.description,
      videoUrl: uploadedVideo.url,
      thumbnailUrl,
      duration: parsedBody.data.duration ?? uploadedVideo!.duration,
      categories: parsedBody.data.categories,
      // createdBy: req.adminId, // uncomment if you add this field in schema
    });

    await doc.save({ session });
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Educational video added successfully",
      data: doc,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error( "addEducationalVideoHandler error (after rollback attempt):", error)

    // Cloudinary rollback
    try {
      if (uploadedVideo?.publicId) await deleteFromCloudinary(uploadedVideo.publicId, "video");
      if (thumbWasUploaded && uploadedThumb?.publicId) {
        await deleteFromCloudinary(uploadedThumb.publicId, "image");
      }
    } catch { /* ignore */ }

    next(error);
  } finally {
    session.endSession();
    await Promise.all([safeUnlink(videoTemp), safeUnlink(thumbTemp)]);
  }
};

// UPDATE 
type UploadVideoResult = { url: string; duration: number; publicId: string };
type UploadThumbResult = { url: string; publicId: string };

export const updateEducationalVideoHandler = async (
  req: Request<z.infer<typeof EducationalVideoParamsSchema>, {}, z.infer<typeof updateEducationalVideoSchema>>,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const files = req.files as { [k: string]: Express.Multer.File[] } | undefined;

  const incomingVideoFile: Express.Multer.File | undefined =   (req as any).videoFile ?? files?.video?.[0];

  const incomingThumbFile: Express.Multer.File | undefined =  (req as any).thumbnailFile ?? files?.thumbnail?.[0];

  const videoTempPath = (incomingVideoFile as any)?.path as string | undefined;
  const thumbTempPath = (incomingThumbFile as any)?.path as string | undefined;

  let newVideo: UploadVideoResult | null = null;
  let newThumb: UploadThumbResult | null = null;

  try {
    // validate params & body (your simple sanitized schemas)
    const parsedParams = EducationalVideoParamsSchema.safeParse(req.params);

    if (!parsedParams.success) {
      const errorMessages = parsedParams.error.issues.map((issue) => issue.message).join(", ")
      throw new ErrorHandler(400, errorMessages);
    }
    
    const parsedBody = updateEducationalVideoSchema.safeParse(req.body);
    
    if(!parsedBody.success) {
      const errorMessages= parsedBody.error.issues.map((issue) => issue.message).join(", ");
      throw new ErrorHandler(400, errorMessages);
    }

    const { id } = parsedParams.data as any;
    const updatePayload = parsedBody.data as any;

    const existing = await EducationalVideoModel.findById(id).session(session);
    if (!existing) throw new ErrorHandler(404, "Educational video not found");

    // Duplicate title check (case-insensitive) if title changed
    if (updatePayload.title && updatePayload.title.trim().toLowerCase() !== existing.title.trim().toLowerCase()) {
      const duplicate = await EducationalVideoModel.findOne({
        _id: { $ne: existing._id },
        title: { $regex: new RegExp(`^${updatePayload.title}$`, "i") },
      }).session(session);
      
      if (duplicate) throw new ErrorHandler(409, "A video with this title already exists");
    }

    // 1) Upload new assets first (optional on PUT)
    const subFolder = "educational-videos";
    if (incomingVideoFile) newVideo = await uploadVideoToCloudinary(incomingVideoFile, subFolder);
    if (incomingThumbFile) newThumb = await uploadThumbnailToCloudinary(incomingThumbFile, subFolder);

    // 2) Build patch
    const patch: any = { ...updatePayload };

    // categories to ObjectIds if provided
    if (updatePayload.categories !== undefined) {
      patch.categories = updatePayload.categories;
    }

    if (newVideo) {
      patch.videoUrl = newVideo.url;
      patch.duration = newVideo.duration;

      const payloadHasThumbUrl =
        typeof updatePayload.thumbnailUrl === "string" && updatePayload.thumbnailUrl.trim().length > 0;

      if (!newThumb && !payloadHasThumbUrl && !existing.thumbnailUrl) {
        patch.thumbnailUrl = newVideo.url
          .replace("/upload/", "/upload/so_2/")
          .replace(".mp4", ".jpg");
      }
    }

    if (newThumb) {
      patch.thumbnailUrl = newThumb.url;
    }

    const updated = await EducationalVideoModel.findByIdAndUpdate(
      id,
      patch,
      { new: true, runValidators: true, session }
    );
    if (!updated) throw new ErrorHandler(404, "Educational video not updated");

    await session.commitTransaction();

    // 3) Post-commit cleanup
    (async () => {
      try {
        if (newVideo && existing.videoUrl) {
          const oldVideoPublicId = extractPublicIdFromUrl(existing.videoUrl);
          if (oldVideoPublicId) await deleteFromCloudinary(oldVideoPublicId, "video");
        }

        const payloadThumbnailChanged =
          typeof updatePayload.thumbnailUrl === "string" &&
          updatePayload.thumbnailUrl.trim().length > 0 &&
          updatePayload.thumbnailUrl !== existing.thumbnailUrl;

        const thumbnailWasReplaced = !!newThumb || payloadThumbnailChanged;
        if (thumbnailWasReplaced && existing.thumbnailUrl) {
          const oldThumbPublicId = extractPublicIdFromUrl(existing.thumbnailUrl);
          if (oldThumbPublicId) await deleteFromCloudinary(oldThumbPublicId, "image");
        }
      } catch (cleanupErr) {
        console.error("educational video post-commit cleanup failed (ignored):", cleanupErr);
      }
    })();

    res.status(200).json({
      success: true,
      message: "Educational video updated successfully",
      data: updated,
    });
  } catch (error) {
    await session.abortTransaction();
    
    try {
      if (newVideo?.publicId) await deleteFromCloudinary(newVideo.publicId, "video");
      if (newThumb?.publicId) await deleteFromCloudinary(newThumb.publicId, "image");
    } catch (rollbackErr) {
      console.error("educational video rollback cleanup failed (ignored):", rollbackErr);
    }
    
    console.error("updateEducationalVideoHandler error (after rollback attempt):", error);
    next(error);
  } finally {
    session.endSession();
    await Promise.all([safeUnlink(videoTempPath), safeUnlink(thumbTempPath)]);
  }
};


// DELETE 
export const deleteEducationalVideoHandler = async (
  req: Request<TEduVideoParams, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const parsedParams = EducationalVideoParamsSchema.safeParse(req.params);
    
    if (!parsedParams.success) {
      const errorMessages= parsedParams.error.issues.map((issue) => issue.message).join(", ");
      throw new ErrorHandler(400, errorMessages);
    }

    const { id } = parsedParams.data;

    const videoDoc = await EducationalVideoModel.findById(id).session(session);
    if (!videoDoc) throw new ErrorHandler(404, "Educational video not found");

    // Pre-compute public IDs for cleanup
    const publicIdsToDelete: Array<{ id: string; type: "video" | "image" }> = [];

    if (videoDoc.videoUrl) {
      const vId = extractPublicIdFromUrl(videoDoc.videoUrl);
      if (vId) publicIdsToDelete.push({ id: vId, type: "video" });
    }

    if (videoDoc.thumbnailUrl) {
      const isAutoDerived = videoDoc.thumbnailUrl.includes("/upload/so_");
      if (!isAutoDerived) {
        const tId = extractPublicIdFromUrl(videoDoc.thumbnailUrl);
        if (tId) publicIdsToDelete.push({ id: tId, type: "image" });
      }
    }

    const deleted = await EducationalVideoModel.findByIdAndDelete(id).session(session);
    if (!deleted) throw new ErrorHandler(500, "Educational video deletion failed");

    await session.commitTransaction();

    (async () => {
      try {
        await Promise.all(
          publicIdsToDelete.map(({ id: pubId, type }) => deleteFromCloudinary(pubId, type))
        );
      } catch { /* ignore */ }
    })();

    res.status(200).json({
      success: true,
      message: "Educational video deleted successfully",
    });
  } catch (error) {
    console.error("deleteEducationalVideoHandler error:", error);
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};


// Get all educational videos
export const getAllEducationalVideosHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const educationalVideos = await EducationalVideoModel.find()
      .populate({
        path: 'categories',
        select: 'title'
      })
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: educationalVideos,
    });

  } catch (error) {
    console.error('getAllEducationalVideosHandler error', error);
    next(error);
  }
};