import { Router } from "express";
import { createEducationalVideoCategoryHandler, getAllEducationalVideoCategoriesHandler } from "../controllers/educationalVideosCategory.controllers";
import { addEducationalVideoHandler, deleteEducationalVideoHandler, getAllEducationalVideosHandler, updateEducationalVideoHandler } from "../controllers/educationalVideos.controllers";
import { uploadVideoAndThumbnail, validateVideoUpload } from "../middlewares/upload.middleware";
import { isAdminAuthenticated } from "../middlewares/isAuthenticated.middleware";

const router = Router()

router.route("/")
  .post(uploadVideoAndThumbnail, validateVideoUpload, addEducationalVideoHandler)
  .get(getAllEducationalVideosHandler);
router.route("/:id")
  .put(isAdminAuthenticated, uploadVideoAndThumbnail, updateEducationalVideoHandler)
  .delete(isAdminAuthenticated, deleteEducationalVideoHandler);

  // categories routes
router.route("/category")
  .post(isAdminAuthenticated, createEducationalVideoCategoryHandler)
  .get(getAllEducationalVideoCategoriesHandler);


export default router;