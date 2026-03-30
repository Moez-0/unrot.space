import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const body = JSON.parse(event.body || "{}");
  console.log("--- POLAR WEBHOOK DEBUG ---");
  console.log("Event Type:", body.type);
  console.log("Full Body:", JSON.stringify(body, null, 2));
  
  try {
    const data = body.data;
    // Polar.sh events that indicate an active subscription
    const successEvents = [
      "subscription.created", 
      "subscription.updated", 
      "subscription.active", 
      "order.paid", 
      "order.created"
    ];
    
    if (successEvents.includes(body.type)) {
      // Try every possible metadata path
      const userId = 
        data.metadata?.user_id || 
        data.metadata?.reference_id ||
        data.customer_metadata?.user_id || 
        data.custom_field_data?.user_id ||
        (data.metadata && typeof data.metadata === 'string' ? JSON.parse(data.metadata).user_id : null);

      console.log("Extracted User ID:", userId);

      if (userId) {
        const { error } = await supabase
          .from("profiles")
          .update({ subscription_tier: "pro" })
          .eq("id", userId);

        if (error) {
          console.error("Supabase Update Error:", error.message);
          throw error;
        }
        console.log(`>>> SUCCESS: User ${userId} is now PRO <<<`);
      } else {
        console.error("CRITICAL: No user_id found. Metadata might be missing from the checkout session.");
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
