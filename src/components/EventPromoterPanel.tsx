import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, Copy, Megaphone, Loader2, Share2 } from "lucide-react";
import { useState, useEffect } from "react";

interface Props {
  eventId: string;
  organizerId: string;
}

function useUserPromoterForOrganizer(userId?: string, organizerId?: string) {
  return useQuery({
    queryKey: ["user-promoter-status", userId, organizerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promoters")
        .select("id, promo_code, commission_percent, invite_status, active, display_name")
        .eq("user_id", userId!)
        .eq("organizer_id", organizerId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!organizerId,
  });
}

function useEventPromoterRecord(promoterId?: string, eventId?: string) {
  return useQuery({
    queryKey: ["event-promoter-record", promoterId, eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_promoters")
        .select("id, referral_code")
        .eq("promoter_id", promoterId!)
        .eq("event_id", eventId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!promoterId && !!eventId,
  });
}

export function EventPromoterPanel({ eventId, organizerId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: promoter, isLoading } = useUserPromoterForOrganizer(user?.id, organizerId);
  const isActive = promoter?.invite_status === "active" && promoter?.active;
  const { data: eventRecord, isLoading: eventRecordLoading } = useEventPromoterRecord(
    isActive ? promoter?.id : undefined,
    isActive ? eventId : undefined
  );
  const [copied, setCopied] = useState(false);

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("promoters")
        .update({ invite_status: "active" })
        .eq("id", promoter!.id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-promoter-status", user?.id, organizerId] });
      toast.success("You're now an active promoter!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Auto-create event_promoters record when active promoter views event
  const createEventRecord = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("event_promoters")
        .insert({ promoter_id: promoter!.id, event_id: eventId, referral_code: "" })
        .select("id, referral_code")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-promoter-record", promoter?.id, eventId] });
    },
  });

  useEffect(() => {
    if (isActive && !eventRecordLoading && !eventRecord && !createEventRecord.isPending) {
      createEventRecord.mutate();
    }
  }, [isActive, eventRecordLoading, eventRecord]);

  if (!user || isLoading || !promoter) return null;

  // Pending invite
  if (promoter.invite_status === "pending") {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Promoter Invite</h3>
          <Badge variant="secondary" className="text-xs">Pending</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          You've been invited to promote this organizer's events. Accept to start earning commissions.
        </p>
        <Button
          size="sm"
          onClick={() => acceptMutation.mutate()}
          disabled={acceptMutation.isPending}
          className="gap-1.5"
        >
          {acceptMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle className="h-3.5 w-3.5" />
          )}
          Accept Promoter Invite
        </Button>
      </div>
    );
  }

  // Active promoter
  if (isActive) {
    const referralCode = eventRecord?.referral_code;
    const shareUrl = referralCode
      ? `${window.location.origin}/event/${eventId}?ref=${referralCode}`
      : null;

    const handleCopy = async () => {
      if (!shareUrl) return;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
      if (!shareUrl) return;
      if (navigator.share) {
        try {
          await navigator.share({ url: shareUrl, title: "Check out this event!" });
        } catch {}
      } else {
        handleCopy();
      }
    };

    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Promoter Tools</h3>
          <Badge className="text-xs bg-primary/20 text-primary border-0">Active</Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Commission</span>
            <span className="font-semibold text-foreground">{promoter.commission_percent}%</span>
          </div>
          {referralCode && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Referral Code</span>
              <span className="font-mono font-semibold text-foreground">{referralCode}</span>
            </div>
          )}
        </div>
        {shareUrl ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy} className="flex-1 gap-1.5 text-xs">
              {copied ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleShare} className="gap-1.5 text-xs">
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">Generating referral link...</div>
        )}
      </div>
    );
  }

  return null;
}
