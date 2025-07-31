import { Router } from "express";
import {
  addExerciseHandler,
  updateExerciseHandler,
  deleteExerciseHandler,
  getAllExercisesHandler,
  getExerciseByIdHandler,
  getAllCategoriesHandler,
  getAllTagsHandler,
  getExercisesByCategoryHandler,
  searchExercisesHandler,
  getDashboardExercisesHandler,
  getAllBodyPartsHandler,
  getExercisesByBodyPartHandler
} from "../controllers/exercise.controller";
import { uploadVideoAndThumbnail, validateExerciseUpload, handleUploadError } from "../middlewares/upload.middleware";
import { isAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { hasRole } from "../middlewares/hasRole.middleware";

const router = Router();

// Handle upload errors - must be placed BEFORE routes that use file uploads
router.use(handleUploadError);

// Static routes (specific paths first)
router.route("/search").get(searchExercisesHandler);
router.route("/categories").get(getAllCategoriesHandler);
router.route("/tags").get(getAllTagsHandler);
router.route("/body-parts").get(getAllBodyPartsHandler);
router.route("/dashboard").get(getDashboardExercisesHandler);

// Dynamic routes (with parameters)
router.route("/category/:category").get(getExercisesByCategoryHandler);
router.route("/body-part/:bodyPart").get(getExercisesByBodyPartHandler);
router.route("/:id")  // ⚠️ Now this won't accidentally catch "/search"
  .get(getExerciseByIdHandler)
  .put(isAuthenticated, hasRole('admin'), uploadVideoAndThumbnail, validateExerciseUpload, updateExerciseHandler)
  .delete(isAuthenticated, hasRole('admin'), deleteExerciseHandler);

// CRUD operations (root path)
router.route("/")
  .post(isAuthenticated, hasRole('admin'), uploadVideoAndThumbnail, validateExerciseUpload, addExerciseHandler)
  .get(getAllExercisesHandler);

export default router;