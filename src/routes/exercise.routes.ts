import { Router } from "express";
import {
  addExerciseHandler,
  updateExerciseHandler,
  deleteExerciseHandler,
  getAllExercisesHandler,
  getExerciseByIdHandler,
  getExercisesByCategoryHandler,
} from "../controllers/exercise.controllers";
import { uploadVideoAndThumbnail, validateVideoUpload, validateExerciseUpdate } from "../middlewares/upload.middleware";
import { isAdminAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { hasRole } from "../middlewares/hasRole.middleware";

const router = Router();

router.route("/category/:category").get(getExercisesByCategoryHandler);
router.route("/:id")
  .get(getExerciseByIdHandler)
  .put(isAdminAuthenticated, hasRole('admin'), uploadVideoAndThumbnail, validateExerciseUpdate, updateExerciseHandler)
  .delete(isAdminAuthenticated, hasRole('admin'), deleteExerciseHandler);

router.route("/")
  .post(isAdminAuthenticated, hasRole('admin'), uploadVideoAndThumbnail, validateVideoUpload, addExerciseHandler)
  .get(getAllExercisesHandler);

export default router;