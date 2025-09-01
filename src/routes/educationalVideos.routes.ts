import { Router } from "express";
import { createEducationalVideoCategoryHandler, deleteEducationalVideoCategoryHandler, getAllEducationalVideoCategoriesHandler, updateEducationalVideoCategoryHandler } from "../controllers/educationalVideosCategory.controllers";
import { addEducationalVideoHandler, deleteEducationalVideoHandler, getAllEducationalVideosHandler, updateEducationalVideoHandler } from "../controllers/educationalVideos.controllers";
import { uploadVideoAndThumbnail, validateVideoUpload } from "../middlewares/upload.middleware";
import { isAdminAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { hasRole } from "../middlewares/hasRole.middleware";

const router = Router()

router.route("/")
  .post(isAdminAuthenticated, hasRole('admin'), uploadVideoAndThumbnail, validateVideoUpload, addEducationalVideoHandler)
  .get(getAllEducationalVideosHandler);
router.route("/:id")
  .put(isAdminAuthenticated, hasRole('admin'), uploadVideoAndThumbnail, updateEducationalVideoHandler)
  .delete(isAdminAuthenticated, hasRole('admin'), deleteEducationalVideoHandler);

  // categories routes
router.route("/category")
  .post(isAdminAuthenticated, hasRole('admin'), createEducationalVideoCategoryHandler)
  .get(getAllEducationalVideoCategoriesHandler);

  router.route("/category/:id")  
  .put(isAdminAuthenticated, hasRole('admin'), updateEducationalVideoCategoryHandler)
  .delete(isAdminAuthenticated, hasRole('admin'), deleteEducationalVideoCategoryHandler);



export default router;