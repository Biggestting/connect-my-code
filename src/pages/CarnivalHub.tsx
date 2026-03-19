import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { Calendar, MapPin, Users, Music, Package } from "lucide-react";
import { format } from "date-fns";
import { useCarnival, useCarnivalEvents, useCarnivalBands, useCarnivalJouvertPackages } from "@/hooks/use-carnivals";
import { CarnivalFallbackImage } from "@/components/CarnivalFallbackImage";
import { EventCard } from "@/components/EventCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CarnivalHub() {
  const { slug } = useParams<{ slug: string }>();
  const { data: carnival, isLoading: loadingCarnival } = useCarnival(slug || "");

  const seasons = carnival?.carnival_seasons?.sort((a, b) => b.year - a.year) || [];
  const currentYear = seasons[0]?.year || new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const year = selectedYear ?? currentYear;

  const { data: events, isLoading: loadingEvents } = useCarnivalEvents(carnival?.id, year);
  const { data: bands, isLoading: loadingBands } = useCarnivalBands(carnival?.id, year);
  const { data: jouvertPackages } = useCarnivalJouvertPackages(carnival?.id, year);

  if (loadingCarnival) {
    return (
      <div className="p-4 pb-24 space-y-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!carnival) {
    return (
      <div className="p-4 pb-24 text-center py-20">
        <h1 className="text-xl font-bold text-foreground">Carnival not found</h1>
        <p className="text-muted-foreground mt-2">This carnival doesn't exist or has been removed.</p>
        <Link to="/" className="text-primary underline mt-4 inline-block">Back to Discovery</Link>
      </div>
    );
  }

  const selectedSeason = seasons.find(s => s.year === year);
  const totalEvents = events?.length || 0;
  const totalBands = bands?.length || 0;
  const totalJouvert = jouvertPackages?.length || 0;

  return (
    <div className="pb-24">
      {/* Hero */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden">
        {carnival.image_url ? (
          <img src={carnival.image_url} alt={carnival.name} className="w-full h-full object-cover" />
        ) : (
          <CarnivalFallbackImage name={carnival.name} city={carnival.city} country={carnival.country} className="w-full h-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 text-white">
          <h1 className="text-2xl md:text-4xl font-bold">{carnival.name}</h1>
          {(carnival.city || carnival.country) && (
            <p className="text-sm md:text-base opacity-80 flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {[carnival.city, carnival.country].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 md:px-8 mt-6 space-y-8">
        {/* Season selector + stats */}
        <div className="flex flex-wrap items-center gap-4">
          {seasons.length > 1 && (
            <Select value={String(year)} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {seasons.map(s => (
                  <SelectItem key={s.year} value={String(s.year)}>{s.year} Season</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {seasons.length <= 1 && (
            <Badge variant="secondary" className="text-sm font-semibold">{year} Season</Badge>
          )}

          {selectedSeason?.start_date && selectedSeason?.end_date && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(selectedSeason.start_date), "MMM d")} – {format(new Date(selectedSeason.end_date), "MMM d, yyyy")}
            </span>
          )}
        </div>

        {/* Quick stats */}
        <div className="flex gap-6 text-sm">
          {totalEvents > 0 && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              <strong className="text-foreground">{totalEvents}</strong> Event{totalEvents !== 1 ? "s" : ""}
            </span>
          )}
          {totalBands > 0 && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4 text-primary" />
              <strong className="text-foreground">{totalBands}</strong> Band{totalBands !== 1 ? "s" : ""}
            </span>
          )}
          {totalJouvert > 0 && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Package className="h-4 w-4 text-primary" />
              <strong className="text-foreground">{totalJouvert}</strong> J'ouvert Package{totalJouvert !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Description */}
        {carnival.description && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{carnival.description}</p>
        )}

        {/* Events Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Events
          </h2>
          {loadingEvents ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
            </div>
          ) : events && events.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {events.map(event => <EventCard key={event.id} event={event} />)}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm py-6 text-center">No events listed for {year} yet.</p>
          )}
        </section>

        {/* Bands Section */}
        {(loadingBands || (bands && bands.length > 0)) && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" /> Bands
            </h2>
            {loadingBands ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bands!.map(band => (
                  <Link
                    key={band.id}
                    to={`/bands/${band.id}`}
                    className="group rounded-2xl overflow-hidden border border-border bg-card hover:shadow-md transition-all"
                  >
                    <div className="aspect-[16/9] overflow-hidden bg-muted">
                      {band.cover_image ? (
                        <img src={band.cover_image} alt={band.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : band.logo_url ? (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <img src={band.logo_url} alt={band.name} className="max-h-16 max-w-[60%] object-contain" loading="lazy" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                          <Music className="h-10 w-10 text-primary/40" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-1">
                      <h3 className="font-semibold text-foreground">{band.name}</h3>
                      {band.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{band.description}</p>
                      )}
                      {band.band_sections?.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {band.band_sections.length} section{band.band_sections.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* J'ouvert Packages */}
        {jouvertPackages && jouvertPackages.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> J'ouvert Packages
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {jouvertPackages.map((pkg: any) => (
                <div key={pkg.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  {pkg.image_url && (
                    <div className="aspect-[4/3] rounded-xl overflow-hidden">
                      <img src={pkg.image_url} alt={pkg.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <h3 className="font-semibold text-foreground">{pkg.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">${Number(pkg.price).toFixed(0)}</span>
                    <span className="text-xs text-muted-foreground">
                      {pkg.quantity - pkg.sold_count} left
                    </span>
                  </div>
                  {pkg.bundle_items?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {pkg.bundle_items.map((item: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
