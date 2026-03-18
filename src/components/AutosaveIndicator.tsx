import { Check, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import type { AutosaveStatus } from "@/hooks/use-autosave";

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  error?: string | null;
}

export function AutosaveIndicator({ status, lastSavedAt, error }: AutosaveIndicatorProps) {
  if (status === "idle" && !lastSavedAt) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving…</span>
        </>
      )}
      {status === "saved" && lastSavedAt && (
        <>
          <Check className="h-3 w-3 text-green-500" />
          <span>Saved {format(lastSavedAt, "h:mm a")}</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-3 w-3 text-destructive" />
          <span>{error || "Save failed"}</span>
        </>
      )}
    </div>
  );
}
