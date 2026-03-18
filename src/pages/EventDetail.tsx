import { useParams, useNavigate } from "react-router-dom";
import { useEvent, useRelatedEvents } from "@/hooks/use-events";
import { useAuth } from "@/hooks/use-auth";
import { useSavedEventIds, useToggleSave } from "@/hooks/use-saved-events";
import { useToggleSaveItem, useSavedItemIds } from "@/hooks/use-saved-items";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StickyTicketBar } from "@/components/StickyTicketBar";
import { OrganizerPreview } from "@/components/OrganizerPreview";
import { RequestToPromoteButton } from "@/components/RequestToPromoteButton";
import { ReviewCard } from "@/components/ReviewCard";
import { EventCard } from "@/components/EventCard";
import { EventFallbackImage } from "@/components/EventFallbackImage";
import {
  ArrowLeft, Heart, Share2, MapPin, Calendar, Clock,
  ChevronDown, ChevronUp, Users, Star, Music, ListChecks
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading } = useEvent(id || "");
  const { data: relatedEvents } = useRelatedEvents(event);
  const { user } = useAuth();
  const { data: savedIds } = useSavedEventIds();
  const { data: savedItemIds } = useSavedItemIds();
  const toggleSave = useToggleSave();
  const toggleSaveItem = useToggleSaveItem();
  const [showFullDesc, setShowFullDesc] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen pb-32">
        <Skeleton className="w-full aspect-[16/9]" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Event Not Found</h1>
          <p className="text-muted-foreground">This event may have been removed.</p>
          <Button onClick={() => navigate("/")} className="gradient-primary text-primary-foreground rounded-full">
            Back to Discover
          </Button>
        </div>
      </div>
    );
  }

  const isSaved = savedIds?.has(event.id) || savedItemIds?.get("event")?.has(event.id) || false;

  const handleSave = () => {
    if (!user) {
      toast.error("Sign in to save events");
      navigate("/auth");
      return;
    }
    toggleSave.mutate({ eventId: event.id, isSaved });
    toggleSaveItem.mutate({ itemId: event.id, itemType: "event", isSaved });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: event.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  const tiers = event.ticket_tiers || [];
  const lineup = event.event_lineup || [];
  const agenda = event.event_agenda || [];
  const reviews = event.reviews || [];
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen pb-32">
      {/* Hero */}
      <div className="relative">
        <div className="aspect-[16/9] md:aspect-[21/9] overflow-hidden">
          {event.image_url ? (
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <EventFallbackImage title={event.title} date={event.date} category={event.category} />
          )}
        </div>
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex gap-2">
            <button onClick={handleSave} className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <Heart className={cn("h-5 w-5", isSaved ? "fill-primary text-primary" : "text-foreground")} />
            </button>
            <button onClick={handleShare} className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <Share2 className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:px-8 max-w-4xl mx-auto space-y-6">
        {/* Title & Meta */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="capitalize">{event.category}</Badge>
            {event.tags?.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">{event.title}</h1>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-primary" />
              {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
              {event.end_date && ` – ${format(new Date(event.end_date), "MMMM d, yyyy")}`}
            </p>
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-primary" />
              {format(new Date(event.date), "h:mm a")}
            </p>
            {event.venue && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                {event.venue}{event.city ? `, ${event.city}` : ""}
              </p>
            )}
          </div>
        </div>

        {/* Organizer */}
        {event.organizers && (
          <div className="space-y-2">
            <OrganizerPreview organizer={event.organizers} />
            <RequestToPromoteButton eventId={event.id} organizerId={event.organizer_id} />
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">About</h2>
            <p className={cn("text-sm text-muted-foreground whitespace-pre-line", !showFullDesc && "line-clamp-4")}>
              {event.description}
            </p>
            {event.description.length > 200 && (
              <button
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="text-primary text-sm font-medium flex items-center gap-1"
              >
                {showFullDesc ? "Show less" : "Read more"}
                {showFullDesc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
          </div>
        )}

        {/* Highlights */}
        {event.highlights && event.highlights.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Highlights</h2>
            <ul className="space-y-1">
              {event.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ticket Tiers */}
        {tiers.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Tickets</h2>
            <div className="space-y-2">
              {tiers.map((tier) => {
                const soldOut = tier.sold_count >= tier.quantity;
                return (
                  <div key={tier.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                    <div>
                      <p className="font-medium text-foreground text-sm">{tier.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {soldOut ? "Sold out" : `${tier.quantity - tier.sold_count} remaining`}
                      </p>
                    </div>
                    <p className={cn("font-bold", soldOut ? "text-muted-foreground line-through" : "text-foreground")}>
                      ${Number(tier.price).toFixed(0)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lineup */}
        {lineup.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" /> Lineup
            </h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {lineup.map((artist) => (
                <div key={artist.id} className="flex flex-col items-center gap-2 min-w-[80px]">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
                    {artist.image_url ? (
                      <img src={artist.image_url} alt={artist.artist_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-foreground font-medium text-center">{artist.artist_name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agenda */}
        {agenda.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" /> Schedule
            </h2>
            <div className="space-y-2">
              {agenda.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 rounded-xl bg-card border border-border">
                  <p className="text-sm font-semibold text-primary whitespace-nowrap">{item.time}</p>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Venue Notes */}
        {event.venue_notes && event.venue_notes.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Venue Notes</h2>
            <ul className="space-y-1">
              {event.venue_notes.map((note, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Reviews</h2>
              {avgRating && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-1" />
                  {avgRating} ({reviews.length})
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {reviews.slice(0, 5).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>
        )}

        {/* Related Events */}
        {relatedEvents && relatedEvents.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">You May Also Like</h2>
            <div className="grid grid-cols-2 gap-3">
              {relatedEvents.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </div>
        )}
      </div>

      <StickyTicketBar event={event} />
    </div>
  );
}
