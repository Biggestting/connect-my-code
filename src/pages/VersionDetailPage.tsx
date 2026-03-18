import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Minus, Plus, Clock, Layers } from "lucide-react";
import { useBand, usePurchaseProduct } from "@/hooks/use-products";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { SectionVersionWithFields, CustomizationField } from "@/types";

export default function VersionDetailPage() {
  const { bandId, sectionId, versionId } = useParams<{
    bandId: string;
    sectionId: string;
    versionId: string;
  }>();
  const { data: band, isLoading } = useBand(bandId);
  const { user } = useAuth();
  const navigate = useNavigate();
  const purchaseProduct = usePurchaseProduct();

  const [quantity, setQuantity] = useState(1);
  const [success, setSuccess] = useState(false);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [imageIdx, setImageIdx] = useState(0);

  // Find section & version
  const section = band?.band_sections?.find((s) => s.id === sectionId);
  const version = section?.section_versions?.find((v) => v.id === versionId) as
    | SectionVersionWithFields
    | undefined;
  const fields = version?.customization_fields || [];

  // Launch countdown
  const launchAt = section?.launch_at ? new Date(section.launch_at) : null;
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!launchAt || launchAt <= new Date()) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [launchAt]);

  const isBeforeLaunch = launchAt && launchAt > now;
  const diff = isBeforeLaunch ? launchAt.getTime() - now.getTime() : 0;
  const cDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  const cHours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const cMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const cSeconds = Math.floor((diff % (1000 * 60)) / 1000);

  const available = version ? version.inventory_quantity - version.inventory_sold : 0;
  const soldOut = !version || available <= 0;
  const total = version ? Number(version.price) * quantity : 0;
  const images = version?.image_gallery?.length ? version.image_gallery : [];

  const structureLabel =
    version?.costume_structure === "1-piece"
      ? "One Piece"
      : version?.costume_structure === "2-piece"
      ? "Two Piece"
      : version?.costume_structure === "board-shorts"
      ? "Board Shorts"
      : version?.costume_structure || "";

  // Check required fields
  const requiredFieldsFilled = fields
    .filter((f) => f.required)
    .every((f) => customFields[f.id]?.trim());
  const canPurchase = version && !soldOut && !isBeforeLaunch && requiredFieldsFilled;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!band || !section || !version) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-lg font-semibold text-foreground">Version not found</p>
        <Link to="/" className="mt-4 text-accent text-sm font-medium">
          Back to Discover
        </Link>
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
        <p className="text-sm text-muted-foreground mb-6">
          Your {structureLabel} costume from {band.name} has been confirmed.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/tickets")} variant="outline" className="rounded-full">
            View Purchases
          </Button>
          <Button
            onClick={() => navigate(`/bands/${band.id}/sections/${section.id}`)}
            className="gradient-primary text-primary-foreground rounded-full"
          >
            Back to Section
          </Button>
        </div>
      </div>
    );
  }

  const handlePurchase = async () => {
    if (!user) {
      toast.error("Sign in to purchase");
      navigate("/auth");
      return;
    }
    if (!canPurchase) return;

    const eventId = band.event_id;
    if (!eventId) {
      toast.error("This band is not attached to an event yet.");
      return;
    }

    const responses: Record<string, any> = {};
    for (const field of fields) {
      if (customFields[field.id]) {
        responses[field.field_label] = customFields[field.id];
      }
    }

    try {
      await purchaseProduct.mutateAsync({
        userId: user.id,
        eventId,
        productType: "costume",
        quantity,
        totalAmount: total,
        customizationResponses: responses,
      });
      setSuccess(true);
      toast.success("Purchase complete!");
    } catch (err: any) {
      toast.error(err.message || "Purchase failed");
    }
  };

  const renderField = (field: CustomizationField) => {
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
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
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
          to={`/bands/${band.id}/sections/${section.id}`}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">{version.version_name}</h1>
          <p className="text-xs text-muted-foreground">
            {band.name} · {section.name}
          </p>
        </div>
      </div>

      {/* Image Gallery */}
      {images.length > 0 ? (
        <div className="relative aspect-square bg-muted">
          <img
            src={images[imageIdx]}
            alt={version.version_name}
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
      ) : (
        <div className="aspect-[16/9] bg-muted flex items-center justify-center">
          <Layers className="w-12 h-12 text-muted-foreground/30" />
        </div>
      )}

      {/* Launch Countdown */}
      {isBeforeLaunch && (
        <div className="mx-4 mt-3 p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-3">
          <Clock className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Section launches soon</p>
            <p className="text-lg font-mono font-bold text-primary">
              {cDays > 0 ? `${cDays}d ` : ""}
              {String(cHours).padStart(2, "0")}:{String(cMinutes).padStart(2, "0")}:
              {String(cSeconds).padStart(2, "0")}
            </p>
            <p className="text-xs text-muted-foreground">Purchases will be available after launch</p>
          </div>
        </div>
      )}

      {/* Title & Price */}
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-foreground">{version.version_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-[10px]">
                {structureLabel}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {band.name} · {section.name}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-foreground">${Number(version.price).toFixed(0)}</p>
          </div>
        </div>
        {!soldOut && <p className="text-xs text-muted-foreground mt-1">{available} remaining</p>}
      </div>

      <Separator />

      {/* Description */}
      {version.description && (
        <>
          <div className="px-4 py-4">
            <h3 className="text-sm font-bold text-foreground mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{version.description}</p>
          </div>
          <Separator />
        </>
      )}

      {/* Customization Fields */}
      {!soldOut && !isBeforeLaunch && fields.length > 0 && (
        <>
          <div className="px-4 py-4 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Customization</h3>
            {fields
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map(renderField)}
          </div>
          <Separator />
        </>
      )}

      {/* Quantity & Purchase */}
      {!soldOut && !isBeforeLaunch && (
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-bold w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(available, quantity + 1))}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Purchase Bar */}
      {!soldOut && !isBeforeLaunch && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 z-30">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-bold text-foreground">${total.toFixed(0)}</p>
              <p className="text-[10px] text-muted-foreground">
                {quantity} × ${Number(version.price).toFixed(0)}
              </p>
            </div>
            <Button
              onClick={handlePurchase}
              disabled={!canPurchase || purchaseProduct.isPending}
              className="gradient-primary text-primary-foreground rounded-full px-8 font-bold"
            >
              {purchaseProduct.isPending ? "Processing..." : "Purchase"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
