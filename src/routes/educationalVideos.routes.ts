import { Router } from "express";
import { createEducationalVideoCategoryHandler, deleteEducationalVideoCategoryHandler, getAllEducationalVideoCategoriesHandler, updateEducationalVideoCategoryHandler } from "../controllers/educationalVideosCategory.controllers";
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

  router.route("/category/:id")  
  .put(isAdminAuthenticated, updateEducationalVideoCategoryHandler)
  .delete(isAdminAuthenticated, deleteEducationalVideoCategoryHandler);



export default router;