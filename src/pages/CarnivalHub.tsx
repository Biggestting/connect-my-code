import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { MapPin, Calendar, Star, ChevronRight, Users, ExternalLink } from "lucide-react";
import { useCarnival, useCarnivalEvents } from "@/hooks/use-carnivals";
import { EventCard } from "@/components/EventCard";
import { CarnivalFallbackImage } from "@/components/CarnivalFallbackImage";
import { EventCardSkeleton } from "@/components/EventSkeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function CarnivalHub() {
  const { slug } = useParams<{ slug: string }>();
  const { data: carnival, isLoading } = useCarnival(slug!);
  const [selectedYear, setSelectedYear] = useState<number | undefined>();

  const effectiveYear = selectedYear ?? carnival?.carnival_seasons?.[0]?.year;
  const { data: events, isLoading: eventsLoading } = useCarnivalEvents(carnival?.id, effectiveYear);

  if (isLoading) {
    return (
      <div className="pb-20 md:pb-8">
        <div className="animate-pulse">
          <div className="h-48 bg-muted" />
          <div className="px-4 py-6 space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!carnival) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-lg font-semibold text-foreground">Carnival not found</p>
        <Link to="/" className="mt-4 text-accent text-sm font-medium">Back to Discover</Link>
      </div>
    );
  }

  const seasons = carnival.carnival_seasons || [];

  return (
    <div className="pb-20 md:pb-8">
      {/* Hero */}
      <div className="relative">
        <div className="aspect-[16/7]">
          {carnival.image_url ? (
            <>
              <img
                src={carnival.image_url}
                alt={carnival.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h1 className="text-2xl md:text-4xl font-extrabold text-primary-foreground mb-1">
                  {carnival.name}
                </h1>
                <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{carnival.city}, {carnival.country}</span>
                </div>
              </div>
            </>
          ) : (
            <CarnivalFallbackImage
              name={carnival.name}
              city={carnival.city}
              country={carnival.country}
            />
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full">
        {/* Description */}
        {carnival.description && (
          <section className="px-4 py-5">
            <p className="text-sm text-muted-foreground leading-relaxed">{carnival.description}</p>
          </section>
        )}

        <Separator />

        {/* Season Selector */}
        {seasons.length > 0 && (
          <section className="px-4 py-4">
            <h2 className="text-base font-bold text-foreground mb-3">Seasons</h2>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {seasons.map((season) => (
                <button
                  key={season.id}
                  onClick={() => setSelectedYear(season.year)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    (effectiveYear === season.year)
                      ? "gradient-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-border"
                  }`}
                >
                  {season.year}
                </button>
              ))}
            </div>
          </section>
        )}

        <Separator />

        {/* Events */}
        <section className="px-4 py-5">
          <h2 className="text-base font-bold text-foreground mb-4">
            Events {effectiveYear ? `· ${effectiveYear}` : ""}
          </h2>
          {eventsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No events found for this season.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
