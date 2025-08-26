import { Router } from "express";
import { isUserAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { createWeeklyPsychologicalCheckIn } from "../controllers/weeklyPsychologicalCheckIn.controllers";

const router = Router();

router.route("/").post(isUserAuthenticated, createWeeklyPsychologicalCheckIn)

export default router