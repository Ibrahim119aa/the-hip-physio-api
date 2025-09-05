import cloudinary from "../../config/cloudinaryConfig";
import ErrorHandler from "../errorHandlerClass";
import streamifier from 'streamifier';

// export const uploadProfileImageToCloudinary = async (file: Express.Multer.File): Promise<string> => {
//   try {
//     if (!file) {
//       throw new ErrorHandler(400, 'No image file provided');
//     }

//     // Check file type
//     if (!file.mimetype.startsWith('image/')) {
//       throw new ErrorHandler(400, 'File must be an image');
//     }

//     // Check file size (max 10MB for images)
//     const maxSize = 10 * 1024 * 1024; // 10MB
//     if (file.size > maxSize) {
//       throw new ErrorHandler(400, 'Image file size must be less than 10MB');
//     }

//     // Convert buffer to base64
//     const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

//     // Upload to Cloudinary
//     const result = await cloudinary.uploader.upload(base64File, {
//       resource_type: 'image',
//       folder: 'hip-physio/profile/images',
//       quality: 'auto', // Root-level optimization
//       transformation: [
//         { crop: 'scale' }
//       ]
//     });

//     return result.secure_url;

//   } catch (error) {
//     console.error('Error uploading image to Cloudinary:', error);
//     if (error instanceof ErrorHandler) {
//       throw error;
//     }
//     throw new ErrorHandler(500, 'Failed to upload image');
//   }
// };

export type UploadProfileResult = { url: string; publicId: string };

export const uploadProfileImageToCloudinary = async (
  file: Express.Multer.File
): Promise<UploadProfileResult> => {
  if (!file) throw new ErrorHandler(400, 'No image file provided');
  if (!file.mimetype?.startsWith('image/')) throw new ErrorHandler(400, 'File must be an image');
  if (file.size > 10 * 1024 * 1024) throw new ErrorHandler(400, 'Image must be < 10MB');

  const options = {
    resource_type: 'image' as const,
    folder: 'hip-physio/profile/images',
    transformation: [{ crop: 'scale', quality: 'auto' }],
  };

  const filePath = (file as any).path as string | undefined;

  try {
    const res = filePath
      ? await cloudinary.uploader.upload(filePath, options)
      : await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          options
        );

    return { url: res.secure_url as string, publicId: res.public_id as string };
  } catch (err: any) {
    console.error('profile image upload failed:', err);
    throw err instanceof ErrorHandler
      ? err
      : new ErrorHandler(500, err?.message || err?.error?.message || 'Failed to upload image');
  } finally {
    if (filePath) {
      import('fs/promises').then(fs => fs.unlink(filePath!).catch(() => void 0));
    }
  }
};
