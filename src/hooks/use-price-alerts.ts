import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface PriceAlert {
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  target_price: number | null;
  alert_enabled: boolean;
  created_at: string;
}

export function usePriceAlerts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["price-alerts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_alerts")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as unknown as PriceAlert[];
    },
    enabled: !!user,
  });
}

export function useUpsertPriceAlert() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      itemType,
      targetPrice,
      alertEnabled,
    }: {
      itemId: string;
      itemType: string;
      targetPrice: number | null;
      alertEnabled: boolean;
    }) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("price_alerts")
        .upsert(
          {
            user_id: user.id,
            item_type: itemType,
            item_id: itemId,
            target_price: targetPrice,
            alert_enabled: alertEnabled,
          },
          { onConflict: "user_id,item_type,item_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
    },
  });
}
