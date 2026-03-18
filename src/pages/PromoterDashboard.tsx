import { useAuth } from "@/hooks/use-auth";
import { useMyPromoterStats } from "@/hooks/use-promoters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Megaphone, Ticket, DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PromoterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useMyPromoterStats(user?.id);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Megaphone className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Sign in to view your promoter dashboard</h1>
          <Button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground rounded-full">Sign In</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 pb-24 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!stats || stats.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Megaphone className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold text-foreground">No Promoter Activity</h1>
          <p className="text-sm text-muted-foreground">You haven't been invited as a promoter for any organizer yet.</p>
          <Button onClick={() => navigate("/")} variant="outline" className="rounded-full">Browse Events</Button>
        </div>
      </div>
    );
  }

  // Aggregate totals across all organizers
  const totals = stats.reduce(
    (acc, s) => ({
      tickets: acc.tickets + s.tickets_sold,
      revenue: acc.revenue + s.revenue_generated,
      earned: acc.earned + s.commission_earned,
      paid: acc.paid + (s.commission_paid || 0),
      pending: acc.pending + (s.commission_pending || 0),
    }),
    { tickets: 0, revenue: 0, earned: 0, paid: 0, pending: 0 }
  );

  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Promoter Dashboard</h1>
          <p className="text-xs text-muted-foreground">Your performance across all organizers</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Ticket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totals.tickets}</p>
              <p className="text-xs text-muted-foreground">Tickets Sold</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">${totals.revenue.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Revenue Generated</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">${totals.earned.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Commission Earned</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.length}</p>
              <p className="text-xs text-muted-foreground">Organizers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Breakdown */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold text-foreground text-sm">Commission Breakdown</h2>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Paid</span>
            </div>
            <span className="font-semibold text-foreground">${totals.paid.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Pending</span>
            </div>
            <span className="font-semibold text-foreground">${totals.pending.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Per-Organizer Breakdown */}
      <div className="space-y-3">
        <h2 className="font-semibold text-foreground text-sm">By Organizer</h2>
        {stats.map((s: any) => (
          <Card key={s.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm">
                    {s.organizers?.name || "Organizer"}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">{s.commission_percent}%</Badge>
                </div>
                <Badge className="text-[10px] bg-primary/20 text-primary border-0">
                  {s.invite_status}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-foreground">{s.tickets_sold}</p>
                  <p className="text-[10px] text-muted-foreground">Tickets</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">${s.revenue_generated.toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">Revenue</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">${s.commission_earned.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
