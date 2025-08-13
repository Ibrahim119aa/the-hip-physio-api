import { Router } from "express";
import { getUserProgressHandler, getUserStreakHanlder, markExerciseCompleteHandler, markSessionCompleteHandler } from "../controllers/userProgress.controllers";

const router = Router();

router.route("/exercise/completed").post(markExerciseCompleteHandler);
router.route("/session/completed").post(markSessionCompleteHandler);
router.route("/:userId/:rehabPlanId").get(getUserProgressHandler);
router.route("/streak/:userId/:rehabPlanId").get(getUserStreakHanlder);

export default router;