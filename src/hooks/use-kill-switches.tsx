import { usePlatformSettings } from "@/hooks/use-platform";
import { AlertTriangle } from "lucide-react";

export function usePlatformKillSwitches() {
  const { data: settings, isLoading } = usePlatformSettings();

  const getBool = (key: string) => {
    if (!settings) return false;
    const v = settings[key];
    return v === true || v === "true";
  };

  return {
    isLoading,
    purchasesDisabled: getBool("kill_all_purchases") || getBool("kill_payments"),
    resaleDisabled: getBool("kill_resale_marketplace") || getBool("kill_all_purchases"),
    costumeDisabled: getBool("kill_costume_marketplace") || getBool("kill_all_purchases"),
    eventCreationDisabled: getBool("kill_event_creation"),
    paymentsDisabled: getBool("kill_payments"),
  };
}

export function KillSwitchBanner({ message }: { message: string }) {
  return (
    <div className="mx-4 mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
      <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
        <AlertTriangle className="h-4 w-4" />
        Temporarily Unavailable
      </div>
      <p className="text-sm text-muted-foreground mt-1">{message}</p>
    </div>
  );
}
