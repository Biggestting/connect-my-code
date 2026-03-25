import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityItem {
  id: string;
  type: "ticket_sold" | "promo_used";
  title: string;
  subtitle: string;
  timestamp: string;
}

export function useOrganizerRecentActivity(organizerId?: string, eventIds?: string[]) {
  return useQuery({
    queryKey: ["organizer-activity", organizerId, eventIds],
    queryFn: async () => {
      if (!eventIds || eventIds.length === 0) return [];

      const { data: tickets, error } = await supabase
        .from("tickets")
        .select("id, created_at, events(title), ticket_tiers(name, price)")
        .in("event_id", eventIds)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const items: ActivityItem[] = (tickets || []).map((t: any) => ({
        id: t.id,
        type: "ticket_sold" as const,
        title: `Ticket sold for ${t.events?.title || "Unknown Event"}`,
        subtitle: `${t.ticket_tiers?.name || "General"} — $${Number(t.ticket_tiers?.price || 0).toFixed(0)}`,
        timestamp: t.created_at,
      }));

      return items;
    },
    enabled: !!organizerId && !!eventIds && eventIds.length > 0,
  });
}
