import { Router } from "express"
import { addExerciseCategoryHandler, deleteExerciseCategoryHandler, getAllCategoriesHandler, updateExerciseCategoryHandler } from "../controllers/exerciseCategory.controllers";
import { isAdminAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { hasRole } from "../middlewares/hasRole.middleware";

const router = Router();

router.route("/")
  .get(getAllCategoriesHandler)
  .post( isAdminAuthenticated, hasRole("admin"), addExerciseCategoryHandler)

router.put("/:id", isAdminAuthenticated, hasRole("admin"),  updateExerciseCategoryHandler);
router.delete("/:id", isAdminAuthenticated, hasRole("admin"), deleteExerciseCategoryHandler);
 
export default router;