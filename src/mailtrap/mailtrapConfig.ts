import { MailtrapClient } from "mailtrap";
import config from "../config/config.js";

const TOKEN = config.mailtrapApiToken!;
console.log("TOKEN", TOKEN)

export const client = new MailtrapClient({token: TOKEN });

export const sender = {
  email: "no-reply@demomailtrap.com",
  name: "The Hip Physio",
};