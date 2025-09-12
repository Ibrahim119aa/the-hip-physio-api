
import nodemailer from "nodemailer";
import config from "../config/config.js";

// export const smtpTransport = nodemailer.createTransport({
//   host: "smtp.mailtrap.io",
//   port: 587,
//   auth: {
//     user: config.mailtrapSmtpUser,
//     pass: config.mailtrapSmtpPass,
//   },
// });

// testing purpose
console.log('config.mailtrapSmtpUser', config.mailtrapSmtpUser);
console.log('config.mailtrapSmtpPass', config.mailtrapSmtpPass);

export const smtpTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.GMAIL_USERNAME,
    pass: config.GMAIL_PASSWORD,    // use an App Password (not Gmail login password)
  },
});

// export const smtpTransport = nodemailer.createTransport({
//   host: "sandbox.smtp.mailtrap.io",
//   port: 2525,
//   auth: {
//     user: config.mailtrapSmtpUser,
//     pass: config.mailtrapSmtpPass,
//   },
// });
