import { cn } from "@/lib/utils";

interface CarnivalFallbackImageProps {
  name: string;
  city?: string | null;
  country?: string | null;
  className?: string;
}

export function CarnivalFallbackImage({ name, city, country, className }: CarnivalFallbackImageProps) {
  const location = [city, country].filter(Boolean).join(", ");

  return (
    <div className={cn("relative w-full h-full bg-gradient-to-br from-[hsl(326,100%,45%)] to-[hsl(254,100%,59%)]", className)}>
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle at 30% 30%, white 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }} />

      <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center">
        <span className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Carnival</span>
        <h2 className="text-white font-bold text-xl leading-tight">{name}</h2>
        {location && (
          <p className="text-white/70 text-sm mt-2">{location}</p>
        )}
        <span className="absolute bottom-3 right-3 text-white/20 text-[10px] font-bold tracking-wider">Ti'Fete</span>
      </div>
    </div>
  );
}
