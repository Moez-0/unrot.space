import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const body = JSON.parse(event.body || "{}");
  console.log("Received Polar.sh webhook on Netlify:", body.type);

  try {
    // Handle subscription created or updated
    if (body.type === "subscription.created" || body.type === "subscription.updated") {
      const subscription = body.data;
      const userId = subscription.metadata?.user_id;

      if (userId) {
        const { error } = await supabase
          .from("profiles")
          .update({ subscription_tier: "pro" })
          .eq("id", userId);

        if (error) throw error;
        console.log(`User ${userId} upgraded to Pro via Polar.sh (Netlify)`);
      }
    }

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
