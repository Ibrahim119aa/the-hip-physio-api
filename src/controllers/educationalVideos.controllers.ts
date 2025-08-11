import { TEducationVideoRequest } from "../validationSchemas/educationalVideo.schema";
import { Request, Response, NextFunction} from 'express';

export const createEducationalVideoHandler = async(req: Request<{}, {}, TEducationVideoRequest>, res: Response, next: NextFunction) => {
  try{
    const parsedBody = await educationVideoSchema.safeParse(req.body)
    const videoFile = 
    
  } catch(error) {
    console.error('createEducationalVideoHandler Error:', error);
    next(error)
  }
}