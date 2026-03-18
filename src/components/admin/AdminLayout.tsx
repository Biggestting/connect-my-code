import { ReactNode } from "react";
import { useIsAdmin } from "@/hooks/use-admin";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Globe, Calendar, Users, Ticket,
  ShoppingBag, Settings, Shield, ChevronLeft, ShieldAlert, Megaphone, ListOrdered, Fingerprint
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: ShieldAlert, label: "Kill Switches", path: "/admin/kill-switches" },
  { icon: Globe, label: "Carnivals", path: "/admin/carnivals" },
  { icon: Calendar, label: "Events", path: "/admin/events" },
  { icon: Users, label: "Organizers", path: "/admin/organizers" },
  { icon: Megaphone, label: "Org Requests", path: "/admin/organizer-requests" },
  { icon: Ticket, label: "Orders", path: "/admin/orders" },
  { icon: ShoppingBag, label: "Marketplace", path: "/admin/marketplace" },
  { icon: Shield, label: "Users", path: "/admin/users" },
  { icon: Megaphone, label: "Announcements", path: "/admin/announcements" },
  { icon: ListOrdered, label: "Queues", path: "/admin/queues" },
  { icon: Fingerprint, label: "Fraud", path: "/admin/fraud" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Verifying access...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Shield className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-lg font-semibold">Sign in required</p>
        <Button onClick={() => navigate("/auth")} className="rounded-full">Sign In</Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Shield className="w-12 h-12 text-destructive/40" />
        <p className="text-lg font-semibold">Access Denied</p>
        <p className="text-sm text-muted-foreground">You don't have admin privileges.</p>
        <Button onClick={() => navigate("/")} variant="outline" className="rounded-full">
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-border bg-sidebar p-3 gap-0.5">
        <Link to="/" className="flex items-center gap-2 px-3 py-2 mb-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to Ti'Fete
        </Link>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">Admin</p>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border px-2 py-1.5 flex gap-1 overflow-x-auto">
        {navItems.slice(0, 6).map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] min-w-[52px] ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto pb-20 md:pb-0">
        {children}
      </div>
    </div>
  );
}
