import { Router } from "express";
import { getCompletedWithResilience, getUserPlanProgress, getUserProgressHandler,getUserStreakAndProgressHandler, markExerciseCompleteHandler, markSessionCompleteAndStreakCount } from "../controllers/userProgress.controllers";
import { isUserAuthenticated } from "../middlewares/isAuthenticated.middleware";

const router = Router();

router.route("/exercise/completed").post(isUserAuthenticated, markExerciseCompleteHandler);
router.route("/session/completed").post(isUserAuthenticated, markSessionCompleteAndStreakCount);
router.route("/streak-and-progress").get(isUserAuthenticated, getUserStreakAndProgressHandler);
router.route("/status/:planId/:userId").get(getUserPlanProgress);
router.route("/status/completed/:userId/:planId").get(getCompletedWithResilience);
router.route("/:rehabPlanId").get(isUserAuthenticated, getUserProgressHandler);

export default router;