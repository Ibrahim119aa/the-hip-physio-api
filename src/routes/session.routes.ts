import { Router } from "express";
import { createSessionHandler, getExerciseBySessionId, getSessionByIdHandler } from "../controllers/session.controllers";

const router = Router();

router.route("/").post(createSessionHandler);
router.route("/:sessionId/:planId/:exerciseId").get(getExerciseBySessionId);
router.route("/:sessionId").get(getSessionByIdHandler);

export default router;