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
import { adminAuthMiddleware, userAuthMiddleware } from "../middlewares/isAdmin.middleware";
import { uploadExerciseFiles, validateExerciseUpload, handleUploadError } from "../middlewares/upload.middleware";

const router = Router();

// CRUD operations
router.route("/")
  .post(adminAuthMiddleware, uploadExerciseFiles, validateExerciseUpload, addExerciseHandler)
  .get(getAllExercisesHandler);

router.route("/:id")
  .get(getExerciseByIdHandler)
  .put(adminAuthMiddleware, uploadExerciseFiles, validateExerciseUpload, updateExerciseHandler)
  .delete(adminAuthMiddleware, deleteExerciseHandler);

// Handle upload errors
router.use(handleUploadError);

// Search and filter endpoints
router.route("/search").get(searchExercisesHandler);
router.route("/categories").get(getAllCategoriesHandler);
router.route("/tags").get(getAllTagsHandler);
router.route("/category/:category").get(getExercisesByCategoryHandler);
router.route("/body-part/:bodyPart").get(getExercisesByBodyPartHandler);
router.route("/dashboard").get(getDashboardExercisesHandler);
router.route("/body-parts").get(getAllBodyPartsHandler);

export default router; 