import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlatformSettings, useUpdatePlatformSetting } from "@/hooks/use-platform";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users, Clock, Zap, Settings2, RefreshCw, Play,
  AlertTriangle, CheckCircle2, Timer
} from "lucide-react";

function StatCard({ icon: Icon, label, value, variant }: {
  icon: any; label: string; value: string | number; variant?: "default" | "warning" | "success";
}) {
  const colors = {
    default: "bg-primary/10 text-primary",
    warning: "bg-orange-500/10 text-orange-500",
    success: "bg-green-500/10 text-green-500",
  };
  const c = colors[variant || "default"];
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function AdminQueues() {
  const queryClient = useQueryClient();
  const { data: settings } = usePlatformSettings();
  const updateSetting = useUpdatePlatformSetting();

  const [threshold, setThreshold] = useState<string>("");
  const [batchSize, setBatchSize] = useState<string>("");
  const [ttlMinutes, setTtlMinutes] = useState<string>("");
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [showAdmitDialog, setShowAdmitDialog] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventName, setSelectedEventName] = useState<string>("");

  // Sync local state from settings
  const currentThreshold = settings?.queue_threshold ?? 50;
  const currentBatchSize = settings?.queue_batch_size ?? 200;
  const currentTtl = settings?.reservation_ttl_minutes ?? 8;

  // Active queues grouped by event
  const { data: activeQueues, isLoading: queuesLoading, refetch: refetchQueues } = useQuery({
    queryKey: ["admin-active-queues"],
    queryFn: async () => {
      // Get all non-completed queue entries
      const { data, error } = await supabase
        .from("checkout_queue")
        .select("id, event_id, user_id, position, status, joined_at, admitted_at, token_expires_at, checkout_token")
        .in("status", ["waiting", "admitted"])
        .order("position", { ascending: true });
      if (error) throw error;

      // Group by event
      const grouped: Record<string, { eventId: string; waiting: number; admitted: number; entries: any[] }> = {};
      (data || []).forEach((entry: any) => {
        if (!grouped[entry.event_id]) {
          grouped[entry.event_id] = { eventId: entry.event_id, waiting: 0, admitted: 0, entries: [] };
        }
        grouped[entry.event_id].entries.push(entry);
        if (entry.status === "waiting") grouped[entry.event_id].waiting++;
        if (entry.status === "admitted") grouped[entry.event_id].admitted++;
      });
      return Object.values(grouped);
    },
    refetchInterval: 5000,
  });

  // Get event titles for display
  const eventIds = (activeQueues || []).map((q) => q.eventId);
  const { data: eventNames } = useQuery({
    queryKey: ["admin-queue-event-names", eventIds],
    queryFn: async () => {
      if (eventIds.length === 0) return {};
      const { data } = await supabase
        .from("events")
        .select("id, title")
        .in("id", eventIds);
      const map: Record<string, string> = {};
      (data || []).forEach((e: any) => { map[e.id] = e.title; });
      return map;
    },
    enabled: eventIds.length > 0,
  });

  // Active reservations count
  const { data: reservationStats } = useQuery({
    queryKey: ["admin-reservation-stats"],
    queryFn: async () => {
      const { count: held } = await supabase
        .from("inventory_reservations")
        .select("*", { count: "exact", head: true })
        .eq("status", "held");
      const { count: expired } = await supabase
        .from("inventory_reservations")
        .select("*", { count: "exact", head: true })
        .eq("status", "expired");
      return { held: held || 0, expired: expired || 0 };
    },
    refetchInterval: 5000,
  });

  // Manual batch admit
  const admitBatch = useMutation({
    mutationFn: async (eventId: string) => {
      const { data, error } = await supabase.rpc("admit_queue_batch", {
        _event_id: eventId,
        _batch_size: currentBatchSize,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (admitted, eventId) => {
      toast.success(`Admitted ${admitted} users`);
      queryClient.invalidateQueries({ queryKey: ["admin-active-queues"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Process queue (calls edge function)
  const processQueue = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("process-queue");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Processed: ${data.admitted_users} admitted, ${data.released_reservations} released`);
      queryClient.invalidateQueries({ queryKey: ["admin-active-queues"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reservation-stats"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const saveSetting = (key: string, value: number, label: string) => {
    updateSetting.mutate(
      { key, value, reason: `Admin updated ${label}` },
      { onSuccess: () => toast.success(`${label} updated to ${value}`) }
    );
  };

  const totalWaiting = (activeQueues || []).reduce((s, q) => s + q.waiting, 0);
  const totalAdmitted = (activeQueues || []).reduce((s, q) => s + q.admitted, 0);

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Queue Management</h1>
            <p className="text-sm text-muted-foreground">Monitor and control virtual checkout queues</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchQueues()}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setShowProcessDialog(true)}
              disabled={processQueue.isPending}
              className="gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              {processQueue.isPending ? "Processing…" : "Run Queue Processor"}
            </Button>
          </div>
        </div>

        {/* Process Queue Confirmation Dialog */}
        <AlertDialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Run Queue Processor?</AlertDialogTitle>
              <AlertDialogDescription>
                This will release expired reservations, expire lapsed tokens, and admit up to {currentBatchSize} users from each active queue.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  processQueue.mutate();
                  setShowProcessDialog(false);
                }}
              >
                Run Processor
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Stats overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Users Waiting" value={totalWaiting} variant="warning" />
          <StatCard icon={CheckCircle2} label="Users Admitted" value={totalAdmitted} variant="success" />
          <StatCard icon={Timer} label="Active Reservations" value={reservationStats?.held ?? 0} />
          <StatCard icon={AlertTriangle} label="Expired Reservations" value={reservationStats?.expired ?? 0} variant="warning" />
        </div>

        <Separator />

        {/* Active Queues by Event */}
        <section>
          <h2 className="text-base font-bold text-foreground mb-3">Active Queues</h2>
          {queuesLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !activeQueues?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No active queues right now</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeQueues.map((queue) => (
                <div
                  key={queue.eventId}
                  className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {eventNames?.[queue.eventId] || queue.eventId.slice(0, 8) + "…"}
                    </p>
                    <div className="flex gap-3 mt-1">
                      <Badge variant="outline" className="text-xs gap-1">
                        <Clock className="w-3 h-3" />
                        {queue.waiting} waiting
                      </Badge>
                      <Badge variant="secondary" className="text-xs gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {queue.admitted} admitted
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedEventId(queue.eventId);
                      setSelectedEventName(eventNames?.[queue.eventId] || queue.eventId.slice(0, 8) + "…");
                      setShowAdmitDialog(true);
                    }}
                    disabled={admitBatch.isPending || queue.waiting === 0}
                    className="gap-1.5 shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Admit Batch ({currentBatchSize})
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        <Separator />

        {/* Settings */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Settings2 className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-base font-bold text-foreground">Queue Settings</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Queue Threshold (concurrent users)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  placeholder={String(currentThreshold)}
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!threshold || Number(threshold) === currentThreshold}
                  onClick={() => {
                    saveSetting("queue_threshold", Number(threshold), "Queue threshold");
                    setThreshold("");
                  }}
                >
                  Save
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Current: {currentThreshold}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Batch Size (users per release)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  placeholder={String(currentBatchSize)}
                  value={batchSize}
                  onChange={(e) => setBatchSize(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!batchSize || Number(batchSize) === currentBatchSize}
                  onClick={() => {
                    saveSetting("queue_batch_size", Number(batchSize), "Batch size");
                    setBatchSize("");
                  }}
                >
                  Save
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Current: {currentBatchSize}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Reservation TTL (minutes)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={30}
                  placeholder={String(currentTtl)}
                  value={ttlMinutes}
                  onChange={(e) => setTtlMinutes(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!ttlMinutes || Number(ttlMinutes) === currentTtl}
                  onClick={() => {
                    saveSetting("reservation_ttl_minutes", Number(ttlMinutes), "Reservation TTL");
                    setTtlMinutes("");
                  }}
                >
                  Save
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Current: {currentTtl} min</p>
            </div>
          </div>
        </section>

        {/* Admit Batch Confirmation Dialog */}
        <AlertDialog open={showAdmitDialog} onOpenChange={setShowAdmitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Admit Queue Batch?</AlertDialogTitle>
              <AlertDialogDescription>
                This will admit up to {currentBatchSize} users from the queue for <strong>{selectedEventName}</strong>.
                They will receive checkout tokens valid for {currentTtl} minutes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (selectedEventId) {
                    admitBatch.mutate(selectedEventId);
                  }
                  setShowAdmitDialog(false);
                  setSelectedEventId(null);
                }}
              >
                Admit Batch
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
