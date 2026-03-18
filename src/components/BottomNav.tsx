import { Home, Heart, ShoppingBag, User, LayoutDashboard, QrCode } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useActiveProfile } from "@/hooks/use-active-profile";

const userNavItems = [
  { icon: Home, label: "Discover", path: "/" },
  { icon: Heart, label: "Saved", path: "/saved" },
  { icon: ShoppingBag, label: "Purchases", path: "/tickets" },
  { icon: User, label: "Account", path: "/account" },
];

const organizerNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: QrCode, label: "Scan", path: "/dashboard" },
  { icon: User, label: "Account", path: "/account" },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const { isOrganizerMode } = useActiveProfile();
  const navItems = isOrganizerMode ? organizerNavItems : userNavItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path + item.label}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
