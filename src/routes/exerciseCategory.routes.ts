import { Router } from "express"
import { addExerciseCategoryHandler, deleteExerciseCategoryHandler, getAllCategoriesHandler, updateExerciseCategoryHandler } from "../controllers/exerciseCategory.controllers";
import { isAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { hasRole } from "../middlewares/hasRole.middleware";

const router = Router();

router.route("/")
  .get(getAllCategoriesHandler)
  .post( isAuthenticated, hasRole("admin"), addExerciseCategoryHandler)

router.put("/:id", isAuthenticated, hasRole("admin"),  updateExerciseCategoryHandler);
router.delete("/:id", isAuthenticated, hasRole("admin"), deleteExerciseCategoryHandler);
 
export default router;