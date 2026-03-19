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

    const { ticket_id, new_owner_user_id } = await req.json();

    if (!ticket_id || !new_owner_user_id) {
      return new Response(JSON.stringify({ error: "Missing ticket_id or new_owner_user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      return new Response(JSON.stringify({ error: `Cannot transfer ticket with status: ${ticket.status}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newToken = crypto.randomUUID();
    const transferRecord = {
      action: "transferred",
      from: user.id,
      to: new_owner_user_id,
      at: new Date().toISOString(),
    };

    const { error: updateErr } = await adminClient
      .from("tickets")
      .update({
        owner_user_id: new_owner_user_id,
        qr_token: newToken,
        qr_token_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        resale_status: "transferred",
        updated_at: new Date().toISOString(),
        transfer_history: [...(ticket.transfer_history || []), transferRecord],
      })
      .eq("id", ticket_id);

    if (updateErr) throw updateErr;

    return new Response(
      JSON.stringify({
        success: true,
        ticket_id,
        new_owner_user_id,
        message: "Ticket transferred. Original QR is now invalid.",
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
