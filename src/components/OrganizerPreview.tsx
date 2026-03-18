import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useIsFollowing, useToggleFollow } from "@/hooks/use-follows";
import { useAuth } from "@/hooks/use-auth";
import type { Organizer } from "@/types";

interface OrganizerPreviewProps {
  organizer: Organizer;
  onFollowToggle?: () => void;
}

export function OrganizerPreview({ organizer }: OrganizerPreviewProps) {
  const { user } = useAuth();
  const { data: isFollowing } = useIsFollowing(organizer.id);
  const toggleFollow = useToggleFollow();

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
      <Link to={`/organizers/${organizer.slug}`}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={organizer.logo_url || undefined} />
          <AvatarFallback>{organizer.name.charAt(0)}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/organizers/${organizer.slug}`} className="font-semibold text-sm text-foreground hover:underline">
          {organizer.name}
        </Link>
        <p className="text-xs text-muted-foreground">{organizer.follower_count} followers</p>
      </div>
      {user && (
        <Button
          size="sm"
          variant={isFollowing ? "outline" : "default"}
          className="rounded-full text-xs"
          onClick={() => toggleFollow.mutate({ organizerId: organizer.id, isFollowing: isFollowing ?? false })}
        >
          {isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  );
}
