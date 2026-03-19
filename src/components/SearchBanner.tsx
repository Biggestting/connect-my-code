import { useState } from "react";
import { Search, MapPin, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LocationSelector, getStoredLocation } from "@/components/LocationSelector";
import { CATEGORIES } from "@/types";

interface SearchBannerProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: (e: React.FormEvent) => void;
  category: string;
  onCategoryChange: (cat: string) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
}

export function SearchBanner({
  searchQuery,
  onSearchChange,
  onSearch,
  category,
  onCategoryChange,
  selectedCity,
  onCityChange,
}: SearchBannerProps) {
  return (
    <>
      {/* Mobile search — simple pill */}
      <div className="md:hidden px-4 pt-4 pb-2">
        <form onSubmit={onSearch} className="flex items-center gap-3 bg-muted rounded-full px-4 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Events, Organizers, or Venues"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </form>
        <div className="mt-3">
          <LocationSelector value={selectedCity} onChange={onCityChange} />
        </div>
      </div>

      {/* Desktop gradient search banner */}
      <div className="hidden md:block gradient-primary py-8 -mx-4 lg:-mx-8">
        <div className="container">
          <form
            onSubmit={onSearch}
            className="bg-card rounded-2xl shadow-lg flex items-stretch overflow-hidden"
          >
            {/* Search input */}
            <div className="flex-1 px-6 py-4 flex flex-col justify-center border-r border-border">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Events, Organizers, or Venues"
                className="w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none mt-0.5"
              />
            </div>

            {/* Category selector */}
            <div className="px-5 py-4 flex flex-col justify-center border-r border-border min-w-[140px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Category
              </span>
              <select
                value={category}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="bg-transparent text-base font-medium text-foreground outline-none appearance-none cursor-pointer mt-0.5 pr-4"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0 center",
                }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.value === "all" ? "All Events" : cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location selector */}
            <div className="px-5 py-4 flex flex-col justify-center min-w-[160px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Location
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <LocationSelector value={selectedCity} onChange={onCityChange} />
              </div>
            </div>

            {/* Search button */}
            <button
              type="submit"
              className="gradient-primary px-6 flex items-center justify-center hover:opacity-90 transition-opacity"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-primary-foreground" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
