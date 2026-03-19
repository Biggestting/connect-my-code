import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (!stripeSecretKey) return json({ error: "Stripe not configured" }, 500);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);
  const user = userData.user;

  try {
    const { organizerId } = await req.json();
    if (!organizerId) return json({ error: "Missing organizerId" }, 400);

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-08-27.basil" });

    const { data: organizer, error: orgError } = await admin
      .from("organizers")
      .select("id, name, user_id, stripe_account_id")
      .eq("id", organizerId)
      .single();

    if (orgError || !organizer) return json({ error: "Organizer not found" }, 404);
    if (organizer.user_id !== user.id) return json({ error: "Not authorized" }, 403);

    if (organizer.stripe_account_id) {
      return json({ accountId: organizer.stripe_account_id, alreadyExists: true });
    }

    const account = await stripe.accounts.create({
      type: "express",
      email: user.email || undefined,
      metadata: {
        organizer_id: organizerId,
        user_id: user.id,
      },
      business_profile: {
        name: organizer.name,
        product_description: "Event tickets and carnival costume sales",
      },
    });

    await admin
      .from("organizers")
      .update({ stripe_account_id: account.id } as any)
      .eq("id", organizerId);

    return json({ accountId: account.id, alreadyExists: false });
  } catch (err: any) {
    console.error("Connect create-account error:", err);
    return json({ error: err.message || "Failed to create account" }, 500);
  }
});
