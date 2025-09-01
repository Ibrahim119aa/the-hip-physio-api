import { Router } from "express";
import { isAdminAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { createContentHandler, deleteContentHandler, getAllContentHandler, getSingleContentHandler, updateContentHandler } from "../controllers/editableContent.controllers";
import { hasRole } from "../middlewares/hasRole.middleware";

const router = Router();

router.route("/").get(getAllContentHandler)

router.route("/:slug")
  .get(getSingleContentHandler)
  .post( isAdminAuthenticated, hasRole('admin'), createContentHandler)
  .put( isAdminAuthenticated, hasRole('admin'), updateContentHandler)
  .delete(isAdminAuthenticated, hasRole("admin"), deleteContentHandler);

export default router;