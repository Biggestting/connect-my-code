import { Heart, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import type { EventWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EventFallbackImage } from "@/components/EventFallbackImage";
import { useAuth } from "@/hooks/use-auth";
import { useSavedEventIds, useToggleSave } from "@/hooks/use-saved-events";
import { useToggleSaveItem, useSavedItemIds } from "@/hooks/use-saved-items";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface EventCardProps {
  event: EventWithRelations;
  className?: string;
}

export function EventCard({ event, className }: EventCardProps) {
  const minPrice = event.min_ticket_price ?? event.price;
  const { user } = useAuth();
  const { data: savedIds } = useSavedEventIds();
  const { data: savedItemIds } = useSavedItemIds();
  const toggleSave = useToggleSave();
  const toggleSaveItem = useToggleSaveItem();
  const navigate = useNavigate();
  const isSaved = savedIds?.has(event.id) || savedItemIds?.get("event")?.has(event.id) || false;

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Sign in to save events");
      navigate("/auth");
      return;
    }
    toggleSave.mutate({ eventId: event.id, isSaved });
    toggleSaveItem.mutate({ itemId: event.id, itemType: "event", isSaved });
  };

  return (
    <Link
      to={`/events/${event.id}`}
      className={cn(
        "group block rounded-2xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <EventFallbackImage title={event.title} date={event.date} category={event.category} />
        )}
        <button
          onClick={handleSave}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-background"
        >
          <Heart
            className={cn("h-4 w-4", isSaved ? "fill-primary text-primary" : "text-foreground")}
          />
        </button>
        {event.sales_status === "few_left" && (
          <Badge className="absolute bottom-3 left-3 bg-destructive text-destructive-foreground text-xs">
            Few Tickets Left
          </Badge>
        )}
      </div>
      <div className="p-4 space-y-2">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {format(new Date(event.date), "EEE, MMM d · h:mm a")}
        </p>
        <h3 className="font-semibold text-foreground line-clamp-2 leading-snug">{event.title}</h3>
        <p className="text-xs text-muted-foreground flex items-center gap-1 line-clamp-1">
          <MapPin className="h-3 w-3 shrink-0" />
          {event.venue}{event.city ? `, ${event.city}` : ""}
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-bold text-foreground">
            {minPrice ? `From $${Number(minPrice).toFixed(0)}` : "Free"}
          </span>
          {event.organizers && (
            <span className="text-xs text-muted-foreground">
              by {event.organizers.name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
