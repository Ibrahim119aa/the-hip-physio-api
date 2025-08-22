import { Router } from "express";
import NotificationModel from "../models/notifications.model";

const router = Router();

router.route("/").get(async (req, res) => {
  await NotificationModel.create();

  res.send("Hello World!");
});

export default router;