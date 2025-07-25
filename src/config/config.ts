import dotenv from 'dotenv';
dotenv.config(); 

const config = {
  crossOrigin: process.env.CLIENT_URL,
  clientUrl: process.env.CLIENT_URL,
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV,
  mongoURI: process.env.MONGO_URI,
  saltFactor: process.env.SALT,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeEndpointSecret: process.env.STRIPE_ENDPOINT_SECRET,
}

export default config;