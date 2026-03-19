import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateClaimCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { event_id, ticket_tier_id, quantity, fulfillment_type, assigned_user_id } = await req.json();

    if (!event_id || !ticket_tier_id || !quantity || quantity < 1 || quantity > 500) {
      return new Response(JSON.stringify({ error: "Invalid parameters. quantity must be 1-500." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: event, error: eventErr } = await adminClient
      .from("events")
      .select("organizer_id")
      .eq("id", event_id)
      .single();

    if (eventErr || !event) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isMember } = await adminClient.rpc("is_organizer_member", {
      _user_id: user.id,
      _organizer_id: event.organizer_id,
    });

    if (!isMember) {
      return new Response(JSON.stringify({ error: "Not authorized for this event" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fType = fulfillment_type === "physical_assigned" ? "physical_assigned" : "physical_unassigned";
    const tickets = [];

    for (let i = 0; i < quantity; i++) {
      const claimCode = generateClaimCode();
      tickets.push({
        event_id,
        ticket_tier_id,
        fulfillment_type: fType,
        claim_code: claimCode,
        claim_status: fType === "physical_assigned" && assigned_user_id ? "claimed" : "unclaimed",
        owner_user_id: fType === "physical_assigned" && assigned_user_id ? assigned_user_id : null,
        status: fType === "physical_assigned" && assigned_user_id ? "valid" : "available",
        qr_token: crypto.randomUUID(),
      });
    }

    const { data: created, error: insertErr } = await adminClient
      .from("tickets")
      .insert(tickets)
      .select("id, claim_code, status, fulfillment_type");

    if (insertErr) throw insertErr;

    return new Response(
      JSON.stringify({
        success: true,
        count: created?.length || 0,
        tickets: created,
        message: `Created ${created?.length} physical tickets`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
