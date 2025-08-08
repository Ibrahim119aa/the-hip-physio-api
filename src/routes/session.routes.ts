import { Router } from "express";
import { createSessionHandler } from "../controllers/session.controller";

const router = Router();

router.route("/:sessionId").post(createSessionHandler);
router.route("/").post(createSessionHandler);

export default router;