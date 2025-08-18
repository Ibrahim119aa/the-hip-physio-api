import cloudinary from "../../config/cloudinaryConfig";
import ErrorHandler from "../errorHandlerClass";

export const uploadEducationalThumbnailToCloudinary = async (file: Express.Multer.File): Promise<string> => {
  try {
    if (!file) {
      throw new ErrorHandler(400, 'No image file provided');
    }

    // Check file type
    if (!file.mimetype.startsWith('image/')) {
      throw new ErrorHandler(400, 'Only image files are allowed (PDFs are not supported)');
    }

    // Check file size (max 10MB for images)
    // const maxSize = 10 * 1024 * 1024; // 10MB
    // if (file.size > maxSize) {
    //   throw new ErrorHandler(400, 'Image file size must be less than 10MB');
    // }

    // Convert buffer to base64
    const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64File, {
    resource_type: 'image',
    folder: 'hip-physio/educational/thumbnails',
    quality: 'auto', // Root-level optimization
    transformation: [
      { crop: 'scale' }
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
