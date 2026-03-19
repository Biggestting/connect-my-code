import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const statusFilter = url.searchParams.get("status") || "all";
    const dateFrom = url.searchParams.get("from") || "";
    const dateTo = url.searchParams.get("to") || "";

    const { data: events, error: eventsError } = await adminClient
      .from("events")
      .select("*, organizers(name, slug), ticket_tiers(price, sold_count, quantity)")
      .order("date", { ascending: false });

    if (eventsError) throw eventsError;

    const { data: purchases, error: purchasesError } = await adminClient
      .from("purchases")
      .select("event_id, total_amount, promoter_id, status");

    if (purchasesError) throw purchasesError;

    const { data: resales, error: resalesError } = await adminClient
      .from("marketplace_listings")
      .select("event_id, asking_price, status")
      .eq("status", "sold");

    if (resalesError) throw resalesError;

    const purchasesByEvent: Record<string, { gross: number; promoter: number; direct: number }> = {};
    for (const p of purchases || []) {
      if (p.status !== "completed") continue;
      if (!purchasesByEvent[p.event_id]) {
        purchasesByEvent[p.event_id] = { gross: 0, promoter: 0, direct: 0 };
      }
      const amount = Number(p.total_amount);
      purchasesByEvent[p.event_id].gross += amount;
      if (p.promoter_id) {
        purchasesByEvent[p.event_id].promoter += amount;
      } else {
        purchasesByEvent[p.event_id].direct += amount;
      }
    }

    const resaleByEvent: Record<string, number> = {};
    for (const r of resales || []) {
      resaleByEvent[r.event_id] = (resaleByEvent[r.event_id] || 0) + Number(r.asking_price);
    }

    const now = new Date();
    const filtered = (events || []).filter((e: any) => {
      if (search) {
        const q = search.toLowerCase();
        const matchSearch =
          e.title.toLowerCase().includes(q) ||
          e.organizers?.name?.toLowerCase().includes(q);
        if (!matchSearch) return false;
      }
      const eventDate = new Date(e.date);
      if (dateFrom && eventDate < new Date(dateFrom)) return false;
      if (dateTo && eventDate > new Date(dateTo + "T23:59:59.999Z")) return false;
      const isPast = eventDate < now;
      if (statusFilter === "all") return true;
      if (statusFilter === "active") return !isPast && e.sales_status !== "paused";
      if (statusFilter === "paused") return e.sales_status === "paused";
      if (statusFilter === "hidden") return e.hidden;
      if (statusFilter === "cancelled") return e.sales_status === "cancelled";
      if (statusFilter === "past") return isPast;
      return true;
    });

    const headers = [
      "event_id",
      "event_name",
      "organizer_username",
      "event_date",
      "venue",
      "city",
      "tickets_sold",
      "tickets_remaining",
      "gross_sales",
      "promoter_sales_total",
      "direct_sales_total",
      "resale_sales_total",
      "event_status",
      "created_at",
    ];

    const rows = filtered.map((e: any) => {
      const sold = e.ticket_tiers?.reduce((s: number, t: any) => s + t.sold_count, 0) || 0;
      const total = e.ticket_tiers?.reduce((s: number, t: any) => s + t.quantity, 0) || 0;
      const remaining = total - sold;
      const sales = purchasesByEvent[e.id] || { gross: 0, promoter: 0, direct: 0 };
      const resaleTotal = resaleByEvent[e.id] || 0;
      const isPast = new Date(e.date) < now;
      const status = e.sales_status === "cancelled"
        ? "cancelled"
        : e.sales_status === "paused"
        ? "paused"
        : e.hidden
        ? "hidden"
        : isPast
        ? "past"
        : "active";

      return [
        e.id,
        e.title,
        e.organizers?.slug || e.organizers?.name || "",
        e.date,
        e.venue || "",
        e.city || "",
        sold,
        remaining,
        sales.gross.toFixed(2),
        sales.promoter.toFixed(2),
        sales.direct.toFixed(2),
        resaleTotal.toFixed(2),
        status,
        e.created_at,
      ].map(escapeCsv).join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="events-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
