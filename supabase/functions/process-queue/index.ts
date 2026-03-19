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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: released, error: releaseErr } = await supabase.rpc(
      "release_expired_reservations"
    );
    if (releaseErr) console.error("Release error:", releaseErr);

    const { error: expireErr } = await supabase
      .from("checkout_queue")
      .update({ status: "expired", checkout_token: null })
      .eq("status", "admitted")
      .lt("token_expires_at", new Date().toISOString());
    if (expireErr) console.error("Token expiry error:", expireErr);

    const { data: settingsData } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "queue_batch_size")
      .single();
    const batchSize = settingsData?.value ?? 200;

    const { data: activeQueues } = await supabase
      .from("checkout_queue")
      .select("event_id")
      .eq("status", "waiting");

    const eventIds = [
      ...new Set((activeQueues || []).map((q: any) => q.event_id)),
    ];

    let totalAdmitted = 0;
    for (const eventId of eventIds) {
      const { data: admitted } = await supabase.rpc("admit_queue_batch", {
        _event_id: eventId,
        _batch_size: batchSize,
      });
      totalAdmitted += admitted || 0;
    }

    return new Response(
      JSON.stringify({
        released_reservations: released || 0,
        expired_tokens: 0,
        admitted_users: totalAdmitted,
        events_processed: eventIds.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
