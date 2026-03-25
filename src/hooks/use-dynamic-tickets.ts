import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useCallback, useState } from "react";

export interface Ticket {
  id: string;
  purchase_id: string | null;
  event_id: string;
  ticket_tier_id: string;
  owner_user_id: string | null;
  status: string;
  fulfillment_type: string;
  claim_code: string | null;
  claim_status: string;
  resale_status: string | null;
  transfer_history: any[];
  qr_token: string;
  qr_token_expires_at: string;
  scanned_at: string | null;
  scanned_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketWithRelations extends Ticket {
  events?: {
    id: string;
    title: string;
    date: string;
    end_date: string | null;
    venue: string | null;
    image_url: string | null;
    organizer_id: string;
    organizers?: { name: string; slug: string; logo_url: string | null };
  };
  ticket_tiers?: { name: string; price: number };
  purchases?: { status: string; balance_remaining: number | null } | null;
}

export function useMyTickets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-tickets", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*, events(id, title, date, end_date, venue, image_url, organizer_id, organizers(name, slug, logo_url)), ticket_tiers(name, price), purchases(status, balance_remaining)")
        .eq("owner_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as TicketWithRelations[];
    },
    enabled: !!user,
  });
}

/**
 * Hook that provides a static single-use QR token for a ticket.
 * Token is created once at purchase and only changes on resale transfer.
 * Security comes from single-use scan, not rotation.
 */
export function useTicketQR(ticketId: string | null) {
  const [qrData, setQrData] = useState<{ token: string; expiresAt: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("rotate_ticket_qr", {
        ticket_id: ticketId,
      });
      if (error) throw error;
      if (data && data.length > 0) {
        setQrData({
          token: data[0].new_qr_token,
          expiresAt: data[0].expires_at,
        });
      }
    } catch (err) {
      console.error("Failed to load QR:", err);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  return { qrData, loading, refresh };
}

export function useTransferTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, newOwnerUserId }: { ticketId: string; newOwnerUserId: string }) => {
      const { data, error } = await supabase.functions.invoke("transfer-ticket", {
        body: { ticket_id: ticketId, new_owner_user_id: newOwnerUserId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
    },
  });
}

export function useClaimTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ claimCode }: { claimCode: string }) => {
      const { data, error } = await supabase.functions.invoke("claim-ticket", {
        body: { claim_code: claimCode },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
    },
  });
}

export function useCreatePhysicalTickets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      eventId: string;
      ticketTierId: string;
      quantity: number;
      fulfillmentType: string;
      assignedUserId?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("create-physical-tickets", {
        body: {
          event_id: params.eventId,
          ticket_tier_id: params.ticketTierId,
          quantity: params.quantity,
          fulfillment_type: params.fulfillmentType,
          assigned_user_id: params.assignedUserId,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-tickets"] });
    },
  });
}

export function useEventTickets(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event-tickets", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*, ticket_tiers(name, price)")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as (Ticket & { ticket_tiers?: { name: string; price: number } })[];
    },
    enabled: !!eventId,
  });
}
