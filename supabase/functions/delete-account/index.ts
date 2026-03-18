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
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the calling user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 1. Anonymize profile PII
    await adminClient
      .from("profiles")
      .update({
        first_name: null,
        last_name: null,
        display_name: "Deleted User",
        email: null,
        avatar_url: null,
        phone_number: null,
        status: "deleted",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    // 2. Anonymize purchases — keep records for financial audit but strip PII linkage
    // purchase_ip is PII, clear it. Keep user_id for now since cascade will handle.
    await adminClient
      .from("purchases")
      .update({ purchase_ip: null })
      .eq("user_id", userId);

    // 3. Detach promoter records — keep for commission history but remove user link
    await adminClient
      .from("promoters")
      .update({
        user_id: null,
        invited_email: null,
        display_name: "Deleted User",
        active: false,
      })
      .eq("user_id", userId);

    // 4. Remove saved items / follows / price alerts (fully delete, not audit-relevant)
    await Promise.all([
      adminClient.from("saved_events").delete().eq("user_id", userId),
      adminClient.from("saved_items").delete().eq("user_id", userId),
      adminClient.from("organizer_follows").delete().eq("user_id", userId),
      adminClient.from("price_alerts").delete().eq("user_id", userId),
    ]);

    // 5. Remove checkout queue entries
    await adminClient.from("checkout_queue").delete().eq("user_id", userId);

    // 6. Release any held inventory reservations
    await adminClient
      .from("inventory_reservations")
      .update({ status: "released" })
      .eq("user_id", userId)
      .eq("status", "held");

    // 7. Log the deletion in admin audit log
    await adminClient.from("admin_audit_log").insert({
      admin_id: userId,
      action: "account_deleted",
      target_type: "user",
      target_id: userId,
      details: { deleted_at: new Date().toISOString(), initiated_by: "user" },
    });

    // 8. Delete user from Supabase Auth (cascades FK-linked rows)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete account. Please try again." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("delete-account error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
