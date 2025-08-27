import { Router } from "express";
import { isUserAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { createWeeklyPsychologicalCheckIn, getWeeklyPsychologicalCheckIn } from "../controllers/weeklyPsychologicalCheckIn.controllers";

const router = Router();

router.route("/")
  .get(getWeeklyPsychologicalCheckIn)
  .post(isUserAuthenticated, createWeeklyPsychologicalCheckIn)

export default router