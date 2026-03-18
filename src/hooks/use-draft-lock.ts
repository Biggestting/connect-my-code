import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseDraftLockConfig {
  recordId: string | null;
  userId: string | undefined;
  enabled?: boolean;
  heartbeatMs?: number;
  lockExpiryMs?: number;
}

export function useDraftLock({
  recordId,
  userId,
  enabled = true,
  heartbeatMs = 30000,
  lockExpiryMs = 120000,
}: UseDraftLockConfig) {
  const [isLockedByOther, setIsLockedByOther] = useState(false);
  const [lockedByUserId, setLockedByUserId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const acquireLock = useCallback(async () => {
    if (!recordId || !userId) return true;

    const { data } = await supabase
      .from("events")
      .select("editing_by, editing_at")
      .eq("id", recordId)
      .single() as any;

    if (data?.editing_by && data.editing_by !== userId) {
      const lockAge = Date.now() - new Date(data.editing_at).getTime();
      if (lockAge < lockExpiryMs) {
        setIsLockedByOther(true);
        setLockedByUserId(data.editing_by);
        return false;
      }
    }

    await supabase
      .from("events")
      .update({ editing_by: userId, editing_at: new Date().toISOString() } as any)
      .eq("id", recordId);

    setIsLockedByOther(false);
    setLockedByUserId(null);
    return true;
  }, [recordId, userId, lockExpiryMs]);

  const releaseLock = useCallback(async () => {
    if (!recordId || !userId) return;
    await supabase
      .from("events")
      .update({ editing_by: null, editing_at: null } as any)
      .eq("id", recordId);
  }, [recordId, userId]);

  const refreshLock = useCallback(async () => {
    if (!recordId || !userId) return;
    await supabase
      .from("events")
      .update({ editing_at: new Date().toISOString() } as any)
      .eq("id", recordId);
  }, [recordId, userId]);

  useEffect(() => {
    if (!enabled || !recordId || !userId) return;

    acquireLock();
    intervalRef.current = setInterval(refreshLock, heartbeatMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      releaseLock();
    };
  }, [enabled, recordId, userId, heartbeatMs]);

  return { isLockedByOther, lockedByUserId, acquireLock, releaseLock };
}
