import dotenv from 'dotenv';
dotenv.config(); 

const config = {
  crossOrigin: process.env.CLIENT_URL,
  clientUrl: process.env.CLIENT_URL,
  port: process.env.PORT || 4000,
  environment: process.env.ENV_NODE,
  mongoURI: process.env.MONGO_URI,
  saltFactor: process.env.SALT,
  sendGridApiKey: process.env.SENDGRID_API_KEY,
  senderEmail: process.env.SENDER_EMAIL,
  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeEndpointSecret: process.env.STRIPE_ENDPOINT_SECRET,
  GMAIL_USERNAME:process.env.GMAIL_USERNAME,
  GMAIL_PASSWORD:process.env.GMAIL_PASSWORD,
  // mail trap
  mailtrapSmtpUser: process.env.MAILTRAP_SMTP_USER,
  mailtrapSmtpPass: process.env.MAILTRAP_SMTP_PASS,
  mailtrapApiToken: process.env.MAILTRAP_API_TOKEN,

  // JWT 
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: '1d',
  jwtCookieExpiresIn: 86400,

  iosAppLink: "not added ",
  androidAppLink:'not added',

  // Cloudinary
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  webhookUrl: process.env.WEBHOOK_URL || '',

  // Firebase
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY
  // ?.replace(/\\n/g, '\n'),

}

export default config;