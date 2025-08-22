import { Router } from "express";
import { 
  resetPasswordHandler, 
  stripeWebhookAndCreateCredentialHandlerTemporary,
  assignAdminRoleHandler,
  getUsersHandler,
  createFirstAdminHandler,
  userLoginHandler,
  adminLoginHandler,
  getUserProfileHandler,
  updateUserProfileHandler
} from "../controllers/user.controllers";
import {  } from "../middlewares/isAdmin.middleware";
import { isAdminAuthenticated, isUserAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { hasRole } from "../middlewares/hasRole.middleware";

const router = Router();

// user routes
router.route("/credentials").post(stripeWebhookAndCreateCredentialHandlerTemporary)
router.route("/reset-password").post(resetPasswordHandler)
router.route("/login").post(userLoginHandler)
router.route("/profile")
  .get(isUserAuthenticated, getUserProfileHandler)
  .put(isUserAuthenticated, updateUserProfileHandler);

// Admin routes (protected by admin middleware)
router.route("/admin/login").post(adminLoginHandler)
router.route("/admin/first-admin").post(createFirstAdminHandler)
router.route("/admin/users").get(getUsersHandler)
router.route("/admin/users/:userId/role").put(isAdminAuthenticated, hasRole('admin'), assignAdminRoleHandler)

export default router;