import { useAuth } from "@/hooks/use-auth";
import { useSavedEventIds } from "@/hooks/use-saved-events";
import { useEvents } from "@/hooks/use-events";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SavedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: savedIds, isLoading: savedLoading } = useSavedEventIds();
  const { data: allEvents, isLoading: eventsLoading } = useEvents();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Sign in to see saved items</h1>
          <Button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground rounded-full">Sign In</Button>
        </div>
      </div>
    );
  }

  const isLoading = savedLoading || eventsLoading;
  const savedEvents = allEvents?.filter((e) => savedIds?.has(e.id)) || [];

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold text-foreground mb-4">Saved</h1>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : savedEvents.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No saved events yet</p>
          <Button onClick={() => navigate("/")} variant="outline" className="rounded-full">Browse Events</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {savedEvents.map((event) => <EventCard key={event.id} event={event} />)}
        </div>
      )}
    </div>
  );
}
