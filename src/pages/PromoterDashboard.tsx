import { useAuth } from "@/hooks/use-auth";
import { useMyPromoterStats } from "@/hooks/use-promoters";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Trophy, Ticket, DollarSign, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

export default function PromoterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: promoterStats, isLoading } = useMyPromoterStats(user?.id);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-lg font-semibold text-foreground mb-2">Sign in first</p>
        <Button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground rounded-full">Sign In</Button>
      </div>
    );
  }

  const totalTickets = promoterStats?.reduce((s, p) => s + p.tickets_sold, 0) || 0;
  const totalRevenue = promoterStats?.reduce((s, p) => s + p.revenue_generated, 0) || 0;
  const totalCommission = promoterStats?.reduce((s, p) => s + p.commission_earned, 0) || 0;
  const totalPending = promoterStats?.reduce((s, p) => s + (p.commission_pending || 0), 0) || 0;
  const totalPaid = promoterStats?.reduce((s, p) => s + (p.commission_paid || 0), 0) || 0;

  return (
    <div className="pb-20 md:pb-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <Link to="/profile" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-lg font-bold text-foreground">My Promoter Dashboard</h1>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      )}

      {!isLoading && (!promoterStats || promoterStats.length === 0) && (
        <div className="text-center py-12 px-4">
          <Trophy className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground mb-1">Not a promoter yet</p>
          <p className="text-sm text-muted-foreground">You haven't been added as a promoter for any organizer yet.</p>
        </div>
      )}

      {promoterStats && promoterStats.length > 0 && (
        <>
          {/* Overall Stats */}
          <section className="px-4 py-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-border text-center">
                <Ticket className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{totalTickets}</p>
                <p className="text-[10px] text-muted-foreground">Tickets Sold</p>
              </div>
              <div className="p-3 rounded-xl border border-border text-center">
                <DollarSign className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Revenue Generated</p>
              </div>
              <div className="p-3 rounded-xl border border-border text-center">
                <Trophy className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">${totalCommission.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Commission Earned</p>
              </div>
            </div>
          </section>

          {/* Payout Summary */}
          <section className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-xl border border-border">
                <Clock className="w-4 h-4 text-yellow-500 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-sm font-bold text-foreground">${totalPending.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl border border-border">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="text-sm font-bold text-foreground">${totalPaid.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Per-Organizer Breakdown */}
          <section className="px-4 py-5 space-y-4">
            <h2 className="text-sm font-bold text-foreground">By Organizer</h2>
            {promoterStats.map((stat: any) => (
              <div key={stat.id} className="p-4 rounded-xl border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{stat.organizers?.name || "Unknown"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px]">{stat.promo_code}</Badge>
                      <span className="text-xs text-muted-foreground">{stat.commission_percent}% commission</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Tickets</p>
                    <p className="font-bold text-foreground">{stat.tickets_sold}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="font-bold text-foreground">${stat.revenue_generated.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Commission</p>
                    <p className="font-bold text-foreground">${stat.commission_earned.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
