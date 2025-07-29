import config from "../../config/config";
import { smtpTransport } from "../../utils/smtpMailer";
// import { smtpTransport } from "../../utils/smtpMailer";
import { generateNewPasswordEmailHtml, generatePasswordResetEmailHtml } from "../htmlForEmail";
import { client, sender } from "../mailtrapConfig";

// USE FOR RESET LINK
export const sendPasswordResetEmail = async (email:string, resetURL:string, name: string) => {
  const recipient = [{ email }];
  const htmlContent = generatePasswordResetEmailHtml(resetURL, name);
console.log(config.mailtrapApiToken);

  try {
    const res = await client.send({
      from: sender,
      to: recipient,
      subject: 'Reset your password',
      html:htmlContent,
      category:"Reset Password"
    });
  } catch (error) {
    console.error("SMTP Password Reset Email error:", error);
    throw new Error("Failed to send password reset email");
  }
}

// USE FOE NEW PASSWORD
// export const sendNewPasswordEmail = async (email:string, newPassword:string, name: string) => {
//   console.log('new password send email triggered');
  
//   const recipient = [{ email }];
//   const htmlContent = generateNewPasswordEmailHtml(newPassword, name);
  
//   try {
//     const res = await client.send({
//       from: sender,
//       to: recipient,
//       subject: 'Reset your password',
//       html:htmlContent,
//       category:"Reset Password"
//     });
    
//     console.log('email response:', res);

//   } catch (error) {
//     console.error("SMTP Password Reset Email error:", error);
//     throw new Error("Failed to send password reset email");
//   }
// }

// FOR PRODUCTION
export const sendNewPasswordEmailSMTP = async ( email:string, newPassword:string, name: string ) => {
  console.log('name', name);
  console.log('email', email);
  console.log('newPassword', newPassword);
  
  const htmlContent = generateNewPasswordEmailHtml(newPassword, name);

  try {
    await smtpTransport.sendMail({
      from: `"The Hip Physio" <noreply@thehipphysio.com>`,
      to: email,
      subject: 'Reset your password',
      html: htmlContent,
    })

  } catch (error) {
    console.error("SMTP Password Reset Email error:", error);
    throw new Error("Failed to send password reset email");
  }
}

// FOR PRODUCTION
// export const sendPasswordResetEmailSMTP = async (email:string, resetURL:string, name: string) => {
//   const htmlContent = generatePasswordResetEmailHtml(resetURL, name);

//   try {
//     await smtpTransport.sendMail({
//       from: `"The Hip Physio Team" <noreply@thehipphysio.com>`,
//       to: email,
//       subject: 'Reset your password',
//       html: htmlContent,
//     })

//   } catch (error) {
//     console.error("SMTP Password Reset Email error:", error);
//     throw new Error("Failed to send password reset email");
//   }
// }


