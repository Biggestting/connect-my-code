import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EventWithRelations } from "@/types";

export function useEvents(category?: string, search?: string, location?: string) {
  return useQuery({
    queryKey: ["events", category, search, location],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*, organizers(*), carnivals(*), ticket_tiers(*)")
        .eq("publishing_status", "published")
        .order("date", { ascending: true });

      if (category && category !== "all") {
        query = query.eq("category", category);
      }

      if (search) {
        query = query.or(
          `title.ilike.%${search}%,venue.ilike.%${search}%,city.ilike.%${search}%,description.ilike.%${search}%`
        );
      }

      if (location && location !== "All Locations") {
        query = query.ilike("city", `%${location}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EventWithRelations[];
    },
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(
          "*, organizers(*), carnivals(*), ticket_tiers(*), event_lineup(*), event_agenda(*), reviews(*, review_responses(*))"
        )
        .eq("id", id)
        .order("sort_order", { referencedTable: "event_lineup", ascending: true })
        .order("sort_order", { referencedTable: "event_agenda", ascending: true })
        .order("created_at", { referencedTable: "reviews", ascending: false })
        .single();

      if (error) throw error;

      // Fetch bands (with sections → costume products → pickup) and jouvert packages
      const [bandsRes, jouvertRes] = await Promise.all([
        supabase
          .from("bands" as any)
          .select("*, band_sections(*, costume_products(*, costume_pickup(*)))")
          .eq("event_id", id)
          .order("created_at", { ascending: true }),
        supabase
          .from("jouvert_packages" as any)
          .select("*")
          .eq("event_id", id)
          .order("created_at", { ascending: true }),
      ]);

      return {
        ...data,
        bands: (bandsRes.data || []) as unknown as EventWithRelations["bands"],
        jouvert_packages: (jouvertRes.data || []) as unknown as EventWithRelations["jouvert_packages"],
      } as EventWithRelations;
    },
    enabled: !!id,
  });
}

export function useRelatedEvents(event: EventWithRelations | undefined) {
  return useQuery({
    queryKey: ["related-events", event?.id],
    queryFn: async () => {
      if (!event) return [];

      const { data, error } = await supabase
        .from("events")
        .select("*, organizers(*), ticket_tiers(*)")
        .neq("id", event.id)
        .limit(10);

      if (error) throw error;

      const scored = (data as EventWithRelations[]).map((e) => {
        let score = 0;
        if (e.category === event.category) score += 3;
        if (e.city === event.city) score += 2;
        if (e.organizer_id === event.organizer_id) score += 2;
        if (e.tags && event.tags) {
          const shared = e.tags.filter((t) => event.tags!.includes(t));
          score += shared.length;
        }
        return { ...e, _score: score };
      });

      return scored.sort((a, b) => b._score - a._score).slice(0, 4);
    },
    enabled: !!event,
  });
}
