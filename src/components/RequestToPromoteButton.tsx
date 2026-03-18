import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Megaphone, Loader2, CheckCircle, Clock } from "lucide-react";

interface Props {
  eventId: string;
  organizerId: string;
}

export function RequestToPromoteButton({ eventId, organizerId }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check if user already has a pending/approved request or is already a promoter
  const { data: existingRequest, isLoading } = useQuery({
    queryKey: ["promoter-request-status", user?.id, organizerId],
    queryFn: async () => {
      // Check promoter_requests
      const { data: request } = await supabase
        .from("promoter_requests")
        .select("id, status")
        .eq("user_id", user!.id)
        .eq("organizer_id", organizerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (request) return { type: "request" as const, status: request.status };

      // Check if already a promoter
      const { data: promoter } = await supabase
        .from("promoters")
        .select("id")
        .eq("user_id", user!.id)
        .eq("organizer_id", organizerId)
        .maybeSingle();

      if (promoter) return { type: "promoter" as const, status: "active" };

      return null;
    },
    enabled: !!user,
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("promoter_requests").insert({
        user_id: user!.id,
        organizer_id: organizerId,
        event_id: eventId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["promoter-request-status", user?.id, organizerId],
      });
      toast.success("Request sent! The organizer will review it.");
    },
    onError: (err: Error) => {
      if (err.message.includes("duplicate") || err.message.includes("unique")) {
        toast.error("You already have a pending request");
      } else {
        toast.error(err.message);
      }
    },
  });

  const handleClick = () => {
    if (!user) {
      toast.error("Sign in to request promoter access");
      navigate("/auth");
      return;
    }
    requestMutation.mutate();
  };

  // Don't show if user is the organizer
  if (!user || isLoading) return null;

  if (existingRequest?.type === "promoter") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle className="h-3.5 w-3.5 text-primary" />
        You're a promoter for this organizer
      </div>
    );
  }

  if (existingRequest?.status === "pending") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        Promoter request pending
      </div>
    );
  }

  if (existingRequest?.status === "rejected") {
    return null; // Don't show button if rejected
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleClick}
      disabled={requestMutation.isPending}
      className="gap-1.5 text-xs"
    >
      {requestMutation.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Megaphone className="h-3.5 w-3.5" />
      )}
      Request to Promote
    </Button>
  );
}
