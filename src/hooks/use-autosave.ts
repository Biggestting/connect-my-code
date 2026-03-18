import { useState, useRef, useEffect, useCallback } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutosaveConfig {
  onSave: (changedFields: Record<string, any>) => Promise<void>;
  data: Record<string, any>;
  enabled?: boolean;
  debounceMs?: number;
}

function getChangedFields(prev: Record<string, any>, current: Record<string, any>) {
  const changed: Record<string, any> = {};
  for (const key of Object.keys(current)) {
    if (JSON.stringify(prev[key]) !== JSON.stringify(current[key])) {
      changed[key] = current[key];
    }
  }
  return Object.keys(changed).length > 0 ? changed : null;
}

export function useAutosave({ onSave, data, enabled = true, debounceMs = 4000 }: UseAutosaveConfig) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const prevDataRef = useRef<Record<string, any>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const isMountedRef = useRef(true);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const save = useCallback(async () => {
    const changed = getChangedFields(prevDataRef.current, dataRef.current);
    if (!changed) return;

    setStatus("saving");
    setError(null);
    try {
      await onSaveRef.current(changed);
      if (isMountedRef.current) {
        prevDataRef.current = { ...dataRef.current };
        setStatus("saved");
        setLastSavedAt(new Date());
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setStatus("error");
        setError(err.message || "Autosave failed");
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const changed = getChangedFields(prevDataRef.current, data);
    if (!changed) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, enabled, debounceMs, save]);

  const setSnapshot = useCallback((snapshot: Record<string, any>) => {
    prevDataRef.current = { ...snapshot };
  }, []);

  const flush = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    await save();
  }, [save]);

  return { status, lastSavedAt, error, setSnapshot, flush };
}
