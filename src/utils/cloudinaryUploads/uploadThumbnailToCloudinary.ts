import cloudinary from "../../config/cloudinaryConfig";
import ErrorHandler from "../errorHandlerClass";

// // Upload image/thumbnail to Cloudinary
// export const uploadExerciseThumbnailToCloudinary = async (file: Express.Multer.File): Promise<string> => {
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
//       folder: 'hip-physio/exercises/thumbnails',
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

// Upload image/thumbnail to Cloudinary (supports diskStorage or memoryStorage)
// export const uploadExerciseThumbnailToCloudinary = async (
//   file: Express.Multer.File
// ): Promise<string> => {
//   try {
//     if (!file) throw new ErrorHandler(400, "No image file provided");
//     if (!file.mimetype?.startsWith("image/")) {
//       throw new ErrorHandler(400, "File must be an image");
//     }

//     // Optional size guard (10MB)
//     const maxSize = 10 * 1024 * 1024;
//     if (file.size > maxSize) {
//       throw new ErrorHandler(400, "Image file size must be less than 10MB");
//     }

//     const options = {
//       resource_type: "image" as const,
//       folder: "hip-physio/exercises/thumbnails",
//       quality: "auto",
//       transformation: [{ crop: "scale", quality: "auto" }],
//     };

//     // Prefer disk path if available (diskStorage)
//     const filePath = (file as unknown as { path?: string })?.path;
//     if (filePath) {
//       const res: any = await cloudinary.uploader.upload(filePath, options);
//       return res.secure_url as string;
//     }

//     // Fallback: memoryStorage (buffer present)
//     if (file.buffer) {
//       const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
//       const res: any = await cloudinary.uploader.upload(base64, options);
//       return res.secure_url as string;
//     }

//     throw new ErrorHandler(400, "Unsupported upload source: missing path/buffer");
//   } catch (error: any) {
//     console.error("Error uploading image to Cloudinary:", error);
//     if (error instanceof ErrorHandler) throw error;
//     throw new ErrorHandler(500, error?.message || error?.error?.message || "Failed to upload image");
//   }
// };

export type UploadThumbResult = { url: string; publicId: string };

export const uploadThumbnailToCloudinary = async ( file: Express.Multer.File, subfolder: string ): Promise<UploadThumbResult> => {
  if (!file) throw new ErrorHandler(400, "No image file provided");
  if (!file.mimetype?.startsWith("image/")) throw new ErrorHandler(400, "File must be an image");
  if (file.size > 10 * 1024 * 1024) throw new ErrorHandler(400, "Image file size must be less than 10MB");

  const options = {
    resource_type: "image" as const,
    folder: `hip-physio/${subfolder}/thumbnails`,
    transformation: [{ crop: "scale", quality: "auto" }],
  };

  try {
    const filePath = (file as unknown as { path?: string })?.path;

    const res: any = filePath
      ? await cloudinary.uploader.upload(filePath, options)
      : await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          options
        );

    return { url: res.secure_url as string, publicId: res.public_id as string };
  } catch (err: any) {
    console.error("image upload failed:", err);
    throw err instanceof ErrorHandler
      ? err
      : new ErrorHandler(500, err?.message || err?.error?.message || "Failed to upload image");
  }
};
