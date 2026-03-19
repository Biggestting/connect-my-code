import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Carnival, CarnivalSeason, EventWithRelations } from "@/types";

export function useCarnivals() {
  return useQuery({
    queryKey: ["carnivals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carnivals")
        .select("*, carnival_seasons(*)")
        .order("name");
      if (error) throw error;
      return data as (Carnival & { carnival_seasons: CarnivalSeason[] })[];
    },
  });
}

export function useCarnival(slug: string) {
  return useQuery({
    queryKey: ["carnival", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carnivals")
        .select("*, carnival_seasons(*)")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data as Carnival & { carnival_seasons: CarnivalSeason[] };
    },
    enabled: !!slug,
  });
}

export function useCarnivalEvents(carnivalId?: string, year?: number) {
  return useQuery({
    queryKey: ["carnival-events", carnivalId, year],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*, organizers(*), ticket_tiers(*)")
        .eq("carnival_id", carnivalId!)
        .eq("publishing_status", "published")
        .order("date", { ascending: true });

      if (year) query = query.or(`carnival_year.eq.${year},carnival_year.is.null`);

      const { data, error } = await query;
      if (error) throw error;
      return data as EventWithRelations[];
    },
    enabled: !!carnivalId,
  });
}

export function useCarnivalBands(carnivalId?: string, year?: number) {
  return useQuery({
    queryKey: ["carnival-bands", carnivalId, year],
    queryFn: async () => {
      let query = supabase
        .from("bands")
        .select("*, band_sections(*, costume_products(*))")
        .eq("carnival_id", carnivalId!)
        .order("created_at", { ascending: true });

      if (year) query = query.eq("carnival_year", year);

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
    enabled: !!carnivalId,
  });
}

export function useCarnivalJouvertPackages(carnivalId?: string, year?: number) {
  return useQuery({
    queryKey: ["carnival-jouvert", carnivalId, year],
    queryFn: async () => {
      let query = supabase
        .from("jouvert_packages")
        .select("*")
        .eq("carnival_id", carnivalId!)
        .order("created_at", { ascending: true });

      if (year) query = query.eq("carnival_year", year);

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
    enabled: !!carnivalId,
  });
}

/** Lightweight count of events per carnival for display on cards */
export function useCarnivalEventCounts() {
  return useQuery({
    queryKey: ["carnival-event-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("carnival_id")
        .eq("publishing_status", "published")
        .not("carnival_id", "is", null);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data || []) {
        if (row.carnival_id) {
          counts[row.carnival_id] = (counts[row.carnival_id] || 0) + 1;
        }
      }
      return counts;
    },
  });
}
