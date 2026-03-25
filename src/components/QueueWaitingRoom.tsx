import { useEffect, useState } from "react";
import { Users, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface QueueWaitingRoomProps {
  position: number;
  totalWaiting: number;
  isWaiting: boolean;
  onJoinQueue: () => void;
  isJoining: boolean;
  eventTitle: string;
}

export function QueueWaitingRoom({
  position,
  totalWaiting,
  isWaiting,
  onJoinQueue,
  isJoining,
  eventTitle,
}: QueueWaitingRoomProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isWaiting) return;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 600);
    return () => clearInterval(interval);
  }, [isWaiting]);

  const estimatedMinutes = Math.max(1, Math.ceil(position / 20) * 0.5);
  const progressPercent = totalWaiting > 0 ? Math.max(5, ((totalWaiting - position + 1) / totalWaiting) * 100) : 5;

  if (!isWaiting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Users className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">High Demand Event</h2>
        <p className="text-sm text-muted-foreground mb-1 max-w-xs">
          <span className="font-semibold text-foreground">{eventTitle}</span> is experiencing high traffic.
        </p>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Join the queue to secure your spot. You'll be admitted to checkout in order.
        </p>
        <Button
          onClick={onJoinQueue}
          disabled={isJoining}
          className="gradient-primary text-primary-foreground font-semibold rounded-full px-8 h-12"
        >
          {isJoining ? "Joining..." : "Join Queue"}
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          <Users className="w-3 h-3 inline mr-1" />
          {totalWaiting} people waiting
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <Zap className="w-10 h-10 text-primary" />
        </div>
        <div className="absolute inset-0 w-24 h-24 rounded-full border-2 border-primary/30 animate-ping" />
      </div>

      <h2 className="text-xl font-bold text-foreground mb-1">You're in the queue{dots}</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Stay on this page. You'll be automatically admitted to checkout when it's your turn.
      </p>

      <div className="w-full max-w-xs rounded-2xl border border-border bg-muted/30 p-5 space-y-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-primary tabular-nums">#{position}</p>
          <p className="text-xs text-muted-foreground mt-1">Your position</p>
        </div>

        <Progress value={progressPercent} className="h-2" />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {totalWaiting} ahead
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> ~{estimatedMinutes} min
          </span>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground mt-6 max-w-[280px]">
        Don't close this page. Users are admitted in batches every 30 seconds.
        Your items will be reserved once you're in.
      </p>
    </div>
  );
}
