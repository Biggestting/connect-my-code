import { useAuth } from "@/hooks/use-auth";
import { usePurchaseItems } from "@/hooks/use-purchases";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Ticket, Calendar, MapPin, ChevronRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";

export default function MyTickets() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: purchases, isLoading } = usePurchaseItems();

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Ticket className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Sign in to view tickets</h1>
          <Button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground rounded-full">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 pb-24 space-y-3">
        <h1 className="text-xl font-bold text-foreground">My Tickets</h1>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const items = purchases || [];

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold text-foreground mb-4">My Tickets</h1>
      {items.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Ticket className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No tickets yet</p>
          <Button onClick={() => navigate("/")} variant="outline" className="rounded-full">
            Browse Events
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((purchase) => (
            <Link
              key={purchase.id}
              to={`/events/${purchase.event_id}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:shadow-sm transition-shadow"
            >
              {purchase.events?.image_url && (
                <img src={purchase.events.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-semibold text-foreground text-sm line-clamp-1">{purchase.events?.title || "Event"}</p>
                {purchase.events?.date && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(purchase.events.date), "MMM d, yyyy")}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs capitalize">{purchase.product_type}</Badge>
                  <Badge
                    variant={purchase.status === "confirmed" ? "default" : "outline"}
                    className="text-xs capitalize"
                  >
                    {purchase.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">×{purchase.quantity}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
