import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Polar.sh Webhook Endpoint
  // Note: In a real app, you'd use @polar-sh/sdk to verify the signature
  app.post("/api/webhooks/polar", express.json(), async (req, res) => {
    const event = req.body;
    
    console.log("Received Polar.sh webhook:", event.type);

    try {
      // Handle subscription created or updated
      if (event.type === "subscription.created" || event.type === "subscription.updated") {
        const subscription = event.data;
        const userId = subscription.metadata?.user_id || subscription.metadata?.reference_id || subscription.custom_field_data?.user_id;

        if (userId) {
          const { error } = await supabase
            .from("profiles")
            .update({ subscription_tier: "pro" })
            .eq("id", userId);

          if (error) throw error;
          console.log(`User ${userId} upgraded to Pro via Polar.sh`);
        }
      }

      // Handle subscription deleted or canceled
      if (event.type === "subscription.deleted" || event.type === "subscription.revoked") {
        const subscription = event.data;
        const userId = subscription.metadata?.user_id || subscription.metadata?.reference_id || subscription.custom_field_data?.user_id;

        if (userId) {
          const { error } = await supabase
            .from("profiles")
            .update({ subscription_tier: "free" })
            .eq("id", userId);

          if (error) throw error;
          console.log(`User ${userId} downgraded to Free via Polar.sh`);
        }
      }

      res.status(200).json({ received: true });
    } catch (err) {
      console.error("Webhook error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
