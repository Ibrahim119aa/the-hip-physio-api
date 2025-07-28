import { NextFunction, Request, Response } from "express";
import UserModel from "../models/user.model";
import createPassword from "../utils/createPassword";
import Stripe from "stripe";
import config from "../config/config";
import { TUserDocument } from "../types/user.type";
import { Types } from "mongoose";
import { sendAccountCredentialsEmail } from "../mailtrap/emails/sendAccountCredentialsEmail";
import { dummyStripeEvent } from "../utils/DummyData";
import ErrorHandler from "../utils/errorHandlerClass";
import { sendPasswordResetEmail } from "../mailtrap/emails/sendPasswordResetEmail";
// import { sendPasswordResetEmailSMTP } from "../mailtrap/emails/sendPasswordResetEmail";


// const stripe = new Stripe(config.stripeSecretKey!, {
//   apiVersion: '2025-06-30.basil',
//   timeout: 8000,
//   maxNetworkRetries: 2
// });
// const endpointSecret = config.stripeEndpointSecret!;

// export const stripeWebhookAndCreateCredentialHandler = async (
//   req: Request, 
//   res: Response, 
//   next: NextFunction
// ) => {
//   const sig = req.headers['stripe-signature'] as string;
//   const buf = req.body as Buffer;

//   let event: Stripe.Event;

//   try {
//     event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
//   } catch (error: any) {
//     console.error('Webhook signature verification failed:', error.message);
//     return res.status(400).send(`Webhook Error: ${error.message}`);
//   }

//   try {
//     switch (event.type) {
//       case 'checkout.session.completed':
//         const session = event.data.object as Stripe.Checkout.Session;

//         // Extract Data
//         const email = session.customer_details?.email;
//         const name = session.customer_details?.name || "Customer";
//         const planId = session.metadata?.rehab_plan_id;
//         const rehabPlan = session.metadata?.rehab_plan_name || "Rehab Plan";

//         // Validate required fields
//         if (!email || !planId) {
//           return res.status(400).send("Missing email or planId");
//         }

//         // Validate planId format      
//         const planIdObject = new Types.ObjectId(planId);
//         const existingUser = await UserModel.findOne<TUserDocument>({ email });

//         if (existingUser) {
//           // Update existing user if plan not already added
//           if (!existingUser.purchasedPlans.includes(planIdObject)) {
//             existingUser.purchasedPlans.push(planIdObject);
//             await existingUser.save();
//           }
//           return res.status(200).json({
//             success: true,
//             message: 'Plan added to existing user'
//           });
//         } else {
//           // Create NEW USER with required name field
//           const generatedPassword = createPassword();
          
//           const newUser = new UserModel({
//             email,
//             name,
//             password: generatedPassword,
//             purchased_plans: [planIdObject],
//             status: 'active',
//           });

//           await newUser.save();

//           // Send credentials via secure email
//           await sendAccountCredentialsEmail(
//             email, 
//             name, 
//             generatedPassword, 
//             rehabPlan, 
//             config.iosAppLink, 
//             config.androidAppLink
//           )

//           return res.status(201).json({
//             success: true,
//             message: 'User created and credentials sent'
//           });
//         }

//       default:
//         console.log(`Unhandled event type ${event.type}`);
//         return res.status(200).json({ received: true }); // Acknowledge event
//     }
//   } catch (error) {
//     console.error('Error in webhook handler:', error);
//     return res.status(500).send('Internal Server Error');
//   }
// };


export const stripeWebhookAndCreateCredentialHandlerTemporary = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const session = dummyStripeEvent.data.object;
    
    // Extract Data
    const email = session.customer_details?.email;
    const name = session.customer_details?.name || "Customer";
    const planId = session.metadata?.rehab_plan_id;
    const rehabPlan = session.metadata?.rehab_plan_name || "Rehab Plan";

    // Validate required fields
    if (!email || !planId) {
      return res.status(400).send("Missing email or planId");
    }

    // Validate planId format      
    const planIdObject = new Types.ObjectId(planId);
    const existingUser = await UserModel.findOne<TUserDocument>({ email });

    if (existingUser) {
      // Update existing user if plan not already added
      if (!existingUser.purchasedPlans.includes(planIdObject)) {
        existingUser.purchasedPlans.push(planIdObject);
        await existingUser.save();
      }
      return res.status(200).json({
        success: true,
        message: 'Plan added to existing user'
      });
    } else {
      // Create NEW USER with required name field
      const generatedPassword = createPassword();
      console.log('generatedPassword', generatedPassword);
      
      const newUser = new UserModel({
        email,
        name,
        password: generatedPassword,
        purchasedPlans: [planIdObject],
        status: 'active',
      });

      await newUser.save();

      // Send credentials via secure email
      // await sendAccountCredentialsEmail(
      //   email, 
      //   name, 
      //   generatedPassword, 
      //   rehabPlan, 
      //   config.iosAppLink, 
      //   config.androidAppLink
      // );

      return res.status(201).json({
        success: true,
        message: 'User created and credentials sent'
      });
    }
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return res.status(500).send('Internal Server Error');
  }
};

export const loginHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ErrorHandler(400, 'Email and password are required');
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new ErrorHandler(404, 'Invalid credentials');
    }

    // const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      // token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        purchasedPlans: user.purchasedPlans,
        status: user.status
      }
    });

  } catch (error) {
    console.error('loginHandler error', error);
    next(error)
  }
}

export const resetPasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ErrorHandler(400, 'Email is required');
    }

    // Find user and handle not found
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new ErrorHandler(404, 'User not found');
    }

    // Generate and set new password
    const generatedPassword = createPassword();
    user.password = generatedPassword; // Ensure pre-save hook hashes this
    await user.save();
    
    await sendPasswordResetEmail(email, 'http', user.name)

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });

  } catch (error) {
    console.error('resetPasswordHandler error', error);
    next(error)
  }
}

