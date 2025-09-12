import config from "../../config/config";
import { smtpTransport } from "../../utils/smtpMailer";
import { htmlContent } from "../htmlForEmail";
import { client, sender } from "../mailtrapConfig";

// FOR TESTING (Mailtrap)
export const sendAccountCredentialsEmail = async (
  email: string,
  userName: string,
  generatedPassword: string,
  packageName: string,
  iosAppLink: string,
  androidAppLink: string
) => {
  console.log("this is email");
  console.log(email);
  const recipient = [{ email }];
  console.log('started sending email');


  try {

    const emailHtml = htmlContent
      .replace(/{userName}/g, userName)
      .replace(/{userEmail}/g, email)
      .replace(/{generatedPassword}/g, generatedPassword)
      .replace(/{packageName}/g, packageName)
      .replace(/{iosAppLink}/g, iosAppLink)
      .replace(/{androidAppLink}/g, androidAppLink);

    const res = await smtpTransport.sendMail({
      from: `"The Hip Physio" <noreply@thehipphysio.com>`,
      to: email,
      subject: `Your HIP Physio ${packageName} Access`,
      html: emailHtml,
    })

    // const res = await client.send({
    //   from: sender,
    //   to: recipient,
    //   subject: `Your HIP Physio ${packageName} Access`,
    //   html: emailHtml,
    //   category: 'Plan Purchase'
    // });

    return res;
  } catch (error) {
    console.error('Failed to send test account credentials email:', error);
    throw new Error("Failed to send test account credentials email");
  }
}

// FOR PRODUCTION
// export const sendAccountCredentialsEmailSMTP = async (
//   email: string,
//   userName: string,
//   generatedPassword: string,
//   packageName: string,
//   iosAppLink: string,
//   androidAppLink: string
// ) => {
//   try {
//     const emailHtml = htmlContent
//       .replace(/{userName}/g, userName)
//       .replace(/{userEmail}/g, email)
//       .replace(/{generatedPassword}/g, generatedPassword)
//       .replace(/{packageName}/g, packageName)
//       .replace(/{iosAppLink}/g, iosAppLink)
//       .replace(/{androidAppLink}/g, androidAppLink);

//     await smtpTransport.sendMail({
//       from: `"The Hip Physio Team" <noreply@thehipphysio.com>`,
//       to: email,
//       subject: `Your HIP Physio ${packageName} Access`,
//       html: emailHtml
//     });

//   } catch (error) {
//     console.error('Failed to send credentials email:', error);
//     throw new Error("Failed to send credentials email");
//   }
// }