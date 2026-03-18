import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Check, Minus, Plus, Clock } from "lucide-react";
import { useBand, usePurchaseProduct, useCustomizationFields } from "@/hooks/use-products";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { CostumeProduct } from "@/types";

export default function CostumeDetail() {
  const { bandId, costumeId } = useParams<{ bandId: string; costumeId: string }>();
  const { data: band, isLoading } = useBand(bandId);
  const { data: fields } = useCustomizationFields(costumeId);
  const { user } = useAuth();
  const navigate = useNavigate();
  const purchaseProduct = usePurchaseProduct();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [paymentOption, setPaymentOption] = useState<"full" | "deposit">("full");
  const [quantity, setQuantity] = useState(1);
  const [success, setSuccess] = useState(false);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [imageIdx, setImageIdx] = useState(0);

  // Find costume across all sections
  let costume: (CostumeProduct & { costume_pickup?: any[] }) | undefined;
  let sectionName = "";
  let sectionLaunchAt: string | null = null;
  for (const section of band?.band_sections || []) {
    const found = section.costume_products?.find((c) => c.id === costumeId);
    if (found) {
      costume = found;
      sectionName = section.name;
      sectionLaunchAt = (section as any).launch_at || null;
      break;
    }
  }

  // Launch countdown logic
  const [now, setNow] = useState(new Date());
  const launchDate = sectionLaunchAt ? new Date(sectionLaunchAt) : null;
  const isBeforeLaunch = launchDate && launchDate > now;

  useEffect(() => {
    if (!isBeforeLaunch) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isBeforeLaunch]);

  const diff = isBeforeLaunch ? launchDate!.getTime() - now.getTime() : 0;
  const cDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  const cHours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const cMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const cSeconds = Math.floor((diff % (1000 * 60)) / 1000);

  const available = costume ? costume.inventory_quantity - costume.inventory_sold : 0;
  const soldOut = !costume || available <= 0 || costume.status === "sold_out";
  const pickup = costume?.costume_pickup?.[0];
  const hasDeposit = costume?.deposit_amount && costume.deposit_amount > 0;
  const total = costume ? Number(costume.price) * quantity : 0;
  const depositAmt = hasDeposit ? Number(costume!.deposit_amount) * quantity : 0;
  const balanceAmt = total - depositAmt;
  const payingNow = paymentOption === "deposit" && hasDeposit ? depositAmt : total;
  const images = costume?.image_gallery?.length ? costume.image_gallery : ["/placeholder.svg"];

  // Check required fields are filled
  const requiredFieldsFilled = (fields || [])
    .filter((f) => f.required)
    .every((f) => customFields[f.id]?.trim());
  const canPurchase = costume && !soldOut && !isBeforeLaunch && (costume.size_options.length === 0 || selectedSize) && requiredFieldsFilled;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!band || !costume) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-lg font-semibold text-foreground">Costume not found</p>
        <Link to="/" className="mt-4 text-accent text-sm font-medium">Back to Discover</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">You're in!</h2>
        <p className="text-sm text-muted-foreground mb-6">Your costume from {band.name} has been confirmed.</p>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/tickets")} variant="outline" className="rounded-full">View Purchases</Button>
          <Button onClick={() => navigate(`/bands/${band.id}`)} className="gradient-primary text-primary-foreground rounded-full">Back to Band</Button>
        </div>
      </div>
    );
  }

  const handlePurchase = async () => {
    if (!user) { toast.error("Sign in to purchase"); navigate("/auth"); return; }
    if (!canPurchase) return;

    const eventId = band.event_id;
    if (!eventId) {
      toast.error("This band is not attached to an event yet. Purchases require an event.");
      return;
    }

    // Build customization responses with labels
    const responses: Record<string, any> = {};
    if (selectedSize) responses["Size"] = selectedSize;
    for (const field of fields || []) {
      if (customFields[field.id]) {
        responses[field.field_label] = customFields[field.id];
      }
    }
    if (customFields["notes"]) responses["Special Requests"] = customFields["notes"];

    const isDeposit = paymentOption === "deposit" && hasDeposit;
    try {
      await purchaseProduct.mutateAsync({
        userId: user.id,
        eventId,
        productType: "costume",
        costumeProductId: costume!.id,
        selectedSize: selectedSize || undefined,
        quantity,
        totalAmount: total,
        amountPaid: isDeposit ? depositAmt : total,
        balanceRemaining: isDeposit ? balanceAmt : 0,
        customizationResponses: responses,
      });
      setSuccess(true);
      toast.success(isDeposit ? "Deposit paid! Balance due later." : "Purchase complete!");
    } catch (err: any) {
      toast.error(err.message || "Purchase failed");
    }
  };

  const renderField = (field: (typeof fields)[number]) => {
    switch (field.field_type) {
      case "dropdown":
        return (
          <div key={field.id}>
            <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
              {field.field_label} {field.required && "*"}
            </Label>
            <Select
              value={customFields[field.id] || ""}
              onValueChange={(v) => setCustomFields({ ...customFields, [field.id]: v })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={`Select ${field.field_label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {(field.options || []).map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case "checkbox":
        return (
          <div key={field.id} className="flex items-center gap-2">
            <Checkbox
              checked={customFields[field.id] === "true"}
              onCheckedChange={(checked) =>
                setCustomFields({ ...customFields, [field.id]: String(!!checked) })
              }
            />
            <Label className="text-sm text-foreground">
              {field.field_label} {field.required && "*"}
            </Label>
          </div>
        );
      case "number":
        return (
          <div key={field.id}>
            <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
              {field.field_label} {field.required && "*"}
            </Label>
            <Input
              type="number"
              value={customFields[field.id] || ""}
              onChange={(e) => setCustomFields({ ...customFields, [field.id]: e.target.value })}
              className="rounded-xl"
            />
          </div>
        );
      default:
        return (
          <div key={field.id}>
            <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
              {field.field_label} {field.required && "*"}
            </Label>
            <Input
              value={customFields[field.id] || ""}
              onChange={(e) => setCustomFields({ ...customFields, [field.id]: e.target.value })}
              placeholder={`Enter ${field.field_label.toLowerCase()}`}
              className="rounded-xl"
            />
          </div>
        );
    }
  };

  return (
    <div className="pb-28 md:pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <Link
          to={`/bands/${band.id}`}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">{costume.title}</h1>
          <p className="text-xs text-muted-foreground">{band.name} · {sectionName}</p>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative aspect-square bg-muted">
        <img
          src={images[imageIdx]}
          alt={costume.title}
          className="w-full h-full object-cover"
        />
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImageIdx(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === imageIdx ? "bg-primary-foreground" : "bg-primary-foreground/40"
                }`}
              />
            ))}
          </div>
        )}
        {soldOut && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Badge variant="destructive" className="text-base px-4 py-1">Sold Out</Badge>
          </div>
        )}
      </div>

      {/* Launch Countdown Banner */}
      {isBeforeLaunch && (
        <div className="mx-4 mt-3 p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-3">
          <Clock className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Section launches soon</p>
            <p className="text-lg font-mono font-bold text-primary">
              {cDays > 0 ? `${cDays}d ` : ""}{String(cHours).padStart(2, "0")}:{String(cMinutes).padStart(2, "0")}:{String(cSeconds).padStart(2, "0")}
            </p>
            <p className="text-xs text-muted-foreground">Purchases will be available after launch</p>
          </div>
        </div>
      )}

      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-foreground">{costume.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {band.name} · {sectionName}
              {costume.gender && ` · ${costume.gender}`}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-foreground">${Number(costume.price).toFixed(0)}</p>
            {hasDeposit && (
              <p className="text-[10px] text-muted-foreground">
                or ${Number(costume.deposit_amount).toFixed(0)} deposit
              </p>
            )}
          </div>
        </div>

        {!soldOut && (
          <p className="text-xs text-muted-foreground mt-1">{available} remaining</p>
        )}
      </div>

      <Separator />

      {/* Description */}
      {costume.description && (
        <>
          <div className="px-4 py-4">
            <h3 className="text-sm font-bold text-foreground mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{costume.description}</p>
          </div>
          <Separator />
        </>
      )}

      {/* Pickup Info */}
      {pickup && (pickup.pickup_location || pickup.pickup_date) && (
        <>
          <div className="px-4 py-4">
            <h3 className="text-sm font-bold text-foreground mb-2">Pickup Details</h3>
            {pickup.pickup_location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" /> {pickup.pickup_location}
              </p>
            )}
            {pickup.pickup_date && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 shrink-0" /> {pickup.pickup_date}
              </p>
            )}
            {pickup.pickup_instructions && (
              <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded-lg">
                {pickup.pickup_instructions}
              </p>
            )}
          </div>
          <Separator />
        </>
      )}

      {/* Customization Form */}
      {!soldOut && (
        <>
          <div className="px-4 py-4 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Customization</h3>

            {/* Size Selection */}
            {costume.size_options.length > 0 && (
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Size *</Label>
                <div className="grid grid-cols-4 gap-2">
                  {costume.size_options.map((sz) => (
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

            {/* Dynamic organizer-defined fields */}
            {(fields || []).map(renderField)}

            {/* Fallback special requests if no custom fields */}
            {(!fields || fields.length === 0) && (
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Special Requests (optional)</Label>
                <Input
                  placeholder="Any special requests or notes..."
                  value={customFields.notes || ""}
                  onChange={(e) => setCustomFields({ ...customFields, notes: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            )}
          </div>
          <Separator />

          {/* Payment Option */}
          {hasDeposit && (
            <>
              <div className="px-4 py-4 space-y-2">
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
                    <p className="text-[10px] text-muted-foreground">
                      Balance ${balanceAmt.toFixed(0)} due {costume.balance_due_date || "later"}
                    </p>
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
              <Separator />
            </>
          )}

          {/* Quantity & Purchase */}
          <div className="px-4 py-3">
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
            {paymentOption === "deposit" && hasDeposit && (
              <p className="text-xs text-muted-foreground mb-3">
                Balance of ${balanceAmt.toFixed(0)} due by {costume.balance_due_date || "TBD"}
              </p>
            )}
            <Button
              onClick={handlePurchase}
              disabled={!canPurchase || purchaseProduct.isPending}
              className="w-full gradient-primary text-primary-foreground font-semibold rounded-full h-12"
            >
              {purchaseProduct.isPending
                ? "Processing..."
                : !canPurchase
                ? "Select required options"
                : paymentOption === "deposit" && hasDeposit
                ? "Pay Deposit"
                : "Complete Purchase"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
