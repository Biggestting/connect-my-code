import { useState, useCallback } from "react";
import { MapPin, Navigation, Search, ChevronDown, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const POPULAR_CITIES = [
  { city: "Miami", country: "USA" },
  { city: "Port of Spain", country: "Trinidad" },
  { city: "Notting Hill", country: "UK" },
  { city: "Toronto", country: "Canada" },
  { city: "Brooklyn", country: "USA" },
  { city: "Barbados", country: "Barbados" },
  { city: "Atlanta", country: "USA" },
  { city: "Houston", country: "USA" },
];

const STORAGE_KEY = "quara_selected_location";
export const ALL_LOCATIONS = "All Locations";
const DEFAULT_LOCATION = ALL_LOCATIONS;

export function getStoredLocation(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_LOCATION;
  } catch {
    return DEFAULT_LOCATION;
  }
}

function storeLocation(city: string) {
  try {
    localStorage.setItem(STORAGE_KEY, city);
  } catch {}
}

interface LocationSelectorProps {
  value: string;
  onChange: (city: string) => void;
}

export function LocationSelector({ value, onChange }: LocationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);

  const filtered = search.trim()
    ? POPULAR_CITIES.filter(
        (c) =>
          c.city.toLowerCase().includes(search.toLowerCase()) ||
          c.country.toLowerCase().includes(search.toLowerCase())
      )
    : POPULAR_CITIES;

  const handleSelect = useCallback(
    (city: string) => {
      storeLocation(city);
      onChange(city);
      setOpen(false);
      setSearch("");
    },
    [onChange]
  );

  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            DEFAULT_LOCATION;
          handleSelect(city);
        } catch {
          handleSelect(DEFAULT_LOCATION);
        } finally {
          setGeoLoading(false);
        }
      },
      () => setGeoLoading(false),
      { timeout: 8000 }
    );
  }, [handleSelect]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer group"
      >
        <MapPin className="h-4 w-4 text-primary" />
        <div className="text-left">
          <p className="text-[10px] text-muted-foreground leading-none">Location</p>
          <p className="text-xs font-medium text-foreground flex items-center gap-0.5">
            {value}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </p>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Select Location</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cities..."
                className="pl-10 pr-10 h-11 rounded-full bg-muted border-0"
                autoFocus
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* All Locations */}
            <button
              onClick={() => handleSelect(ALL_LOCATIONS)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                value === ALL_LOCATIONS
                  ? "bg-primary/10 ring-1 ring-primary/30"
                  : "bg-muted hover:bg-border"
              }`}
            >
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">All Locations</p>
                <p className="text-xs text-muted-foreground">Show events from every city</p>
              </div>
            </button>

            {/* Use Current Location */}
            <button
              onClick={handleGeolocation}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-muted hover:bg-border transition-colors text-left"
            >
              <Navigation className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">{geoLoading ? "Detecting..." : "Use my current location"}</p>
                <p className="text-xs text-muted-foreground">Allow location access to find nearby events</p>
              </div>
            </button>

            {/* Popular Cities */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                Popular Cities
              </p>
              <div className="grid grid-cols-2 gap-2">
                {filtered.map((c) => (
                  <button
                    key={c.city}
                    onClick={() => handleSelect(c.city)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all ${
                      value === c.city
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-border text-foreground"
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{c.city}</p>
                      <p className="text-[10px] opacity-70">{c.country}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom search submit */}
            {search.trim() && filtered.length === 0 && (
              <button
                onClick={() => handleSelect(search.trim())}
                className="w-full px-4 py-3 rounded-xl bg-muted hover:bg-border transition-colors text-left"
              >
                <p className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Use "{search.trim()}" as location
                </p>
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
