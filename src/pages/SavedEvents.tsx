import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSavedEvents } from "@/hooks/use-saved-events";
import { EventCard } from "@/components/EventCard";
import { EventCardSkeleton } from "@/components/EventSkeleton";
import { Button } from "@/components/ui/button";

export default function SavedEvents() {
  const { user } = useAuth();
  const { data: events, isLoading } = useSavedEvents();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Heart className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <p className="text-lg font-semibold text-foreground mb-1">Sign in to see saved events</p>
        <p className="text-sm text-muted-foreground mb-4">Save events you're interested in.</p>
        <Button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground rounded-full">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8 max-w-7xl mx-auto w-full">
      <div className="px-4 py-5">
        <h1 className="text-xl font-bold text-foreground mb-4">Saved Events</h1>
        {isLoading ? (
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
            <Heart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium text-foreground">No saved events yet</p>
            <p className="text-sm text-muted-foreground mt-1">Tap the heart on events you like!</p>
            <Button onClick={() => navigate("/")} variant="outline" className="mt-4 rounded-full">
              Discover Events
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
