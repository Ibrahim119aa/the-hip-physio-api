import { dummyStripeEvent } from "./DummyData";

export function extractCheckoutSessionData(session: any) {
    
  if (!session || !session.metadata) {
    throw new Error("Invalid session metadata");
  }

//   return {
//     email: session.customer_email,
//     planId: session.metadata.rehab_plan_id,
//     planName: session.metadata.rehab_plan_name,
//   };

  return {
    email: dummyStripeEvent.data.object.customer_email,
    planId: dummyStripeEvent.data.object.metadata.rehab_plan_id,
    planName: dummyStripeEvent.data.object.metadata.rehab_plan_name,
  };
}
