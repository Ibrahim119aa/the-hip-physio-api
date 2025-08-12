import mongoose from "mongoose";
import EducationalVideoModel from "../models/educationalVideo.model";
import { Request, Response, NextFunction} from 'express';
import { educationVideoSchema } from "../validationSchemas/educationalVideo.schema";

type TUploadedVideoUrl = {
  url: string;
  duration: number;
};

export const createEducationalVideoHandler = async(req: Request, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  let uploadedVideoUrl: TUploadedVideoUrl | null = null;
  let uploadedThumbnailUrl = '';

  try{
    const parsedBody = educationVideoSchema.safeParse(req.body);
    
    if(!parsedBody.success) {
      const errorMessages = parsedBody.error.issues.map(issue => issue.message).join(', ');
    }
    console.log('api called')
    console.log('body', req.body)
    const {
      title,
      duration,
      description,
      categories
    } = req.body 
 
    const newEducationalVideo = new EducationalVideoModel({
      title,
      duration,
      description,
      categories,
      videoUrl: "https://res.cloudinary.com/daoktsoq3/video/upload/v1754332742/hip-physio/exercises/videos/tfgtb3xbewifvnbjy26o.mp4",
      thumbnailUrl: "https://res.cloudinary.com/daoktsoq3/image/upload/v1754332774/hip-physio/exercises/thumbnails/i2nchtmmbce1u8or15b5.jpg"
    })

    await newEducationalVideo.save();

    res.status(201).json({
      success: true,
      videos: newEducationalVideo,
      message: 'educational video uploaded successfully'
    })

  } catch(error) {
    console.error('createEducationalVideoHandler Error:', error);
    next(error)
  }
}

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