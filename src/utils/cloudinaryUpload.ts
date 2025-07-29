import { v2 as cloudinary } from 'cloudinary';
import config from '../config/config';
import ErrorHandler from './errorHandlerClass';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret
});

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

// Upload image/thumbnail to Cloudinary
export const uploadImageToCloudinary = async (file: Express.Multer.File): Promise<string> => {
  try {
    if (!file) {
      throw new ErrorHandler(400, 'No image file provided');
    }

    // Check file type
    if (!file.mimetype.startsWith('image/')) {
      throw new ErrorHandler(400, 'File must be an image');
    }

    // Check file size (max 10MB for images)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new ErrorHandler(400, 'Image file size must be less than 10MB');
    }

    // Convert buffer to base64
    const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64File, {
      resource_type: 'image',
      folder: 'hip-physio/exercises/thumbnails',
      format: 'jpg',
      quality: 'auto',
      transformation: [
        { width: 400, height: 300, crop: 'fill', gravity: 'auto' },
        { quality: 'auto' }
      ]
    });

    return result.secure_url;

  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    if (error instanceof ErrorHandler) {
      throw error;
    }
    throw new ErrorHandler(500, 'Failed to upload image');
  }
};

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    // Don't throw error as this is cleanup operation
  }
};

// Extract public ID from Cloudinary URL
export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = filename.split('.')[0];
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

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