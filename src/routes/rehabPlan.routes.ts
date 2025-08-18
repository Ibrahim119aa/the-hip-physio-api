import { Router } from "express";
import { createRehabPlanCategory, createRehabPlanHandler, deleteRehabPlanHandler, getAllRehabPlanCategories, getAllRehabPlansHandler, getRehabPlanByIdHandler, updateRehabPlanHandler } from "../controllers/rehabPlan.controllers";
import { isAdminAuthenticated, isUserAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { hasRole } from "../middlewares/hasRole.middleware";

const router = Router();

router.route("/")
  .post(createRehabPlanHandler)
  .get(getAllRehabPlansHandler)
  
  // router.route("/:planId")
  // .put(isAuthenticated, hasRole('admin'), updateRehabPlanHandler)
  // .delete(isAuthenticated, hasRole('admin'), deleteRehabPlanHandler);

router.route("/category")
  .post(isAdminAuthenticated, hasRole('admin'), createRehabPlanCategory)
  .get(getAllRehabPlanCategories)

router.route("/:planId")
  .get(isUserAuthenticated, getRehabPlanByIdHandler)
  .put(updateRehabPlanHandler)
  .delete( deleteRehabPlanHandler);

  export default router;