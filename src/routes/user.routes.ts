import { Router } from "express";
import { loginHandler, resetPasswordHandler, stripeWebhookAndCreateCredentialHandlerTemporary } from "../controllers/user.controller";

const router = Router();

router.route("/credentials").post(stripeWebhookAndCreateCredentialHandlerTemporary)
router.route("/reset-password").post(resetPasswordHandler)
router.route("/login").post(loginHandler)

export default router;