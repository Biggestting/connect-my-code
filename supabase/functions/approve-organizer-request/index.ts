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
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify calling user and check admin role
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const adminUserId = user.id;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role
    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: adminUserId,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { request_id, action } = await req.json();

    if (!request_id || !action || !["approve", "reject"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid request_id or action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the request
    const { data: orgRequest, error: fetchError } = await adminClient
      .from("organizer_requests")
      .select("*")
      .eq("id", request_id)
      .eq("status", "pending")
      .single();

    if (fetchError || !orgRequest) {
      return new Response(JSON.stringify({ error: "Request not found or already processed" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reject") {
      // Update request status to rejected
      const { error: updateError } = await adminClient
        .from("organizer_requests")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminUserId,
        })
        .eq("id", request_id);

      if (updateError) throw updateError;

      // Audit log
      await adminClient.from("admin_audit_log").insert({
        admin_id: adminUserId,
        action: "reject_organizer_request",
        target_type: "organizer_request",
        target_id: request_id,
        details: { brand_name: orgRequest.brand_name, username: orgRequest.username_requested },
      });

      return new Response(JSON.stringify({ success: true, action: "rejected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // APPROVE: Create organizer profile + update request
    // Check slug uniqueness
    const { data: existingSlug } = await adminClient
      .from("organizers")
      .select("id")
      .eq("slug", orgRequest.username_requested)
      .maybeSingle();

    if (existingSlug) {
      return new Response(
        JSON.stringify({ error: `Slug @${orgRequest.username_requested} is already taken` }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create organizer
    const { data: newOrganizer, error: insertError } = await adminClient
      .from("organizers")
      .insert({
        user_id: orgRequest.user_id,
        name: orgRequest.brand_name,
        slug: orgRequest.username_requested,
        instagram: orgRequest.instagram,
        website: orgRequest.website,
        event_types: orgRequest.event_types ? [orgRequest.event_types] : [],
        status: "active",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to create organizer:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create organizer profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Add owner membership
    await adminClient.from("organizer_members").insert({
      organizer_id: newOrganizer.id,
      user_id: orgRequest.user_id,
      role: "owner",
    });

    // Update request status
    const { error: updateError } = await adminClient
      .from("organizer_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUserId,
      })
      .eq("id", request_id);

    if (updateError) {
      console.error("Failed to update request status:", updateError);
    }

    // Audit log
    await adminClient.from("admin_audit_log").insert({
      admin_id: adminUserId,
      action: "approve_organizer_request",
      target_type: "organizer_request",
      target_id: request_id,
      details: {
        brand_name: orgRequest.brand_name,
        username: orgRequest.username_requested,
        organizer_id: newOrganizer.id,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        action: "approved",
        organizer_id: newOrganizer.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Approve organizer request error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
