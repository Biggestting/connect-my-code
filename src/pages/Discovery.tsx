import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { getStoredLocation } from "@/components/LocationSelector";
import { SearchBanner } from "@/components/SearchBanner";
import { Link, useNavigate } from "react-router-dom";
import { format, isToday, isThisWeek, addDays, isBefore } from "date-fns";
import { useEvents } from "@/hooks/use-events";
import { useCarnivals, useCarnivalEventCounts } from "@/hooks/use-carnivals";
import { EventCard } from "@/components/EventCard";
import { CategoryChips } from "@/components/CategoryChips";
import { EventCardSkeleton } from "@/components/EventSkeleton";
import { EventFallbackImage } from "@/components/EventFallbackImage";
import { CarnivalFallbackImage } from "@/components/CarnivalFallbackImage";
import type { EventWithRelations } from "@/types";

type TimeFilter = "all" | "today" | "weekend" | "30days";

export default function Discovery() {
  const [category, setCategory] = useState("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [carnivalFilter, setCarnivalFilter] = useState("all");
  const [selectedCity, setSelectedCity] = useState(getStoredLocation);
  const { data: events, isLoading, error } = useEvents(category, undefined, selectedCity);
  const { data: carnivals } = useCarnivals();
  const { data: carnivalEventCounts } = useCarnivalEventCounts();
  const navigate = useNavigate();
  const carnivalSlugs = carnivals?.map(c => ({ name: c.name.toLowerCase(), slug: c.slug })) || [];

  const filteredEvents = events?.filter((e) => {
    const eventDate = new Date(e.date);
    let passesTime = true;
    switch (timeFilter) {
      case "today": passesTime = isToday(eventDate); break;
      case "weekend": passesTime = isThisWeek(eventDate, { weekStartsOn: 1 }) && eventDate.getDay() >= 5; break;
      case "30days": passesTime = isBefore(eventDate, addDays(new Date(), 30)) && eventDate >= new Date(); break;
    }
    const passesCarnival = carnivalFilter === "all" || e.carnival_id === carnivalFilter;
    return passesTime && passesCarnival;
  }) || [];

  const featuredEvents = events?.slice(0, 3) || [];
  const upcomingEvents = filteredEvents.filter(e => new Date(e.date) >= new Date());
  const justAnnounced = [...(events || [])].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 8);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    const match = carnivalSlugs.find(c => c.name.includes(q) || q.includes(c.name));
    if (match) {
      navigate(`/carnivals/${match.slug}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="pb-24 md:pb-8">
      {/* Search Banner */}
      <SearchBanner
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
        category={category}
        onCategoryChange={setCategory}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
      />

      {/* Hero Carousel */}
      {featuredEvents.length > 0 && <HeroCarousel events={featuredEvents} />}

      {/* Categories */}
      <div className="px-4 py-3">
        <CategoryChips selected={category} onChange={setCategory} />
      </div>

      {/* Error State */}
      {error && (
        <div className="px-4 py-8 text-center">
          <p className="text-destructive font-semibold">Something went wrong</p>
          <p className="text-sm text-muted-foreground mt-1">Could not load events. Please try again.</p>
        </div>
      )}

      {/* Discover Events */}
      <section className="px-4 space-y-4">
        <h2 className="text-xl font-bold text-foreground">Discover Events</h2>

        {/* Time Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {([
            { key: "all" as TimeFilter, label: "All" },
            { key: "today" as TimeFilter, label: "Today" },
            { key: "weekend" as TimeFilter, label: "This Weekend" },
            { key: "30days" as TimeFilter, label: "Next 30 Days" },
          ]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setTimeFilter(opt.key)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                timeFilter === opt.key
                  ? "gradient-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-border"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Carnival Filter */}
        {carnivals && carnivals.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">By Carnival</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setCarnivalFilter("all")}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  carnivalFilter === "all"
                    ? "gradient-primary text-primary-foreground border-transparent shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                }`}
              >All</button>
              {carnivals.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCarnivalFilter(c.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    carnivalFilter === c.id
                      ? "gradient-primary text-primary-foreground border-transparent shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >{c.name}</button>
              ))}
            </div>
          </div>
        )}

        {/* Events Row */}
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[260px]"><EventCardSkeleton /></div>
            ))}
          </div>
        ) : upcomingEvents.length > 0 ? (
          <ScrollRow>
            {upcomingEvents.slice(0, 12).map((event) => (
              <div key={event.id} className="min-w-[260px] max-w-[280px] shrink-0">
                <EventCard event={event} />
              </div>
            ))}
          </ScrollRow>
        ) : (
          <p className="text-center text-muted-foreground py-8">No events found for this filter.</p>
        )}
      </section>

      {/* Just Announced */}
      {justAnnounced.length > 0 && (
        <section className="px-4 mt-8 space-y-4">
          <h2 className="text-xl font-bold text-foreground">Just Announced</h2>
          <ScrollRow>
            {justAnnounced.map((event) => (
              <div key={event.id} className="min-w-[260px] max-w-[280px] shrink-0">
                <EventCard event={event} />
              </div>
            ))}
          </ScrollRow>
        </section>
      )}

      {/* Carnival Hubs */}
      {carnivals && carnivals.length > 0 && (
        <section className="px-4 mt-8 space-y-4">
          <h2 className="text-xl font-bold text-foreground">Carnival Hubs</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {carnivals.map((carnival) => (
              <Link
                key={carnival.id}
                to={`/carnivals/${carnival.slug}`}
                className="group block rounded-2xl overflow-hidden border border-border hover:shadow-md transition-all"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  {carnival.image_url ? (
                    <img src={carnival.image_url} alt={carnival.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <CarnivalFallbackImage name={carnival.name} city={carnival.city} country={carnival.country} />
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-foreground">{carnival.name}</h3>
                  <p className="text-xs text-muted-foreground">{carnival.city}, {carnival.country}</p>
                  {carnivalEventCounts && carnivalEventCounts[carnival.id] > 0 && (
                    <p className="text-xs text-primary font-medium mt-1">
                      {carnivalEventCounts[carnival.id]} event{carnivalEventCounts[carnival.id] !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Browse All */}
      <section className="px-4 mt-8 space-y-4">
        <h2 className="text-xl font-bold text-foreground">Browse All Events</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEvents.map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No events found.</p>
        )}
      </section>
    </div>
  );
}

/* ─── Hero Carousel ─── */
function HeroCarousel({ events }: { events: EventWithRelations[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollAmount = container.clientWidth;
    const newPage = dir === "left" ? Math.max(0, page - 1) : Math.min(events.length - 1, page + 1);
    container.scrollTo({ left: scrollAmount * newPage, behavior: "smooth" });
    setPage(newPage);
  };

  return (
    <div className="relative group px-4 py-4">
      <div ref={scrollRef} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 rounded-2xl">
        {events.map((event) => (
          <Link key={event.id} to={`/events/${event.id}`} className="snap-start shrink-0 w-full rounded-2xl overflow-hidden relative aspect-[16/9]">
            {event.image_url ? (
              <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <EventFallbackImage title={event.title} date={event.date} category={event.category} className="!p-0 [&>div:last-child]:hidden" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <p className="text-xs font-medium opacity-80 mb-1">
                {format(new Date(event.date), "EEE").toUpperCase()} {format(new Date(event.date), "MMM d, yyyy")} - {format(new Date(event.date), "h:mm a")}
              </p>
              <h3 className="text-lg font-bold leading-tight">{event.title}</h3>
              <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {event.venue}{event.city ? `, ${event.city}` : ""}{event.state ? `, ${event.state}` : ""}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <button onClick={() => scroll("left")} className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={() => scroll("right")} className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

/* ─── Horizontal Scroll Row ─── */
function ScrollRow({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  return (
    <div className="relative group">
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide">
        {children}
      </div>
      <button onClick={() => scroll("left")} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-8 h-8 rounded-full border border-border bg-background shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button onClick={() => scroll("right")} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-8 h-8 rounded-full border border-border bg-background shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
