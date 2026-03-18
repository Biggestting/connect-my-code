import { Clock } from "lucide-react";

interface ReservationTimerProps {
  timeLeft: number;
}

export function ReservationTimer({ timeLeft }: ReservationTimerProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLow = timeLeft <= 60;

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${isLow ? "text-destructive" : "text-amber-600"}`}>
      <Clock className="h-3.5 w-3.5" />
      <span>{minutes}:{String(seconds).padStart(2, "0")} remaining</span>
    </div>
  );
}
