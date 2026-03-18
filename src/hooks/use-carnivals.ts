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
        .order("date", { ascending: true });

      if (year) query = query.eq("carnival_year", year);

      const { data, error } = await query;
      if (error) throw error;
      return data as EventWithRelations[];
    },
    enabled: !!carnivalId,
  });
}
