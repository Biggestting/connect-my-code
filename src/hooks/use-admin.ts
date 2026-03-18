import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("has_role", {
        _user_id: user!.id,
        _role: "admin",
      });
      if (error) throw error;
      return data as boolean;
    },
    enabled: !!user?.id,
  });
}

export function useAdminStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [eventsRes, organizersRes, purchasesRes, usersRes, listingsRes] = await Promise.all([
        supabase.from("events").select("id, date, title, sales_status", { count: "exact" }),
        supabase.from("organizers").select("id", { count: "exact" }),
        supabase.from("purchases").select("id, total_amount, created_at, status", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("marketplace_listings").select("id, status", { count: "exact" }),
      ]);

      const purchases = purchasesRes.data || [];
      const totalRevenue = purchases.reduce((s, p) => s + Number(p.total_amount), 0);
      const today = new Date().toISOString().split("T")[0];
      const todayPurchases = purchases.filter((p) => p.created_at.startsWith(today));
      const todayRevenue = todayPurchases.reduce((s, p) => s + Number(p.total_amount), 0);

      const events = eventsRes.data || [];
      const activeEvents = events.filter((e) => new Date(e.date) >= new Date()).length;

      return {
        totalEvents: eventsRes.count || 0,
        activeEvents,
        totalOrganizers: organizersRes.count || 0,
        totalTicketsSold: purchasesRes.count || 0,
        totalRevenue,
        todayTickets: todayPurchases.length,
        todayRevenue,
        totalUsers: usersRes.count || 0,
        activeListings: (listingsRes.data || []).filter((l) => l.status === "active").length,
      };
    },
    enabled: !!user?.id,
  });
}
