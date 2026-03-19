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

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeSecretKey) return json({ error: "Stripe not configured" }, 500);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);
  const user = userData.user;

  try {
    const { paymentIntentId, eventId, quantity, reservationId, selectedSize, customizationResponses } = await req.json();

    if (!paymentIntentId) return json({ error: "Missing paymentIntentId" }, 400);

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-08-27.basil" });
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== "succeeded") {
      return json({ error: `Payment not succeeded. Status: ${pi.status}` }, 400);
    }

    const itemType = pi.metadata.itemType;
    const itemId = pi.metadata.itemId;
    const userId = pi.metadata.userId;
    const platformFee = parseInt(pi.metadata.platformFee || "0", 10);

    if (userId !== user.id) {
      return json({ error: "Payment does not belong to this user" }, 403);
    }

    const { data: existingPurchase } = await admin
      .from("purchases")
      .select("id")
      .eq("payment_intent_id", paymentIntentId)
      .maybeSingle();

    if (existingPurchase) {
      return json({ success: true, purchaseId: existingPurchase.id, alreadyProcessed: true });
    }

    const productType = itemType === "jouvert" ? "jouvert" : itemType === "costume" ? "costume" : "ticket";
    const purchaseData: Record<string, unknown> = {
      user_id: user.id,
      event_id: eventId || pi.metadata.eventId,
      product_type: productType,
      quantity: quantity || 1,
      total_amount: pi.amount / 100,
      amount_paid: pi.amount / 100,
      balance_remaining: 0,
      status: "confirmed",
      payment_intent_id: paymentIntentId,
      platform_fee: platformFee / 100,
      organizer_payout: (pi.amount - platformFee) / 100,
      selected_size: selectedSize || null,
      customization_responses: customizationResponses || null,
    };

    if (productType === "ticket") {
      purchaseData.ticket_tier_id = itemId;
    } else if (productType === "costume") {
      purchaseData.costume_product_id = itemId;
    } else if (productType === "jouvert") {
      purchaseData.jouvert_package_id = itemId;
    }

    const { data: purchase, error: purchaseError } = await admin
      .from("purchases")
      .insert(purchaseData as any)
      .select("id")
      .single();

    if (purchaseError) {
      console.error("Purchase insert error:", purchaseError);
      return json({ error: "Failed to create purchase record" }, 500);
    }

    if (reservationId) {
      await admin.rpc("complete_reservation", {
        _reservation_id: reservationId,
        _user_id: user.id,
      });
    }

    return json({ success: true, purchaseId: purchase.id });
  } catch (err: any) {
    console.error("Confirm purchase error:", err);
    return json({ error: err.message || "Failed to confirm purchase" }, 500);
  }
});
