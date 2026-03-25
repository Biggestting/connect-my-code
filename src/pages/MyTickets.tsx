import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Ticket, QrCode, Shield, RefreshCw, ScanLine, ShoppingBag, Shirt, MoreVertical, Send, DollarSign, Eye } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/hooks/use-auth";
import { useMyTickets, useTicketQR, type TicketWithRelations } from "@/hooks/use-dynamic-tickets";
import { usePurchaseItems, type PurchaseItem, type PurchaseAddon } from "@/hooks/use-purchases";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function MyTickets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [productFilter, setProductFilter] = useState<"tickets" | "costumes">("tickets");

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <ShoppingBag className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <p className="text-lg font-semibold text-foreground mb-1">Sign in to see your purchases</p>
        <p className="text-sm text-muted-foreground mb-4">Purchase tickets, costumes & more.</p>
        <Button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground rounded-full">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8 max-w-5xl mx-auto">
      <div className="px-4 py-5">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-foreground">Purchases</h1>
          <Button onClick={() => navigate("/claim-ticket")} variant="outline" size="sm" className="gap-1.5 rounded-full text-xs">
            <ScanLine className="w-3.5 h-3.5" />
            Claim Physical Ticket
          </Button>
        </div>

        {/* Segmented filter */}
        <div className="flex bg-muted rounded-lg p-1 mb-4 max-w-xs">
          <button
            onClick={() => setProductFilter("tickets")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              productFilter === "tickets"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            <Ticket className="w-4 h-4" />
            Tickets
          </button>
          <button
            onClick={() => setProductFilter("costumes")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              productFilter === "costumes"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            <Shirt className="w-4 h-4" />
            Costumes
          </button>
        </div>

        {productFilter === "tickets" ? <TicketsView /> : <CostumesView />}
      </div>
    </div>
  );
}

/* ─── Tickets + J'ouvert View ─── */
function TicketsView() {
  const navigate = useNavigate();
  const { data: tickets, isLoading: ticketsLoading } = useMyTickets();
  const { data: purchases, isLoading: purchasesLoading } = usePurchaseItems();

  const isLoading = ticketsLoading || purchasesLoading;

  const jouvertPurchases = purchases?.filter((p) => p.product_type === "jouvert") || [];

  const upcoming = tickets?.filter(
    (t) => t.events && new Date(t.events.date) >= new Date() && t.status === "valid"
  ) || [];
  const past = tickets?.filter(
    (t) => t.events && (new Date(t.events.date) < new Date() || t.status === "used")
  ) || [];

  const hasAny = upcoming.length > 0 || past.length > 0 || jouvertPurchases.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!hasAny) {
    return (
      <div className="text-center py-12">
        <Ticket className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="font-medium text-foreground">No Tickets Found</p>
        <p className="text-sm text-muted-foreground mt-1">Discover events and get tickets!</p>
        <Button onClick={() => navigate("/")} variant="outline" className="mt-4 rounded-full">
          Discover Events
        </Button>
      </div>
    );
  }

  return (
    <Tabs defaultValue="upcoming">
      <TabsList className="w-full mb-4">
        <TabsTrigger value="upcoming" className="flex-1">Upcoming ({upcoming.length})</TabsTrigger>
        <TabsTrigger value="past" className="flex-1">Past ({past.length})</TabsTrigger>
        {jouvertPurchases.length > 0 && (
          <TabsTrigger value="jouvert" className="flex-1">J'ouvert ({jouvertPurchases.length})</TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="upcoming">
        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcoming.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-muted-foreground">No upcoming tickets.</p>
        )}
      </TabsContent>

      <TabsContent value="past">
        {past.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {past.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} isPast />
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-muted-foreground">No past tickets.</p>
        )}
      </TabsContent>

      {jouvertPurchases.length > 0 && (
        <TabsContent value="jouvert">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {jouvertPurchases.map((p) => (
              <JouvertCard key={p.id} purchase={p} />
            ))}
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}

/* ─── Costumes View ─── */
function CostumesView() {
  const { data: purchases, isLoading } = usePurchaseItems();
  const costumePurchases = purchases?.filter((p) => p.product_type === "costume") || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (costumePurchases.length === 0) {
    return (
      <div className="text-center py-12">
        <Shirt className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="font-medium text-foreground">No Costumes Found</p>
        <p className="text-sm text-muted-foreground mt-1">Browse events to find carnival costumes.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {costumePurchases.map((p) => (
        <CostumeCard key={p.id} purchase={p} />
      ))}
    </div>
  );
}

/* ─── Ticket Card with Actions ─── */
function TicketCard({ ticket, isPast }: { ticket: TicketWithRelations; isPast?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [qrOpen, setQrOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [sellPrice, setSellPrice] = useState("");
  const [listing, setListing] = useState(false);
  const [delisting, setDelisting] = useState(false);
  const event = ticket.events;
  const purchaseStatus = ticket.purchases?.status;
  const isFullyPaid = purchaseStatus === "confirmed" || purchaseStatus === "paid";
  const isListed = ticket.resale_status === "listed";
  if (!event) return null;

  const refreshTickets = () => queryClient.invalidateQueries({ queryKey: ["my-tickets"] });

  const handleSellTicket = async () => {
    const price = parseFloat(sellPrice);
    if (!price || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    setListing(true);
    try {
      // Create marketplace listing
      const { error } = await supabase
        .from("marketplace_listings")
        .insert({
          event_id: event.id,
          ticket_tier_id: ticket.ticket_tier_id || "",
          purchase_id: ticket.purchase_id || "",
          seller_id: ticket.owner_user_id,
          asking_price: price,
        });
      if (error) throw error;

      // Update resale status via edge function
      const { data, error: fnErr } = await supabase.functions.invoke("update-resale-listing", {
        body: { ticket_id: ticket.id, resale_status: "listed", resale_price: price },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);

      toast.success("Ticket listed for sale!");
      setSellOpen(false);
      refreshTickets();
    } catch (err: any) {
      toast.error(err.message || "Failed to list ticket");
    } finally {
      setListing(false);
    }
  };

  const handleRemoveListing = async () => {
    setDelisting(true);
    try {
      // Remove active marketplace listing
      const { error: deleteErr } = await supabase
        .from("marketplace_listings")
        .delete()
        .eq("seller_id", ticket.owner_user_id)
        .eq("event_id", event.id)
        .eq("status", "active");
      if (deleteErr) throw deleteErr;

      // Update resale status via edge function
      const { data, error: fnErr } = await supabase.functions.invoke("remove-resale-listing", {
        body: { ticket_id: ticket.id },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);

      toast.success("Listing removed");
      refreshTickets();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove listing");
    } finally {
      setDelisting(false);
    }
  };

  return (
    <div className={`flex gap-3 p-3 rounded-xl bg-card border relative ${
      isListed ? "border-amber-500 border-dashed opacity-90" : "border-border"
    }`}>
      {/* Listed badge */}
      {isListed && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-amber-500 text-white text-[10px] py-0.5 px-2 shadow-sm">
            💸 Listed for Sale
          </Badge>
        </div>
      )}

      <button
        onClick={() => navigate(`/events/${event.id}`)}
        className="flex gap-3 flex-1 text-left min-w-0"
      >
        <img
          src={event.image_url || "/placeholder.svg"}
          alt={event.title}
          className={`w-20 h-20 rounded-lg object-cover shrink-0 ${isListed ? "opacity-75" : ""}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {isListed && <span className="mr-1">🔁</span>}
            {event.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(event.date), "EEE, MMM d · h:mm a")}
          </p>
          <p className="text-xs text-muted-foreground">{event.venue}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="secondary" className="text-[10px] py-0 px-2">
              {ticket.ticket_tiers?.name || "Ticket"}
            </Badge>
            {ticket.fulfillment_type && ticket.fulfillment_type !== "digital" && (
              <Badge variant="outline" className="text-[10px] py-0 px-2">Physical</Badge>
            )}
            {ticket.status === "used" && (
              <Badge variant="secondary" className="text-[10px] py-0 px-2">Attended</Badge>
            )}
            {ticket.status === "cancelled" && (
              <Badge variant="destructive" className="text-[10px] py-0 px-2">Event Cancelled</Badge>
            )}
            {isListed && (
              <Badge variant="outline" className="text-[10px] py-0 px-2 border-amber-500 text-amber-600">
                Status: Listed for Sale
              </Badge>
            )}
          </div>
        </div>
      </button>
      <div className="flex flex-col items-end gap-2 shrink-0 mt-5">
        {!isPast && ticket.status === "valid" && (
          <>
            <Dialog open={qrOpen} onOpenChange={setQrOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <QrCode className="w-5 h-5 text-muted-foreground" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xs">
                <DialogHeader>
                  <DialogTitle className="text-center">Your Ticket</DialogTitle>
                </DialogHeader>
                <DynamicQRDisplay ticketId={ticket.id} eventTitle={event.title} tierName={ticket.ticket_tiers?.name || "Ticket"} />
              </DialogContent>
            </Dialog>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/events/${event.id}`)}>
                  <Eye className="w-4 h-4 mr-2" /> View Event
                </DropdownMenuItem>
                {!isListed && (
                  <DropdownMenuItem
                    onClick={() => {
                      if (!isFullyPaid) { toast.error("Complete payment before transferring"); return; }
                      toast.info("Transfer feature coming soon");
                    }}
                    className={!isFullyPaid ? "opacity-50" : ""}
                  >
                    <Send className="w-4 h-4 mr-2" /> Transfer Ticket
                  </DropdownMenuItem>
                )}
                {isListed ? (
                  <DropdownMenuItem
                    onClick={handleRemoveListing}
                    disabled={delisting}
                    className="text-destructive"
                  >
                    <DollarSign className="w-4 h-4 mr-2" /> {delisting ? "Removing..." : "Remove Listing"}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => {
                      if (!isFullyPaid) { toast.error("Complete payment before selling"); return; }
                      setSellOpen(true);
                    }}
                    className={!isFullyPaid ? "opacity-50" : ""}
                  >
                    <DollarSign className="w-4 h-4 mr-2" /> Sell Ticket
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {/* Sell Dialog */}
      <Dialog open={sellOpen} onOpenChange={setSellOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sell Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-sm font-medium text-foreground">{event.title}</p>
              <p className="text-xs text-muted-foreground">{ticket.ticket_tiers?.name || "Ticket"}</p>
            </div>
            <div className="space-y-2">
              <Label>Asking Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>
            {sellPrice && parseFloat(sellPrice) > 0 && (
              <div className="p-3 rounded-lg bg-muted space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Marketplace fee (5%)</span>
                  <span>${(parseFloat(sellPrice) * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-foreground">
                  <span>You receive</span>
                  <span>${(parseFloat(sellPrice) * 0.95).toFixed(2)}</span>
                </div>
              </div>
            )}
            <Button
              onClick={handleSellTicket}
              disabled={listing}
              className="w-full gradient-primary text-primary-foreground font-semibold rounded-full h-11"
            >
              {listing ? "Listing..." : "List Ticket"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── J'ouvert Card ─── */
function JouvertCard({ purchase }: { purchase: PurchaseItem }) {
  const navigate = useNavigate();
  const event = purchase.events;

  return (
    <div className="flex gap-3 p-3 rounded-xl bg-card border border-border">
      <button
        onClick={() => event && navigate(`/events/${event.id}`)}
        className="flex gap-3 flex-1 text-left min-w-0"
      >
        <img
          src={event?.image_url || "/placeholder.svg"}
          alt={event?.title || "J'ouvert"}
          className="w-20 h-20 rounded-lg object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {purchase.jouvert_packages?.name || "J'ouvert Package"}
          </p>
          {event && (
            <>
              <p className="text-xs text-muted-foreground mt-0.5">{event.title}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(event.date), "EEE, MMM d · h:mm a")}
              </p>
            </>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="secondary" className="text-[10px] py-0 px-2">J'ouvert</Badge>
            <Badge variant="outline" className="text-[10px] py-0 px-2">Qty: {purchase.quantity}</Badge>
          </div>
          <PurchaseAddonsDisplay addons={purchase.purchase_addons} />
          <CustomizationResponsesDisplay responses={purchase.customization_responses} />
        </div>
      </button>
    </div>
  );
}

/* ─── Costume Card ─── */
function CostumeCard({ purchase }: { purchase: PurchaseItem }) {
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const costume = purchase.costume_products;
  const event = purchase.events;
  const section = costume?.band_sections;
  const band = section?.bands;
  const pickup = costume?.costume_pickup?.[0];

  const balanceRemaining = purchase.balance_remaining || 0;
  const hasBalance = balanceRemaining > 0;
  const isPaid = purchase.status === "confirmed" && !hasBalance;
  const isPartial = purchase.status === "partial" || purchase.status === "deposit_paid";

  const handlePayBalance = async () => {
    if (!hasBalance) return;
    setPaying(true);
    try {
      const balanceCents = Math.round(balanceRemaining * 100);
      const { data, error } = await supabase.functions.invoke("create-payment-sheet", {
        body: {
          purchaseId: purchase.id,
          paymentAmount: balanceCents,
        },
      });

      if (error || !data?.paymentIntent) {
        throw new Error(data?.error || "Failed to create payment");
      }

      // For web: redirect to Stripe or use PaymentSheet
      // Store the client secret for the payment confirmation flow
      toast.success("Payment initiated. Complete checkout to finalize.");
      // Navigate to a payment confirmation page with the client secret
      navigate(`/payment-success?purchase_id=${purchase.id}&client_secret=${data.paymentIntent}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate payment");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-3">
      <button
        onClick={() => event && navigate(`/events/${event.id}`)}
        className="flex gap-3 w-full text-left min-w-0"
      >
        <img
          src={event?.image_url || "/placeholder.svg"}
          alt={costume?.title || "Costume"}
          className="w-20 h-20 rounded-lg object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{costume?.title || "Costume"}</p>
          {band && <p className="text-xs text-muted-foreground mt-0.5">Band: {band.name}</p>}
          {section && <p className="text-xs text-muted-foreground">Section: {section.name}</p>}
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="secondary" className="text-[10px] py-0 px-2">Costume</Badge>
            {purchase.selected_size && (
              <Badge variant="outline" className="text-[10px] py-0 px-2">Size: {purchase.selected_size}</Badge>
            )}
            {isPaid && (
              <Badge variant="secondary" className="text-[10px] py-0 px-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Paid in Full
              </Badge>
            )}
            {isPartial && (
              <Badge variant="outline" className="text-[10px] py-0 px-2 border-amber-500 text-amber-600">
                {purchase.status === "deposit_paid" ? "Deposit Paid" : "Partial Payment"}
              </Badge>
            )}
          </div>
          <PurchaseAddonsDisplay addons={purchase.purchase_addons} />
          <CustomizationResponsesDisplay responses={purchase.customization_responses} />
        </div>
      </button>

      {/* Payment breakdown */}
      <div className="border-t border-border pt-2 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Total price</span>
          <span className="font-medium text-foreground">${purchase.total_amount.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Amount paid</span>
          <span className="font-medium text-foreground">${(purchase.amount_paid || 0).toFixed(2)}</span>
        </div>
        {hasBalance && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Remaining balance</span>
            <span className="font-bold text-foreground">${balanceRemaining.toFixed(2)}</span>
          </div>
        )}
        {hasBalance && costume?.balance_due_date && (
          <p className="text-[11px] text-muted-foreground">
            Due by {format(new Date(costume.balance_due_date), "MMM d, yyyy")}
          </p>
        )}
      </div>

      {/* Pay Remaining Balance button */}
      {hasBalance && (
        <Button
          onClick={handlePayBalance}
          disabled={paying}
          className="w-full gradient-primary text-primary-foreground font-semibold rounded-full h-10 text-sm"
        >
          <DollarSign className="w-4 h-4 mr-1.5" />
          {paying ? "Processing..." : `Pay Remaining Balance — $${balanceRemaining.toFixed(2)}`}
        </Button>
      )}

      {/* Pickup details */}
      {pickup && (pickup.pickup_location || pickup.pickup_date) && (
        <div className="border-t border-border pt-2 space-y-1">
          <p className="text-xs font-medium text-foreground">Pickup Details</p>
          {pickup.pickup_location && (
            <p className="text-xs text-muted-foreground">📍 {pickup.pickup_location}</p>
          )}
          {pickup.pickup_date && (
            <p className="text-xs text-muted-foreground">📅 {format(new Date(pickup.pickup_date), "EEE, MMM d, yyyy")}</p>
          )}
          {pickup.pickup_instructions && (
            <p className="text-xs text-muted-foreground">{pickup.pickup_instructions}</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Dynamic QR Display ─── */
function DynamicQRDisplay({ ticketId, eventTitle, tierName }: { ticketId: string; eventTitle: string; tierName: string }) {
  const { qrData, loading, refresh } = useTicketQR(ticketId);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Shield className="w-3.5 h-3.5 text-primary" />
        <span>Secure single-use QR code</span>
      </div>

      {loading && !qrData ? (
        <div className="w-48 h-48 bg-muted rounded-xl animate-pulse flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : qrData ? (
        <div className="bg-white p-4 rounded-xl">
          <QRCodeSVG value={qrData.token} size={192} level="H" includeMargin={false} />
        </div>
      ) : (
        <p className="text-sm text-destructive">Failed to generate QR</p>
      )}

      {qrData && (
        <p className="text-xs text-muted-foreground text-center">
          Screenshot-safe — this QR is valid until scanned at the event
        </p>
      )}

      <div className="text-center border-t border-border pt-3 w-full">
        <p className="text-sm font-semibold text-foreground">{eventTitle}</p>
        <p className="text-xs text-muted-foreground">{tierName}</p>
      </div>
    </div>
  );
}

/* ─── Purchase Addons Display ─── */
function PurchaseAddonsDisplay({ addons }: { addons?: PurchaseAddon[] }) {
  if (!addons || addons.length === 0) return null;
  return (
    <div className="mt-2 space-y-0.5">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Add-ons</p>
      {addons.map((a) => (
        <div key={a.id} className="flex items-center gap-1.5 text-[11px] text-foreground">
          <span className="font-medium">{a.addon_name}</span>
          {a.size_label && <Badge variant="outline" className="text-[9px] py-0 px-1.5">{a.size_label}</Badge>}
          <span className="text-muted-foreground">× {a.quantity}</span>
          <span className="text-muted-foreground ml-auto">${(Number(a.unit_price) * a.quantity).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Customization Responses Display ─── */
function CustomizationResponsesDisplay({ responses }: { responses?: Record<string, string> | null }) {
  if (!responses || Object.keys(responses).length === 0) return null;
  return (
    <div className="mt-2 space-y-0.5">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Selections</p>
      {Object.entries(responses).map(([label, value]) => (
        <div key={label} className="flex items-center gap-1.5 text-[11px] text-foreground">
          <span className="text-muted-foreground">{label}:</span>
          <span className="font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}
