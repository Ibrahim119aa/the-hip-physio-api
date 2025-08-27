import { Router } from "express";
import { isUserAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { createUserNoteHandler, getUserNoteHandler } from "../controllers/userNote.controllers";

const router = Router();

router.route("/")
  .post( isUserAuthenticated, createUserNoteHandler);

router.route("/:noteId").get(getUserNoteHandler);


export default router