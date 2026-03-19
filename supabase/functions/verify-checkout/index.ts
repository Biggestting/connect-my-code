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
  const userId = userData.user.id;

  const { sessionId } = await req.json();
  if (!sessionId) {
    return json({ error: "Missing sessionId" }, 400);
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-08-27.basil" });
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });

  if (session.payment_status !== "paid") {
    return json({ error: "Payment not completed", status: session.payment_status }, 400);
  }

  const meta = session.metadata || {};

  if (meta.user_id !== userId) {
    return json({ error: "Session does not belong to this user" }, 403);
  }

  const { data: existingBySession } = await admin
    .from("purchases")
    .select("id")
    .contains("customization_responses", { stripe_session_id: sessionId } as any)
    .limit(1);

  if (existingBySession && existingBySession.length > 0) {
    return json({ success: true, purchaseId: existingBySession[0].id, alreadyProcessed: true });
  }

  const balanceRemaining = Number(meta.balance_remaining || 0);
  const purchaseStatus = balanceRemaining > 0 ? "deposit_paid" : "completed";

  const { data: purchase, error: purchaseError } = await admin
    .from("purchases")
    .insert({
      user_id: userId,
      event_id: meta.event_id,
      product_type: meta.product_type,
      ticket_tier_id: meta.ticket_tier_id || null,
      costume_product_id: meta.costume_product_id || null,
      jouvert_package_id: meta.jouvert_package_id || null,
      selected_size: meta.selected_size || null,
      quantity: Number(meta.quantity || 1),
      total_amount: Number(meta.total_amount),
      amount_paid: Number(meta.amount_paid),
      balance_remaining: balanceRemaining,
      status: purchaseStatus,
      promoter_id: meta.promoter_id || null,
      commission_rate: meta.commission_rate ? Number(meta.commission_rate) : null,
      terms_accepted: true,
      terms_version: "February 2026",
      terms_accepted_at: new Date().toISOString(),
      purchase_ip: null,
      customization_responses: { stripe_session_id: sessionId },
    } as any)
    .select("id")
    .single();

  if (purchaseError) {
    console.error("Purchase insert error:", purchaseError);
    return json({ error: "Failed to record purchase" }, 500);
  }

  if (meta.reservation_id) {
    await admin.rpc("complete_reservation", {
      _reservation_id: meta.reservation_id,
      _user_id: userId,
    });
  }

  if (meta.checkout_token) {
    await admin.rpc("consume_checkout_token", {
      _token: meta.checkout_token,
      _user_id: userId,
    });
  }

  return json({
    success: true,
    purchaseId: purchase.id,
    productType: meta.product_type,
    eventId: meta.event_id,
  });
});
