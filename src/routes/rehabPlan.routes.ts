import { Router } from "express";
import { assigPlanToUserHandler, createRehabPlanHandler, deleteRehabPlanHandler, getAllRehabPlansHandler, getPlanScheduleHandler, getRehabPlanByIdHandler, updateRehabPlanHandler } from "../controllers/rehabPlan.controllers";
import { addRehabPlanCategoryHandler, deleteRehabPlanCategoryHandler, getAllRehabPlabCategoriesHandler, updateRehabPlanCategoryHandler } from "../controllers/rehabPlanCategory.controllers";
import { isAdminAuthenticated, isUserAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { hasRole } from "../middlewares/hasRole.middleware";
import { addRehabPlanEquipmentHandler, deleteRehabPlanEquipmentHandler, getAllRehabPlabEqupmentsHandler, updateRehabPlanEquipmentHandler } from "../controllers/rehabPlansEquipments.controller";
import { addRehabPlanEducationalVideoHandler, getRehabPlanEducationalVideosByUser  } from "../controllers/RehabPlanEducationVideo.controller";

const router = Router();


/** Rehab plan category Routes */
router.route("/category")
  .get(getAllRehabPlabCategoriesHandler)
  .post(isAdminAuthenticated, hasRole("admin"), addRehabPlanCategoryHandler)


router.route("/educational-video").post(isAdminAuthenticated, hasRole("admin"), addRehabPlanEducationalVideoHandler)
router.route('/educational-video').get(getRehabPlanEducationalVideosByUser);
router.route("/equipments")
  .get(getAllRehabPlabEqupmentsHandler)
  .post(isAdminAuthenticated, hasRole("admin"), addRehabPlanEquipmentHandler)

router.route("/category/:id")
  .put(isAdminAuthenticated, hasRole("admin"), updateRehabPlanCategoryHandler)
  .delete(isAdminAuthenticated, hasRole("admin"), deleteRehabPlanCategoryHandler);


router.route("/equipments/:id")
  .put(isAdminAuthenticated, hasRole("admin"), updateRehabPlanEquipmentHandler)
  .delete(isAdminAuthenticated, hasRole("admin"), deleteRehabPlanEquipmentHandler);

/** Rehab plans Routes */
router.route("/")
  .post(isAdminAuthenticated, hasRole('admin'), createRehabPlanHandler)
  .get(getAllRehabPlansHandler)
router.route("/:planId/assign").post(isAdminAuthenticated, hasRole('admin'), assigPlanToUserHandler);
router.route('/:planId/schedule').get(getPlanScheduleHandler);
router.route("/:planId")
  .get(isUserAuthenticated, getRehabPlanByIdHandler)
  .put(isAdminAuthenticated, hasRole('admin'), updateRehabPlanHandler)
  .delete(isAdminAuthenticated, hasRole('admin'), deleteRehabPlanHandler);
export default router;