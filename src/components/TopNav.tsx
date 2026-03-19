import { Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import tifeteLogo from "@/assets/tifete-logo.png";
import { useAuth } from "@/hooks/use-auth";
import { useActiveProfile } from "@/hooks/use-active-profile";
import { ProfileSwitcher } from "@/components/ProfileSwitcher";

export function TopNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { isOrganizerMode } = useActiveProfile();

  const links = isOrganizerMode
    ? [
        { label: "Dashboard", path: "/dashboard" },
        { label: "Events", path: "/dashboard" },
        { label: "Account", path: "/account" },
      ]
    : [
        { label: "Discover", path: "/" },
        { label: "Saved", path: "/saved" },
        { label: "Purchases", path: "/tickets" },
        { label: "Account", path: "/account" },
      ];

  return (
    <header className="hidden md:block sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0">
          <img src={tifeteLogo} alt="Ti'Fete" className="h-10 w-auto" />
        </Link>

        {/* Center nav links */}
        <nav className="flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.path + link.label}
              to={link.path}
              className={cn(
                "text-sm font-semibold transition-colors hover:text-primary",
                pathname === link.path
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <ProfileSwitcher />
          ) : (
            <Link
              to="/auth"
              className="gradient-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
