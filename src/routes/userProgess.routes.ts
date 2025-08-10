import { Router } from "express";
import { markExerciseCompleteHandler } from "../controllers/userProgress.controllers";

const router = Router();

router.route("/exercise/completed").post(markExerciseCompleteHandler);

export default router;