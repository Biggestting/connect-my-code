import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the calling user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { claim_code } = await req.json();
    if (!claim_code || typeof claim_code !== "string" || claim_code.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Claim code is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Atomic claim via a single transaction using RPC
    // We use the service role client to bypass RLS for the claim operation
    const normalizedCode = claim_code.trim().toUpperCase();

    // 1. Find the ticket by claim_code
    const { data: ticket, error: findError } = await adminClient
      .from("tickets")
      .select("id, status, fulfillment_type, claim_status, owner_user_id, event_id, ticket_tier_id, transfer_history")
      .eq("claim_code", normalizedCode)
      .maybeSingle();

    if (findError) {
      console.error("Find error:", findError);
      return new Response(JSON.stringify({ error: "Failed to look up ticket" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ticket) {
      return new Response(JSON.stringify({ error: "Invalid claim code" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Validate ticket state
    if (ticket.fulfillment_type === "digital") {
      return new Response(JSON.stringify({ error: "This is already a digital ticket and cannot be claimed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ticket.claim_status === "claimed") {
      return new Response(JSON.stringify({ error: "This ticket has already been claimed" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ticket.status !== "valid") {
      return new Response(JSON.stringify({ error: `Ticket is not valid (status: ${ticket.status})` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Atomically claim: convert to digital, assign ownership, record history
    const transferEntry = {
      action: "physical_claim",
      from_user_id: ticket.owner_user_id,
      to_user_id: user.id,
      previous_fulfillment_type: ticket.fulfillment_type,
      claimed_at: new Date().toISOString(),
      claim_code: normalizedCode,
    };

    const existingHistory = Array.isArray(ticket.transfer_history) ? ticket.transfer_history : [];

    const { error: updateError } = await adminClient
      .from("tickets")
      .update({
        owner_user_id: user.id,
        claim_status: "claimed",
        fulfillment_type: "digital",
        status: "valid",
        transfer_history: [...existingHistory, transferEntry],
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticket.id)
      .eq("claim_status", "unclaimed") // Optimistic lock — prevents double-claim
      .eq("status", "valid");

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to claim ticket" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the update actually happened (optimistic lock check)
    const { data: claimed } = await adminClient
      .from("tickets")
      .select("id, claim_status, fulfillment_type, owner_user_id")
      .eq("id", ticket.id)
      .single();

    if (!claimed || claimed.claim_status !== "claimed" || claimed.owner_user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Ticket was claimed by another user" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        ticket_id: ticket.id,
        event_id: ticket.event_id,
        message: "Ticket claimed successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Claim ticket error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
