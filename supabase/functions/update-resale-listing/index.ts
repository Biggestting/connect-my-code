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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const { ticket_id, resale_status, resale_price } = await req.json();

    if (!ticket_id || !resale_status) {
      return new Response(JSON.stringify({ error: "Missing ticket_id or resale_status" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validStatuses = ["not_listed", "listed", "sold", "delisted"];
    if (!validStatuses.includes(resale_status)) {
      return new Response(JSON.stringify({ error: `Invalid resale_status. Must be one of: ${validStatuses.join(", ")}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch ticket and verify ownership
    const { data: ticket, error: fetchErr } = await adminClient
      .from("tickets")
      .select("*")
      .eq("id", ticket_id)
      .single();

    if (fetchErr || !ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ticket.owner_user_id !== user.id) {
      return new Response(JSON.stringify({ error: "You don't own this ticket" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ticket.status !== "valid") {
      return new Response(JSON.stringify({ error: `Cannot update resale for ticket with status: ${ticket.status}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      resale_status,
      updated_at: new Date().toISOString(),
    };

    if (resale_status === "listed" && resale_price != null) {
      if (typeof resale_price !== "number" || resale_price <= 0) {
        return new Response(JSON.stringify({ error: "resale_price must be a positive number" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      updatePayload.resale_price = resale_price;
    }

    // Clear price when delisting
    if (resale_status === "not_listed" || resale_status === "delisted") {
      updatePayload.resale_price = null;
    }

    const { data: updated, error: updateErr } = await adminClient
      .from("tickets")
      .update(updatePayload)
      .eq("id", ticket_id)
      .select("*")
      .single();

    if (updateErr) throw updateErr;

    return new Response(
      JSON.stringify({ success: true, ticket: updated }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
