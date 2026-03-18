import { useState } from "react";
import { Printer, Package, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCreatePhysicalTickets, useEventTickets } from "@/hooks/use-dynamic-tickets";
import { toast } from "sonner";
import type { Event, TicketTier } from "@/types";

interface InventoryTabProps {
  events: (Event & { ticket_tiers?: TicketTier[] })[];
}

export function InventoryTab({ events }: InventoryTabProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const { data: tickets, isLoading } = useEventTickets(selectedEventId || undefined);

  const digitalCount = tickets?.filter((t) => t.fulfillment_type === "digital").length || 0;
  const physicalAssigned = tickets?.filter((t) => t.fulfillment_type === "physical_assigned").length || 0;
  const physicalUnassigned = tickets?.filter((t) => t.fulfillment_type === "physical_unassigned").length || 0;
  const claimedCount = tickets?.filter((t) => t.claim_status === "claimed").length || 0;
  const unclaimedCount = tickets?.filter((t) => t.claim_status === "unclaimed" && t.fulfillment_type !== "digital").length || 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Ticket Inventory</h2>
          <p className="text-sm text-muted-foreground">Manage digital and physical ticket allocation</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Select Event</Label>
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an event..." />
          </SelectTrigger>
          <SelectContent>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedEventId && selectedEvent && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Digital" count={digitalCount} />
            <SummaryCard label="Physical (Assigned)" count={physicalAssigned} />
            <SummaryCard label="Physical (Unassigned)" count={physicalUnassigned} />
            <SummaryCard label="Unclaimed" count={unclaimedCount} variant="warning" />
          </div>

          {/* Create physical tickets */}
          <CreatePhysicalTicketsDialog
            eventId={selectedEventId}
            tiers={selectedEvent.ticket_tiers || []}
          />

          {/* Ticket list */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {tickets?.filter((t) => t.fulfillment_type !== "digital").map((ticket) => (
                <div key={ticket.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Printer className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-foreground">{ticket.claim_code || "—"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {ticket.ticket_tiers?.name} · {ticket.fulfillment_type.replace("_", " ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={ticket.claim_status === "claimed" ? "default" : "outline"}
                      className="text-[10px]"
                    >
                      {ticket.claim_status}
                    </Badge>
                    <Badge
                      variant={ticket.status === "valid" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {ticket.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {tickets?.filter((t) => t.fulfillment_type !== "digital").length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No physical tickets created for this event yet.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, count, variant }: { label: string; count: number; variant?: "warning" }) {
  return (
    <div className="p-3 rounded-xl border border-border bg-card">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${variant === "warning" && count > 0 ? "text-amber-500" : "text-foreground"}`}>
        {count}
      </p>
    </div>
  );
}

function CreatePhysicalTicketsDialog({ eventId, tiers }: { eventId: string; tiers: TicketTier[] }) {
  const [open, setOpen] = useState(false);
  const [tierId, setTierId] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [fulfillmentType, setFulfillmentType] = useState("physical_unassigned");
  const createMutation = useCreatePhysicalTickets();

  const handleCreate = async () => {
    if (!tierId) { toast.error("Select a ticket tier"); return; }
    try {
      const data = await createMutation.mutateAsync({
        eventId,
        ticketTierId: tierId,
        quantity,
        fulfillmentType,
      });
      toast.success(`Created ${data.count} physical tickets`);
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create tickets");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Printer className="w-4 h-4" />
          Create Physical Tickets
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Physical Tickets</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Ticket Tier</Label>
            <Select value={tierId} onValueChange={setTierId}>
              <SelectTrigger>
                <SelectValue placeholder="Select tier..." />
              </SelectTrigger>
              <SelectContent>
                {tiers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} — ${Number(t.price).toFixed(0)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fulfillment Type</Label>
            <Select value={fulfillmentType} onValueChange={setFulfillmentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="physical_unassigned">Unassigned (offline sale)</SelectItem>
                <SelectItem value="physical_assigned">Assigned (POS sale)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.min(500, Math.max(1, parseInt(e.target.value) || 1)))}
              min={1}
              max={500}
            />
            <p className="text-[11px] text-muted-foreground">Each ticket gets a unique claim code for physical distribution.</p>
          </div>

          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="w-full gradient-primary text-primary-foreground rounded-full"
          >
            {createMutation.isPending ? "Creating..." : `Create ${quantity} Tickets`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
