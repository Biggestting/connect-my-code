import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type SavedItemType = "event" | "ticket" | "costume" | "table" | "band";

export interface SavedItem {
  id: string;
  user_id: string;
  item_type: SavedItemType;
  item_id: string;
  created_at: string;
}

export interface SavedItemWithDetails extends SavedItem {
  event?: {
    id: string;
    title: string;
    date: string;
    venue: string | null;
    city: string | null;
    image_url: string | null;
  } | null;
}

export function useSavedItemIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["saved-item-ids", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_items")
        .select("item_type, item_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      const map = new Map<string, Set<string>>();
      data.forEach((d: any) => {
        if (!map.has(d.item_type)) map.set(d.item_type, new Set());
        map.get(d.item_type)!.add(d.item_id);
      });
      return map;
    },
    enabled: !!user,
  });
}

export function useSavedItemsWithEvents() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["saved-items-with-events", user?.id],
    queryFn: async () => {
      const { data: savedItems, error } = await supabase
        .from("saved_items")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const eventIds = (savedItems as any[])
        .filter((s) => s.item_type === "event")
        .map((s) => s.item_id);

      let eventsMap: Record<string, any> = {};
      if (eventIds.length > 0) {
        const { data: events } = await supabase
          .from("events")
          .select("id, title, date, venue, city, image_url")
          .in("id", eventIds);
        if (events) {
          events.forEach((e: any) => {
            eventsMap[e.id] = e;
          });
        }
      }

      return (savedItems as any[]).map((item) => ({
        ...item,
        event: item.item_type === "event" ? eventsMap[item.item_id] || null : null,
      })) as SavedItemWithDetails[];
    },
    enabled: !!user,
  });
}

export function useToggleSaveItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      itemType,
      isSaved,
    }: {
      itemId: string;
      itemType: SavedItemType;
      isSaved: boolean;
    }) => {
      if (!user) throw new Error("Must be logged in");
      if (isSaved) {
        const { error } = await supabase
          .from("saved_items")
          .delete()
          .eq("user_id", user.id)
          .eq("item_type", itemType)
          .eq("item_id", itemId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_items")
          .insert({ user_id: user.id, item_type: itemType, item_id: itemId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-item-ids"] });
      queryClient.invalidateQueries({ queryKey: ["saved-items-with-events"] });
      queryClient.invalidateQueries({ queryKey: ["saved-event-ids"] });
      queryClient.invalidateQueries({ queryKey: ["saved-events"] });
    },
  });
}
