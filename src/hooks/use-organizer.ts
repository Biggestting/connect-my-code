import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Organizer, EventWithRelations } from "@/types";

export function useOrganizer(slug: string) {
  return useQuery({
    queryKey: ["organizer", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizers")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data as Organizer;
    },
    enabled: !!slug,
  });
}

export function useOrganizerEvents(organizerId?: string) {
  return useQuery({
    queryKey: ["organizer-events", organizerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, organizers(*), carnivals(*), ticket_tiers(*)")
        .eq("organizer_id", organizerId!)
        .order("date", { ascending: true });
      if (error) throw error;
      return data as EventWithRelations[];
    },
    enabled: !!organizerId,
  });
}

export function useOrganizerByUserId(userId?: string) {
  return useQuery({
    queryKey: ["organizer-by-user", userId],
    queryFn: async () => {
      // First check organizer_members for membership-based access
      const { data: memberships, error: memError } = await supabase
        .from("organizer_members")
        .select("organizer_id, organizers(*)")
        .eq("user_id", userId!);

      if (!memError && memberships && memberships.length > 0) {
        return memberships[0].organizers as unknown as Organizer;
      }

      // Fallback to direct user_id lookup for legacy data
      const { data, error } = await supabase
        .from("organizers")
        .select("*")
        .eq("user_id", userId!)
        .single();
      if (error) throw error;
      return data as Organizer;
    },
    enabled: !!userId,
  });
}
