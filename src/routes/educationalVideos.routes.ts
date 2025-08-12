import { Router } from "express";
import { createEducationalVideoCategoryHandler, getAllEducationalVideoCategoriesHandler } from "../controllers/educationalVideosCategory.controllers";
import { createEducationalVideoHandler, getAllEducationalVideosHandler } from "../controllers/educationalVideos.controllers";
import { uploadVideoAndThumbnail } from "../middlewares/upload.middleware";

const router = Router()

router.route("/")
  .post(uploadVideoAndThumbnail, createEducationalVideoHandler)
  .get(getAllEducationalVideosHandler)
  
// categories routes
router.route("/category")
  .post(uploadVideoAndThumbnail, createEducationalVideoCategoryHandler)
  .get(getAllEducationalVideoCategoriesHandler);

export default router;