import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

/**
 * Efficient count-only query for pending promoter requests.
 * Subscribes to real-time changes for instant badge updates.
 */
export function usePendingPromoterCount(organizerId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pending-promoter-count", organizerId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("promoter_requests")
        .select("*", { count: "exact", head: true })
        .eq("organizer_id", organizerId!)
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!organizerId,
  });

  // Real-time subscription for instant updates
  useEffect(() => {
    if (!organizerId) return;

    const channel = supabase
      .channel(`promoter-requests-${organizerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "promoter_requests",
          filter: `organizer_id=eq.${organizerId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["pending-promoter-count", organizerId] });
          queryClient.invalidateQueries({ queryKey: ["promoter-requests", organizerId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizerId, queryClient]);

  return query;
}
