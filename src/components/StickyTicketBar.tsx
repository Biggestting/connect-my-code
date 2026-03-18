import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { EventWithRelations, TicketTier } from "@/types";

interface StickyTicketBarProps {
  event: EventWithRelations;
}

export function StickyTicketBar({ event }: StickyTicketBarProps) {
  const navigate = useNavigate();
  const tiers = event.ticket_tiers || [];
  const lowestPrice = tiers.length > 0
    ? Math.min(...tiers.map((t) => Number(t.price)))
    : event.price ? Number(event.price) : null;

  const allSoldOut = tiers.length > 0 && tiers.every((t) => t.sold_count >= t.quantity);

  if (event.sales_status === "sold_out" || allSoldOut) {
    return (
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4 z-40">
        <Button disabled className="w-full rounded-full text-base py-6">
          Sold Out
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4 z-40">
      <div className="flex items-center justify-between gap-4">
        {lowestPrice !== null && (
          <div>
            <p className="text-xs text-muted-foreground">From</p>
            <p className="text-lg font-bold text-foreground">${lowestPrice.toFixed(0)}</p>
          </div>
        )}
        <Button
          onClick={() => navigate(`/checkout/${event.id}`)}
          className="flex-1 gradient-primary text-primary-foreground rounded-full text-base py-6"
        >
          Get Tickets
        </Button>
      </div>
    </div>
  );
}
