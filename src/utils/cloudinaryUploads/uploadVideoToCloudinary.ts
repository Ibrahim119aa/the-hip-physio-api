import fs from "fs";
import cloudinary from "../../config/cloudinaryConfig";
import config from "../../config/config";
import ErrorHandler from "../errorHandlerClass";

// // Upload video to Cloudinary
// export const uploadVideoToCloudinary = async (file: Express.Multer.File): Promise<{ url: string; duration: number }> => {
//   try {
//     if (!file) {
//       throw new ErrorHandler(400, 'No video file provided');
//     }

//     // Check file type
//     if (!file.mimetype.startsWith('video/')) {
//       throw new ErrorHandler(400, 'File must be a video');
//     }

//     // Check file size (max 100MB for videos)
//     // const maxSize = 100 * 1024 * 1024; // 100MB
//     // if (file.size > maxSize) {
//     //   throw new ErrorHandler(400, 'Video file size must be less than 100MB');
//     // }

//     // Convert buffer to base64
//     const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

//     // Upload to Cloudinary
//     const result = await cloudinary.uploader.upload(base64File, {
//       resource_type: 'video',
//       folder: 'hip-physio/exercises/videos',
//       format: 'mp4',
//       quality: 'auto',
//       eager: [
//         { width: 640, height: 480, crop: 'scale', quality: 'auto' },
//         { width: 1280, height: 720, crop: 'scale', quality: 'auto' }
//       ],
//       eager_async: true,
//       eager_notification_url: config.webhookUrl // Optional: for notifications
//     });

//     return {
//       url: result.secure_url,
//       duration: result.duration,
//     };

//   } catch (error) {
//     console.error('Error uploading video to Cloudinary:', error);
//     if (error instanceof ErrorHandler) {
//       throw error;
//     }
//     throw new ErrorHandler(500, 'Failed to upload video');
//   }
// };

// import fs from "fs";
// import cloudinary from "../../config/cloudinaryConfig";
// import config from "../../config/config";
// import ErrorHandler from "../errorHandlerClass";

// export const uploadVideoToCloudinary = async (
//   file: Express.Multer.File // should be from diskStorage (has file.path)
// ): Promise<{ url: string; duration: number }> => {
//   try {
//     if (!file) throw new ErrorHandler(400, "No video file provided");
//     if (!file.mimetype.startsWith("video/")) throw new ErrorHandler(400, "File must be a video");
//     if (!file.path) throw new ErrorHandler(400, "Large upload requires disk storage (file.path missing)");

//     const folder = "hip-physio/exercises/videos";

//     const result = await new Promise<any>((resolve, reject) => {
//       const upload = cloudinary.uploader.upload_large_stream(
//         {
//           resource_type: "video",
//           folder,
//           chunk_size: 20 * 1024 * 1024, // 20MB chunks (tweak if needed)
//           eager: [
//             { width: 640, height: 480, crop: "scale", quality: "auto" },
//             { width: 1280, height: 720, crop: "scale", quality: "auto" },
//           ],
//           eager_async: true,
//           eager_notification_url: config.webhookUrl,
//           // public_id: optional stable name without extension
//         },
//         (err, res) => (err ? reject(err) : resolve(res))
//       );

//       fs.createReadStream(file.path).pipe(upload);
//     });

//     return { url: result.secure_url, duration: result.duration };
//   } catch (err: any) {
//     console.error("Error uploading video (large/chunked):", err);
//     if (err instanceof ErrorHandler) throw err;
//     throw new ErrorHandler(500, "Failed to upload large video");
//   }
// };


type UploadResult = { url: string; duration: number };

/**
 * Upload a large video file from disk (Multer diskStorage) to Cloudinary in chunks.
 * Requires: req.file.path (i.e., Multer diskStorage, not memoryStorage).
 */
// export const uploadVideoToCloudinary = async (
//   file: Express.Multer.File
// ): Promise<UploadResult> => {
//   // We'll reuse this in finally for cleanup
//   const filePath = (file as unknown as { path?: string })?.path;

//   try {
//     if (!file) throw new ErrorHandler(400, "No video file provided");
//     if (!file.mimetype?.startsWith("video/")) {
//       throw new ErrorHandler(400, "File must be a video");
//     }
//     if (!filePath) {
//       // Multer memoryStorage does not populate path; for large uploads we need diskStorage
//       throw new ErrorHandler(400, "Large upload requires disk storage (file.path is missing)");
//     }

//     const folder = "hip-physio/exercises/videos";
//     const chunkSize = 20 * 1024 * 1024; // 20MB chunks

//     // ⬇️ Chunked upload by file path (no streams)
//     const result: any = await cloudinary.uploader.upload_large(filePath, {
//       resource_type: "video",
//       folder,
//       chunk_size: chunkSize,
//       eager: [
//         { width: 640, height: 480, crop: "scale", quality: "auto" },
//         { width: 1280, height: 720, crop: "scale", quality: "auto" },
//       ],
//       eager_async: true,
//       eager_notification_url: config.webhookUrl,
//       // public_id: "optional-stable-id-without-extension"
//     });

//     const secureUrl: string = result.secure_url;
//     const duration: number = typeof result.duration === "number" ? result.duration : 0;

//     return { url: secureUrl, duration };

//   } catch (err: any) {
//     console.error("Error uploading video (large/chunked):", err);
//     if (err instanceof ErrorHandler) throw err;
//     const msg =
//       err?.message ||
//       err?.error?.message ||
//       "Failed to upload large video";
//     throw new ErrorHandler(500, msg);
//   } finally {
//     // Always clean up the temp file written by Multer diskStorage
//     if (filePath) {
//       fs.unlink(filePath, () => {});
//     }
//   }
// };


export type UploadVideoResult = { url: string; duration: number; publicId: string };



export const uploadVideoToCloudinary = async (
  file: Express.Multer.File
): Promise<UploadVideoResult> => {
  const filePath = (file as unknown as { path?: string })?.path;

  if (!file) throw new ErrorHandler(400, "No video file provided");
  if (!file.mimetype?.startsWith("video/")) throw new ErrorHandler(400, "File must be a video");
  if (!filePath) throw new ErrorHandler(400, "Large upload requires disk storage (file.path is missing)");

  const options = {
    resource_type: "video" as const,                    // important for video
    folder: "hip-physio/exercises/videos",
    chunk_size: 20 * 1024 * 1024,                       // 20MB chunks
    eager: [
      { width: 640, height: 480, crop: "scale", quality: "auto" },
      { width: 1280, height: 720, crop: "scale", quality: "auto" },
    ],
    eager_async: true,
    eager_notification_url: config.webhookUrl,
    // async: true, // uncomment if your files can exceed 20 GB. :contentReference[oaicite:1]{index=1}
    // timeout: 600000, // optional: increase SDK wait time if needed (ms). :contentReference[oaicite:2]{index=2}
  };

  // upload_large(filePath, options) returns a stream for local paths — use the callback to resolve the final response
  const result: any = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_large(
      filePath,
      options,
      (error, res) => (error ? reject(error) : resolve(res as any))
    );
  });
  console.log('result couldinary +++', result);
  
  if (!result?.secure_url || !result?.public_id) {
    throw new ErrorHandler(502, "Cloudinary did not return URL/public_id for the video");
  }

  // duration is included for video uploads
  const duration = Number((result as any).duration) || 0; // seconds. :contentReference[oaicite:3]{index=3}

  return {
    url: result.secure_url,                              // HTTPS delivery URL. :contentReference[oaicite:4]{index=4}
    duration,
    publicId: result.public_id,
  };
};
