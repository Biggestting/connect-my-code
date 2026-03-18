import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

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
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { request_id, action, commission_percent } = await req.json();
    if (!request_id || !action || !["approve", "reject"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Missing request_id or invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Get the request
    const { data: request, error: reqErr } = await admin
      .from("promoter_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (reqErr || !request) {
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the caller owns the organizer
    const { data: organizer } = await admin
      .from("organizers")
      .select("id, user_id")
      .eq("id", request.organizer_id)
      .single();

    if (!organizer || organizer.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (request.status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Request already processed" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the request status
    await admin
      .from("promoter_requests")
      .update({
        status: action === "approve" ? "approved" : "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", request_id);

    if (action === "approve") {
      // Get requester's profile
      const { data: profile } = await admin
        .from("profiles")
        .select("display_name, email")
        .eq("user_id", request.user_id)
        .maybeSingle();

      const displayName = profile?.display_name || "Promoter";
      const codeBase = displayName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
      const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
      const promoCode = `${codeBase}${suffix}`;

      // Check if already a promoter
      const { data: existing } = await admin
        .from("promoters")
        .select("id")
        .eq("organizer_id", request.organizer_id)
        .eq("user_id", request.user_id)
        .maybeSingle();

      if (!existing) {
        const { error: insertErr } = await admin.from("promoters").insert({
          organizer_id: request.organizer_id,
          user_id: request.user_id,
          display_name: displayName,
          promo_code: promoCode,
          commission_percent: commission_percent ?? 10,
          active: true,
          invite_status: "active",
          invited_email: profile?.email,
        });

        if (insertErr) {
          return new Response(JSON.stringify({ error: insertErr.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: action === "approve" ? "Promoter request approved" : "Promoter request rejected",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
