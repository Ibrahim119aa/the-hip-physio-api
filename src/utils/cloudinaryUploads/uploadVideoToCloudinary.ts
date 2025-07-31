import cloudinary from "../../config/cloudinaryConfig";
import config from "../../config/config";
import ErrorHandler from "../errorHandlerClass";

// Upload video to Cloudinary
export const uploadVideoToCloudinary = async (file: Express.Multer.File): Promise<string> => {
  try {
    if (!file) {
      throw new ErrorHandler(400, 'No video file provided');
    }

    // Check file type
    if (!file.mimetype.startsWith('video/')) {
      throw new ErrorHandler(400, 'File must be a video');
    }

    // Check file size (max 100MB for videos)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      throw new ErrorHandler(400, 'Video file size must be less than 100MB');
    }

    // Convert buffer to base64
    const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64File, {
      resource_type: 'video',
      folder: 'hip-physio/exercises/videos',
      format: 'mp4',
      quality: 'auto',
      eager: [
        { width: 640, height: 480, crop: 'scale', quality: 'auto' },
        { width: 1280, height: 720, crop: 'scale', quality: 'auto' }
      ],
      eager_async: true,
      eager_notification_url: config.webhookUrl // Optional: for notifications
    });

    return result.secure_url;

  } catch (error) {
    console.error('Error uploading video to Cloudinary:', error);
    if (error instanceof ErrorHandler) {
      throw error;
    }
    throw new ErrorHandler(500, 'Failed to upload video');
  }
};