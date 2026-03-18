import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { EventWithRelations } from "@/types";

export function useSavedEventIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["saved-event-ids", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_events")
        .select("event_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set(data.map((d) => d.event_id));
    },
    enabled: !!user,
  });
}

export function useSavedEvents() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["saved-events", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_events")
        .select("*, events(*, organizers(*), ticket_tiers(*))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((d: any) => d.events).filter(Boolean) as EventWithRelations[];
    },
    enabled: !!user,
  });
}

export function useToggleSave() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, isSaved }: { eventId: string; isSaved: boolean }) => {
      if (!user) throw new Error("Must be logged in");
      if (isSaved) {
        const { error } = await supabase
          .from("saved_events")
          .delete()
          .eq("user_id", user.id)
          .eq("event_id", eventId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_events")
          .insert({ user_id: user.id, event_id: eventId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-event-ids"] });
      queryClient.invalidateQueries({ queryKey: ["saved-events"] });
    },
  });
}
