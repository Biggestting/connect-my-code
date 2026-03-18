import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OrganizerMembership {
  id: string;
  organizer_id: string;
  user_id: string;
  role: string;
  created_at: string;
  organizers?: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    bio: string | null;
    status: string;
  };
}

export function useUserOrganizers(userId?: string) {
  return useQuery({
    queryKey: ["user-organizers", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizer_members")
        .select("*, organizers(id, name, slug, logo_url, bio, status)")
        .eq("user_id", userId!);
      if (error) throw error;
      return data as OrganizerMembership[];
    },
    enabled: !!userId,
  });
}

export function useOrganizerMembers(organizerId?: string) {
  return useQuery({
    queryKey: ["organizer-members", organizerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizer_members")
        .select("*")
        .eq("organizer_id", organizerId!);
      if (error) throw error;
      return data as OrganizerMembership[];
    },
    enabled: !!organizerId,
  });
}
