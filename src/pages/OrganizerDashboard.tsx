import { useAuth } from "@/hooks/use-auth";
import { useActiveProfile } from "@/hooks/use-active-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Ticket, DollarSign, ArrowLeft } from "lucide-react";
import { PromotersSection } from "@/components/PromotersSection";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const { activeProfile, isOrganizerMode } = useActiveProfile();
  const navigate = useNavigate();
  const organizerId = activeProfile.organizerId;

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", organizerId],
    queryFn: async () => {
      if (!organizerId) return null;
      const eventsRes = await supabase.from("events").select("id", { count: "exact" }).eq("organizer_id", organizerId);
      const eventIds = (eventsRes.data || []).map(e => e.id);
      let totalRevenue = 0;
      let totalSales = 0;
      if (eventIds.length > 0) {
        const purchasesRes = await supabase.from("purchases").select("total_amount").in("event_id", eventIds);
        totalSales = purchasesRes.data?.length || 0;
        totalRevenue = (purchasesRes.data || []).reduce((s, p) => s + Number(p.total_amount), 0);
      }
      return { totalEvents: eventsRes.count || 0, totalSales, totalRevenue };
    },
    enabled: !!organizerId,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Sign in to access dashboard</h1>
          <Button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground rounded-full">Sign In</Button>
        </div>
      </div>
    );
  }

  if (!isOrganizerMode || !organizerId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold text-foreground">No Organizer Profile</h1>
          <p className="text-sm text-muted-foreground">Switch to an organizer profile or request access.</p>
          <Button onClick={() => navigate("/request-organizer")} className="gradient-primary text-primary-foreground rounded-full">
            Request Organizer Access
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground">{activeProfile.organizerName}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalEvents}</p>
                <p className="text-xs text-muted-foreground">Events</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Ticket className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalSales}</p>
                <p className="text-xs text-muted-foreground">Sales</p>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">${stats.totalRevenue.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <PromotersSection organizerId={organizerId} />
    </div>
  );
}
