import { Router } from "express";
import { createEducationalVideoCategory } from "../controllers/educationalVideosCategory.controllers";
import { createEducationalVideoHandler } from "../controllers/educationalVideos.controllers";

const router = Router()

router.route("/")
  .post(createEducationalVideoHandler)
  .get(createEducationalVideoHandler)
  
router.route("/category").post(createEducationalVideoCategory);

export default router;