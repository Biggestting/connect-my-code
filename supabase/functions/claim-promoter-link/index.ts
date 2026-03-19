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

    // Verify user
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

    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Look up the invite token
    const { data: invite, error: inviteErr } = await admin
      .from("promoter_invite_tokens")
      .select("*, organizers(name, slug)")
      .eq("token", token)
      .maybeSingle();

    if (inviteErr || !invite) {
      return new Response(JSON.stringify({ error: "Invalid invite link" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invite.used_by) {
      return new Response(
        JSON.stringify({ error: "This invite link has already been used" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This invite link has expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is already a promoter for this organizer
    const { data: existing } = await admin
      .from("promoters")
      .select("id")
      .eq("organizer_id", invite.organizer_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          error: "You are already a promoter for this organizer",
          promoter_id: existing.id,
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile for display name
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", user.id)
      .maybeSingle();

    const displayName =
      profile?.display_name || user.email?.split("@")[0] || "Promoter";

    // Generate a promo code from display name + random suffix
    const codeBase = displayName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
    const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    const promoCode = `${codeBase}${suffix}`;

    // Create promoter record
    const { data: promoter, error: createErr } = await admin
      .from("promoters")
      .insert({
        organizer_id: invite.organizer_id,
        user_id: user.id,
        display_name: displayName,
        promo_code: promoCode,
        commission_percent: invite.commission_percent,
        active: true,
        invite_status: "active",
        invited_email: profile?.email || user.email,
      })
      .select()
      .single();

    if (createErr) {
      console.error("Promoter creation error:", createErr);
      return new Response(JSON.stringify({ error: "Failed to create promoter record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark token as used
    await admin
      .from("promoter_invite_tokens")
      .update({ used_by: user.id, used_at: new Date().toISOString() })
      .eq("id", invite.id);

    return new Response(
      JSON.stringify({
        success: true,
        promoter,
        organizer_name: invite.organizers?.name,
        organizer_slug: invite.organizers?.slug,
        message: `You are now a promoter for ${invite.organizers?.name || "this organizer"}!`,
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
