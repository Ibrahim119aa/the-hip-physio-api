// import multer from "multer";
// import { Request } from "express";

// const storage = multer.memoryStorage();

// const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
//   if (file.mimetype.startsWith("video/")) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only video files are allowed"));
//   }
// };

// export const uploadSingleVideo = multer({
//   storage,
//   limits: {
//     fileSize: 2 * 1024 * 1024 * 1024, // 2GB max (adjust if needed)
//   },
//   fileFilter,
// }).single("video"); // field name should match client form-data
