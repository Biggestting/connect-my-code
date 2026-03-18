import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ShieldAlert, Search, AlertTriangle, Activity, Users, Globe,
  RefreshCw, Clock, Ban, Download, CalendarIcon,
} from "lucide-react";
import { formatDistanceToNow, format, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── CSV Helper ──────────────────────────────────────────────
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(","), ...rows.map(r => r.map(escapeCsv).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${rows.length} rows`);
}

// ── Stat Card ───────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, variant = "default" }: {
  icon: any; label: string; value: string | number; variant?: "default" | "warning" | "destructive" | "success";
}) {
  const colors = {
    default: "bg-primary/10 text-primary",
    warning: "bg-orange-500/10 text-orange-500",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-green-500/10 text-green-500",
  };
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[variant]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

// ── Hooks ───────────────────────────────────────────────────
function usePurchaseAttempts(ipFilter: string, dateFrom: Date | undefined, dateTo: Date | undefined) {
  return useQuery({
    queryKey: ["admin-purchase-attempts", ipFilter, dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("purchase_attempts" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (ipFilter) query = query.ilike("ip_address", `%${ipFilter}%`);
      if (dateFrom) query = query.gte("created_at", startOfDay(dateFrom).toISOString());
      if (dateTo) query = query.lte("created_at", endOfDay(dateTo).toISOString());
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    },
    refetchInterval: 15_000,
  });
}

function useFraudFlags(ipFilter: string, dateFrom: Date | undefined, dateTo: Date | undefined) {
  return useQuery({
    queryKey: ["admin-fraud-flags", ipFilter, dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("fraud_flags" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (ipFilter) query = query.ilike("ip_address", `%${ipFilter}%`);
      if (dateFrom) query = query.gte("created_at", startOfDay(dateFrom).toISOString());
      if (dateTo) query = query.lte("created_at", endOfDay(dateTo).toISOString());
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    },
    refetchInterval: 15_000,
  });
}

function useFraudStats() {
  return useQuery({
    queryKey: ["admin-fraud-stats"],
    queryFn: async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();

      const [attempts1h, attempts24h, flags24h, flagsTotal] = await Promise.all([
        supabase
          .from("purchase_attempts" as any)
          .select("*", { count: "exact", head: true })
          .gte("created_at", oneHourAgo),
        supabase
          .from("purchase_attempts" as any)
          .select("*", { count: "exact", head: true })
          .gte("created_at", oneDayAgo),
        supabase
          .from("fraud_flags" as any)
          .select("*", { count: "exact", head: true })
          .gte("created_at", oneDayAgo),
        supabase
          .from("fraud_flags" as any)
          .select("*", { count: "exact", head: true }),
      ]);

      // Distinct IPs in last hour
      const { data: recentAttempts } = await supabase
        .from("purchase_attempts" as any)
        .select("ip_address")
        .gte("created_at", oneHourAgo);
      const uniqueIps = new Set((recentAttempts || []).map((r: any) => r.ip_address)).size;

      return {
        attempts1h: attempts1h.count ?? 0,
        attempts24h: attempts24h.count ?? 0,
        flags24h: flags24h.count ?? 0,
        flagsTotal: flagsTotal.count ?? 0,
        uniqueIps,
      };
    },
    refetchInterval: 15_000,
  });
}

// ── Main Page ───────────────────────────────────────────────
export default function AdminFraudMonitoring() {
  const [ipFilter, setIpFilter] = useState("");
  const [activeTab, setActiveTab] = useState("attempts");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const stats = useFraudStats();
  const attempts = usePurchaseAttempts(ipFilter, dateFrom, dateTo);
  const flags = useFraudFlags(ipFilter, dateFrom, dateTo);

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Fraud Monitoring</h1>
              <p className="text-xs text-muted-foreground">Purchase attempts &amp; suspicious activity</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                if (activeTab === "attempts" && attempts.data?.length) {
                  downloadCsv(
                    `purchase-attempts-${format(new Date(), "yyyy-MM-dd")}.csv`,
                    ["id", "user_id", "event_id", "ip_address", "created_at"],
                    attempts.data.map((r: any) => [r.id, r.user_id, r.event_id, r.ip_address || "", r.created_at])
                  );
                } else if (activeTab === "flags" && flags.data?.length) {
                  downloadCsv(
                    `fraud-flags-${format(new Date(), "yyyy-MM-dd")}.csv`,
                    ["id", "user_id", "ip_address", "reason", "created_at"],
                    flags.data.map((r: any) => [r.id, r.user_id || "", r.ip_address || "", r.reason, r.created_at])
                  );
                } else {
                  toast.info("No data to export");
                }
              }}
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                stats.refetch();
                attempts.refetch();
                flags.refetch();
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={Activity} label="Attempts (1h)" value={stats.data?.attempts1h ?? "—"} />
          <StatCard icon={Clock} label="Attempts (24h)" value={stats.data?.attempts24h ?? "—"} />
          <StatCard icon={Globe} label="Unique IPs (1h)" value={stats.data?.uniqueIps ?? "—"} />
          <StatCard icon={AlertTriangle} label="Flags (24h)" value={stats.data?.flags24h ?? "—"} variant="warning" />
          <StatCard icon={Ban} label="Total Flags" value={stats.data?.flagsTotal ?? "—"} variant="destructive" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Filter by IP address..."
              value={ipFilter}
              onChange={(e) => setIpFilter(e.target.value)}
              className="pl-9 rounded-full"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("gap-1.5 rounded-full", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="w-3.5 h-3.5" />
                {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("gap-1.5 rounded-full", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="w-3.5 h-3.5" />
                {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>

          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
              Clear dates
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="attempts" className="gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Purchase Attempts
            </TabsTrigger>
            <TabsTrigger value="flags" className="gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Fraud Flags
            </TabsTrigger>
          </TabsList>

          {/* ── Purchase Attempts Tab ───────────────────────── */}
          <TabsContent value="attempts">
            <div className="border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Time</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Event ID</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : (attempts.data?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No purchase attempts found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    attempts.data?.map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {row.user_id?.slice(0, 8)}…
                          </code>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {row.event_id?.slice(0, 8)}…
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {row.ip_address || "unknown"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── Fraud Flags Tab ─────────────────────────────── */}
          <TabsContent value="flags">
            <div className="border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Time</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flags.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : (flags.data?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No fraud flags found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    flags.data?.map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          {row.user_id ? (
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {row.user_id.slice(0, 8)}…
                            </code>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {row.ip_address || "unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-xs font-normal">
                            {row.reason}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
