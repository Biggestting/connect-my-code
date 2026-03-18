import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QueueWaitingRoomProps {
  position?: number;
  waitingCount: number;
  isWaiting: boolean;
  onJoinQueue: () => void;
  isJoining: boolean;
  eventTitle: string;
}

export function QueueWaitingRoom({ position, waitingCount, isWaiting, onJoinQueue, isJoining, eventTitle }: QueueWaitingRoomProps) {
  if (isWaiting) {
    return (
      <div className="text-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <h3 className="text-lg font-bold text-foreground">You're in the queue</h3>
        <p className="text-sm text-muted-foreground">
          Position: {position || "—"} · {waitingCount} people waiting
        </p>
        <p className="text-xs text-muted-foreground">
          You'll be admitted automatically. Please keep this page open.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-12 space-y-4">
      <h3 className="text-lg font-bold text-foreground">High demand for {eventTitle}</h3>
      <p className="text-sm text-muted-foreground">
        Join the queue to secure your spot in checkout.
      </p>
      <Button onClick={onJoinQueue} disabled={isJoining} className="gradient-primary text-primary-foreground rounded-full">
        {isJoining ? "Joining..." : "Join Queue"}
      </Button>
    </div>
  );
}
