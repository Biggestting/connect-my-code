import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminStats } from "@/hooks/use-admin";
import {
  Calendar, Ticket, DollarSign, Users, TrendingUp,
  ShoppingBag, BarChart3, Globe
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Link } from "react-router-dom";

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  const { data: topEvents } = useQuery({
    queryKey: ["admin-top-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, date, ticket_tiers(price, sold_count)")
        .order("date", { ascending: false })
        .limit(10);
      return (data || []).map((e: any) => ({
        ...e,
        revenue: e.ticket_tiers?.reduce((s: number, t: any) => s + Number(t.price) * t.sold_count, 0) || 0,
        ticketsSold: e.ticket_tiers?.reduce((s: number, t: any) => s + t.sold_count, 0) || 0,
      })).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("purchases")
        .select("id, total_amount, created_at, status, events(title)")
        .order("created_at", { ascending: false })
        .limit(8);
      return data || [];
    },
  });

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-6xl">
        <h1 className="text-xl font-bold text-foreground mb-1">Platform Dashboard</h1>
        <p className="text-sm text-muted-foreground mb-5">Ti'Fete admin overview</p>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl border border-border animate-pulse bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={DollarSign} label="Total Revenue" value={`$${(stats?.totalRevenue || 0).toLocaleString()}`} sub={`$${(stats?.todayRevenue || 0).toLocaleString()} today`} />
            <StatCard icon={Ticket} label="Tickets Sold" value={stats?.totalTicketsSold || 0} sub={`${stats?.todayTickets || 0} today`} />
            <StatCard icon={Calendar} label="Total Events" value={stats?.totalEvents || 0} sub={`${stats?.activeEvents || 0} active`} />
            <StatCard icon={Users} label="Organizers" value={stats?.totalOrganizers || 0} />
            <StatCard icon={TrendingUp} label="Users" value={stats?.totalUsers || 0} />
            <StatCard icon={ShoppingBag} label="Active Listings" value={stats?.activeListings || 0} />
            <StatCard icon={BarChart3} label="Platform Fee" value="10%" sub="Default rate" />
            <StatCard icon={Globe} label="Active Events" value={stats?.activeEvents || 0} />
          </div>
        )}

        <Separator className="my-6" />

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Events */}
          <div>
            <h2 className="text-base font-bold text-foreground mb-3">Top Events by Revenue</h2>
            <div className="space-y-2">
              {topEvents?.map((event: any, i: number) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-bold text-muted-foreground w-6 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.ticketsSold} tickets</p>
                  </div>
                  <p className="text-sm font-bold text-foreground">${event.revenue.toLocaleString()}</p>
                </Link>
              ))}
              {(!topEvents || topEvents.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-6">No events yet.</p>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div>
            <h2 className="text-base font-bold text-foreground mb-3">Recent Orders</h2>
            <div className="space-y-2">
              {recentOrders?.map((order: any) => (
                <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{order.events?.title || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">${Number(order.total_amount).toLocaleString()}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      order.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
              {(!recentOrders || recentOrders.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-6">No orders yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
