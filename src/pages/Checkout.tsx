import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useEvent } from "@/hooks/use-events";
import { useProductAddons, useJouvertCustomizationFields, useCustomizationFields } from "@/hooks/use-products";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ArrowLeft, Minus, Plus, Tag, Shirt, PartyPopper, Ticket, MapPin, ShieldAlert, Ruler, CheckCircle2, ListChecks, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { usePlatformKillSwitches, KillSwitchBanner } from "@/hooks/use-kill-switches";
import { usePromoCode } from "@/hooks/use-promo-code";
import { usePromoterByCode, usePromoterById } from "@/hooks/use-promoters";
import { useCheckoutQueue, useReservationTimer } from "@/hooks/use-checkout-queue";
import { QueueWaitingRoom } from "@/components/QueueWaitingRoom";
import { ReservationTimer } from "@/components/ReservationTimer";
import TurnstileCaptcha from "@/components/TurnstileCaptcha";
import type { ProductType, BandWithSections, CostumeProduct, JouvertPackage, TicketTier, ProductAddon } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { data: event, isLoading } = useEvent(id!);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { purchasesDisabled } = usePlatformKillSwitches();
  const { promoterCode, referral, clearPromoCode } = usePromoCode();

  const { data: promoterByCode } = usePromoterByCode(promoterCode || undefined);
  const { data: promoterById } = usePromoterById(referral.promoterId || undefined);
  const promoter = promoterById || promoterByCode;

  const initialTab = (searchParams.get("type") as ProductType) || "ticket";
  const [activeTab, setActiveTab] = useState<ProductType>(initialTab);

  // Ticket state
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  // Costume state
  const [selectedCostume, setSelectedCostume] = useState<CostumeProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [paymentOption, setPaymentOption] = useState<"full" | "deposit">("full");

  // Jouvert state
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [reserving, setReserving] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [guardIp, setGuardIp] = useState<string | undefined>();
  const [guardBlocked, setGuardBlocked] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Addon state: { addonId: { quantity, sizeLabel?, sizeValue? } }
  const [selectedAddons, setSelectedAddons] = useState<Record<string, { quantity: number; size_label?: string; size_value?: string }>>({});

  // Customization responses: { fieldId: value }
  const [customizationResponses, setCustomizationResponses] = useState<Record<string, string>>({});

  // Queue system
  const {
    queueActive,
    isAdmitted,
    isWaiting,
    needsQueue,
    queueEntry,
    checkoutToken,
    waitingCount,
    joinQueue,
  } = useCheckoutQueue(id);

  // Reservation timer
  const {
    timeLeft,
    reservationId,
    hasReservation,
    reserveInventory,
    completeReservation,
  } = useReservationTimer(id);

  if (purchasesDisabled) {
    return <KillSwitchBanner message="Purchasing is temporarily paused. Please check back shortly." />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-lg font-semibold text-foreground mb-2">Sign in to purchase</p>
        <Button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground rounded-full">Sign In</Button>
      </div>
    );
  }

  if (isLoading || !event) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  }

  // Show queue waiting room if queue is active and user isn't admitted
  if (queueActive && !isAdmitted) {
    return (
      <div className="pb-20 md:pb-8 max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <Link to={`/events/${event.id}`} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">Checkout</h1>
        </div>
        <QueueWaitingRoom
          position={queueEntry?.position || waitingCount + 1}
          waitingCount={waitingCount}
          isWaiting={isWaiting}
          onJoinQueue={() => joinQueue.mutate()}
          isJoining={joinQueue.isPending}
          eventTitle={event.title}
        />
      </div>
    );
  }

  const tiers = event.ticket_tiers || [];
  const bands = (event.bands || []) as BandWithSections[];
  const jouvertPackages = (event.jouvert_packages || []) as JouvertPackage[];

  const hasCostumes = bands.some((b) => b.band_sections?.some((s) => s.costume_products?.length > 0));
  const hasJouvert = jouvertPackages.length > 0;

  // Per-user ticket limit
  const enforceLimit = (event as any).enforce_ticket_limit === true;
  const maxPerUser = enforceLimit ? (event.max_tickets_per_user || 4) : Infinity;

  // Addon query for selected product
  const addonJouvertId = activeTab === "jouvert" ? selectedPackage || undefined : undefined;
  const addonCostumeId = activeTab === "costume" ? selectedCostume?.id || undefined : undefined;
  const { data: productAddons } = useProductAddons(addonJouvertId, addonCostumeId);

  // Customization fields query
  const { data: jouvertCustFields } = useJouvertCustomizationFields(addonJouvertId);
  const { data: costumeCustFields } = useCustomizationFields(addonCostumeId);
  const customizationFields = activeTab === "jouvert" ? jouvertCustFields : activeTab === "costume" ? costumeCustFields : undefined;

  // Validate required customization fields
  const customizationFieldsValid = !customizationFields || customizationFields.every(f => {
    if (!f.required) return true;
    return !!customizationResponses[f.id]?.trim();
  });

  // Compute addon total
  const addonsTotal = Object.entries(selectedAddons).reduce((sum, [addonId, sel]) => {
    const addon = productAddons?.find(a => a.id === addonId);
    if (!addon) return sum;
    return sum + Number(addon.price) * sel.quantity;
  }, 0);

  // Validate addon size selections
  const addonsValid = Object.entries(selectedAddons).every(([addonId, sel]) => {
    const addon = productAddons?.find(a => a.id === addonId);
    if (!addon || !addon.has_size_options) return true;
    return !!sel.size_value;
  });

  const tabs: { key: ProductType; label: string; icon: any }[] = [
    { key: "ticket", label: "Tickets", icon: Ticket },
    ...(hasCostumes ? [{ key: "costume" as ProductType, label: "Costumes", icon: Shirt }] : []),
    ...(hasJouvert ? [{ key: "jouvert" as ProductType, label: "J'ouvert", icon: PartyPopper }] : []),
  ];

  // Compute total + availability
  const selectedTicketTier = tiers.find((t) => t.id === selectedTier);
  const selectedJouvert = jouvertPackages.find((jp) => jp.id === selectedPackage);

  let total = 0;
  let available = 0;
  let depositAvailable = false;
  let depositAmt = 0;
  let balanceAmt = 0;

  if (activeTab === "ticket" && selectedTicketTier) {
    total = Number(selectedTicketTier.price) * quantity;
    available = selectedTicketTier.quantity - selectedTicketTier.sold_count;
    // Apply per-user ticket limit to available
    if (enforceLimit) {
      available = Math.min(available, maxPerUser);
    }
  } else if (activeTab === "costume" && selectedCostume) {
    total = Number(selectedCostume.price) * quantity;
    available = selectedCostume.inventory_quantity - selectedCostume.inventory_sold;
    if (selectedCostume.deposit_amount && selectedCostume.deposit_amount > 0) {
      depositAvailable = true;
      depositAmt = Number(selectedCostume.deposit_amount) * quantity;
      balanceAmt = total - depositAmt;
    }
  } else if (activeTab === "jouvert" && selectedJouvert) {
    total = Number(selectedJouvert.price) * quantity;
    available = selectedJouvert.quantity - selectedJouvert.sold_count;
  }

  // Add addons to totals
  total += addonsTotal;

  const payingNow = activeTab === "costume" && paymentOption === "deposit" && depositAvailable ? depositAmt + addonsTotal : total;

  const canPurchase =
    ((activeTab === "ticket" && selectedTicketTier) ||
    (activeTab === "costume" && selectedCostume && (selectedCostume.size_options.length === 0 || selectedSize)) ||
    (activeTab === "jouvert" && selectedJouvert)) && addonsValid && customizationFieldsValid;

  // Call checkout-guard edge function
  const runCheckoutGuard = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("checkout-guard", {
        body: {
          eventId: event.id,
          quantity,
          productType: activeTab,
          turnstileToken: turnstileToken || undefined,
        },
      });

      if (error) {
        toast.error("Checkout validation failed. Please try again.");
        return false;
      }

      if (data?.ip) setGuardIp(data.ip);

      if (data?.blocked) {
        setGuardBlocked(true);
        toast.error(data.error || "Suspicious activity detected. Please try again later.");
        return false;
      }

      if (data?.rateLimited) {
        toast.error(data.error || "Too many purchase attempts. Please wait before trying again.");
        return false;
      }

      if (data?.captchaRequired && !data?.allowed) {
        setShowCaptcha(true);
        toast.error(data.error || "Please complete the verification.");
        return false;
      }

      if (!data?.allowed) {
        toast.error(data?.error || "Checkout not allowed.");
        return false;
      }

      return true;
    } catch {
      // Non-blocking fallback — allow purchase if guard is unavailable
      return true;
    }
  };

  // Reserve inventory when user selects a product
  const handleReserve = async () => {
    if (!canPurchase) return;
    setReserving(true);
    try {
      const guardOk = await runCheckoutGuard();
      if (!guardOk) return;

      await reserveInventory({
        productType: activeTab,
        ticketTierId: activeTab === "ticket" ? selectedTier! : undefined,
        costumeProductId: activeTab === "costume" ? selectedCostume!.id : undefined,
        jouvertPackageId: activeTab === "jouvert" ? selectedPackage! : undefined,
        quantity,
        checkoutToken,
      });
      toast.success("Items reserved! Complete your purchase before the timer expires.");
    } catch (err: any) {
      const msg = err.message || "Failed to reserve inventory";
      if (msg.includes("maximum number of tickets")) {
        toast.error("You have reached the maximum number of tickets allowed for this event.");
      } else {
        toast.error(msg);
      }
    } finally {
      setReserving(false);
    }
  };

  const handlePurchase = async () => {
    if (!canPurchase || !termsAccepted) return;
    setProcessingPayment(true);
    try {
      const guardOk = await runCheckoutGuard();
      if (!guardOk) {
        setProcessingPayment(false);
        return;
      }

      // Build addon selections for the payload
      const addonSelections = Object.entries(selectedAddons)
        .filter(([_, sel]) => sel.quantity > 0)
        .map(([addonId, sel]) => ({
          addon_id: addonId,
          quantity: sel.quantity,
          ...(sel.size_label && { size_label: sel.size_label }),
          ...(sel.size_value && { size_value: sel.size_value }),
        }));

      // Build customization responses snapshot (label → value)
      const custResponses: Record<string, string> = {};
      if (customizationFields) {
        for (const f of customizationFields) {
          const val = customizationResponses[f.id];
          if (val) custResponses[f.field_label] = val;
        }
      }

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          eventId: event.id,
          productType: activeTab,
          ticketTierId: activeTab === "ticket" ? selectedTier! : undefined,
          costumeProductId: activeTab === "costume" ? selectedCostume!.id : undefined,
          jouvertPackageId: activeTab === "jouvert" ? selectedPackage! : undefined,
          quantity,
          selectedSize: activeTab === "costume" ? selectedSize || undefined : undefined,
          paymentOption: activeTab === "costume" && depositAvailable ? paymentOption : "full",
          reservationId: reservationId || undefined,
          checkoutToken: checkoutToken || undefined,
          promoterId: promoter?.id || undefined,
          commissionRate: promoter ? Number(promoter.commission_percent) : undefined,
          addons: addonSelections.length > 0 ? addonSelections : undefined,
          customizationResponses: Object.keys(custResponses).length > 0 ? custResponses : undefined,
        },
      });

      // Free purchase — no Stripe redirect needed
      if (data?.free && data?.purchaseId) {
        toast.success("Your free ticket has been confirmed!");
        navigate(`/payment-success?free=true&purchaseId=${data.purchaseId}`);
        return;
      }

      if (error || !data?.url) {
        throw new Error(data?.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
      setProcessingPayment(false);
    }
  };

  const resetSelection = (tab: ProductType) => {
    setActiveTab(tab);
    setSelectedTier(null);
    setSelectedCostume(null);
    setSelectedSize(null);
    setSelectedPackage(null);
    setPaymentOption("full");
    setQuantity(1);
    setSelectedAddons({});
    setCustomizationResponses({});
  };

  return (
    <div className="pb-20 md:pb-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <Link to={`/events/${event.id}`} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-lg font-bold text-foreground flex-1">Checkout</h1>
        {hasReservation && timeLeft !== null && (
          <ReservationTimer timeLeft={timeLeft} />
        )}
      </div>

      {/* Reservation expired warning */}
      {timeLeft === 0 && hasReservation && (
        <div className="px-4 py-3 bg-destructive/10 border-b border-destructive/20">
          <p className="text-xs text-destructive font-medium">
            Your reservation has expired. Please select your items again to reserve.
          </p>
        </div>
      )}

      {/* Event Summary */}
      <div className="px-4 py-4 flex gap-3 border-b border-border">
        <img src={event.image_url || "/placeholder.svg"} alt={event.title} className="w-16 h-16 rounded-lg object-cover" />
        <div>
          <p className="font-semibold text-foreground text-sm">{event.title}</p>
          <p className="text-xs text-muted-foreground">{format(new Date(event.date), "EEE, MMM d · h:mm a")}</p>
          <p className="text-xs text-muted-foreground">{event.venue}</p>
        </div>
      </div>

      {/* Promo Banner */}
      {promoter && (
        <div className="px-4 py-3 bg-primary/5 border-b border-border flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <p className="text-xs text-foreground flex-1">
            Referred by <span className="font-semibold">{promoter.display_name}</span>
            <span className="text-muted-foreground ml-1">({promoter.promo_code})</span>
          </p>
          <button onClick={clearPromoCode} className="text-xs text-muted-foreground hover:text-foreground">Remove</button>
        </div>
      )}

      {/* Ticket limit notice */}
      {enforceLimit && activeTab === "ticket" && (
        <div className="mx-4 mt-4 p-3 rounded-xl border border-primary/30 bg-primary/5">
          <p className="text-xs text-primary font-medium flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            Limited to {maxPerUser} ticket{maxPerUser !== 1 ? "s" : ""} per person for this event.
          </p>
        </div>
      )}

      {/* Product Type Tabs */}
      {tabs.length > 1 && (
        <div className="px-4 pt-4 flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => resetSelection(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Ticket Selection */}
      {activeTab === "ticket" && (
        <div className="px-4 py-4">
          <h2 className="text-sm font-bold text-foreground mb-3">Select Ticket</h2>
          {tiers.length === 0 ? (
            <div className="py-8 text-center">
              <Ticket className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No tickets available for this event yet.</p>
              <p className="text-xs text-muted-foreground mt-1">The organizer hasn't added ticket tiers.</p>
            </div>
          ) : (
          <div className="space-y-2">
            {tiers.map((tier) => {
              const avail = tier.quantity - tier.sold_count;
              const soldOut = avail <= 0;
              return (
                <button
                  key={tier.id}
                  onClick={() => { if (!soldOut) { setSelectedTier(tier.id); setQuantity(1); } }}
                  disabled={soldOut}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                    selectedTier === tier.id ? "border-primary bg-primary/5"
                      : soldOut ? "border-border bg-muted/50 opacity-50"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{tier.name}</p>
                    <p className="text-xs text-muted-foreground">{soldOut ? "Sold out" : `${avail} remaining`}</p>
                  </div>
                  <p className="text-sm font-bold text-foreground">${Number(tier.price).toFixed(0)}</p>
                </button>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* Costume Selection */}
      {activeTab === "costume" && (
        <div className="px-4 py-4 space-y-4">
          {bands.map((band) => (
            <div key={band.id}>
              <h2 className="text-sm font-bold text-foreground mb-2">{band.name}</h2>
              {band.band_sections?.map((section) => (
                <div key={section.id} className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{section.name}</p>
                  <div className="space-y-2">
                    {section.costume_products?.filter((c) => c.status !== "sold_out").map((costume) => {
                      const avail = costume.inventory_quantity - costume.inventory_sold;
                      const isSelected = selectedCostume?.id === costume.id;
                      const pickup = costume.costume_pickup?.[0];
                      return (
                        <button
                          key={costume.id}
                          onClick={() => { setSelectedCostume(costume); setSelectedSize(null); setQuantity(1); }}
                          className={`w-full p-3 rounded-xl border transition-all text-left ${
                            isSelected ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {costume.title}
                                {costume.gender && <span className="text-xs text-muted-foreground ml-1">({costume.gender})</span>}
                              </p>
                              <p className="text-xs text-muted-foreground">{avail} remaining</p>
                            </div>
                            <p className="text-sm font-bold text-foreground">${Number(costume.price).toFixed(0)}</p>
                          </div>
                          {pickup?.pickup_location && (
                            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> Pickup: {pickup.pickup_location}
                              {pickup.pickup_date && ` · ${pickup.pickup_date}`}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Size Selection */}
          {selectedCostume && selectedCostume.size_options.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">Select Size</h3>
              <div className="grid grid-cols-4 gap-2">
                {selectedCostume.size_options.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      selectedSize === sz ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <p className="text-sm font-bold text-foreground">{sz}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* J'ouvert Selection */}
      {activeTab === "jouvert" && (
        <div className="px-4 py-4">
          <h2 className="text-sm font-bold text-foreground mb-3">Select J'ouvert Package</h2>
          <div className="space-y-2">
            {jouvertPackages.map((pkg) => {
              const avail = pkg.quantity - pkg.sold_count;
              const soldOut = avail <= 0;
              return (
                <button
                  key={pkg.id}
                  onClick={() => { if (!soldOut) { setSelectedPackage(pkg.id); setQuantity(1); } }}
                  disabled={soldOut}
                  className={`w-full p-3 rounded-xl border transition-all text-left ${
                    selectedPackage === pkg.id ? "border-primary bg-primary/5"
                      : soldOut ? "border-border bg-muted/50 opacity-50"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{pkg.name}</p>
                    <p className="text-sm font-bold text-foreground">${Number(pkg.price).toFixed(0)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{soldOut ? "Sold out" : `${avail} remaining`}</p>
                  {pkg.bundle_items?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {pkg.bundle_items.map((item, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{item}</Badge>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Included Items (bundle_items as bullet list) */}
      {canPurchase && activeTab === "jouvert" && selectedJouvert && selectedJouvert.bundle_items?.length > 0 && (
        <div className="px-4 py-4 border-t border-border">
          <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-primary" /> Included Items
          </h3>
          <ul className="space-y-1.5 pl-1">
            {selectedJouvert.bundle_items.map((item, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Customization / Selection Fields */}
      {canPurchase && customizationFields && customizationFields.length > 0 && (
        <div className="px-4 py-4 border-t border-border">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
            <ListChecks className="w-4 h-4 text-primary" /> Your Selections
          </h3>
          <div className="space-y-4">
            {customizationFields.map((field) => (
              <div key={field.id}>
                <Label className="text-xs font-medium text-foreground flex items-center gap-1">
                  {field.field_label}
                  {field.required && <span className="text-destructive text-[10px]">*</span>}
                </Label>

                {/* Selection / Radio type */}
                {(field.field_type === "selection" || field.field_type === "dropdown") && field.options?.length > 0 && (
                  <RadioGroup
                    value={customizationResponses[field.id] || ""}
                    onValueChange={(val) => setCustomizationResponses(prev => ({ ...prev, [field.id]: val }))}
                    className="mt-2 space-y-1.5"
                  >
                    {field.options.map((opt) => (
                      <Label
                        key={opt}
                        htmlFor={`cust-${field.id}-${opt}`}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all text-xs ${
                          customizationResponses[field.id] === opt
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <RadioGroupItem value={opt} id={`cust-${field.id}-${opt}`} />
                        <span className="font-medium">{opt}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                )}

                {/* Text input */}
                {field.field_type === "text" && (
                  <Input
                    value={customizationResponses[field.id] || ""}
                    onChange={(e) => setCustomizationResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                    placeholder={`Enter ${field.field_label.toLowerCase()}`}
                    className="mt-1.5 h-8 text-xs"
                  />
                )}

                {/* Number input */}
                {field.field_type === "number" && (
                  <Input
                    type="number"
                    value={customizationResponses[field.id] || ""}
                    onChange={(e) => setCustomizationResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                    placeholder="0"
                    className="mt-1.5 h-8 text-xs w-24"
                  />
                )}

                {/* Checkbox */}
                {field.field_type === "checkbox" && (
                  <div className="mt-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={customizationResponses[field.id] === "true"}
                        onCheckedChange={(v) => setCustomizationResponses(prev => ({ ...prev, [field.id]: v ? "true" : "false" }))}
                      />
                      <span className="text-xs text-foreground">{field.field_label}</span>
                    </label>
                  </div>
                )}

                {/* Required validation hint */}
                {field.required && !customizationResponses[field.id]?.trim() && (
                  <p className="text-[10px] text-destructive mt-1">Required — please make a selection</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* À la Carte Add-ons */}
      {canPurchase && productAddons && productAddons.length > 0 && (
        <div className="px-4 py-4 border-t border-border">
          <h3 className="text-sm font-bold text-foreground mb-3">À la Carte Add-ons</h3>
          <div className="space-y-3">
            {productAddons.map((addon) => {
              const sel = selectedAddons[addon.id];
              const isSelected = sel && sel.quantity > 0;
              const sizes = (addon.addon_size_options || []).sort((a, b) => a.sort_order - b.sort_order);

              return (
                <div
                  key={addon.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isSelected ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{addon.name}</p>
                      {addon.description && (
                        <p className="text-xs text-muted-foreground">{addon.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">+${Number(addon.price).toFixed(2)}</p>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            if (!sel || sel.quantity === 0) return;
                            const newQty = sel.quantity - 1;
                            if (newQty === 0) {
                              const next = { ...selectedAddons };
                              delete next[addon.id];
                              setSelectedAddons(next);
                            } else {
                              setSelectedAddons({ ...selectedAddons, [addon.id]: { ...sel, quantity: newQty } });
                            }
                          }}
                          className="w-6 h-6 rounded-full bg-muted flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-4 text-center">{sel?.quantity || 0}</span>
                        <button
                          onClick={() => {
                            const current = sel?.quantity || 0;
                            if (current >= addon.max_quantity - addon.sold_count) return;
                            setSelectedAddons({
                              ...selectedAddons,
                              [addon.id]: { ...(sel || {}), quantity: current + 1 },
                            });
                          }}
                          className="w-6 h-6 rounded-full bg-muted flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Size selection for addon */}
                  {isSelected && addon.has_size_options && sizes.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-border/50">
                      <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
                        <Ruler className="w-3 h-3" /> Select Size
                      </p>
                      <RadioGroup
                        value={sel?.size_value || ""}
                        onValueChange={(val) => {
                          const size = sizes.find(s => s.value === val);
                          setSelectedAddons({
                            ...selectedAddons,
                            [addon.id]: {
                              ...sel,
                              size_value: val,
                              size_label: size?.label || val,
                            },
                          });
                        }}
                        className="grid grid-cols-3 gap-2"
                      >
                        {sizes.map((size) => (
                          <Label
                            key={size.id}
                            htmlFor={`size-${size.id}`}
                            className={`flex items-center gap-1.5 p-2 rounded-lg border cursor-pointer transition-all text-xs ${
                              sel?.size_value === size.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-muted-foreground/30"
                            }`}
                          >
                            <RadioGroupItem value={size.value} id={`size-${size.id}`} className="sr-only" />
                            <span className="font-medium">{size.label}</span>
                            <span className="text-muted-foreground">({size.value})</span>
                          </Label>
                        ))}
                      </RadioGroup>
                      {!sel?.size_value && (
                        <p className="text-[10px] text-destructive mt-1">Please select a size</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {canPurchase && activeTab === "costume" && depositAvailable && (
        <div className="px-4 py-4 border-t border-border space-y-2">
          <h3 className="text-sm font-bold text-foreground">Payment Option</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPaymentOption("deposit")}
              className={`p-3 rounded-xl border text-left transition-all ${
                paymentOption === "deposit" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <p className="text-sm font-semibold text-foreground">Deposit</p>
              <p className="text-lg font-bold text-foreground">${depositAmt.toFixed(0)}</p>
              <p className="text-[10px] text-muted-foreground">Balance ${balanceAmt.toFixed(0)} due {selectedCostume?.balance_due_date || "later"}</p>
            </button>
            <button
              onClick={() => setPaymentOption("full")}
              className={`p-3 rounded-xl border text-left transition-all ${
                paymentOption === "full" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <p className="text-sm font-semibold text-foreground">Full Price</p>
              <p className="text-lg font-bold text-foreground">${total.toFixed(0)}</p>
              <p className="text-[10px] text-muted-foreground">Pay everything now</p>
            </button>
          </div>
        </div>
      )}

      {/* Quantity & Reserve / Purchase */}
      {canPurchase && (
        <>
          <div className="px-4 py-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Quantity</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-bold w-6 text-center">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(available, quantity + 1))} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 border-t border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-base font-bold text-foreground">Paying Now</span>
              <span className="text-xl font-bold text-foreground">${payingNow.toFixed(2)}</span>
            </div>
            {paymentOption === "deposit" && depositAvailable && activeTab === "costume" && (
              <p className="text-xs text-muted-foreground mb-3">Balance of ${balanceAmt.toFixed(0)} due by {selectedCostume?.balance_due_date || "TBD"}</p>
            )}

            {/* Terms of Service Agreement */}
            <div className="flex items-start gap-3 mb-4 py-2">
              <Checkbox
                id="terms-agreement"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                aria-label="Agree to Terms of Service and Privacy Policy"
                className="mt-0.5"
              />
              <label
                htmlFor="terms-agreement"
                className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none"
              >
                I agree to the Ti'Fete{" "}
                <Link
                  to="/terms"
                  target="_blank"
                  className="text-primary hover:underline font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  target="_blank"
                  className="text-primary hover:underline font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            {/* Blocked state */}
            {guardBlocked && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 mb-4">
                <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive font-medium">
                  Suspicious activity detected. Please try again later.
                </p>
              </div>
            )}

            {/* Conditional CAPTCHA */}
            {showCaptcha && !guardBlocked && (
              <TurnstileCaptcha
                onVerify={(token) => {
                  setTurnstileToken(token);
                  setShowCaptcha(false);
                }}
              />
              />
            )}

            {/* Two-step: Reserve → Purchase */}
            {!hasReservation ? (
              <Button
                onClick={handleReserve}
                disabled={reserving || !termsAccepted || guardBlocked}
                className="w-full bg-secondary text-secondary-foreground font-semibold rounded-full h-12 mb-2"
              >
                {reserving ? "Reserving..." : "Reserve Items (6 min hold)"}
              </Button>
            ) : (
              <Button
                onClick={handlePurchase}
                disabled={processingPayment || (timeLeft !== null && timeLeft <= 0) || !termsAccepted || guardBlocked}
                className="w-full gradient-primary text-primary-foreground font-semibold rounded-full h-12"
              >
                {processingPayment
                  ? "Redirecting to payment..."
                  : paymentOption === "deposit" && depositAvailable && activeTab === "costume"
                  ? `Pay Deposit — $${depositAmt.toFixed(2)}`
                  : `Pay $${payingNow.toFixed(2)}`}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
