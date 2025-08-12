import mongoose from "mongoose";
import EducationalVideoModel from "../models/educationalVideo.model";
import { Request, Response, NextFunction} from 'express';
import { educationVideoSchema, TEducationVideoRequest } from "../validationSchemas/educationalVideo.schema";
import ErrorHandler from "../utils/errorHandlerClass";
import { uploadEducatioanlVideoToCloudinary } from "../utils/cloudinaryUploads/uploadEducatioanlVideoToCloudinary";
import { uploadEducationalThumbnailToCloudinary } from "../utils/cloudinaryUploads/uploadEducationalThumbnailToCloudinary";
import { extractPublicIdFromUrl, testPublicIdExtraction } from "../utils/cloudinaryUploads/extractPublicIdFromUrl";
import { deleteFromCloudinary } from "../utils/cloudinaryUploads/deleteFromCloudinary";
import { uploadVideo } from "../utils/cloudinaryUploads/uploadVideo";

type TUploadedVideoUrl = {
  url: string;
  duration: number;
};

export const createEducationalVideoHandler = async(req: Request<{}, {}, TEducationVideoRequest>, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  let uploadedVideoUrl: TUploadedVideoUrl | null = null;
  let uploadedThumbnailUrl = '';

  try{
    console.log('req.body', req.body);
    console.log('req.videoFile', req.files);
    
    const parsedBody = educationVideoSchema.safeParse(req.body);
    
    if(!parsedBody.success) {
      const errorMessages = parsedBody.error.issues.map(issue => issue.message).join(', ');
      throw new ErrorHandler(400, errorMessages);
    }

    // check if video file is provided
    if(!req.videoFile) {
      throw new ErrorHandler(400, 'Video file is required');
    }

    // check if educational video with same title already exist
    const existingEducationalVideo = await EducationalVideoModel.findOne({
      title: { $regex: new RegExp(`^${parsedBody.data.title}$`,'i')}
    }).session(session);
    
    if(existingEducationalVideo) {
      throw new ErrorHandler(409, 'Educational video with this title already exists');
    }

    // upload educational video to cloudinary
    uploadedVideoUrl = await uploadEducatioanlVideoToCloudinary(req.videoFile);
    console.log('video uploaded successfully');

    // Upload thumbnail if provided, otherwise generate from video
    if (req.thumbnailFile) {
      uploadedThumbnailUrl = await uploadEducationalThumbnailToCloudinary(req.thumbnailFile);
    } else {
      // Generate thumbnail from video 
      uploadedThumbnailUrl = uploadedVideoUrl.url
        .replace('/upload/', '/upload/so_2/')
        .replace('.mp4', '.jpg');
      // uploadedThumbnailUrl = uploadedVideoUrl.url.replace('.mp4', '_thumb.jpg'); // Placeholder
    }

    const newEducationalVideo = new EducationalVideoModel({
      title: parsedBody.data.title,
      description: parsedBody.data.description,
      category: new mongoose.Types.ObjectId(parsedBody.data.category),
      videoUrl: uploadedVideoUrl.url,
      thumbnailUrl: uploadedThumbnailUrl,
      estimatedDuration: uploadedVideoUrl.duration
    });

    // console.log('api called');
    // console.log('body', req.body);
    // const {
    //   title,
    //   duration,
    //   description,
    //   categories
    // } = req.body 
 
    // const newEducationalVideo = new EducationalVideoModel({
    //   title,
    //   duration,
    //   description,
    //   categories,
    //   videoUrl: "https://res.cloudinary.com/daoktsoq3/video/upload/v1754332742/hip-physio/exercises/videos/tfgtb3xbewifvnbjy26o.mp4",
    //   thumbnailUrl: "https://res.cloudinary.com/daoktsoq3/image/upload/v1754332774/hip-physio/exercises/thumbnails/i2nchtmmbce1u8or15b5.jpg"
    // })

    await newEducationalVideo.save();
    
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: newEducationalVideo,
      message: 'educational video uploaded successfully'
    })

  } catch(error) {
    console.error('createEducationalVideoHandler Error:', error);
    await session.abortTransaction();

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
        
    next(error)
  }
}

// export const deleteEducationalVideoHandler = async (req: Request, res: Response, next: NextFunction) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { id } = req.params;

//     if (!id) throw new ErrorHandler(400, 'Educational video ID is required');

//     const educationalVideo = await EducationalVideoModel.findById(id).session(session);
//     if (!educationalVideo) throw new ErrorHandler(404, 'Educational video not found');

//     // Delete associated Cloudinary resources
//     const deletePromises: Promise<any>[] = [];

//     if (educationalVideo.videoUrl) {
//       const videoPublicId = extractPublicIdFromUrl(educationalVideo.videoUrl);
//       if (videoPublicId) {
//         deletePromises.push(deleteFromCloudinary(videoPublicId, 'video'));
//       }
//     }

//     if (educationalVideo.thumbnailUrl) {
//       const thumbnailPublicId = extractPublicIdFromUrl(educationalVideo.thumbnailUrl);
//       if (thumbnailPublicId) {
//         deletePromises.push(deleteFromCloudinary(thumbnailPublicId, 'image'));
//       }
//     }

//     await Promise.all(deletePromises);

//     await EducationalVideoModel.findByIdAndDelete(id).session(session);

//     await session.commitTransaction();

//     res.status(200).json({
//       success: true,
//       message: 'Educational video deleted successfully'
//     });

//   } catch (error) {
//     console.error('deleteEducationalVideoHandler error', error);
//     await session.abortTransaction();
//     next(error);
//   } finally {
//     session.endSession();
//   }
// };

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

// example handler for videos
export async function uploadVideoHandler(req: Request, res: Response) {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ message: "No video file provided" });
    }

    const uploaded = await uploadVideo(req.file.buffer, {
      folder: "hip-physio/educational/videos",
      context: { originalname: req.file.originalname },
    });

    res.status(201).json({ message: "Video uploaded", ...uploaded });
  } catch (err: any) {
    console.error("Cloudinary upload error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
}
