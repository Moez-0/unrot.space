import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const body = JSON.parse(event.body || "{}");
  console.log("--- POLAR WEBHOOK START ---");
  console.log("Event Type:", body.type);
  
  try {
    const data = body.data;
    // Log the full data object so we can see where user_id is hiding
    console.log("Payload Data:", JSON.stringify(data, null, 2));

    // Handle any event that indicates a successful payment or subscription
    const successEvents = ["subscription.created", "subscription.updated", "order.paid", "order.created"];
    
    if (successEvents.includes(body.type)) {
      // Try to find user_id in every possible location Polar might put it
      const userId = 
        data.metadata?.user_id || 
        data.customer_metadata?.user_id || 
        data.custom_field_data?.user_id ||
        (data.metadata ? JSON.parse(JSON.stringify(data.metadata)).user_id : null);

      console.log("Discovered User ID:", userId);

      if (userId) {
        const { error } = await supabase
          .from("profiles")
          .update({ subscription_tier: "pro" })
          .eq("id", userId);

        if (error) {
          console.error("Supabase Update Failed:", error.message);
          throw error;
        }
        console.log(`>>> SUCCESS: User ${userId} is now PRO <<<`);
      } else {
        console.error("CRITICAL: No user_id found in the webhook payload. Check your Polar.sh checkout link metadata.");
      }
    }
    
    console.log("--- POLAR WEBHOOK END ---");

    // Handle subscription deleted or canceled
    if (body.type === "subscription.deleted" || body.type === "subscription.revoked") {
      const subscription = body.data;
      const userId = subscription.metadata?.user_id;

      if (userId) {
        const { error } = await supabase
          .from("profiles")
          .update({ subscription_tier: "free" })
          .eq("id", userId);

        if (error) throw error;
        console.log(`User ${userId} downgraded to Free via Polar.sh (Netlify)`);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (err) {
    console.error("Webhook error on Netlify:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
