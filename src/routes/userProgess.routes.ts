import { Router } from "express";
import { getCompletedWithResilience, getPlanProgressStatus, getProgressPercent, getUserLogbookHandler, getUserProgressHandler, getUserStreakHanlder, getUserStreakHanlderTesting, markExerciseCompleteHandler, markSessionCompleteAndStreakCount } from "../controllers/userProgress.controllers";
import { isUserAuthenticated } from "../middlewares/isAuthenticated.middleware";

const router = Router();

router.route("/exercise/completed").post(isUserAuthenticated, markExerciseCompleteHandler);
router.route("/session/completed").post(isUserAuthenticated, markSessionCompleteAndStreakCount);
// router.route("/streak/:userId/:rehabPlanId").get(getUserStreakHanlder);
router.route("/streak/:userId/:planId").get(getUserStreakHanlderTesting);
router.route("/logbook/:userId/:rehabPlanId").get(getUserLogbookHandler);
router.route("/status/:planId/:userId").get(getPlanProgressStatus);
router.route("/status/completed/:userId/:planId").get(getCompletedWithResilience);
router.route("/progress-percent/:planId").get(isUserAuthenticated, getProgressPercent);
// router.route("/:userId/:rehabPlanId").get(getUserProgressHandler);

// changed logic added user in authentication
router.route("/:rehabPlanId").get(isUserAuthenticated, getUserProgressHandler);
router.route("/:userId/:rehabPlanId").get(getUserProgressHandler);

export default router;