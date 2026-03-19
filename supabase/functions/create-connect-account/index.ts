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

  if (!stripeSecretKey) {
    return json({ error: "Stripe not configured" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) {
    return json({ error: "Unauthorized" }, 401);
  }
  const user = userData.user;

  const { organizerId, action = "onboard" } = await req.json();
  if (!organizerId) {
    return json({ error: "Missing organizerId" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-08-27.basil" });

  const { data: organizer, error: orgError } = await admin
    .from("organizers")
    .select("id, name, user_id, stripe_account_id, stripe_onboarding_complete")
    .eq("id", organizerId)
    .single();

  if (orgError || !organizer) {
    return json({ error: "Organizer not found" }, 404);
  }

  if (organizer.user_id !== user.id) {
    return json({ error: "Not authorized" }, 403);
  }

  const origin = req.headers.get("origin") || "https://tifete.lovable.app";

  if (action === "status") {
    if (!organizer.stripe_account_id) {
      return json({ connected: false, onboardingComplete: false });
    }

    const account = await stripe.accounts.retrieve(organizer.stripe_account_id);
    const isComplete = account.charges_enabled && account.payouts_enabled;

    if (isComplete && !organizer.stripe_onboarding_complete) {
      await admin
        .from("organizers")
        .update({ stripe_onboarding_complete: true } as any)
        .eq("id", organizerId);
    }

    return json({
      connected: true,
      onboardingComplete: isComplete,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    });
  }

  let accountId = organizer.stripe_account_id;

  if (!accountId) {
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

    accountId = account.id;

    await admin
      .from("organizers")
      .update({ stripe_account_id: accountId } as any)
      .eq("id", organizerId);
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/dashboard?tab=settings&stripe=refresh`,
    return_url: `${origin}/dashboard?tab=settings&stripe=return`,
    type: "account_onboarding",
  });

  return json({ url: accountLink.url, accountId });
});
