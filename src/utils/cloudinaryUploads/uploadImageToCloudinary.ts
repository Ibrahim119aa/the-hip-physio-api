import cloudinary from "../../config/cloudinaryConfig";
import ErrorHandler from "../errorHandlerClass";

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
