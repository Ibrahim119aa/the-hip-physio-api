import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import ErrorHandler from '../utils/errorHandlerClass';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// // File filter function
// const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
//   console.log('Processing file:', file.fieldname, file.mimetype);
  
//   // Check file type based on field name
//   if (file.fieldname === 'video') {
//     if (!file.mimetype.startsWith('video/')) {
//       return cb(new ErrorHandler(400, 'Only video files are allowed for video upload'));
//     }
//   } else if (file.fieldname === 'thumbnail') {
//     if (!file.mimetype.startsWith('image/')) {
//       return cb(new ErrorHandler(400, 'Only image files are allowed for thumbnail upload'));
//     }
//   } else {
//     // Log unexpected field names for debugging
//     console.log('Unexpected field name:', file.fieldname);
//     return cb(new ErrorHandler(400, `Unexpected field name: ${file.fieldname}. Expected fields are 'video' and 'thumbnail'`));
//   }

//   cb(null, true);
// };

const fileFilter = ( req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback ) => {
  console.log('Processing file:', file.fieldname, file.mimetype);

  if (file.fieldname === 'video') {
    if (!file.mimetype.startsWith('video/')) {
      return cb(new ErrorHandler(400, 'Only video files are allowed for video upload'));
    }
  } else if (file.fieldname === 'thumbnail') {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new ErrorHandler(400, 'Only image files are allowed for thumbnail upload (e.g., JPEG, PNG)'));
    }
  } else if (file.fieldname === 'profileImage') {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new ErrorHandler(400, 'Only image files are allowed for profile image upload'));
    }
  } else {
    console.log('Unexpected field name:', file.fieldname);
    return cb(new ErrorHandler(400, `Unexpected field name: ${file.fieldname}. Allowed fields: video, thumbnail, profileImage`));
  }

  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    files: 2 // Max 2 files (video + thumbnail)
  }
});

// Middleware for single video upload
export const uploadVideo = upload.single('video');

// Middleware for single image upload
export const uploadImage = upload.single('thumbnail');

// Middleware for single profile image upload
export const uploadProfileImage = upload.single('profileImage');


// Middleware for both video and thumbnail upload
export const uploadVideoAndThumbnail = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

// Error handling middleware for multer
export const handleUploadError = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Multer error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new ErrorHandler(400, 'File size too large. Maximum size is 100MB'));
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      console.error('File count exceeded. Received files:', req.files);
      return next(new ErrorHandler(400, 'Too many files uploaded. Please send only one video file and one thumbnail file.'));
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      console.error('Unexpected file field:', error.field);
      return next(new ErrorHandler(400, `Unexpected file field: ${error.field}. Expected fields are 'video' and 'thumbnail'`));
    }
    return next(new ErrorHandler(400, `File upload error: ${error.message}`));
  }

  if (error instanceof ErrorHandler) {
    return next(error);
  }

  return next(new ErrorHandler(500, 'File upload failed'));
};

// Validation middleware for exercise uploads
export const validateExerciseVideoUpload = (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Received files:', req.files);
    console.log('Request body:', req.body);
    
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    // Check if video is provided
    if (!files || !files.video || files.video.length === 0) {
      throw new ErrorHandler(400, 'Video file is required. Please send a file with field name: video');
    }

    const videoFile = files.video[0];
    const thumbnailFile = files.thumbnail ? files.thumbnail[0] : null;

    // Validate video file
    if (!videoFile.mimetype.startsWith('video/')) {
      throw new ErrorHandler(400, 'Video file must be a valid video format');
    }

    // Validate thumbnail if provided
    if (thumbnailFile && !thumbnailFile.mimetype.startsWith('image/')) {
      throw new ErrorHandler(400, 'Thumbnail file must be a valid image format');
    }

    // Attach files to request for controller access
    req.videoFile = videoFile;
    req.thumbnailFile = thumbnailFile || undefined;

    next();

  } catch (error) {
    next(error);
  }
};

// Validation middleware for exercise edit uploads
export const validateExerciseUpdate = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const videoFile = files?.video?.[0];
    const thumbnailFile = files?.thumbnail?.[0];

    // Validate video (if provided)
    if (videoFile && !videoFile.mimetype.startsWith("video/")) {
      throw new ErrorHandler(400, "Video must be a valid format (MP4, MOV, etc.)");
    }

    // Validate thumbnail (if provided)
    if (thumbnailFile && !thumbnailFile.mimetype.startsWith("image/")) {
      throw new ErrorHandler(400, "Thumbnail must be an image (JPEG, PNG)");
    }

    // Attach files to request (if they exist)
    if (videoFile) req.videoFile = videoFile;
    if (thumbnailFile) req.thumbnailFile = thumbnailFile;

    next();
  } catch (error) {
    next(error);
  }
};

export const validateProfileImageUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const file = req.file;

    // If no file provided, just continue (image update is optional)
    if (!file) {
      return next();
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new ErrorHandler(400, 'Profile image must be a valid image format (JPEG, PNG, etc.)');
    }

    // Attach to request
    req.profileImage = file;

    next();
  } catch (error) {
    next(error);
  }
};



// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      videoFile?: Express.Multer.File;
      thumbnailFile?: Express.Multer.File;
      profileImage?: Express.Multer.File;
    }
  }
} 