import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface QueueEntry {
  id: string;
  user_id: string;
  event_id: string;
  position: number;
  status: "waiting" | "admitted" | "expired" | "completed";
  joined_at: string;
  admitted_at: string | null;
  expires_at: string | null;
  checkout_token: string | null;
  token_expires_at: string | null;
}

interface Reservation {
  id: string;
  expires_at: string;
  status: string;
}

export function useCheckoutQueue(eventId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: queueActive } = useQuery({
    queryKey: ["queue-active", eventId],
    queryFn: async () => {
      const { data: setting } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "queue_threshold")
        .single();
      const threshold = setting?.value ?? 50;

      const { count } = await supabase
        .from("checkout_queue" as any)
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId!)
        .eq("status", "waiting");

      return (count || 0) >= Number(threshold);
    },
    enabled: !!eventId,
    refetchInterval: 10000,
  });

  const { data: queueEntry, refetch: refetchQueue } = useQuery({
    queryKey: ["queue-entry", eventId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("checkout_queue" as any)
        .select("*")
        .eq("event_id", eventId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data as unknown as QueueEntry | null;
    },
    enabled: !!eventId && !!user,
    refetchInterval: 3000,
  });

  const { data: waitingCount } = useQuery({
    queryKey: ["queue-count", eventId],
    queryFn: async () => {
      const { count } = await supabase
        .from("checkout_queue" as any)
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId!)
        .eq("status", "waiting");
      return count || 0;
    },
    enabled: !!eventId && queueEntry?.status === "waiting",
    refetchInterval: 5000,
  });

  const joinQueue = useMutation({
    mutationFn: async () => {
      if (!user || !eventId) throw new Error("Missing user or event");

      const { count } = await supabase
        .from("checkout_queue" as any)
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId);

      const { data, error } = await supabase
        .from("checkout_queue" as any)
        .upsert(
          {
            user_id: user.id,
            event_id: eventId,
            position: (count || 0) + 1,
            status: "waiting",
          } as any,
          { onConflict: "user_id,event_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue-entry", eventId] });
    },
  });

  const checkoutToken = queueEntry?.checkout_token || null;
  const tokenExpiresAt = queueEntry?.token_expires_at
    ? new Date(queueEntry.token_expires_at)
    : null;
  const isAdmitted =
    queueEntry?.status === "admitted" &&
    !!checkoutToken &&
    !!tokenExpiresAt &&
    tokenExpiresAt > new Date();

  const isWaiting = queueEntry?.status === "waiting";
  const needsQueue = queueActive && !isAdmitted;

  return {
    queueActive: queueActive || false,
    isAdmitted,
    isWaiting,
    needsQueue,
    queueEntry,
    checkoutToken,
    tokenExpiresAt,
    waitingCount: waitingCount || 0,
    joinQueue,
    refetchQueue,
  };
}

export function useReservationTimer(eventId: string | undefined) {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);

  const { data: reservation, refetch } = useQuery({
    queryKey: ["reservation", eventId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("inventory_reservations" as any)
        .select("id, expires_at, status")
        .eq("event_id", eventId!)
        .eq("user_id", user!.id)
        .eq("status", "held")
        .maybeSingle();
      return data as unknown as Reservation | null;
    },
    enabled: !!eventId && !!user,
  });

  useEffect(() => {
    if (!reservation) {
      setTimeLeft(null);
      setReservationId(null);
      return;
    }
    setReservationId(reservation.id);
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.floor(
          (new Date(reservation.expires_at).getTime() - Date.now()) / 1000
        )
      );
      setTimeLeft(remaining);
      if (remaining <= 0) refetch();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [reservation, refetch]);

  const reserveInventory = useCallback(
    async (params: {
      productType: string;
      ticketTierId?: string;
      costumeProductId?: string;
      jouvertPackageId?: string;
      quantity: number;
      checkoutToken?: string | null;
    }) => {
      if (!user || !eventId) throw new Error("Missing user or event");

      const { data, error } = await supabase.rpc("reserve_inventory" as any, {
        _user_id: user.id,
        _event_id: eventId,
        _product_type: params.productType,
        _ticket_tier_id: params.ticketTierId || null,
        _costume_product_id: params.costumeProductId || null,
        _jouvert_package_id: params.jouvertPackageId || null,
        _quantity: params.quantity,
        _checkout_token: params.checkoutToken || null,
      });

      if (error) throw error;
      setReservationId(data);
      refetch();
      return data as string;
    },
    [user, eventId, refetch]
  );

  const completeReservation = useCallback(async () => {
    if (!reservationId || !user) return;
    await supabase.rpc("complete_reservation" as any, {
      _reservation_id: reservationId,
      _user_id: user.id,
    });
    refetch();
  }, [reservationId, user, refetch]);

  return {
    timeLeft,
    reservationId,
    hasReservation: !!reservation && reservation.status === "held",
    reserveInventory,
    completeReservation,
    refetch,
  };
}
