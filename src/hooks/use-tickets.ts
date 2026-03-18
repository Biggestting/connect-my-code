import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { PurchaseWithRelations, MarketplaceListingWithRelations } from "@/types";

export function usePurchases() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["purchases", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*, events(*, organizers(*)), ticket_tiers(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PurchaseWithRelations[];
    },
    enabled: !!user,
  });
}

export function usePurchaseTicket() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, ticketTierId, quantity, totalAmount, promoterId, commissionRate }: {
      eventId: string; ticketTierId: string; quantity: number; totalAmount: number;
      promoterId?: string; commissionRate?: number;
    }) => {
      if (!user) throw new Error("Must be logged in");
      const { data, error } = await supabase
        .from("purchases")
        .insert({
          user_id: user.id,
          event_id: eventId,
          ticket_tier_id: ticketTierId,
          quantity,
          total_amount: totalAmount,
          promoter_id: promoterId || null,
          commission_rate: commissionRate ?? null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useMarketplaceListings(eventId?: string) {
  return useQuery({
    queryKey: ["marketplace", eventId],
    queryFn: async () => {
      let query = supabase
        .from("marketplace_listings")
        .select("*, events(*, organizers(*)), ticket_tiers(*)")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (eventId) query = query.eq("event_id", eventId);

      const { data, error } = await query;
      if (error) throw error;
      return data as MarketplaceListingWithRelations[];
    },
  });
}

export function useCreateListing() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ purchaseId, eventId, ticketTierId, askingPrice, listingType }: {
      purchaseId: string; eventId: string; ticketTierId: string; askingPrice: number; listingType: string;
    }) => {
      if (!user) throw new Error("Must be logged in");
      const { data, error } = await supabase
        .from("marketplace_listings")
        .insert({
          seller_id: user.id,
          purchase_id: purchaseId,
          event_id: eventId,
          ticket_tier_id: ticketTierId,
          asking_price: askingPrice,
          listing_type: listingType,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
    },
  });
}
