import { useAuth } from "@/hooks/use-auth";
import { useMyOrganizerRequests } from "@/hooks/use-organizer-requests";
import { useActiveProfile } from "@/hooks/use-active-profile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User, Ticket, Heart, Settings, LogOut, ChevronRight,
  Shield, HelpCircle, FileText, Bell, Megaphone
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const menuItems = [
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Ticket, label: "My Tickets", path: "/tickets" },
  { icon: Heart, label: "Saved", path: "/saved" },
  { icon: Bell, label: "Price Alerts", path: "/saved" },
  { icon: Settings, label: "Settings", path: "/account" },
];

const legalItems = [
  { icon: FileText, label: "Terms of Service", path: "/terms" },
  { icon: Shield, label: "Privacy Policy", path: "/privacy" },
  { icon: HelpCircle, label: "Accessibility", path: "/accessibility" },
];

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const { isOrganizerMode } = useActiveProfile();
  const navigate = useNavigate();
  const { data: myRequests } = useMyOrganizerRequests(user?.id);

  const latestRequest = myRequests?.[0];
  const hasPendingRequest = latestRequest?.status === "pending";
  const hasApprovedRequest = latestRequest?.status === "approved";
  const showOrganizerCTA = !isOrganizerMode && !hasApprovedRequest;

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <User className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Sign in to your account</h1>
          <Button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground rounded-full">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto space-y-6">
      {/* Profile Header */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="gradient-primary text-primary-foreground text-lg font-bold">
            {user.email?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground">Personal account</p>
        </div>
      </div>

      {/* Become an Organizer CTA */}
      {showOrganizerCTA && (
        <Link
          to="/request-organizer"
          className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Become an Organizer</p>
            <p className="text-xs text-muted-foreground">
              {hasPendingRequest ? "Your application is under review" : "List and sell tickets for your events"}
            </p>
          </div>
          {hasPendingRequest ? (
            <Badge variant="secondary" className="text-xs">Pending</Badge>
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </Link>
      )}

      {/* Menu */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        {menuItems.map((item, i) => (
          <Link
            key={item.path + item.label}
            to={item.path}
            className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
          >
            <item.icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground flex-1">{item.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>

      {/* Legal */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        {legalItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
          >
            <item.icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground flex-1">{item.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={handleSignOut}
        className="w-full rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}
