import { Router } from "express";
import { createRehabPlanHandler, getAllRehabPlansHandler } from "../controllers/rehabPlan.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { hasRole } from "../middlewares/hasRole.middleware";

const router = Router();

router.route("/")
  .post( isAuthenticated, hasRole('admin'), createRehabPlanHandler)
  .get(getAllRehabPlansHandler)    

  export default router;