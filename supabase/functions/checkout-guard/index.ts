import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate-limit thresholds (log-only, not blocking by default)
const IP_MAX_ATTEMPTS_1H = 15; // flag if >15 attempts from same IP in 1 hour
const USER_MAX_ATTEMPTS_10M = 5; // flag if >5 attempts from same user in 10 min
const MULTI_ACCOUNT_WINDOW_MIN = 5; // flag if multiple users from same IP buy same event within 5 min
const MULTI_ACCOUNT_THRESHOLD = 3; // flag if 3+ distinct users from same IP

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Extract auth token
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ allowed: false, error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { eventId, quantity, productType, turnstileToken, deviceFingerprint } = body;

    if (!eventId) {
      return new Response(
        JSON.stringify({ allowed: false, error: "Missing event ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract IP from headers (Supabase edge functions provide this)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const userAgent = req.headers.get("user-agent") || null;
    const now = new Date().toISOString();

    // 1. Log the purchase attempt
    await supabase.from("purchase_attempts").insert({
      user_id: user.id,
      event_id: eventId,
      ip_address: ip,
      device_fingerprint: deviceFingerprint || null,
      user_agent: userAgent,
      created_at: now,
    });

    // 2. Check IP-based rate (last 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: ipCount } = await supabase
      .from("purchase_attempts")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("created_at", oneHourAgo);

    let flagged = false;
    const flags: string[] = [];

    if ((ipCount || 0) > IP_MAX_ATTEMPTS_1H) {
      flags.push(`High-frequency IP: ${ipCount} attempts in 1h from ${ip}`);
      flagged = true;
    }

    // 3. Check user-based rate (last 10 min)
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count: userCount } = await supabase
      .from("purchase_attempts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", tenMinAgo);

    if ((userCount || 0) > USER_MAX_ATTEMPTS_10M) {
      flags.push(`High-frequency user: ${userCount} attempts in 10min by ${user.id}`);
      flagged = true;
    }

    // 4. Check multi-account same-IP same-event (last 5 min)
    const fiveMinAgo = new Date(Date.now() - MULTI_ACCOUNT_WINDOW_MIN * 60 * 1000).toISOString();
    const { data: recentSameIpEvent } = await supabase
      .from("purchase_attempts")
      .select("user_id")
      .eq("ip_address", ip)
      .eq("event_id", eventId)
      .gte("created_at", fiveMinAgo);

    if (recentSameIpEvent) {
      const distinctUsers = new Set(recentSameIpEvent.map((r: any) => r.user_id));
      if (distinctUsers.size >= MULTI_ACCOUNT_THRESHOLD) {
        flags.push(
          `Multi-account suspicion: ${distinctUsers.size} distinct users from IP ${ip} for event ${eventId} in ${MULTI_ACCOUNT_WINDOW_MIN}min`
        );
        flagged = true;
      }
    }

    // 5. Insert fraud flags (log only — do NOT block)
    if (flagged) {
      const flagInserts = flags.map((reason) => ({
        user_id: user.id,
        ip_address: ip,
        reason,
      }));
      await supabase.from("fraud_flags").insert(flagInserts);
      console.warn(`[checkout-guard] Flagged user ${user.id} from ${ip}:`, flags);
    }

    // 6. Rate-limit response (soft — warn but allow)
    // Only hard-block if IP has >50 attempts in 1 hour (clear bot)
    const hardBlock = (ipCount || 0) > 50;

    return new Response(
      JSON.stringify({
        allowed: !hardBlock,
        ip,
        flagged,
        rateLimited: hardBlock,
        error: hardBlock ? "Too many purchase attempts. Please wait before trying again." : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[checkout-guard] error:", err);
    // Non-blocking: allow purchase if guard fails
    return new Response(
      JSON.stringify({ allowed: true, error: null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
