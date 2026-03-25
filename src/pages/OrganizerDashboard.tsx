import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useOrganizerByUserId, useOrganizerEvents } from "@/hooks/use-organizer";
import { useOrganizerRecentActivity } from "@/hooks/use-organizer-activity";
import { useNavigate, Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import {
  BarChart3, Calendar, Ticket, Settings, Plus,
  TrendingUp, DollarSign, Eye, Megaphone, Package, ShoppingBag, Pencil, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PromotersTab } from "@/components/dashboard/PromotersTab";
import { SettingsTab } from "@/components/dashboard/SettingsTab";
import { InventoryTab } from "@/components/dashboard/InventoryTab";
import { ProductsTab } from "@/components/dashboard/ProductsTab";
import { EventFallbackImage } from "@/components/EventFallbackImage";

type Tab = "overview" | "events" | "inventory" | "products" | "carnivals" | "insights" | "promoters" | "settings";

const sidebarItems: { key: Tab; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "events", label: "Events", icon: Calendar },
  { key: "inventory", label: "Inventory", icon: Package },
  { key: "products", label: "Products", icon: ShoppingBag },
  { key: "promoters", label: "Promoters", icon: Megaphone },
  { key: "carnivals", label: "Carnivals", icon: TrendingUp },
  { key: "insights", label: "Insights", icon: Eye },
  { key: "settings", label: "Settings", icon: Settings },
];

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: organizer, isLoading: orgLoading } = useOrganizerByUserId(user?.id);
  const { data: events } = useOrganizerEvents(organizer?.id);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const upcomingEvents = events?.filter((e) => new Date(e.date) >= new Date()) || [];
  const pastEvents = events?.filter((e) => new Date(e.date) < new Date()) || [];
  const totalEvents = events?.length || 0;

  const totalTicketsSold = events?.reduce((sum, e) => {
    return sum + (e.ticket_tiers?.reduce((s, t) => s + t.sold_count, 0) || 0);
  }, 0) || 0;

  const grossSales = events?.reduce((sum, e) => {
    return sum + (e.ticket_tiers?.reduce((s, t) => s + (Number(t.price) * t.sold_count), 0) || 0);
  }, 0) || 0;

  const carnivalMap = new Map<string, { name: string; year: number | null; events: typeof events }>();
  (events?.filter((e) => e.carnival_id) || []).forEach((e) => {
    const key = e.carnival_id!;
    if (!carnivalMap.has(key)) {
      carnivalMap.set(key, { name: e.carnivals?.name || "Unknown", year: e.carnival_year, events: [] });
    }
    carnivalMap.get(key)!.events!.push(e);
  });

  const tools = [
    { icon: Plus, label: "Create Event", path: "/dashboard/create-event" },
  ];

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-lg font-semibold text-foreground mb-2">Sign in to access dashboard</p>
        <Button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground rounded-full">Sign In</Button>
      </div>
    );
  }

  if (orgLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-muted-foreground">Loading dashboard...</div></div>;
  }

  if (!organizer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <p className="text-lg font-semibold text-foreground mb-1">No organizer account found</p>
        <p className="text-sm text-muted-foreground mb-4">You need an organizer account to access the dashboard.</p>
        <Button onClick={() => navigate("/")} variant="outline" className="rounded-full">Back to Discover</Button>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8">
      <div className="md:flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-60 border-r border-border min-h-[calc(100vh-4rem)] p-4 space-y-1">
          <p className="text-sm font-bold text-foreground mb-4 px-2">Dashboard</p>
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2.5 ${
                activeTab === item.key
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </aside>

        {/* Mobile Tabs */}
        <div className="md:hidden border-b border-border px-2 flex gap-1 overflow-x-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === item.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex-1 w-full max-w-7xl mx-auto">
          {/* Organizer Header */}
          <section className="px-4 py-5 border-b border-border">
            <h1 className="text-xl font-bold text-foreground">{organizer.name}</h1>
            <p className="text-sm text-muted-foreground">Organizer Dashboard</p>
          </section>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <OverviewTab
              upcomingEvents={upcomingEvents}
              totalTicketsSold={totalTicketsSold}
              grossSales={grossSales}
              totalEvents={totalEvents}
              tools={tools}
              navigate={navigate}
              setActiveTab={setActiveTab}
              organizerId={organizer.id}
              eventIds={(events || []).map((e) => e.id)}
            />
          )}

          {activeTab === "events" && (
            <EventsTab events={events || []} navigate={navigate} />
          )}

          {activeTab === "inventory" && (
            <InventoryTab events={events || []} />
          )}

          {activeTab === "products" && organizer && (
            <div className="px-4 py-5">
              <ProductsTab events={events || []} organizerId={organizer.id} />
            </div>
          )}

          {activeTab === "promoters" && organizer && (
            <PromotersTab organizerId={organizer.id} organizerSlug={organizer.slug} />
          )}

          {activeTab === "carnivals" && (
            <CarnivalsTab carnivalMap={carnivalMap} />
          )}

          {activeTab === "insights" && (
            <InsightsTab events={events || []} />
          )}

          {activeTab === "settings" && organizer && (
            <SettingsTab organizer={organizer} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Tab Components ─── */

function OverviewTab({ upcomingEvents, totalTicketsSold, grossSales, totalEvents, tools, navigate, setActiveTab, organizerId, eventIds }: any) {
  const { data: recentActivity, isLoading: activityLoading } = useOrganizerRecentActivity(organizerId, eventIds);

  return (
    <>
      <section className="px-4 py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Calendar} label="Active Events" value={upcomingEvents.length} />
          <StatCard icon={Ticket} label="Tickets Sold" value={totalTicketsSold} />
          <StatCard icon={DollarSign} label="Gross Sales" value={`$${grossSales.toLocaleString()}`} />
          <StatCard icon={Eye} label="Total Events" value={totalEvents} />
        </div>
      </section>
      <Separator />
      <section className="px-4 py-5 md:hidden">
        <h2 className="text-base font-bold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2">
          {tools.map((tool: any) => (
            <button
              key={tool.label}
              onClick={() => navigate(tool.path)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted hover:bg-border transition-colors"
            >
              <tool.icon className="w-5 h-5 text-primary" />
              <span className="text-[11px] font-medium text-foreground text-center">{tool.label}</span>
            </button>
          ))}
          <button
            onClick={() => setActiveTab("products")}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted hover:bg-border transition-colors"
          >
            <ShoppingBag className="w-5 h-5 text-primary" />
            <span className="text-[11px] font-medium text-foreground text-center">Create Product</span>
          </button>
        </div>
      </section>
      <Separator />
      <section className="px-4 py-5">
        <h2 className="text-base font-bold text-foreground mb-3">Recent Activity</h2>
        {activityLoading ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground animate-pulse">Loading activity...</p>
          </div>
        ) : recentActivity && recentActivity.length > 0 ? (
          <div className="space-y-2">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Ticket className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Ticket sales and promo usage will appear here.</p>
          </div>
        )}
      </section>
    </>
  );
}

function EventsTab({ events, navigate }: { events: any[]; navigate: any }) {
  const upcoming = events.filter((e) => new Date(e.date) >= new Date());
  const past = events.filter((e) => new Date(e.date) < new Date());

  return (
    <div className="px-4 py-5 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">All Events ({events.length})</h2>
        <Button onClick={() => navigate("/dashboard/create-event")} size="sm" className="rounded-full gap-1">
          <Plus className="w-4 h-4" /> New Event
        </Button>
      </div>

      {upcoming.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Upcoming ({upcoming.length})</p>
          <div className="space-y-2">
            {upcoming.map((event) => <EventRow key={event.id} event={event} />)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Past ({past.length})</p>
          <div className="space-y-2">
            {past.map((event) => <EventRow key={event.id} event={event} showPastBadge />)}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No events created yet.</p>
          <Button onClick={() => navigate("/dashboard/create-event")} className="mt-3 gradient-primary text-primary-foreground rounded-full" size="sm">
            <Plus className="w-4 h-4 mr-1" /> Create Event
          </Button>
        </div>
      )}
    </div>
  );
}

function CarnivalsTab({ carnivalMap }: { carnivalMap: Map<string, any> }) {
  return (
    <div className="px-4 py-5">
      <h2 className="text-base font-bold text-foreground mb-3">Carnival Associations</h2>
      {carnivalMap.size > 0 ? (
        <div className="space-y-2">
          {Array.from(carnivalMap.entries()).map(([id, data]) => (
            <div key={id} className="p-4 rounded-xl border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">{data.name}</p>
                {data.year && <Badge variant="secondary" className="text-[10px]">{data.year}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {data.events.length} linked event{data.events.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-1.5">
                {data.events.map((e: any) => (
                  <Link key={e.id} to={`/events/${e.id}`} className="block text-xs text-primary hover:underline truncate">
                    {e.title} — {format(new Date(e.date), "MMM d, yyyy")}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <TrendingUp className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No events are associated with a carnival yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Link events to carnivals when creating or editing them.</p>
        </div>
      )}
    </div>
  );
}

function InsightsTab({ events }: { events: any[] }) {
  const eventsWithRevenue = events.map((e) => ({
    ...e,
    revenue: e.ticket_tiers?.reduce((s: number, t: any) => s + (Number(t.price) * t.sold_count), 0) || 0,
    ticketsSold: e.ticket_tiers?.reduce((s: number, t: any) => s + t.sold_count, 0) || 0,
  }));

  const totalRevenue = eventsWithRevenue.reduce((s, e) => s + e.revenue, 0);
  const totalTickets = eventsWithRevenue.reduce((s, e) => s + e.ticketsSold, 0);
  const avgTicketPrice = totalTickets > 0 ? totalRevenue / totalTickets : 0;

  const topByRevenue = [...eventsWithRevenue].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const topByTickets = [...eventsWithRevenue].sort((a, b) => b.ticketsSold - a.ticketsSold).slice(0, 5);

  return (
    <div className="px-4 py-5 space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={DollarSign} label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} />
        <StatCard icon={Ticket} label="Total Tickets" value={totalTickets} />
        <StatCard icon={TrendingUp} label="Avg Price" value={`$${avgTicketPrice.toFixed(0)}`} />
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-bold text-foreground mb-2">Top Events by Revenue</h3>
        {topByRevenue.length > 0 ? (
          <div className="space-y-2">
            {topByRevenue.map((event, i) => (
              <div key={event.id} className="flex items-center gap-3 p-2">
                <span className="text-sm font-bold text-muted-foreground w-6 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.ticketsSold} tickets</p>
                </div>
                <p className="text-sm font-bold text-foreground">${event.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No data yet.</p>
        )}
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-bold text-foreground mb-2">Top Events by Tickets Sold</h3>
        {topByTickets.length > 0 ? (
          <div className="space-y-2">
            {topByTickets.map((event, i) => (
              <div key={event.id} className="flex items-center gap-3 p-2">
                <span className="text-sm font-bold text-muted-foreground w-6 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">${event.revenue.toLocaleString()} revenue</p>
                </div>
                <p className="text-sm font-bold text-foreground">{event.ticketsSold}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No data yet.</p>
        )}
      </div>
    </div>
  );
}

/* ─── Shared Components ─── */

function PublishingStatusBadge({ status }: { status?: string }) {
  switch (status) {
    case "draft":
      return <Badge variant="outline" className="text-[10px] border-muted-foreground/40 text-muted-foreground">Draft</Badge>;
    case "scheduled":
      return <Badge variant="secondary" className="text-[10px] bg-accent text-accent-foreground">Scheduled</Badge>;
    default:
      return <Badge variant="default" className="text-[10px]">Published</Badge>;
  }
}

function EventRow({ event, showPastBadge }: { event: any; showPastBadge?: boolean }) {
  const pubStatus = event.publishing_status || "published";
  const carnivalName = event.carnivals?.name;
  return (
    <div className="rounded-xl border border-border hover:shadow-sm transition-all">
      <div className="flex items-center gap-3 p-3">
        <Link to={`/events/${event.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <EventFallbackImage
                title={event.title}
                date={event.date}
                location={[event.venue, event.city].filter(Boolean).join(", ")}
                category={event.category}
                className="text-[6px] p-1"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{event.title}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(event.date), "MMM d, yyyy")}</p>
            {carnivalName && (
              <p className="text-[10px] text-primary font-medium mt-0.5">🎭 {carnivalName}{event.carnival_year ? ` ${event.carnival_year}` : ""}</p>
            )}
          </div>
        </Link>
        <div className="text-right shrink-0 flex flex-col items-end gap-1">
          <p className="text-xs font-medium text-foreground">
            {event.ticket_tiers?.reduce((s: number, t: any) => s + t.sold_count, 0) || 0} sold
          </p>
          <PublishingStatusBadge status={pubStatus} />
          {showPastBadge && <Badge variant="outline" className="text-[10px]">Past</Badge>}
        </div>
        <Link
          to={`/dashboard/edit-event/${event.id}`}
          className="w-8 h-8 rounded-full bg-muted hover:bg-border flex items-center justify-center shrink-0 transition-colors"
          title="Edit event"
        >
          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
        </Link>
      </div>
      {pubStatus === "draft" && (
        <div className="px-3 pb-2.5">
          <p className="text-[10px] font-semibold text-destructive uppercase tracking-wide">
            ⚠ Drafts cannot be published from iOS app
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="p-3 rounded-xl border border-border">
      <Icon className="w-4 h-4 text-primary mb-1" />
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
