import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { usePlatformSettings, useUpdatePlatformSetting, useAuditLog } from "@/hooks/use-platform";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert, Power, ShoppingBag, CreditCard, Calendar,
  RotateCcw, AlertTriangle, Clock
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface KillSwitchConfig {
  key: string;
  label: string;
  description: string;
  icon: any;
  color: string;
}

const killSwitches: KillSwitchConfig[] = [
  {
    key: "kill_all_purchases",
    label: "Global Purchase Kill Switch",
    description: "Stops ALL ticket purchases, costume purchases, and resale transactions platform-wide. Browsing remains active.",
    icon: Power,
    color: "text-destructive",
  },
  {
    key: "kill_payments",
    label: "Payment System Pause",
    description: "Pauses all payment processing while still allowing browsing. Use for payment processor issues or fraud attacks.",
    icon: CreditCard,
    color: "text-orange-500",
  },
  {
    key: "kill_event_creation",
    label: "Event Creation Lock",
    description: "Prevents organizers from creating new events. Existing events remain unaffected.",
    icon: Calendar,
    color: "text-yellow-600",
  },
  {
    key: "kill_resale_marketplace",
    label: "Resale Marketplace Kill Switch",
    description: "Disables resale listing creation and resale purchases. Existing tickets remain valid.",
    icon: RotateCcw,
    color: "text-purple-500",
  },
  {
    key: "kill_costume_marketplace",
    label: "Costume Marketplace Kill Switch",
    description: "Pauses costume purchases. Browsing and listings remain visible.",
    icon: ShoppingBag,
    color: "text-blue-500",
  },
];

export default function AdminKillSwitches() {
  const { data: settings, isLoading } = usePlatformSettings();
  const updateSetting = useUpdatePlatformSetting();
  const { data: auditLog } = useAuditLog();

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    key: string;
    label: string;
    newValue: boolean;
    reason: string;
  }>({ open: false, key: "", label: "", newValue: false, reason: "" });

  const getSettingBool = (key: string) => {
    if (!settings) return false;
    const v = settings[key];
    return v === true || v === "true";
  };

  const handleToggle = (ks: KillSwitchConfig) => {
    const current = getSettingBool(ks.key);
    setConfirmDialog({
      open: true,
      key: ks.key,
      label: ks.label,
      newValue: !current,
      reason: "",
    });
  };

  const confirmAction = async () => {
    try {
      await updateSetting.mutateAsync({
        key: confirmDialog.key,
        value: confirmDialog.newValue,
        reason: confirmDialog.reason || undefined,
      });
      toast.success(
        confirmDialog.newValue
          ? `${confirmDialog.label} ACTIVATED`
          : `${confirmDialog.label} deactivated`
      );
    } catch (err: any) {
      toast.error(err.message);
    }
    setConfirmDialog((p) => ({ ...p, open: false }));
  };

  const activeKills = killSwitches.filter((ks) => getSettingBool(ks.key));

  const recentKillActions = auditLog?.filter((l: any) =>
    l.action.startsWith("update_setting:kill_")
  ).slice(0, 10);

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-1">
          <ShieldAlert className="w-6 h-6 text-destructive" />
          <h1 className="text-xl font-bold text-foreground">Platform Kill Switches</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Emergency controls to immediately stop harmful or suspicious activity.
        </p>

        {/* Active alerts banner */}
        {activeKills.length > 0 && (
          <div className="mb-5 p-4 rounded-xl border-2 border-destructive/30 bg-destructive/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <p className="text-sm font-bold text-destructive">{activeKills.length} Kill Switch{activeKills.length > 1 ? "es" : ""} Active</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeKills.map((ks) => (
                <Badge key={ks.key} variant="destructive" className="text-xs">{ks.label}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Kill Switch Cards */}
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 rounded-xl border border-border animate-pulse bg-muted" />)}</div>
        ) : (
          <div className="space-y-3">
            {killSwitches.map((ks) => {
              const active = getSettingBool(ks.key);
              return (
                <div
                  key={ks.key}
                  className={`p-4 rounded-xl border transition-colors ${
                    active ? "border-destructive/40 bg-destructive/5" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        active ? "bg-destructive/10" : "bg-muted"
                      }`}>
                        <ks.icon className={`w-5 h-5 ${active ? "text-destructive" : ks.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground">{ks.label}</p>
                          {active && <Badge variant="destructive" className="text-[10px]">ACTIVE</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{ks.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={active}
                      onCheckedChange={() => handleToggle(ks)}
                      className="shrink-0"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Separator className="my-6" />

        {/* Recent Kill Switch Actions */}
        <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Recent Kill Switch Actions
        </h2>
        <div className="space-y-2">
          {recentKillActions && recentKillActions.length > 0 ? (
            recentKillActions.map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-xs">
                    {log.action.replace("update_setting:", "").replace(/_/g, " ")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {log.details?.reason || "No reason provided"} ·{" "}
                    Value: {String(log.details?.value)}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground shrink-0">
                  {format(new Date(log.created_at), "MMM d, h:mm a")}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No kill switch actions logged yet.</p>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((p) => ({ ...p, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${confirmDialog.newValue ? "text-destructive" : "text-green-600"}`} />
              {confirmDialog.newValue ? "Activate Kill Switch" : "Deactivate Kill Switch"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                {confirmDialog.newValue
                  ? `You are about to activate "${confirmDialog.label}". This will immediately affect live platform operations.`
                  : `You are about to deactivate "${confirmDialog.label}". Normal operations will resume.`}
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs">Reason (required for activation)</Label>
                <Textarea
                  value={confirmDialog.reason}
                  onChange={(e) => setConfirmDialog((p) => ({ ...p, reason: e.target.value }))}
                  placeholder="Describe why this action is being taken..."
                  rows={2}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={confirmDialog.newValue && !confirmDialog.reason.trim()}
              className={confirmDialog.newValue ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirmDialog.newValue ? "ACTIVATE" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
