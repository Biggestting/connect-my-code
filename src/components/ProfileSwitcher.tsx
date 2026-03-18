import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useActiveProfile } from "@/hooks/use-active-profile";
import { useIsAdmin } from "@/hooks/use-admin";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, Check, User, Building2, Loader2, ShieldCheck } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export function ProfileSwitcher() {
  const { user } = useAuth();
  const { activeProfile, switchToUser, switchToOrganizer, userOrganizers, isLoadingOrganizers } = useActiveProfile();
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [switching, setSwitching] = useState<{ to: string; label: string } | null>(null);

  const handleSwitchToUser = () => {
    if (activeProfile.type === "user") return;
    setSwitching({ to: "user", label: "Personal" });
    setTimeout(() => {
      switchToUser();
      if (location.pathname.startsWith("/dashboard")) {
        navigate("/");
      }
      setTimeout(() => setSwitching(null), 400);
    }, 500);
  };

  const handleSwitchToOrganizer = (organizerId: string, name: string, slug: string) => {
    if (activeProfile.organizerId === organizerId) return;
    setSwitching({ to: "organizer", label: `@${slug}` });
    setTimeout(() => {
      switchToOrganizer(organizerId, name, slug);
      if (!location.pathname.startsWith("/dashboard")) {
        navigate("/dashboard");
      }
      setTimeout(() => setSwitching(null), 400);
    }, 500);
  };

  if (!user) return null;
  if (isLoadingOrganizers) return null;
  if (!userOrganizers?.length && !isAdmin) return null;

  return (
    <>
      {/* Fullscreen transition overlay */}
      {switching && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
            {switching.to === "organizer" ? (
              <Building2 className="h-8 w-8 text-primary-foreground" />
            ) : (
              <User className="h-8 w-8 text-primary-foreground" />
            )}
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Switching to {switching.label}
          </p>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity outline-none">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="gradient-primary text-primary-foreground text-xs">
              {activeProfile.type === "organizer"
                ? (activeProfile.organizerName || "O").charAt(0).toUpperCase()
                : (user.email || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {activeProfile.type === "organizer" ? (
            <>
              <span className="hidden lg:inline text-foreground">@{activeProfile.organizerSlug}</span>
            </>
          ) : (
            <>
              <span className="hidden lg:inline text-foreground">Personal</span>
            </>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Switch Profile</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSwitchToUser} className="gap-2">
            <User className="h-4 w-4" />
            <div className="flex-1">
              <p className="font-medium">Personal</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            {activeProfile.type === "user" && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate("/admin")}
                className="gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Admin Panel</p>
                  <p className="text-xs text-muted-foreground">Platform management</p>
                </div>
                {location.pathname.startsWith("/admin") && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Organizer Profiles</DropdownMenuLabel>
          {userOrganizers.map((membership) => (
            <DropdownMenuItem
              key={membership.organizer_id}
              onClick={() =>
                handleSwitchToOrganizer(
                  membership.organizer_id,
                  membership.organizers?.name || "",
                  membership.organizers?.slug || ""
                )
              }
              className="gap-2"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-muted text-xs">
                  {(membership.organizers?.name || "O").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">@{membership.organizers?.slug}</p>
                <p className="text-xs text-muted-foreground">{membership.role}</p>
              </div>
              {activeProfile.organizerId === membership.organizer_id && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
