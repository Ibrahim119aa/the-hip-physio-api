import { Router } from "express";
import { assigPlanToUserHandler, createRehabPlanHandler, deleteRehabPlanHandler, getAllRehabPlansHandler, getRehabPlanByIdHandler, updateRehabPlanHandler } from "../controllers/rehabPlan.controllers";
import { addRehabPlanCategoryHandler, deleteRehabPlanCategoryHandler, getAllRehabPlabCategoriesHandler, updateRehabPlanCategoryHandler } from "../controllers/rehabPlanCategory.controllers";
import { isAdminAuthenticated, isUserAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { hasRole } from "../middlewares/hasRole.middleware";

const router = Router();


/** Rehab plan category Routes */ 
router.route("/category")
  .get(getAllRehabPlabCategoriesHandler)
  .post( isAdminAuthenticated, hasRole("admin"), addRehabPlanCategoryHandler)
  
router.route("/category/:id")
  .put(isAdminAuthenticated, hasRole("admin"),  updateRehabPlanCategoryHandler)
  .delete(isAdminAuthenticated, hasRole("admin"), deleteRehabPlanCategoryHandler);

/** Rehab plans Routes */ 
router.route("/")
  .post(isAdminAuthenticated, createRehabPlanHandler)
  .get(getAllRehabPlansHandler)
router.route("/:planId/assign").post(isAdminAuthenticated, assigPlanToUserHandler);  
router.route("/:planId")
  .get(isUserAuthenticated, getRehabPlanByIdHandler)
  .put(isAdminAuthenticated, hasRole('admin'), updateRehabPlanHandler)
  .delete(isAdminAuthenticated, hasRole('admin'), deleteRehabPlanHandler);

export default router;