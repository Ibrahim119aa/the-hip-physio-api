import dotenv from 'dotenv';
dotenv.config(); 

const config = {
  crossOrigin: process.env.CLIENT_URL,
  clientUrl: process.env.CLIENT_URL,
  port: process.env.PORT || 4000,
  environment: process.env.ENV_NODE,
  mongoURI: process.env.MONGO_URI,
  saltFactor: process.env.SALT,
  
  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeEndpointSecret: process.env.STRIPE_ENDPOINT_SECRET,

  // mail trap
  mailtrapSmtpUser: process.env.MAILTRAP_SMTP_USER,
  mailtrapSmtpPass: process.env.MAILTRAP_SMTP_PASS,
  mailtrapApiToken: process.env.MAILTRAP_API_TOKEN,

  // JWT 
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: '1d',
  jwtCookieExpiresIn: 86400,

  iosAppLink: "not added ",
  androidAppLink:'not added'
}

export default config;