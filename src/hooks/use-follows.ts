import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useIsFollowing(organizerId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["following", user?.id, organizerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizer_follows")
        .select("id")
        .eq("user_id", user!.id)
        .eq("organizer_id", organizerId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!organizerId,
  });
}

export function useToggleFollow() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizerId, isFollowing }: { organizerId: string; isFollowing: boolean }) => {
      if (!user) throw new Error("Must be logged in");
      if (isFollowing) {
        const { error } = await supabase
          .from("organizer_follows")
          .delete()
          .eq("user_id", user.id)
          .eq("organizer_id", organizerId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("organizer_follows")
          .insert({ user_id: user.id, organizer_id: organizerId });
        if (error) throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["organizer"] });
    },
  });
}
