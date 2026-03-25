import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { qr_token, scanner_user_id } = await req.json();

    if (!qr_token) {
      return new Response(JSON.stringify({ error: "Missing qr_token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up ticket by QR token
    const { data: ticket, error: fetchErr } = await adminClient
      .from("tickets")
      .select("*, events(title, date, venue, organizer_id), ticket_tiers(name)")
      .eq("qr_token", qr_token)
      .single();

    if (fetchErr || !ticket) {
      return new Response(
        JSON.stringify({ valid: false, reason: "Invalid QR code — ticket not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reject voided tickets
    if (ticket.status === "void") {
      return new Response(
        JSON.stringify({ valid: false, reason: "Ticket has been voided" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already redeemed/used
    if (ticket.status === "used" || ticket.status === "redeemed") {
      return new Response(
        JSON.stringify({
          valid: false,
          reason: "Ticket already scanned",
          scanned_at: ticket.scanned_at,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Must have an owner (unclaimed physical tickets can't enter)
    if (!ticket.owner_user_id) {
      return new Response(
        JSON.stringify({ valid: false, reason: "Ticket not yet claimed — no verified owner" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only valid/claimed tickets can be scanned
    if (ticket.status !== "valid") {
      return new Response(
        JSON.stringify({ valid: false, reason: `Ticket status: ${ticket.status}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as used/redeemed
    const { error: updateErr } = await adminClient
      .from("tickets")
      .update({
        status: "used",
        scanned_at: new Date().toISOString(),
        scanned_by: scanner_user_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticket.id);

    if (updateErr) throw updateErr;

    return new Response(
      JSON.stringify({
        valid: true,
        ticket_id: ticket.id,
        event_title: ticket.events?.title,
        tier_name: ticket.ticket_tiers?.name,
        owner_user_id: ticket.owner_user_id,
        fulfillment_type: ticket.fulfillment_type,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
