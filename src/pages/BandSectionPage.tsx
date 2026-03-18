import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, Clock, Layers } from "lucide-react";
import { useBand } from "@/hooks/use-products";
import { Badge } from "@/components/ui/badge";
import type { SectionVersionWithFields } from "@/types";

export default function BandSectionPage() {
  const { bandId, sectionId } = useParams<{ bandId: string; sectionId: string }>();
  const { data: band, isLoading } = useBand(bandId);

  const section = band?.band_sections?.find((s) => s.id === sectionId);
  const versions = section?.section_versions || [];
  const costumes = section?.costume_products || [];
  const launchAt = (section as any)?.launch_at ? new Date((section as any).launch_at) : null;

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!launchAt || launchAt <= new Date()) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [launchAt]);

  const isBeforeLaunch = launchAt && launchAt > now;
  const diff = isBeforeLaunch ? launchAt.getTime() - now.getTime() : 0;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!band || !section) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-lg font-semibold text-foreground">Section not found</p>
        <Link to="/" className="mt-4 text-accent text-sm font-medium">Back to Discover</Link>
      </div>
    );
  }

  const structureLabel = (s: string) =>
    s === "1-piece" ? "One Piece" : s === "2-piece" ? "Two Piece" : s === "board-shorts" ? "Board Shorts" : s;

  return (
    <div className="pb-28 md:pb-24 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <Link
          to={`/bands/${band.id}`}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">{section.name}</h1>
          <p className="text-xs text-muted-foreground">{band.name}</p>
        </div>
      </div>

      {/* Section Hero */}
      {section.section_image && (
        <div className="aspect-[16/9]">
          <img src={section.section_image} alt={section.name} className="w-full h-full object-cover" />
        </div>
      )}

      {section.description && (
        <p className="px-4 py-3 text-sm text-muted-foreground border-b border-border">{section.description}</p>
      )}

      {/* Launch Countdown */}
      {isBeforeLaunch && (
        <div className="mx-4 mt-4 p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-3">
          <Clock className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Section launches soon</p>
            <p className="text-lg font-mono font-bold text-primary">
              {days > 0 ? `${days}d ` : ""}{String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </p>
            <p className="text-xs text-muted-foreground">Purchases will be available after launch</p>
          </div>
        </div>
      )}

      {/* Section Versions */}
      {versions.length > 0 && (
        <div className="px-4 py-4">
          <h2 className="text-sm font-bold text-foreground mb-3">
            Available Versions ({versions.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {versions.map((version) => (
              <VersionCard
                key={version.id}
                version={version}
                bandId={band.id}
                sectionId={section.id}
                isBeforeLaunch={!!isBeforeLaunch}
              />
            ))}
          </div>
        </div>
      )}

      {/* Legacy Costume Variants (if any exist alongside versions) */}
      {costumes.length > 0 && (
        <div className="px-4 py-4">
          <h2 className="text-sm font-bold text-foreground mb-3">
            Costume Variants ({costumes.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {costumes.map((costume) => {
              const available = costume.inventory_quantity - costume.inventory_sold;
              const soldOut = available <= 0 || costume.status === "sold_out";

              return (
                <Link
                  key={costume.id}
                  to={`/bands/${band.id}/costumes/${costume.id}`}
                  className={`group rounded-xl border border-border overflow-hidden bg-card transition-shadow ${
                    soldOut ? "opacity-50" : "hover:shadow-md"
                  }`}
                >
                  <div className="aspect-square bg-muted relative">
                    {costume.image_gallery?.[0] ? (
                      <img
                        src={costume.image_gallery[0]}
                        alt={costume.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl">👗</span>
                      </div>
                    )}
                    {soldOut && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                        <Badge variant="destructive" className="text-xs">Sold Out</Badge>
                      </div>
                    )}
                    {!soldOut && isBeforeLaunch && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                        <Badge variant="outline" className="text-xs">Upcoming</Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-foreground truncate">{costume.title}</p>
                    {costume.gender && (
                      <p className="text-[10px] text-muted-foreground">{costume.gender}</p>
                    )}
                    <p className="text-sm font-bold text-foreground mt-0.5">${Number(costume.price).toFixed(0)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {versions.length === 0 && costumes.length === 0 && (
        <div className="text-center py-12 px-4">
          <p className="text-sm text-muted-foreground">No options available in this section yet.</p>
        </div>
      )}
    </div>
  );
}

/* ─── Version Card ─── */
function VersionCard({
  version,
  bandId,
  sectionId,
  isBeforeLaunch,
}: {
  version: SectionVersionWithFields;
  bandId: string;
  sectionId: string;
  isBeforeLaunch: boolean;
}) {
  const available = version.inventory_quantity - version.inventory_sold;
  const soldOut = available <= 0;
  const fieldCount = version.customization_fields?.length || 0;
  const structureLabel =
    version.costume_structure === "1-piece"
      ? "One Piece"
      : version.costume_structure === "2-piece"
      ? "Two Piece"
      : version.costume_structure === "board-shorts"
      ? "Board Shorts"
      : version.costume_structure;

  return (
    <Link
      to={`/bands/${bandId}/sections/${sectionId}/versions/${version.id}`}
      className={`group rounded-xl border border-border overflow-hidden bg-card transition-shadow ${
        soldOut ? "opacity-50" : "hover:shadow-md"
      }`}
    >
      <div className="aspect-[4/3] bg-muted relative">
        {version.image_gallery?.[0] ? (
          <img
            src={version.image_gallery[0]}
            alt={version.version_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Layers className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}
        {soldOut && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Badge variant="destructive" className="text-xs">Sold Out</Badge>
          </div>
        )}
        {!soldOut && isBeforeLaunch && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Badge variant="outline" className="text-xs">Upcoming</Badge>
          </div>
        )}
        <Badge className="absolute top-2 left-2 text-[10px] bg-background/80 text-foreground border-0">
          {structureLabel}
        </Badge>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground truncate">{version.version_name}</h3>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
        <p className="text-lg font-bold text-foreground mt-0.5">${Number(version.price).toFixed(0)}</p>
        <div className="flex items-center gap-2 mt-1">
          {!soldOut && (
            <p className="text-[10px] text-muted-foreground">{available} remaining</p>
          )}
          {fieldCount > 0 && (
            <Badge variant="secondary" className="text-[10px] py-0">
              {fieldCount} field{fieldCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        {version.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{version.description}</p>
        )}
      </div>
    </Link>
  );
}
