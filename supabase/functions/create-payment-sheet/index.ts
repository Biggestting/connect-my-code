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

const FEE_RATES: Record<string, number> = {
  ticket: 0.10,
  jouvert: 0.10,
  costume: 0.07,
  product: 0.07,
};

const RESALE_PLATFORM_FEE = 0.02;

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
    const body = await req.json();
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-08-27.basil" });

    if (body.purchaseId && body.paymentAmount) {
      const { purchaseId, paymentAmount } = body;
      const paymentAmountCents = Math.round(paymentAmount);

      if (paymentAmountCents <= 0) return json({ error: "Invalid paymentAmount" }, 400);

      const { data: purchase, error: purchaseErr } = await admin
        .from("purchases")
        .select("*, events(organizer_id)")
        .eq("id", purchaseId)
        .single();

      if (purchaseErr || !purchase) return json({ error: "Purchase not found" }, 404);
      if (purchase.user_id !== user.id) return json({ error: "Not your purchase" }, 403);

      const remainingCents = Math.round((purchase.balance_remaining || 0) * 100);
      if (remainingCents <= 0) return json({ error: "No balance remaining" }, 400);
      if (paymentAmountCents > remainingCents) {
        return json({ error: `Payment exceeds remaining balance ($${(remainingCents / 100).toFixed(2)})` }, 400);
      }

      const organizerId = purchase.events?.organizer_id;
      if (!organizerId) return json({ error: "Could not determine organizer" }, 400);

      const { data: organizer } = await admin
        .from("organizers")
        .select("stripe_account_id, stripe_onboarding_complete")
        .eq("id", organizerId)
        .single();

      if (!organizer?.stripe_account_id || !organizer.stripe_onboarding_complete) {
        return json({ error: "Organizer has not completed Stripe onboarding" }, 400);
      }

      const feeRate = FEE_RATES[purchase.product_type] ?? 0.07;
      const platformFee = Math.round(paymentAmountCents * feeRate);

      const customer = await getOrCreateCustomer(stripe, user);

      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: "2025-08-27.basil" },
      );

      const paymentIntent = await stripe.paymentIntents.create({
        amount: paymentAmountCents,
        currency: "usd",
        customer: customer.id,
        automatic_payment_methods: { enabled: true },
        application_fee_amount: platformFee,
        transfer_data: {
          destination: organizer.stripe_account_id,
        },
        metadata: {
          balancePayment: "true",
          purchaseId,
          userId: user.id,
          itemType: purchase.product_type,
          itemId: purchase.costume_product_id || purchase.ticket_tier_id || purchase.jouvert_package_id || "",
          organizerId,
          platformFee: String(platformFee),
        },
      });

      return json({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id,
      });
    }

    const { amount, itemType, itemId, organizerId, listingId } = body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return json({ error: "Invalid amount" }, 400);
    }
    if (!itemType || !itemId) {
      return json({ error: "Missing itemType or itemId" }, 400);
    }

    let destinationAccountId: string;
    let amountCents = Math.round(amount);
    let platformFee: number;
    let extraMetadata: Record<string, string> = {};

    if (itemType === "resale") {
      if (!listingId) return json({ error: "Missing listingId for resale" }, 400);

      const { data: listing, error: listingErr } = await admin
        .from("marketplace_listings")
        .select("id, seller_id, ticket_tier_id, event_id, asking_price, status, purchase_id")
        .eq("id", listingId)
        .single();

      if (listingErr || !listing) return json({ error: "Listing not found" }, 404);
      if (listing.status !== "active") return json({ error: "Listing is no longer active" }, 400);
      if (listing.seller_id === user.id) return json({ error: "Cannot buy your own listing" }, 400);

      const { data: sellerOrg } = await admin
        .from("organizers")
        .select("id, stripe_account_id, stripe_onboarding_complete")
        .eq("user_id", listing.seller_id)
        .eq("stripe_onboarding_complete", true)
        .maybeSingle();

      if (!sellerOrg?.stripe_account_id) {
        return json({ error: "Seller has not completed payout setup" }, 400);
      }

      destinationAccountId = sellerOrg.stripe_account_id;
      platformFee = Math.round(amountCents * RESALE_PLATFORM_FEE);
      extraMetadata = {
        listingId: listing.id,
        sellerId: listing.seller_id,
        eventId: listing.event_id,
        ticketTierId: listing.ticket_tier_id,
        purchaseId: listing.purchase_id,
      };
    } else {
      if (!organizerId) return json({ error: "Missing organizerId" }, 400);

      const { data: organizer, error: orgError } = await admin
        .from("organizers")
        .select("id, stripe_account_id, stripe_onboarding_complete")
        .eq("id", organizerId)
        .single();

      if (orgError || !organizer) return json({ error: "Organizer not found" }, 404);
      if (!organizer.stripe_account_id || !organizer.stripe_onboarding_complete) {
        return json({ error: "Organizer has not completed Stripe onboarding" }, 400);
      }

      destinationAccountId = organizer.stripe_account_id;
      const feeRate = FEE_RATES[itemType] ?? 0.10;
      platformFee = Math.round(amountCents * feeRate);
      if (organizerId) extraMetadata.organizerId = organizerId;
    }

    const customer = await getOrCreateCustomer(stripe, user);

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2025-08-27.basil" },
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
      application_fee_amount: platformFee,
      transfer_data: {
        destination: destinationAccountId,
      },
      metadata: {
        itemType,
        itemId,
        userId: user.id,
        platformFee: String(platformFee),
        ...extraMetadata,
      },
    });

    return json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
    });
  } catch (err: any) {
    console.error("PaymentSheet error:", err);
    return json({ error: err.message || "Failed to create payment sheet" }, 500);
  }
});

async function getOrCreateCustomer(stripe: Stripe, user: { id: string; email?: string }) {
  const existing = await stripe.customers.list({ email: user.email!, limit: 1 });
  if (existing.data.length > 0) return existing.data[0];
  return stripe.customers.create({
    email: user.email!,
    metadata: { supabase_user_id: user.id },
  });
}
