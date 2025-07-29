import { Router } from "express";
import { 
  loginHandler, 
  resetPasswordHandler, 
  stripeWebhookAndCreateCredentialHandlerTemporary,
  assignAdminRoleHandler,
  getUsersHandler,
  createFirstAdminHandler
} from "../controllers/user.controller";
import { adminAuthMiddleware } from "../middlewares/isAdmin.middleware";

const router = Router();

router.route("/credentials").post(stripeWebhookAndCreateCredentialHandlerTemporary)
router.route("/reset-password").post(resetPasswordHandler)
router.route("/login").post(loginHandler)

// Admin routes (protected by admin middleware)
router.route("/admin/first-admin").post(createFirstAdminHandler)
router.route("/admin/users").get(adminAuthMiddleware, getUsersHandler)
router.route("/admin/users/:userId/role").put(adminAuthMiddleware, assignAdminRoleHandler)

export default router;