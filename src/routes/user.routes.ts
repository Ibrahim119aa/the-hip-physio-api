import { Router } from "express";
import { 
  resetPasswordHandler, 
  stripeWebhookAndCreateCredentialHandlerTemporary,
  getUsersHandler,
  userLoginHandler,
  adminLoginHandler,
  getUserProfileHandler,
  updateUserProfileHandler,
  adminLogoutHandler,
  getUsersForNotificationsHandler
} from "../controllers/user.controllers";
import { isAdminAuthenticated, isUserAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { hasRole } from "../middlewares/hasRole.middleware";
import { uploadProfileImage, validateProfileImageUpload } from "../middlewares/upload.middleware";

const router = Router();

// user routes
router.route("/credentials").post(stripeWebhookAndCreateCredentialHandlerTemporary)
router.route("/reset-password").post(resetPasswordHandler)
router.route("/login").post(userLoginHandler)
router.route("/profile")
  .get(isUserAuthenticated, getUserProfileHandler)
  .put(isUserAuthenticated, uploadProfileImage, validateProfileImageUpload, updateUserProfileHandler);
router.route("/notification-picklist").get(isAdminAuthenticated, getUsersForNotificationsHandler);

// Admin routes (protected by admin middleware)
router.route("/admin/login").post(adminLoginHandler)
router.route("/admin/logout").post(isAdminAuthenticated, hasRole('admin'), adminLogoutHandler)
router.route("/admin/users").get(getUsersHandler)

export default router;