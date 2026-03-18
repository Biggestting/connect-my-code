import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAction } from "@/hooks/use-platform";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Calendar, MoreVertical, Pause, Play, EyeOff, XCircle, Copy, Eye, Download, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminEventsPage() {
  const queryClient = useQueryClient();
  const adminAction = useAdminAction();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [exporting, setExporting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>({
    open: false, title: "", description: "", onConfirm: () => {},
  });

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (dateFrom) params.set("from", dateFrom.toISOString().slice(0, 10));
      if (dateTo) params.set("to", dateTo.toISOString().slice(0, 10));

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/export-events-csv?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Export failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `events-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-events-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, organizers(name, status), carnivals(name), ticket_tiers(price, sold_count, quantity)")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = events?.filter((e: any) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.organizers?.name?.toLowerCase().includes(search.toLowerCase());
    const eventDate = new Date(e.date);
    const isPast = eventDate < new Date();
    const matchStatus = statusFilter === "all" ||
      (statusFilter === "active" && !isPast && e.sales_status !== "paused") ||
      (statusFilter === "paused" && e.sales_status === "paused") ||
      (statusFilter === "hidden" && e.hidden) ||
      (statusFilter === "cancelled" && e.sales_status === "cancelled") ||
      (statusFilter === "past" && isPast);
    const matchDateFrom = !dateFrom || eventDate >= dateFrom;
    const matchDateTo = !dateTo || eventDate <= new Date(dateTo.getTime() + 86400000);
    return matchSearch && matchStatus && matchDateFrom && matchDateTo;
  });

  const doAction = (action: string, event: any, salesStatus?: string, hidden?: boolean) => {
    const labels: Record<string, string> = {
      pause_sales: "Pause Ticket Sales",
      resume_sales: "Resume Ticket Sales",
      cancel_event: "Cancel Event",
      hide_event: "Hide from Discovery",
      show_event: "Show in Discovery",
      clone_event: "Clone Event",
    };

    if (action === "clone_event") {
      setConfirmDialog({
        open: true,
        title: "Clone Event",
        description: `Create a duplicate of "${event.title}" with all settings, ticket types, and pricing?`,
        onConfirm: async () => {
          try {
            await adminAction.mutateAsync({
              action: "clone_event",
              targetType: "event",
              targetId: event.id,
              details: { original_title: event.title },
              execute: async () => {
                const { data: newEvent, error } = await supabase.from("events").insert({
                  title: `${event.title} (Copy)`,
                  date: event.date,
                  end_date: event.end_date,
                  organizer_id: event.organizer_id,
                  carnival_id: event.carnival_id,
                  carnival_year: event.carnival_year,
                  category: event.category,
                  description: event.description,
                  image_url: event.image_url,
                  venue: event.venue,
                  address: event.address,
                  city: event.city,
                  state: event.state,
                  country: event.country,
                  price: event.price,
                  min_ticket_price: event.min_ticket_price,
                  highlights: event.highlights,
                  venue_notes: event.venue_notes,
                  tags: event.tags,
                  has_lineup: event.has_lineup,
                  has_agenda: event.has_agenda,
                }).select("id").single();
                if (error) throw error;

                // Clone ticket tiers
                const tiers = event.ticket_tiers || [];
                if (tiers.length > 0 && newEvent) {
                  await supabase.from("ticket_tiers").insert(
                    tiers.map((t: any) => ({
                      event_id: newEvent.id,
                      name: t.name,
                      price: t.price,
                      quantity: t.quantity,
                    }))
                  );
                }
              },
            });
            toast.success("Event cloned successfully");
            queryClient.invalidateQueries({ queryKey: ["admin-events-full"] });
          } catch (err: any) {
            toast.error(err.message);
          }
        },
      });
      return;
    }

    setConfirmDialog({
      open: true,
      title: labels[action] || action,
      description: `Are you sure you want to ${labels[action]?.toLowerCase()} for "${event.title}"?`,
      onConfirm: async () => {
        try {
          await adminAction.mutateAsync({
            action,
            targetType: "event",
            targetId: event.id,
            details: { title: event.title },
            execute: async () => {
              const updates: any = {};
              if (salesStatus !== undefined) updates.sales_status = salesStatus;
              if (hidden !== undefined) updates.hidden = hidden;
              const { error } = await supabase.from("events").update(updates).eq("id", event.id);
              if (error) throw error;
            },
          });
          toast.success(`${labels[action]} applied`);
          queryClient.invalidateQueries({ queryKey: ["admin-events-full"] });
        } catch (err: any) {
          toast.error(err.message);
        }
      },
    });
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-6xl">
        <h1 className="text-xl font-bold text-foreground mb-1">Event Management</h1>
        <p className="text-sm text-muted-foreground mb-5">{events?.length || 0} total events</p>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events or organizers..." className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>

          {/* Date From */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("w-[140px] justify-start text-left font-normal gap-1.5", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="w-3.5 h-3.5" />
                {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>

          {/* Date To */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("w-[140px] justify-start text-left font-normal gap-1.5", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="w-3.5 h-3.5" />
                {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>

          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }} className="gap-1 text-muted-foreground">
              <X className="w-3.5 h-3.5" /> Clear dates
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={exporting} className="shrink-0 gap-1.5">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{exporting ? "Exporting…" : "Export CSV"}</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-xl border border-border animate-pulse bg-muted" />)}</div>
        ) : (
          <div className="space-y-2">
            {filtered?.map((event: any) => {
              const ticketsSold = event.ticket_tiers?.reduce((s: number, t: any) => s + t.sold_count, 0) || 0;
              const revenue = event.ticket_tiers?.reduce((s: number, t: any) => s + Number(t.price) * t.sold_count, 0) || 0;
              const isPast = new Date(event.date) < new Date();
              const isPaused = event.sales_status === "paused";
              const isCancelled = event.sales_status === "cancelled";

              return (
                <div key={event.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  isPaused ? "border-orange-300 bg-orange-50/50" :
                  isCancelled ? "border-destructive/30 bg-destructive/5" :
                  event.hidden ? "border-muted bg-muted/30" :
                  "border-border hover:bg-muted/50"
                }`}>
                  {event.image_url ? (
                    <img src={event.image_url} alt={event.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0"><Calendar className="w-5 h-5 text-muted-foreground" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link to={`/events/${event.id}`} className="text-sm font-semibold text-foreground truncate block hover:underline">{event.title}</Link>
                    <p className="text-xs text-muted-foreground">
                      {event.organizers?.name} · {format(new Date(event.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="hidden md:flex flex-col items-end gap-0.5">
                    <p className="text-xs font-medium text-foreground">{ticketsSold} sold · ${revenue.toLocaleString()}</p>
                    <div className="flex gap-1">
                      {isPaused && <Badge variant="outline" className="text-[10px] border-orange-400 text-orange-600">Paused</Badge>}
                      {isCancelled && <Badge variant="destructive" className="text-[10px]">Cancelled</Badge>}
                      {event.hidden && <Badge variant="outline" className="text-[10px]">Hidden</Badge>}
                      {!isPast && !isPaused && !isCancelled && <Badge variant="secondary" className="text-[10px]">Active</Badge>}
                      {isPast && !isCancelled && <Badge variant="outline" className="text-[10px]">Past</Badge>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!isPaused && !isCancelled && (
                        <DropdownMenuItem onClick={() => doAction("pause_sales", event, "paused")}>
                          <Pause className="w-3.5 h-3.5 mr-2" /> Pause Sales
                        </DropdownMenuItem>
                      )}
                      {isPaused && (
                        <DropdownMenuItem onClick={() => doAction("resume_sales", event, "on_sale")}>
                          <Play className="w-3.5 h-3.5 mr-2" /> Resume Sales
                        </DropdownMenuItem>
                      )}
                      {!isCancelled && (
                        <DropdownMenuItem onClick={() => doAction("cancel_event", event, "cancelled")} className="text-destructive">
                          <XCircle className="w-3.5 h-3.5 mr-2" /> Cancel Event
                        </DropdownMenuItem>
                      )}
                      {!event.hidden ? (
                        <DropdownMenuItem onClick={() => doAction("hide_event", event, undefined, true)}>
                          <EyeOff className="w-3.5 h-3.5 mr-2" /> Hide from Discovery
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => doAction("show_event", event, undefined, false)}>
                          <Eye className="w-3.5 h-3.5 mr-2" /> Show in Discovery
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => doAction("clone_event", event)}>
                        <Copy className="w-3.5 h-3.5 mr-2" /> Clone Event
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
            {filtered?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No events found.</p>}
          </div>
        )}
      </div>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((p) => ({ ...p, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialog.onConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
