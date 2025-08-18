import { Router } from "express";
import { createEducationalVideoCategoryHandler, getAllEducationalVideoCategoriesHandler } from "../controllers/educationalVideosCategory.controllers";
import { createEducationalVideoHandler, getAllEducationalVideosHandler } from "../controllers/educationalVideos.controllers";
import { uploadVideoAndThumbnail, validateExerciseVideoUpload } from "../middlewares/upload.middleware";

const router = Router()

router.route("/")
  .post(uploadVideoAndThumbnail, validateExerciseVideoUpload, createEducationalVideoHandler)
  .get(getAllEducationalVideosHandler)

  // example for large videos 
  // router.post("/videos", uploadSingleVideo, uploadVideoHandler);
  
// categories routes
router.route("/category")
  .post(createEducationalVideoCategoryHandler)
  .get(getAllEducationalVideoCategoriesHandler);


export default router;