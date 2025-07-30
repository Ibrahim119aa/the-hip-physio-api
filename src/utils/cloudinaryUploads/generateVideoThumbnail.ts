import cloudinary from "../../config/cloudinaryConfig";
import ErrorHandler from "../errorHandlerClass";

import { extractPublicIdFromUrl } from "./extractPublicIdFromUrl";

// Generate thumbnail from video
export const generateVideoThumbnail = async (videoUrl: string): Promise<string> => {
  try {
    // Extract public ID from video URL
    const publicId = extractPublicIdFromUrl(videoUrl);
    if (!publicId) {
      throw new ErrorHandler(400, 'Invalid video URL');
    }

    // Generate thumbnail URL
    const thumbnailUrl = cloudinary.url(publicId, {
      resource_type: 'video',
      transformation: [
        { width: 400, height: 300, crop: 'fill', gravity: 'auto' },
        { quality: 'auto' }
      ]
    });

    return thumbnailUrl;

  } catch (error) {
    console.error('Error generating thumbnail:', error);
    if (error instanceof ErrorHandler) {
      throw error;
    }
    throw new ErrorHandler(500, 'Failed to generate thumbnail');
  }
}; 