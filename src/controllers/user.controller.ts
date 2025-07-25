import { NextFunction, Request, Response } from "express";
import UserModel from "../models/user.model";
import createPassword from "../utils/createPassword";
import Stripe from "stripe";
import config from "../config/config";
import { TUserDocument } from "../types/user.type";
import { Types } from "mongoose";

const stripe = new Stripe(config.stripeSecretKey!, {
  apiVersion: '2025-06-30.basil',
  timeout: 8000,
  maxNetworkRetries: 2
});
const endpointSecret = config.stripeEndpointSecret!;

export const stripeWebhookAndCreateCredentialHandler = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const sig = req.headers['stripe-signature'] as string;
  const buf = req.body as Buffer;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;

        // Extract Data
        const email = session.customer_details?.email;
        const name = session.customer_details?.name || "Customer";
        const planId = session.metadata?.rehab_plan_id;
        const planName = session.metadata?.rehab_plan_name || "Rehab Plan";

        // Validate required fields
        if (!email || !planId) {
          return res.status(400).send("Missing email or planId");
        }

        // Validate planId format      
        const planIdObject = new Types.ObjectId(planId);
        const existingUser = await UserModel.findOne<TUserDocument>({ email });

        if (existingUser) {
          // Update existing user if plan not already added
          if (!existingUser.purchased_plans.includes(planIdObject)) {
            existingUser.purchased_plans.push(planIdObject);
            await existingUser.save();
          }
          return res.status(200).json({
            success: true,
            message: 'Plan added to existing user'
          });
        } else {
          // Create NEW USER with required name field
          const password = createPassword();
          
          const newUser = new UserModel({
            email,
            name,
            password,
            purchased_plans: [planIdObject],
            status: 'active',
          });

          await newUser.save();

          // Send credentials via secure email
          await sendWelcomeEmail(email, password, name, planName);

          return res.status(201).json({
            success: true,
            message: 'User created and credentials sent'
          });
        }

      default:
        console.log(`Unhandled event type ${event.type}`);
        return res.status(200).json({ received: true }); // Acknowledge event
    }
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return res.status(500).send('Internal Server Error');
  }
};