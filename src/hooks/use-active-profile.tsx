import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUserOrganizers } from "@/hooks/use-organizer-members";

interface ActiveProfile {
  type: "user" | "organizer";
  organizerId?: string;
  organizerName?: string;
  organizerSlug?: string;
}

interface ActiveProfileContextType {
  activeProfile: ActiveProfile;
  switchToUser: () => void;
  switchToOrganizer: (organizerId: string, name: string, slug: string) => void;
  isOrganizerMode: boolean;
  userOrganizers: ReturnType<typeof useUserOrganizers>["data"];
  isLoadingOrganizers: boolean;
}

const ActiveProfileContext = createContext<ActiveProfileContextType>({
  activeProfile: { type: "user" },
  switchToUser: () => {},
  switchToOrganizer: () => {},
  isOrganizerMode: false,
  userOrganizers: undefined,
  isLoadingOrganizers: false,
});

const STORAGE_KEY = "quara_active_profile";

export function ActiveProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: userOrganizers, isLoading: isLoadingOrganizers } = useUserOrganizers(user?.id);

  const [activeProfile, setActiveProfile] = useState<ActiveProfile>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return { type: "user" };
  });

  useEffect(() => {
    if (!user) {
      setActiveProfile({ type: "user" });
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (activeProfile.type === "organizer" && userOrganizers && !isLoadingOrganizers) {
      const stillMember = userOrganizers.some(
        (m) => m.organizer_id === activeProfile.organizerId
      );
      if (!stillMember) {
        setActiveProfile({ type: "user" });
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [userOrganizers, isLoadingOrganizers, activeProfile]);

  const switchToUser = () => {
    const profile: ActiveProfile = { type: "user" };
    setActiveProfile(profile);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  };

  const switchToOrganizer = (organizerId: string, name: string, slug: string) => {
    const profile: ActiveProfile = {
      type: "organizer",
      organizerId,
      organizerName: name,
      organizerSlug: slug,
    };
    setActiveProfile(profile);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  };

  return (
    <ActiveProfileContext.Provider
      value={{
        activeProfile,
        switchToUser,
        switchToOrganizer,
        isOrganizerMode: activeProfile.type === "organizer",
        userOrganizers,
        isLoadingOrganizers,
      }}
    >
      {children}
    </ActiveProfileContext.Provider>
  );
}

export function useActiveProfile() {
  return useContext(ActiveProfileContext);
}
