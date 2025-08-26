import { Router } from "express";
import { isUserAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { createUserNote } from "../controllers/userNote.controllers";

const router = Router();

router.route("/").post( isUserAuthenticated, createUserNote);

export default router