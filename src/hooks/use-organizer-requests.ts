import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OrganizerRequest {
  id: string;
  user_id: string;
  username_requested: string;
  brand_name: string;
  instagram: string | null;
  website: string | null;
  event_types: string | null;
  notes: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export function useMyOrganizerRequests(userId?: string) {
  return useQuery({
    queryKey: ["my-organizer-requests", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizer_requests")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OrganizerRequest[];
    },
    enabled: !!userId,
  });
}

export function useAllOrganizerRequests() {
  return useQuery({
    queryKey: ["all-organizer-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizer_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OrganizerRequest[];
    },
  });
}
