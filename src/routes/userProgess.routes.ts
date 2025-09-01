import { Router } from "express";
import { getCompletedWithResilience, getPlanProgressStatus, getUserLogbookHandler, getUserProgressHandler, getUserStreakAndPgoressHanlder, markExerciseCompleteHandler, markSessionCompleteAndStreakCount } from "../controllers/userProgress.controllers";
import { isUserAuthenticated } from "../middlewares/isAuthenticated.middleware";

const router = Router();

router.route("/exercise/completed").post(isUserAuthenticated, markExerciseCompleteHandler);
router.route("/session/completed").post(isUserAuthenticated, markSessionCompleteAndStreakCount);
// router.route("/streak/:userId/:rehabPlanId").get(getUserStreakHanlder);
router.route("/streak-and-progress/:planId").get(isUserAuthenticated, getUserStreakAndPgoressHanlder);
router.route("/logbook/:userId/:rehabPlanId").get(getUserLogbookHandler);
router.route("/status/:planId/:userId").get(getPlanProgressStatus);
router.route("/status/completed/:userId/:planId").get(getCompletedWithResilience);
// router.route("/:userId/:rehabPlanId").get(getUserProgressHandler);

// changed logic added user in authentication
// router.route("/:userId/:rehabPlanId").get(getUserProgressHandler);
router.route("/:rehabPlanId").get(isUserAuthenticated, getUserProgressHandler);

export default router;