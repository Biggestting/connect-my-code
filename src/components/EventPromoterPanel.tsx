import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, Copy, Megaphone, Loader2, Link as LinkIcon } from "lucide-react";
import { useState } from "react";

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

export function EventPromoterPanel({ eventId, organizerId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: promoter, isLoading } = useUserPromoterForOrganizer(user?.id, organizerId);
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

  if (!user || isLoading || !promoter) return null;

  const shareUrl = `${window.location.origin}/event/${eventId}?promo=${promoter.promo_code}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Promo link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

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
  if (promoter.invite_status === "active" && promoter.active) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Promoter Tools</h3>
          <Badge className="text-xs bg-primary/20 text-primary border-0">Active</Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Promo Code</span>
            <span className="font-mono font-semibold text-foreground">{promoter.promo_code}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Commission</span>
            <span className="font-semibold text-foreground">{promoter.commission_percent}%</span>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={handleCopy} className="w-full gap-1.5 text-xs">
          {copied ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied!" : "Copy Promo Link"}
        </Button>
      </div>
    );
  }

  return null;
}
