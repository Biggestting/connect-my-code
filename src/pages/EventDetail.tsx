import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft, Share2, Heart, Calendar, MapPin, Clock, Star, ChevronRight, ExternalLink, Users, Music
} from "lucide-react";
import { useEvent, useRelatedEvents } from "@/hooks/use-events";
import { useAuth } from "@/hooks/use-auth";
import { useSavedEventIds, useToggleSave } from "@/hooks/use-saved-events";
import { useIsFollowing, useToggleFollow } from "@/hooks/use-follows";
import { OrganizerPreview } from "@/components/OrganizerPreview";
import { ReviewCard } from "@/components/ReviewCard";
import { StickyTicketBar } from "@/components/StickyTicketBar";
import { EventCard } from "@/components/EventCard";
import { EventDetailSkeleton } from "@/components/EventSkeleton";
import { EventFallbackImage } from "@/components/EventFallbackImage";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { usePromoCapture, usePromoCode } from "@/hooks/use-promo-code";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading, error } = useEvent(id!);
  const { data: relatedEvents } = useRelatedEvents(event);
  const [descExpanded, setDescExpanded] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setReferral } = usePromoCode();
  
  // Capture deep-link referral from ?promo={promoter_id}
  useEffect(() => {
    const promoId = searchParams.get("promo");
    if (promoId) {
      setReferral({ promoterId: promoId, eventId: id || null });
    }
  }, [searchParams, id, setReferral]);
  
  usePromoCapture(); // Capture ?p=CODE from URL

  const { data: savedIds } = useSavedEventIds();
  const toggleSave = useToggleSave();
  const isSaved = savedIds?.has(id!) ?? false;

  const organizerId = event?.organizers?.id;
  const { data: isFollowing } = useIsFollowing(organizerId);
  const toggleFollow = useToggleFollow();

  const handleSave = () => {
    if (!user) { toast.error("Sign in to save events"); navigate("/auth"); return; }
    toggleSave.mutate({ eventId: id!, isSaved });
  };

  const handleFollow = () => {
    if (!user) { toast.error("Sign in to follow organizers"); navigate("/auth"); return; }
    if (!organizerId) return;
    toggleFollow.mutate({ organizerId, isFollowing: isFollowing ?? false });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: event?.title, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  if (isLoading) return <EventDetailSkeleton />;
  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-lg font-semibold text-foreground">Event not found</p>
        <p className="text-sm text-muted-foreground mt-1">This event may no longer be available.</p>
        <Link to="/" className="mt-4 text-accent text-sm font-medium">Back to Discover</Link>
      </div>
    );
  }

  const organizer = event.organizers;
  const carnival = event.carnivals;
  const lineup = event.event_lineup || [];
  const agenda = event.event_agenda || [];
  const reviews = event.reviews || [];
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  const descriptionPreview = event.description?.slice(0, 200) || "";
  const hasLongDesc = (event.description?.length ?? 0) > 200;

  return (
    <div className="pb-28 md:pb-24">
      {/* Hero */}
      <div className="relative">
        <div className="aspect-[16/9] md:aspect-[21/9]">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <EventFallbackImage
              title={event.title}
              date={event.date}
              location={[event.venue, event.city].filter(Boolean).join(", ")}
              category={event.category}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        </div>

        {/* Nav overlay */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
          <Link
            to="/"
            className="w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
            >
              <Share2 className="w-4 h-4 text-foreground" />
            </button>
            <button
              onClick={handleSave}
              className="w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
            >
              <Heart className={`w-4 h-4 ${isSaved ? "fill-primary text-primary" : "text-foreground"}`} />
            </button>
          </div>
        </div>

        {/* Hero text */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2 mb-2">
            {event.sales_status === "few_left" && (
              <Badge className="gradient-primary border-0 text-primary-foreground text-[11px]">
                Few Tickets Left
              </Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-primary-foreground mb-1.5">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-primary-foreground/80 text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(event.date), "EEE, MMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {format(new Date(event.date), "h:mm a")}
              {event.end_date && ` - ${format(new Date(event.end_date), "h:mm a")}`}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {event.venue}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full">
        {/* Cancellation Notice */}
        {event.sales_status === "cancelled" && (
          <div className="mx-4 mt-4 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
            <p className="text-sm font-semibold text-destructive">This event has been cancelled</p>
            <p className="text-xs text-muted-foreground mt-1">
              If you purchased tickets, your ticket status has been updated. Contact the organizer for refund details.
            </p>
          </div>
        )}

        {/* Organizer Preview */}
        {organizer && (
          <Link to={`/organizers/${organizer.slug}`} className="block px-4 py-4 border-b border-border">
            <OrganizerPreview organizer={organizer} />
          </Link>
        )}

        {/* Overview */}
        <section className="px-4 py-5">
          <h2 className="text-base font-bold text-foreground mb-2">About</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {descExpanded ? event.description : descriptionPreview}
            {hasLongDesc && !descExpanded && "..."}
          </p>
          {hasLongDesc && (
            <button
              onClick={() => setDescExpanded(!descExpanded)}
              className="text-sm font-medium text-accent mt-1"
            >
              {descExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </section>

        <Separator />

        {/* Good To Know */}
        {(event.highlights?.length || event.venue_notes?.length) && (
          <>
            <section className="px-4 py-5">
              <h2 className="text-base font-bold text-foreground mb-3">Good to Know</h2>
              {event.highlights && event.highlights.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {event.highlights.map((h, i) => (
                    <Badge key={i} variant="secondary" className="rounded-lg text-xs font-medium py-1 px-3">
                      {h}
                    </Badge>
                  ))}
                </div>
              )}
              {event.venue_notes && event.venue_notes.length > 0 && (
                <div className="space-y-1.5">
                  {event.venue_notes.map((note, i) => (
                    <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-muted-foreground/60 mt-0.5">•</span>
                      {note}
                    </p>
                  ))}
                </div>
              )}
            </section>
            <Separator />
          </>
        )}

        {/* Lineup */}
        {event.has_lineup && lineup.length > 0 && (
          <>
            <section className="px-4 py-5">
              <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                <Music className="w-4 h-4" /> Lineup
              </h2>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
                {lineup.map((artist) => (
                  <div key={artist.id} className="flex flex-col items-center gap-2 shrink-0">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={artist.image_url || undefined} alt={artist.artist_name} />
                      <AvatarFallback className="bg-muted text-sm">
                        {artist.artist_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs font-medium text-foreground text-center w-20 truncate">
                      {artist.artist_name}
                    </p>
                  </div>
                ))}
              </div>
            </section>
            <Separator />
          </>
        )}

        {/* Agenda */}
        {event.has_agenda && agenda.length > 0 && (
          <>
            <section className="px-4 py-5">
              <h2 className="text-base font-bold text-foreground mb-3">Schedule</h2>
              <div className="space-y-3">
                {agenda.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 shrink-0 text-right">
                      <p className="text-sm font-semibold text-foreground">{item.time}</p>
                    </div>
                    <div className="flex-1 pb-3 border-b border-border last:border-0">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <Separator />
          </>
        )}

        {/* Location */}
        <section className="px-4 py-5">
          <h2 className="text-base font-bold text-foreground mb-3">Location</h2>
          {event.venue && (
            <p className="text-sm font-medium text-foreground">{event.venue}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {[event.address, event.city, event.state, event.country].filter(Boolean).join(", ")}
          </p>
          {event.latitude != null && event.longitude != null ? (
            <>
              <div className="mt-3 rounded-xl overflow-hidden bg-muted aspect-[16/9] flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground/60">Map view</p>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-accent"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Get Directions
              </a>
            </>
          ) : null}
        </section>

        <Separator />

        {/* Organizer Card */}
        {organizer && (
          <>
            <section className="px-4 py-5">
              <h2 className="text-base font-bold text-foreground mb-3">Hosted By</h2>
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={organizer.logo_url || undefined} alt={organizer.name} />
                    <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                      {organizer.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold text-foreground">{organizer.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{organizer.follower_count.toLocaleString()} followers</span>
                      <span>{organizer.events_count} events</span>
                      <span>{organizer.years_hosting}y hosting</span>
                    </div>
                  </div>
                </div>
                {organizer.bio && (
                  <p className="text-sm text-muted-foreground mb-3">{organizer.bio}</p>
                )}
                <Button
                  variant="outline"
                  onClick={handleFollow}
                  className={`w-full rounded-full ${
                    isFollowing
                      ? "border-muted-foreground text-muted-foreground hover:bg-muted"
                      : "border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              </div>
            </section>
            <Separator />
          </>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <>
            <section className="px-4 py-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  Reviews
                  <span className="text-sm font-normal text-muted-foreground">
                    ({reviews.length})
                  </span>
                </h2>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span className="text-sm font-bold text-foreground">{avgRating.toFixed(1)}</span>
                </div>
              </div>
              <div>
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            </section>
            <Separator />
          </>
        )}

        {/* Carnival Association */}
        {carnival && (
          <>
            <section className="px-4 py-5">
              <Link
                to={`/carnivals/${carnival.slug}`}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shrink-0">
                  <span className="text-primary-foreground text-xs font-bold">🎭</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Part of {carnival.name}</p>
                  {event.carnival_year && (
                    <p className="text-xs text-muted-foreground">Season: {event.carnival_year}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Link>
            </section>
            <Separator />
          </>
        )}

        {/* You Might Also Like */}
        {relatedEvents && relatedEvents.length > 0 && (
          <section className="px-4 py-5">
            <h2 className="text-base font-bold text-foreground mb-4">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedEvents.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky Ticket Bar */}
      <StickyTicketBar event={event} />
    </div>
  );
}
