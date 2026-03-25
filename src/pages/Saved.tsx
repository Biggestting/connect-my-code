import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MapPin, Calendar, Bell, BellOff, ExternalLink } from "lucide-react";
import { format, compareAsc, addMonths } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useSavedItemsWithEvents, useToggleSaveItem } from "@/hooks/use-saved-items";
import { usePriceAlerts, useUpsertPriceAlert } from "@/hooks/use-price-alerts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function SavedPage() {
  const { user } = useAuth();
  const { data: savedItems, isLoading } = useSavedItemsWithEvents();
  const { data: priceAlerts } = usePriceAlerts();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Heart className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <p className="text-lg font-semibold text-foreground mb-1">Sign in to see saved items</p>
        <p className="text-sm text-muted-foreground mb-4">Save events, tickets, and costumes you're interested in.</p>
        <Button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground rounded-full">
          Sign In
        </Button>
      </div>
    );
  }

  // Group by event date
  const now = new Date();
  const sixMonthsOut = addMonths(now, 6);

  const itemsWithDate = (savedItems || []).map((item) => ({
    ...item,
    sortDate: item.event?.date ? new Date(item.event.date) : null,
  }));

  // Sort by event date ascending, null dates at bottom
  const sorted = [...itemsWithDate].sort((a, b) => {
    if (!a.sortDate && !b.sortDate) return 0;
    if (!a.sortDate) return 1;
    if (!b.sortDate) return -1;
    return compareAsc(a.sortDate, b.sortDate);
  });

  const upcoming = sorted.filter((i) => i.sortDate && i.sortDate >= now && i.sortDate <= sixMonthsOut);
  const later = sorted.filter((i) => i.sortDate && i.sortDate > sixMonthsOut);
  const noDate = sorted.filter((i) => !i.sortDate);

  const alertMap = new Map(
    (priceAlerts || []).map((a) => [`${a.item_type}:${a.item_id}`, a])
  );

  return (
    <div className="pb-20 md:pb-8 max-w-7xl mx-auto w-full">
      <div className="px-4 py-5">
        <h1 className="text-xl font-bold text-foreground mb-4">Saved</h1>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium text-foreground">No saved items yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tap the heart on events, tickets, and costumes you like!
            </p>
            <Button onClick={() => navigate("/")} variant="outline" className="mt-4 rounded-full">
              Discover Events
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <SavedGroup label="Upcoming" items={upcoming} alertMap={alertMap} />
            )}
            {later.length > 0 && (
              <SavedGroup label="Later" items={later} alertMap={alertMap} />
            )}
            {noDate.length > 0 && (
              <SavedGroup label="Other" items={noDate} alertMap={alertMap} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SavedGroup({
  label,
  items,
  alertMap,
}: {
  label: string;
  items: any[];
  alertMap: Map<string, any>;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {label}
      </p>
      <div className="space-y-3">
        {items.map((item: any) => (
          <SavedItemCard
            key={item.id}
            item={item}
            alert={alertMap.get(`${item.item_type}:${item.item_id}`)}
          />
        ))}
      </div>
    </div>
  );
}

function SavedItemCard({ item, alert }: { item: any; alert?: any }) {
  const navigate = useNavigate();
  const toggleSave = useToggleSaveItem();
  const upsertAlert = useUpsertPriceAlert();
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState(alert?.target_price?.toString() || "");
  const [alertEnabled, setAlertEnabled] = useState(alert?.alert_enabled ?? false);

  const event = item.event;

  const handleRemove = () => {
    toggleSave.mutate({
      itemId: item.item_id,
      itemType: item.item_type,
      isSaved: true,
    });
    toast.success("Removed from saved");
  };

  const handleSaveAlert = () => {
    upsertAlert.mutate({
      itemId: item.item_id,
      itemType: item.item_type,
      targetPrice: targetPrice ? parseFloat(targetPrice) : null,
      alertEnabled,
    });
    setAlertDialogOpen(false);
    toast.success(alertEnabled ? "Price alert enabled" : "Price alert disabled");
  };

  const handleViewItem = () => {
    if (item.item_type === "event" && event) {
      navigate(`/events/${event.id}`);
    }
  };

  return (
    <>
      <div className="p-4 rounded-xl bg-card border border-border hover:shadow-sm transition-all">
        <div className="flex gap-3">
          {event?.image_url && (
            <button onClick={handleViewItem} className="shrink-0">
              <img
                src={event.image_url}
                alt={event.title}
                className="w-20 h-20 rounded-lg object-cover"
              />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <button onClick={handleViewItem} className="text-left w-full">
              <p className="text-sm font-semibold text-foreground truncate">
                {event?.title || "Saved Item"}
              </p>
              {event?.date && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span>{format(new Date(event.date), "EEE, MMM d yyyy")}</span>
                </div>
              )}
              {event?.venue && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {event.venue}{event.city ? `, ${event.city}` : ""}
                  </span>
                </div>
              )}
            </button>

            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-[10px] py-0 px-2 capitalize">
                {item.item_type}
              </Badge>
              {alert?.alert_enabled && (
                <Badge variant="outline" className="text-[10px] py-0 px-2 border-primary/50 text-primary">
                  <Bell className="w-2.5 h-2.5 mr-1" />
                  Alert {alert.target_price ? `≤ $${alert.target_price}` : "on"}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <button
              onClick={handleRemove}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/10 transition-colors"
              aria-label="Remove from saved"
            >
              <Heart className="w-4 h-4 fill-primary text-primary" />
            </button>
            <button
              onClick={() => setAlertDialogOpen(true)}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
              aria-label="Price alert"
            >
              {alert?.alert_enabled ? (
                <Bell className="w-4 h-4 text-primary" />
              ) : (
                <BellOff className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={handleViewItem}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
              aria-label="View item"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Price Alert Dialog */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Price Alert</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {event?.title || "This item"}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Enable Price Alert</span>
              <Switch
                checked={alertEnabled}
                onCheckedChange={setAlertEnabled}
              />
            </div>

            {alertEnabled && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Alert me if price drops below
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="250"
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to get notified on any price drop.
                </p>
              </div>
            )}

            <Button
              onClick={handleSaveAlert}
              className="w-full gradient-primary text-primary-foreground font-semibold rounded-full h-11"
            >
              Save Alert
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
