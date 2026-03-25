import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeSecretKey || !webhookSecret) {
    return json({ error: "Stripe not configured" }, 500);
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-08-27.basil" });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return json({ error: "Missing signature" }, 400);

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return json({ error: "Invalid signature" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = pi.id;
        const userId = pi.metadata?.userId;
        const itemType = pi.metadata?.itemType;
        const itemId = pi.metadata?.itemId;
        const platformFee = parseInt(pi.metadata?.platformFee || "0", 10);
        const isBalancePayment = pi.metadata?.balancePayment === "true";
        const purchaseIdFromMeta = pi.metadata?.purchaseId;

        // ── Balance payment on existing purchase ─────────────
        if (isBalancePayment && purchaseIdFromMeta) {
          const { data: purchase } = await admin
            .from("purchases")
            .select("id, total_amount, amount_paid, balance_remaining, status")
            .eq("id", purchaseIdFromMeta)
            .single();

          if (!purchase) {
            console.log(`Balance payment: purchase ${purchaseIdFromMeta} not found`);
            break;
          }

          const paymentAmountDollars = pi.amount / 100;
          const newAmountPaid = (purchase.amount_paid || 0) + paymentAmountDollars;
          const newBalance = Math.max(0, purchase.total_amount - newAmountPaid);
          const newStatus = newBalance <= 0 ? "confirmed" : "partial";

          await admin
            .from("purchases")
            .update({
              amount_paid: newAmountPaid,
              balance_remaining: newBalance,
              status: newStatus,
              platform_fee: (purchase.platform_fee || 0) + platformFee / 100,
              organizer_payout: (purchase.organizer_payout || 0) + (pi.amount - platformFee) / 100,
            } as any)
            .eq("id", purchaseIdFromMeta);

          console.log(`Balance payment applied to purchase ${purchaseIdFromMeta}: paid +$${paymentAmountDollars}, remaining $${newBalance}, status=${newStatus}`);
          break;
        }

        if (!userId || !itemType || !itemId) {
          console.log("PaymentIntent missing metadata, skipping auto-creation");
          break;
        }

        // ── Resale completion ─────────────────────────────────
        if (itemType === "resale") {
          const listingId = pi.metadata?.listingId;
          const sellerId = pi.metadata?.sellerId;
          const purchaseId = pi.metadata?.purchaseId;

          if (!listingId || !sellerId) {
            console.log("Resale PI missing listing/seller metadata");
            break;
          }

          const { data: listing } = await admin
            .from("marketplace_listings")
            .select("id, status")
            .eq("id", listingId)
            .single();

          if (listing?.status === "sold") {
            console.log(`Listing ${listingId} already sold`);
            break;
          }

          const { data: ticket } = await admin
            .from("tickets")
            .select("id, owner_user_id, transfer_history, event_id, ticket_tier_id")
            .eq("purchase_id", purchaseId)
            .eq("owner_user_id", sellerId)
            .eq("status", "valid")
            .limit(1)
            .single();

          if (ticket) {
            const newToken = crypto.randomUUID();
            const transferRecord = {
              action: "resale",
              from: sellerId,
              to: userId,
              at: new Date().toISOString(),
              paymentIntentId,
            };

            await admin
              .from("tickets")
              .update({
                owner_user_id: userId,
                qr_token: newToken,
                qr_token_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
                resale_status: "sold",
                updated_at: new Date().toISOString(),
                transfer_history: [...(ticket.transfer_history as any[] || []), transferRecord],
              })
              .eq("id", ticket.id);

            console.log(`Ticket ${ticket.id} transferred from ${sellerId} to ${userId}`);
          }

          await admin
            .from("marketplace_listings")
            .update({
              status: "sold",
              buyer_id: userId,
              updated_at: new Date().toISOString(),
            } as any)
            .eq("id", listingId);

          console.log(`Resale listing ${listingId} completed for PI ${paymentIntentId}`);
          break;
        }

        // ── Standard purchase fallback ────────────────────────
        const { data: existing } = await admin
          .from("purchases")
          .select("id")
          .eq("payment_intent_id", paymentIntentId)
          .maybeSingle();

        if (existing) {
          console.log(`Purchase already exists for ${paymentIntentId}`);
          break;
        }

        const productType = itemType === "jouvert" ? "jouvert" : itemType === "costume" ? "costume" : "ticket";
        const purchaseData: Record<string, unknown> = {
          user_id: userId,
          event_id: pi.metadata.eventId || null,
          product_type: productType,
          quantity: parseInt(pi.metadata.quantity || "1", 10),
          total_amount: pi.amount / 100,
          amount_paid: pi.amount / 100,
          balance_remaining: 0,
          status: "confirmed",
          payment_intent_id: paymentIntentId,
          platform_fee: platformFee / 100,
          organizer_payout: (pi.amount - platformFee) / 100,
          ...(pi.metadata.selected_size && { selected_size: pi.metadata.selected_size }),
          ...(pi.metadata.customization_responses_json && {
            customization_responses: JSON.parse(pi.metadata.customization_responses_json),
          }),
        };

        if (productType === "ticket") purchaseData.ticket_tier_id = itemId;
        else if (productType === "costume") purchaseData.costume_product_id = itemId;
        else if (productType === "jouvert") purchaseData.jouvert_package_id = itemId;

        const { data: newPurchase } = await admin.from("purchases").insert(purchaseData as any).select("id").single();

        // Save addon snapshots from metadata
        if (newPurchase && pi.metadata.addons_json) {
          try {
            const addonsData = JSON.parse(pi.metadata.addons_json);
            for (const ra of addonsData) {
              await admin.from("purchase_addons").insert({
                purchase_id: newPurchase.id,
                addon_id: ra.addon_id,
                addon_name: ra.addon_name,
                unit_price: ra.unit_price,
                quantity: ra.quantity,
                size_label: ra.size_label || null,
                size_value: ra.size_value || null,
              });
            }
          } catch (e) {
            console.error("Failed to parse addons_json:", e);
          }
        }

        console.log(`Webhook created purchase for PI ${paymentIntentId}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment failed: ${pi.id} — ${pi.last_payment_error?.message}`);

        if (pi.metadata?.userId) {
          await admin
            .from("purchases")
            .update({ status: "failed" } as any)
            .eq("payment_intent_id", pi.id);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const piId = typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;

        if (piId) {
          await admin
            .from("purchases")
            .update({ status: "refunded" } as any)
            .eq("payment_intent_id", piId);
          console.log(`Marked purchase as refunded for PI ${piId}`);
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const piId = typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

        if (piId) {
          const { data: existing } = await admin
            .from("purchases")
            .select("id")
            .eq("payment_intent_id", piId)
            .maybeSingle();

          if (!existing) {
            const userId = session.metadata?.userId || session.metadata?.user_id;
            const productType = session.metadata?.product_type;
            const platformFee = parseInt(session.metadata?.platformFee || "0", 10);

            if (userId && productType) {
              const totalAmount = (session.amount_total || 0) / 100;
              const amountPaid = parseFloat(session.metadata?.amount_paid || String(totalAmount));
              const balanceRemaining = parseFloat(session.metadata?.balance_remaining || "0");
              const purchaseData: Record<string, unknown> = {
                user_id: userId,
                event_id: session.metadata?.event_id || null,
                product_type: productType,
                quantity: parseInt(session.metadata?.quantity || "1", 10),
                total_amount: parseFloat(session.metadata?.total_amount || String(totalAmount)),
                amount_paid: amountPaid,
                balance_remaining: balanceRemaining,
                status: balanceRemaining > 0 ? "deposit_paid" : "confirmed",
                payment_intent_id: piId,
                platform_fee: platformFee / 100,
                organizer_payout: totalAmount - platformFee / 100,
                ...(session.metadata?.selected_size && { selected_size: session.metadata.selected_size }),
                ...(session.metadata?.promoter_id && { promoter_id: session.metadata.promoter_id }),
                ...(session.metadata?.commission_rate && { commission_rate: parseFloat(session.metadata.commission_rate) }),
                ...(session.metadata?.customization_responses_json && {
                  customization_responses: JSON.parse(session.metadata.customization_responses_json),
                }),
              };

              if (productType === "ticket") purchaseData.ticket_tier_id = session.metadata?.ticket_tier_id;
              else if (productType === "costume") purchaseData.costume_product_id = session.metadata?.costume_product_id;
              else if (productType === "jouvert") purchaseData.jouvert_package_id = session.metadata?.jouvert_package_id;

              const { data: newPurchase } = await admin.from("purchases").insert(purchaseData as any).select("id").single();

              // Save addon snapshots from metadata
              if (newPurchase && session.metadata?.addons_json) {
                try {
                  const addonsData = JSON.parse(session.metadata.addons_json);
                  for (const ra of addonsData) {
                    await admin.from("purchase_addons").insert({
                      purchase_id: newPurchase.id,
                      addon_id: ra.addon_id,
                      addon_name: ra.addon_name,
                      unit_price: ra.unit_price,
                      quantity: ra.quantity,
                      size_label: ra.size_label || null,
                      size_value: ra.size_value || null,
                    });
                  }
                } catch (e) {
                  console.error("Failed to parse addons_json:", e);
                }
              }

              // Complete reservation if provided
              if (session.metadata?.reservation_id) {
                await admin.rpc("complete_reservation", {
                  _reservation_id: session.metadata.reservation_id,
                  _user_id: userId,
                });
              }

              // Consume checkout token if provided
              if (session.metadata?.checkout_token) {
                await admin.rpc("consume_checkout_token", {
                  _token: session.metadata.checkout_token,
                  _user_id: userId,
                });
              }

              console.log(`Checkout session created purchase for PI ${piId}`);
            }
          } else {
            console.log(`Purchase already exists for PI ${piId}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return json({ error: "Webhook processing failed" }, 500);
  }

  return json({ received: true });
});
