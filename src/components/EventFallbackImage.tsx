import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/types";

interface EventFallbackImageProps {
  title: string;
  date?: string;
  location?: string;
  category?: string;
  className?: string;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  fete: "from-[hsl(326,100%,45%)] to-[hsl(254,100%,59%)]",
  jouvert: "from-[hsl(271,76%,40%)] to-[hsl(271,81%,56%)]",
  cooler_fete: "from-[hsl(189,94%,37%)] to-[hsl(189,94%,50%)]",
  boat_ride: "from-[hsl(205,95%,32%)] to-[hsl(199,89%,48%)]",
  breakfast_party: "from-[hsl(22,93%,48%)] to-[hsl(25,95%,53%)]",
  costume_band: "from-[hsl(0,74%,42%)] to-[hsl(0,84%,60%)]",
  concert: "from-[hsl(239,84%,50%)] to-[hsl(239,84%,67%)]",
  festival: "from-[hsl(142,64%,34%)] to-[hsl(142,71%,45%)]",
  carnival: "from-[hsl(326,100%,45%)] to-[hsl(254,100%,59%)]",
  party: "from-[hsl(339,82%,47%)] to-[hsl(291,64%,42%)]",
  experience: "from-[hsl(199,89%,48%)] to-[hsl(217,91%,60%)]",
};

const DEFAULT_GRADIENT = "from-[hsl(326,100%,45%)] to-[hsl(254,100%,59%)]";

export function EventFallbackImage({
  title,
  date,
  location,
  category,
  className,
}: EventFallbackImageProps) {
  const gradient = (category && CATEGORY_GRADIENTS[category]) || DEFAULT_GRADIENT;
  const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label;

  return (
    <div className={cn("relative w-full h-full bg-gradient-to-br", gradient, className)}>
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px)`,
        backgroundSize: "20px 20px",
      }} />

      <div className="relative z-10 flex flex-col justify-end h-full p-4">
        {/* Category badge */}
        {categoryLabel && (
          <span className="inline-block self-start px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm rounded-full text-white mb-2">
            {categoryLabel}
          </span>
        )}

        {/* Title */}
        <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">
          {title || "Untitled Event"}
        </h3>

        {/* Date */}
        {date && (
          <p className="text-white/80 text-xs mt-1">
            {format(new Date(date), "MMM d, yyyy")}
          </p>
        )}

        {/* Location */}
        {location && (
          <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{location}</p>
        )}

        {/* Branding */}
        <span className="absolute top-3 right-3 text-white/30 text-[10px] font-bold tracking-wider">
          Ti'Fete
        </span>
      </div>
    </div>
  );
}
