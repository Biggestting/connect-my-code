import { useParams, Link, useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import { useOrganizer, useOrganizerEvents } from "@/hooks/use-organizer";
import { useAuth } from "@/hooks/use-auth";
import { useIsFollowing, useToggleFollow } from "@/hooks/use-follows";
import { EventCard } from "@/components/EventCard";
import { EventCardSkeleton } from "@/components/EventSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function OrganizerProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { data: organizer, isLoading } = useOrganizer(slug!);
  const { data: events, isLoading: eventsLoading } = useOrganizerEvents(organizer?.id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: isFollowing } = useIsFollowing(organizer?.id);
  const toggleFollow = useToggleFollow();

  const handleFollow = () => {
    if (!user) { toast.error("Sign in to follow organizers"); navigate("/auth"); return; }
    if (!organizer) return;
    toggleFollow.mutate({ organizerId: organizer.id, isFollowing: isFollowing ?? false });
  };

  if (isLoading) {
    return (
      <div className="pb-20 md:pb-8 animate-pulse px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded w-40" />
            <div className="h-4 bg-muted rounded w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-lg font-semibold text-foreground">Organizer not found</p>
        <Link to="/" className="mt-4 text-accent text-sm font-medium">Back to Discover</Link>
      </div>
    );
  }

  const upcomingEvents = events?.filter((e) => new Date(e.date) >= new Date()) || [];
  const pastEvents = events?.filter((e) => new Date(e.date) < new Date()) || [];

  return (
    <div className="pb-20 md:pb-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <section className="px-4 py-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={organizer.logo_url || undefined} alt={organizer.name} />
            <AvatarFallback className="bg-muted text-2xl font-bold text-muted-foreground">
              {organizer.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{organizer.name}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span>{organizer.follower_count.toLocaleString()} followers</span>
              <span>{organizer.events_count} events</span>
              <span>{organizer.years_hosting}y hosting</span>
            </div>
          </div>
        </div>
        {organizer.bio && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{organizer.bio}</p>
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
      </section>

      <Separator />

      {/* Upcoming Events */}
      <section className="px-4 py-5">
        <h2 className="text-base font-bold text-foreground mb-4">Upcoming Events</h2>
        {eventsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No upcoming events.</p>
        )}
      </section>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <>
          <Separator />
          <section className="px-4 py-5">
            <h2 className="text-base font-bold text-foreground mb-4">Past Events</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
