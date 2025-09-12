import { MailtrapClient } from "mailtrap";
import config from "../config/config.js";

const TOKEN = config.mailtrapApiToken!;
console.log("TOKEN", TOKEN)

export const client = new MailtrapClient({token: TOKEN });

// export const sender = {
//   email: "no-reply@demomailtrap.com",
//   name: "The Hip Physio",
// };
export const sender = {
  email: "ibrahimmemon1709@gmail.com", // works for sandbox
  name: "The Hip Physio",
};
