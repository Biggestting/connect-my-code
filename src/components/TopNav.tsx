import { Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
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
    <header className="hidden md:flex sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-extrabold">
              <span className="gradient-primary bg-clip-text text-transparent">Ti'Fete</span>
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.path + link.label}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground",
                  pathname === link.path ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/search" className="text-muted-foreground hover:text-foreground transition-colors">
            <Search className="h-5 w-5" />
          </Link>
          {user ? (
            <ProfileSwitcher />
          ) : (
            <Link
              to="/auth"
              className="gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
