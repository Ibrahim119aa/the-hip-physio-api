import { Router } from "express";
import { isAdminAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { createContentHandler, deleteContentHandler, getAllContentHandler, getSingleContentHandler, updateContentHandler } from "../controllers/editableContent.controllers";

const router = Router();

router.route("/").get(getAllContentHandler)

router.route("/:slug")
  .get(getSingleContentHandler)
  .post(isAdminAuthenticated, createContentHandler)
  .put(isAdminAuthenticated, updateContentHandler)
  .delete(isAdminAuthenticated, deleteContentHandler);

export default router;