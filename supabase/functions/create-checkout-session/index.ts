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

// Platform fee rates
const FEE_RATES: Record<string, number> = {
  ticket: 0.1,   // 10%
  costume: 0.07, // 7%
  jouvert: 0.1,  // 10%
};

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

  // ── Auth ──────────────────────────────────────────────────
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

  // ── Parse request ─────────────────────────────────────────
  const {
    eventId,
    productType,
    ticketTierId,
    costumeProductId,
    jouvertPackageId,
    quantity = 1,
    selectedSize,
    paymentOption = "full", // "full" | "deposit"
    reservationId,
    checkoutToken,
    promoterId,
    commissionRate,
    addons, // Array of { addon_id, quantity, size_label?, size_value? }
    customizationResponses, // Record<string, string> label→value
  } = await req.json();

  if (!eventId || !productType) {
    return json({ error: "Missing eventId or productType" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-08-27.basil" });

  // ── Fetch event + organizer ───────────────────────────────
  const { data: event, error: eventError } = await admin
    .from("events")
    .select("id, title, image_url, organizer_id, organizers:organizer_id(id, name, stripe_account_id, stripe_onboarding_complete)")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return json({ error: "Event not found" }, 404);
  }

  const organizer = (event as any).organizers;

  // ── Fetch product and compute price ───────────────────────
  let unitPrice = 0;
  let productName = "";
  let depositAmount: number | null = null;

  if (productType === "ticket" && ticketTierId) {
    const { data: tier } = await admin
      .from("ticket_tiers")
      .select("name, price")
      .eq("id", ticketTierId)
      .single();
    if (!tier) return json({ error: "Ticket tier not found" }, 404);
    unitPrice = Number(tier.price);
    productName = `${event.title} — ${tier.name}`;
  } else if (productType === "costume" && costumeProductId) {
    const { data: costume } = await admin
      .from("costume_products")
      .select("title, price, deposit_amount")
      .eq("id", costumeProductId)
      .single();
    if (!costume) return json({ error: "Costume not found" }, 404);
    unitPrice = Number(costume.price);
    depositAmount = costume.deposit_amount ? Number(costume.deposit_amount) : null;
    productName = `${event.title} — ${costume.title}${selectedSize ? ` (${selectedSize})` : ""}`;
  } else if (productType === "jouvert" && jouvertPackageId) {
    const { data: pkg } = await admin
      .from("jouvert_packages")
      .select("name, price")
      .eq("id", jouvertPackageId)
      .single();
    if (!pkg) return json({ error: "J'ouvert package not found" }, 404);
    unitPrice = Number(pkg.price);
    productName = `${event.title} — ${pkg.name}`;
  } else {
    return json({ error: "Invalid product type or missing product ID" }, 400);
  }

  // ── Resolve addon details ──────────────────────────────────
  interface ResolvedAddon {
    addon_id: string;
    addon_name: string;
    unit_price: number;
    quantity: number;
    size_label?: string;
    size_value?: string;
  }
  const resolvedAddons: ResolvedAddon[] = [];
  let addonsCharge = 0;

  if (addons && Array.isArray(addons) && addons.length > 0) {
    for (const a of addons) {
      const { data: addon } = await admin
        .from("product_addons")
        .select("id, name, price, has_size_options")
        .eq("id", a.addon_id)
        .single();
      if (!addon) continue;
      const qty = a.quantity || 1;
      const ra: ResolvedAddon = {
        addon_id: addon.id,
        addon_name: addon.name,
        unit_price: Number(addon.price),
        quantity: qty,
      };
      if (addon.has_size_options && a.size_value) {
        ra.size_label = a.size_label || a.size_value;
        ra.size_value = a.size_value;
      }
      resolvedAddons.push(ra);
      addonsCharge += Number(addon.price) * qty;
    }
  }

  // ── Compute charge amount ─────────────────────────────────
  const isDeposit = productType === "costume" && paymentOption === "deposit" && depositAmount && depositAmount > 0;
  const chargePerUnit = isDeposit ? depositAmount! : unitPrice;
  const totalCharge = chargePerUnit * quantity + addonsCharge;
  const totalFull = unitPrice * quantity + addonsCharge;

  // Helper to create purchase_addons rows and decrement size inventory
  async function savePurchaseAddons(purchaseId: string) {
    for (const ra of resolvedAddons) {
      await admin.from("purchase_addons").insert({
        purchase_id: purchaseId,
        addon_id: ra.addon_id,
        addon_name: ra.addon_name,
        unit_price: ra.unit_price,
        quantity: ra.quantity,
        size_label: ra.size_label || null,
        size_value: ra.size_value || null,
      });

      // Decrement addon sold_count
      const { data: addonRow } = await admin.from("product_addons").select("sold_count").eq("id", ra.addon_id).single();
      if (addonRow) {
        await admin.from("product_addons").update({ sold_count: addonRow.sold_count + ra.quantity }).eq("id", ra.addon_id);
      }

      // Decrement size inventory if applicable
      if (ra.size_value) {
        const { data: sizeRow } = await admin
          .from("addon_size_options")
          .select("id, inventory_quantity")
          .eq("addon_id", ra.addon_id)
          .eq("value", ra.size_value)
          .single();
        if (sizeRow && sizeRow.inventory_quantity != null) {
          await admin.from("addon_size_options")
            .update({ inventory_quantity: Math.max(0, sizeRow.inventory_quantity - ra.quantity) })
            .eq("id", sizeRow.id);
        }
      }
    }
  }

  // ── FREE PURCHASE: skip Stripe entirely ───────────────────
  if (totalCharge === 0) {
    try {
      const purchaseData: Record<string, unknown> = {
        user_id: user.id,
        event_id: eventId,
        product_type: productType,
        quantity,
        total_amount: 0,
        amount_paid: 0,
        balance_remaining: 0,
        status: "confirmed",
        payment_intent_id: null,
        platform_fee: 0,
        organizer_payout: 0,
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
        ...(customizationResponses && Object.keys(customizationResponses).length > 0 && {
          customization_responses: customizationResponses,
        }),
      };

      if (productType === "ticket" && ticketTierId) {
        purchaseData.ticket_tier_id = ticketTierId;
      } else if (productType === "costume" && costumeProductId) {
        purchaseData.costume_product_id = costumeProductId;
        if (selectedSize) purchaseData.selected_size = selectedSize;
      } else if (productType === "jouvert" && jouvertPackageId) {
        purchaseData.jouvert_package_id = jouvertPackageId;
      }

      const { data: purchase, error: purchaseError } = await admin
        .from("purchases")
        .insert(purchaseData as any)
        .select("id")
        .single();

      if (purchaseError) {
        console.error("Free purchase insert error:", purchaseError);
        return json({ error: "Failed to create purchase record" }, 500);
      }

      // Save addon snapshots
      await savePurchaseAddons(purchase.id);

      // Update sold_count for the product
      if (productType === "ticket" && ticketTierId) {
        const { data: tier } = await admin.from("ticket_tiers").select("sold_count").eq("id", ticketTierId).single();
        if (tier) {
          await admin.from("ticket_tiers").update({ sold_count: tier.sold_count + quantity }).eq("id", ticketTierId);
        }
      } else if (productType === "costume" && costumeProductId) {
        const { data: costume } = await admin.from("costume_products").select("inventory_sold").eq("id", costumeProductId).single();
        if (costume) {
          await admin.from("costume_products").update({ inventory_sold: costume.inventory_sold + quantity }).eq("id", costumeProductId);
        }
      } else if (productType === "jouvert" && jouvertPackageId) {
        const { data: pkg } = await admin.from("jouvert_packages").select("sold_count").eq("id", jouvertPackageId).single();
        if (pkg) {
          await admin.from("jouvert_packages").update({ sold_count: pkg.sold_count + quantity }).eq("id", jouvertPackageId);
        }
      }

      // Create ticket records for free ticket purchases
      if (productType === "ticket") {
        const ticketInserts = Array.from({ length: quantity }, () => ({
          event_id: eventId,
          owner_user_id: user.id,
          purchase_id: purchase.id,
          ticket_tier_id: ticketTierId || null,
          status: "valid",
          fulfillment_type: "digital",
          qr_token: crypto.randomUUID(),
          qr_token_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        }));
        await admin.from("tickets").insert(ticketInserts);
      }

      // Complete reservation if provided
      if (reservationId) {
        await admin.rpc("complete_reservation", {
          _reservation_id: reservationId,
          _user_id: user.id,
        });
      }

      return json({ free: true, purchaseId: purchase.id });
    } catch (err: any) {
      console.error("Free purchase error:", err);
      return json({ error: err.message || "Failed to process free purchase" }, 500);
    }
  }

  // Amount in cents for Stripe
  const amountCents = Math.round(totalCharge * 100);

  // ── Platform fee ──────────────────────────────────────────
  const feeRate = FEE_RATES[productType] ?? 0.1;
  const applicationFeeCents = Math.round(amountCents * feeRate);

  // ── Stripe customer lookup ────────────────────────────────
  let customerId: string | undefined;
  if (user.email) {
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }
  }

  // ── Build session params ──────────────────────────────────
  const origin = req.headers.get("origin") || "https://tifete.lovable.app";

  const metadata: Record<string, string> = {
    user_id: user.id,
    event_id: eventId,
    product_type: productType,
    quantity: String(quantity),
    total_amount: String(totalFull),
    amount_paid: String(totalCharge),
    balance_remaining: isDeposit ? String(totalFull - totalCharge) : "0",
    ...(ticketTierId && { ticket_tier_id: ticketTierId }),
    ...(costumeProductId && { costume_product_id: costumeProductId }),
    ...(jouvertPackageId && { jouvert_package_id: jouvertPackageId }),
    ...(selectedSize && { selected_size: selectedSize }),
    ...(reservationId && { reservation_id: reservationId }),
    ...(checkoutToken && { checkout_token: checkoutToken }),
    ...(promoterId && { promoter_id: promoterId }),
    ...(commissionRate != null && { commission_rate: String(commissionRate) }),
    ...(resolvedAddons.length > 0 && { addons_json: JSON.stringify(resolvedAddons) }),
    ...(customizationResponses && Object.keys(customizationResponses).length > 0 && {
      customization_responses_json: JSON.stringify(customizationResponses),
    }),
  };

  // Build line items: main product + addon line items
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: "usd",
        product_data: {
          name: productName,
          ...(event.image_url && { images: [event.image_url] }),
        },
        unit_amount: Math.round(chargePerUnit * 100),
      },
      quantity,
    },
  ];

  // Add each addon as a separate line item
  for (const ra of resolvedAddons) {
    const sizeLabel = ra.size_label ? ` (${ra.size_label})` : "";
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: `${ra.addon_name}${sizeLabel}` },
        unit_amount: Math.round(ra.unit_price * 100),
      },
      quantity: ra.quantity,
    });
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    customer_email: customerId ? undefined : user.email || undefined,
    line_items: lineItems,
    mode: "payment",
    metadata,
    success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/${eventId}?type=${productType}`,
    payment_intent_data: {
      metadata,
    },
  };

  // ── Stripe Connect destination charge ─────────────────────
  if (organizer?.stripe_account_id && organizer?.stripe_onboarding_complete) {
    sessionParams.payment_intent_data = {
      ...sessionParams.payment_intent_data,
      application_fee_amount: applicationFeeCents,
      transfer_data: {
        destination: organizer.stripe_account_id,
      },
    };
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    return json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error("Stripe session error:", err);
    return json({ error: err.message || "Failed to create checkout session" }, 500);
  }
});
