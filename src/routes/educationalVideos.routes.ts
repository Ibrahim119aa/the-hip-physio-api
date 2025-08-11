import { Router } from "express";
import { createEducationalVideoCategory } from "../controllers/educationalVideosCategory.controllers";
import { createEducationalVideoHandler, getAllEducationalVideosHandler } from "../controllers/educationalVideos.controllers";
import { uploadVideoAndThumbnail } from "../middlewares/upload.middleware";

const router = Router()

router.route("/")
  .post(uploadVideoAndThumbnail, createEducationalVideoHandler)
  .get(getAllEducationalVideosHandler)
  
router.route("/category").post(createEducationalVideoCategory);

export default router;