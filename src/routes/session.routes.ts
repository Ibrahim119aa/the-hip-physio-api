import { Router } from "express";
import { addExercisesToSessionHandler, createSessionHandler, getExerciseBySessionId, getSessionByIdHandler, getSessionsForRehabPlanHandler, removeExerciseFromSessionHandler } from "../controllers/session.controllers";
import { isAdminAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { hasRole } from "../middlewares/hasRole.middleware";

const router = Router();

router.route("/").post(isAdminAuthenticated, hasRole('admin'), createSessionHandler);
router.route("/plan/:planId").get(getSessionsForRehabPlanHandler);
router.route("/:sessionId/exercises/:exerciseId").delete(isAdminAuthenticated, hasRole('admin'), removeExerciseFromSessionHandler);
router.route('/:sessionId/exercises').post(isAdminAuthenticated, hasRole('admin'), addExercisesToSessionHandler);
router.route("/:sessionId/:planId/:exerciseId").get(getExerciseBySessionId);
router.route("/:sessionId").get(getSessionByIdHandler);

export default router;
