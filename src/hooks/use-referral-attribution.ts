import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePromoCode } from "@/hooks/use-promo-code";

/**
 * Resolves a referral_code to its event_promoters record + promoter_id.
 * Used at checkout to attribute the purchase.
 */
export function useReferralAttribution(eventId?: string) {
  const { referral } = usePromoCode();
  const refCode = referral.referralCode;

  const { data } = useQuery({
    queryKey: ["referral-attribution", refCode, eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_promoters")
        .select("id, promoter_id, referral_code, promoters(id, commission_percent)")
        .eq("referral_code", refCode!)
        .eq("event_id", eventId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!refCode && !!eventId,
  });

  return {
    promoterId: data?.promoter_id ?? null,
    referralCode: data?.referral_code ?? refCode ?? null,
    commissionRate: (data?.promoters as any)?.commission_percent ?? null,
  };
}
