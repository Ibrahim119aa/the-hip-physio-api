import { Router } from "express";
import { getPlanProgressStatus, getUserLogbookHandler, getUserProgressHandler, getUserStreakHanlder, markExerciseCompleteHandler, markSessionCompleteHandler } from "../controllers/userProgress.controllers";
import { isUserAuthenticated } from "../middlewares/isAuthenticated.middleware";

const router = Router();

// router.route("/exercise/completed").post(markExerciseCompleteHandler);
// router.route("/session/completed").post(markSessionCompleteHandler);
// router.route("/:userId/:rehabPlanId").get(getUserProgressHandler);
// router.route("/streak/:userId/:rehabPlanId").get(getUserStreakHanlder);
// router.route("/:planId/progress-status").get(getPlanProgressStatus);

router.route("/exercise/completed").post(isUserAuthenticated, markExerciseCompleteHandler);
router.route("/session/completed").post(isUserAuthenticated, markSessionCompleteHandler);
router.route("/streak/:userId/:rehabPlanId").get(getUserStreakHanlder);
router.route("/logbook/:userId/:rehabPlanId").get(getUserLogbookHandler);
router.route("/status/:planId/:userId").get(getPlanProgressStatus);
router.route("/:userId/:rehabPlanId").get(getUserProgressHandler);

export default router;