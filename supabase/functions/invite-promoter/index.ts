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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    // Verify the caller is authenticated
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { organizer_id, email, display_name, promo_code, commission_percent } = body;

    if (!organizer_id || !email || !display_name || !promo_code) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role client for admin lookups
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller owns this organizer
    const { data: organizer } = await adminClient
      .from("organizers")
      .select("id, user_id")
      .eq("id", organizer_id)
      .single();

    if (!organizer || organizer.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Not authorized for this organizer" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if promoter with this email already exists for this organizer
    const { data: existingPromoter } = await adminClient
      .from("promoters")
      .select("id")
      .eq("organizer_id", organizer_id)
      .eq("invited_email", email.toLowerCase())
      .maybeSingle();

    if (existingPromoter) {
      return new Response(
        JSON.stringify({ error: "A promoter with this email already exists" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up user by email in profiles table
    const { data: profile } = await adminClient
      .from("profiles")
      .select("user_id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    const promoterData: Record<string, unknown> = {
      organizer_id,
      display_name,
      promo_code: promo_code.toUpperCase(),
      commission_percent: commission_percent ?? 10,
      invited_email: email.toLowerCase(),
      active: !!profile,
      user_id: profile?.user_id ?? null,
      invite_status: profile ? "active" : "pending",
    };

    const { data: newPromoter, error: insertError } = await adminClient
      .from("promoters")
      .insert(promoterData)
      .select()
      .single();

    if (insertError) {
      console.error("Promoter insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create promoter" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        promoter: newPromoter,
        user_found: !!profile,
        message: profile
          ? "Promoter added and activated"
          : "Promoter invitation created (pending user signup)",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("invite-promoter error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
