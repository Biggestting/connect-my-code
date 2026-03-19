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
    const normalizedCode = claim_code.trim().toUpperCase();

    // Call the atomic claim function — handles validation, invalidation, and creation in one transaction
    const { data, error: rpcError } = await adminClient.rpc("claim_physical_ticket", {
      _claim_code: normalizedCode,
      _user_id: user.id,
    });

    if (rpcError) {
      console.error("Claim RPC error:", rpcError);
      const msg = rpcError.message || "";

      if (msg.includes("not found") || msg.includes("already claimed") || msg.includes("not a valid")) {
        return new Response(JSON.stringify({ error: "This claim code is invalid or has already been used" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Failed to process ticket claim" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ error: "Claim failed — no ticket returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = data[0];

    return new Response(
      JSON.stringify({
        success: true,
        ticket_id: result.new_ticket_id,
        event_id: result.event_id,
        message: "Physical ticket claimed and converted to digital",
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
