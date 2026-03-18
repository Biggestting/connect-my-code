import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Promoter {
  id: string;
  organizer_id: string;
  user_id: string | null;
  display_name: string;
  promo_code: string;
  commission_percent: number;
  active: boolean;
  created_at: string;
}

export interface PromoterWithStats extends Promoter {
  tickets_sold: number;
  revenue_generated: number;
  commission_earned: number;
  rank?: number;
}

export interface PromoterCommission {
  id: string;
  promoter_id: string;
  event_id: string;
  purchase_id: string;
  commission_amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export function usePromoters(organizerId?: string) {
  return useQuery({
    queryKey: ["promoters", organizerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promoters")
        .select("*")
        .eq("organizer_id", organizerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Promoter[];
    },
    enabled: !!organizerId,
  });
}

export function usePromoterByCode(code?: string) {
  return useQuery({
    queryKey: ["promoter-by-code", code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promoters")
        .select("*")
        .eq("promo_code", code!.toUpperCase())
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return data as Promoter | null;
    },
    enabled: !!code,
  });
}

export function usePromoterById(id?: string) {
  return useQuery({
    queryKey: ["promoter-by-id", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promoters")
        .select("*")
        .eq("id", id!)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return data as Promoter | null;
    },
    enabled: !!id,
  });
}

export function usePromoterSales(organizerId?: string) {
  return useQuery({
    queryKey: ["promoter-sales", organizerId],
    queryFn: async () => {
      const { data: promoters, error: pErr } = await supabase
        .from("promoters")
        .select("*")
        .eq("organizer_id", organizerId!);
      if (pErr) throw pErr;
      if (!promoters || promoters.length === 0) return [];

      const promoterIds = promoters.map((p) => p.id);
      const { data: purchases, error: purchErr } = await supabase
        .from("purchases")
        .select("promoter_id, quantity, total_amount")
        .in("promoter_id", promoterIds)
        .eq("status", "completed");
      if (purchErr) throw purchErr;

      const withStats = promoters.map((p) => {
        const promoSales = (purchases || []).filter((s) => s.promoter_id === p.id);
        const tickets_sold = promoSales.reduce((sum, s) => sum + s.quantity, 0);
        const revenue_generated = promoSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
        const commission_earned = revenue_generated * (Number(p.commission_percent) / 100);
        return { ...p, tickets_sold, revenue_generated, commission_earned } as PromoterWithStats;
      });

      withStats.sort((a, b) => b.tickets_sold - a.tickets_sold);
      withStats.forEach((p, i) => { p.rank = i + 1; });

      return withStats;
    },
    enabled: !!organizerId,
  });
}

export function useCreatePromoter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      organizerId: string;
      displayName: string;
      promoCode: string;
      commissionPercent: number;
      userId?: string;
    }) => {
      const { data, error } = await supabase
        .from("promoters")
        .insert({
          organizer_id: input.organizerId,
          display_name: input.displayName,
          promo_code: input.promoCode.toUpperCase(),
          commission_percent: input.commissionPercent,
          user_id: input.userId || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["promoters", vars.organizerId] });
      queryClient.invalidateQueries({ queryKey: ["promoter-sales", vars.organizerId] });
    },
  });
}

export function useDeletePromoter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, organizerId }: { id: string; organizerId: string }) => {
      const { error } = await supabase.from("promoters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["promoters", vars.organizerId] });
      queryClient.invalidateQueries({ queryKey: ["promoter-sales", vars.organizerId] });
    },
  });
}

export function useMyPromoterStats(userId?: string) {
  return useQuery({
    queryKey: ["my-promoter-stats", userId],
    queryFn: async () => {
      const { data: promoters, error: pErr } = await supabase
        .from("promoters")
        .select("*, organizers(name, slug)")
        .eq("user_id", userId!);
      if (pErr) throw pErr;
      if (!promoters || promoters.length === 0) return [];

      const promoterIds = promoters.map((p) => p.id);
      const { data: purchases, error: purchErr } = await supabase
        .from("purchases")
        .select("promoter_id, quantity, total_amount, event_id, events(title)")
        .in("promoter_id", promoterIds)
        .eq("status", "completed");
      if (purchErr) throw purchErr;

      const { data: commissions } = await supabase
        .from("promoter_commissions")
        .select("promoter_id, commission_amount, status")
        .in("promoter_id", promoterIds);

      return promoters.map((p: any) => {
        const promoSales = (purchases || []).filter((s) => s.promoter_id === p.id);
        const tickets_sold = promoSales.reduce((sum, s) => sum + s.quantity, 0);
        const revenue_generated = promoSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
        const commission_earned = revenue_generated * (Number(p.commission_percent) / 100);
        const myCommissions = (commissions || []).filter((c) => c.promoter_id === p.id);
        const commission_paid = myCommissions
          .filter((c) => c.status === "paid")
          .reduce((sum, c) => sum + Number(c.commission_amount), 0);
        const commission_pending = myCommissions
          .filter((c) => c.status === "pending")
          .reduce((sum, c) => sum + Number(c.commission_amount), 0);
        return { ...p, tickets_sold, revenue_generated, commission_earned, commission_paid, commission_pending };
      });
    },
    enabled: !!userId,
  });
}

export function usePromoterCommissions(organizerId?: string) {
  return useQuery({
    queryKey: ["promoter-commissions", organizerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promoter_commissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PromoterCommission[];
    },
    enabled: !!organizerId,
  });
}

export function useBulkMarkPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commissionIds: string[]) => {
      const { error } = await supabase
        .from("promoter_commissions")
        .update({ status: "paid", paid_at: new Date().toISOString() } as any)
        .in("id", commissionIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoter-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["promoter-sales"] });
    },
  });
}
