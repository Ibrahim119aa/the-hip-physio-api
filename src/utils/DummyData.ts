export const dummyStripeEvent = {
  id: "evt_1ABC234DEFG567HIJKL",
  object: "event",
  api_version: "2023-10-16",
  created: 1721900000,
  data: {
    object: {
      id: "cs_test_abc123xyz789",
      object: "checkout.session",
      customer_details: {
        email: "muzafar@geeksroot.com",
        name: "John Doe"
      },
      payment_status: "paid",
      amount_total: 4900,
      currency: "usd",
      metadata: {
        rehab_plan_id: "64de7d1e4f2a0c001fbcd123",
        // rehab_plan_name: "Beginner 4-Week Rehab Plan"
      },
      mode: "payment",
      payment_intent: "pi_3ExamplePaymentIntent",
      success_url: "https://yourwebflow.com/success",
      cancel_url: "https://yourwebflow.com/failed"
    }
  },
  livemode: false,
  type: "checkout.session.completed",
  pending_webhooks: 1,
  request: {
    id: "req_example123",
    idempotency_key: null
  }
};