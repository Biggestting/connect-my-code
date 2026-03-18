import { useParams, useNavigate } from "react-router-dom";
import { useEvent } from "@/hooks/use-events";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Minus, Plus, ShoppingCart, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CartItem {
  tierId: string;
  name: string;
  price: number;
  quantity: number;
  maxQty: number;
}

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading } = useEvent(id || "");
  const { user } = useAuth();
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Sign In Required</h1>
          <p className="text-muted-foreground text-sm">Please sign in to purchase tickets.</p>
          <Button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground rounded-full">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-bold text-foreground">Event Not Found</h1>
          <Button onClick={() => navigate("/")} className="gradient-primary text-primary-foreground rounded-full">
            Back to Discover
          </Button>
        </div>
      </div>
    );
  }

  const tiers = event.ticket_tiers || [];

  const updateQty = (tier: typeof tiers[0], delta: number) => {
    const existing = cart.get(tier.id);
    const currentQty = existing?.quantity || 0;
    const available = tier.quantity - tier.sold_count;
    const maxPerUser = event.max_tickets_per_user || 10;
    const newQty = Math.max(0, Math.min(currentQty + delta, available, maxPerUser));

    const newCart = new Map(cart);
    if (newQty === 0) {
      newCart.delete(tier.id);
    } else {
      newCart.set(tier.id, {
        tierId: tier.id,
        name: tier.name,
        price: Number(tier.price),
        quantity: newQty,
        maxQty: Math.min(available, maxPerUser),
      });
    }
    setCart(newCart);
  };

  const totalItems = Array.from(cart.values()).reduce((s, i) => s + i.quantity, 0);
  const totalAmount = Array.from(cart.values()).reduce((s, i) => s + i.price * i.quantity, 0);

  const handleCheckout = () => {
    if (totalItems === 0) {
      toast.error("Select at least one ticket");
      return;
    }
    toast.success("Checkout flow coming soon!");
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="font-bold text-foreground">Select Tickets</h1>
      </div>

      {/* Event Summary */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-3">
          {event.image_url && (
            <img src={event.image_url} alt={event.title} className="w-16 h-16 rounded-xl object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground text-sm line-clamp-2">{event.title}</h2>
            <p className="text-xs text-muted-foreground mt-1">{event.venue}</p>
          </div>
        </div>
      </div>

      {/* Tiers */}
      <div className="p-4 space-y-3">
        {tiers.map((tier) => {
          const soldOut = tier.sold_count >= tier.quantity;
          const qty = cart.get(tier.id)?.quantity || 0;
          return (
            <div key={tier.id} className={cn(
              "p-4 rounded-xl bg-card border border-border",
              soldOut && "opacity-50"
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{tier.name}</p>
                  <p className="text-lg font-bold text-foreground">${Number(tier.price).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {soldOut ? "Sold out" : `${tier.quantity - tier.sold_count} left`}
                  </p>
                </div>
                {!soldOut && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQty(tier, -1)}
                      disabled={qty === 0}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center disabled:opacity-30"
                    >
                      <Minus className="h-4 w-4 text-foreground" />
                    </button>
                    <span className="text-foreground font-semibold w-5 text-center">{qty}</span>
                    <button
                      onClick={() => updateQty(tier, 1)}
                      className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center"
                    >
                      <Plus className="h-4 w-4 text-primary-foreground" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4 z-40">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{totalItems} ticket{totalItems > 1 ? "s" : ""}</p>
              <p className="text-lg font-bold text-foreground">${totalAmount.toFixed(2)}</p>
            </div>
            <Button onClick={handleCheckout} className="flex-1 gradient-primary text-primary-foreground rounded-full text-base py-6">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
