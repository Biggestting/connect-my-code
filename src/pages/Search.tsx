import { useState } from "react";
import { useEvents } from "@/hooks/use-events";
import { EventCard } from "@/components/EventCard";
import { EventCardSkeleton } from "@/components/EventSkeleton";
import { Input } from "@/components/ui/input";
import { CategoryChips } from "@/components/CategoryChips";
import { Search, SlidersHorizontal } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const { data: events, isLoading } = useEvents(category, query);

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events, artists, venues..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 rounded-full bg-muted border-0"
          />
        </div>
        <CategoryChips selected={category} onChange={setCategory} />
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 space-y-2">
            <Search className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No events found</p>
            <p className="text-xs text-muted-foreground">Try a different search or category</p>
          </div>
        )}
      </div>
    </div>
  );
}
