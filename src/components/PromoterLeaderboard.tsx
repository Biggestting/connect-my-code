import { usePromoterSales, type PromoterWithStats } from "@/hooks/use-promoters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award } from "lucide-react";

const rankIcons = [Trophy, Medal, Award];
const rankColors = ["text-yellow-500", "text-zinc-400", "text-amber-600"];

export function PromoterLeaderboard({ organizerId }: { organizerId: string }) {
  const { data: promoters, isLoading } = usePromoterSales(organizerId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">Promoter Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </CardContent>
      </Card>
    );
  }

  if (!promoters || promoters.length === 0) return null;

  // Only show promoters with at least some activity or top 10
  const top = promoters.slice(0, 10);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <CardTitle className="text-base font-semibold text-foreground">Promoter Leaderboard</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {top.map((p) => {
          const RankIcon = p.rank && p.rank <= 3 ? rankIcons[p.rank - 1] : null;
          const rankColor = p.rank && p.rank <= 3 ? rankColors[p.rank - 1] : "";

          return (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
            >
              {/* Rank */}
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                {RankIcon ? (
                  <RankIcon className={`h-4 w-4 ${rankColor}`} />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">#{p.rank}</span>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.display_name}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{p.promo_code}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-right shrink-0">
                <div>
                  <p className="text-sm font-bold text-foreground">{p.tickets_sold}</p>
                  <p className="text-[10px] text-muted-foreground">Tickets</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">${p.revenue_generated.toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">Revenue</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">${p.commission_earned.toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">Commission</p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
