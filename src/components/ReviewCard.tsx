import { Star } from "lucide-react";
import type { Review } from "@/types";

interface ReviewCardProps {
  review: Review & { review_responses?: any[] };
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="p-3 rounded-xl bg-card border border-border space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{review.user_name}</span>
      </div>
      {review.text && <p className="text-sm text-foreground">{review.text}</p>}
      {review.review_responses?.map((resp: any) => (
        <div key={resp.id} className="ml-4 mt-2 p-2 rounded-lg bg-muted text-xs text-muted-foreground">
          <span className="font-medium">Organizer reply:</span> {resp.text}
        </div>
      ))}
    </div>
  );
}
