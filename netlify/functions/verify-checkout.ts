import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { customer_session_token, user_id } = JSON.parse(event.body || "{}");
    
    if (!customer_session_token || !user_id) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
    }

    const polarRes = await fetch("https://api.polar.sh/v1/customer-portal/subscriptions", {
      headers: {
        "Authorization": `Bearer ${customer_session_token}`
      }
    });

    if (!polarRes.ok) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid customer session token" }) };
    }

    const polarData = await polarRes.json();
    const hasActiveSub = polarData.items?.some((sub: any) => sub.status === "active");

    if (hasActiveSub) {
      const activeSub = polarData.items.find((sub: any) => sub.status === "active");

      const { error } = await supabase
        .from("profiles")
        .update({ 
          subscription_tier: "pro",
          polar_customer_id: activeSub.customer_id,
          polar_subscription_id: activeSub.id
        })
        .eq("id", user_id);

      if (error) throw error;
      
      return { statusCode: 200, body: JSON.stringify({ success: true, upgraded: true }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, upgraded: false }) };
  } catch (err) {
    console.error("Verify checkout error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
};
