import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Share2, MapPin, Calendar, ChevronRight, Clock } from "lucide-react";
import { useBand } from "@/hooks/use-products";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function BandStorefront() {
  const { bandId } = useParams<{ bandId: string }>();
  const { data: band, isLoading } = useBand(bandId);
  const [activeTab, setActiveTab] = useState<"about" | "costumes">("costumes");

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: band?.name, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!band) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-lg font-semibold text-foreground">Band not found</p>
        <Link to="/" className="mt-4 text-accent text-sm font-medium">Back to Discover</Link>
      </div>
    );
  }

  const sections = band.band_sections || [];
  const totalCostumes = sections.reduce((sum, s) => sum + (s.costume_products?.length || 0), 0);

  return (
    <div className="pb-28 md:pb-24">
      {/* Hero */}
      <div className="relative">
        <div className="aspect-[16/9] md:aspect-[21/9]">
          <img
            src={band.cover_image || band.logo_url || "/placeholder.svg"}
            alt={band.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        </div>

        {/* Nav overlay */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
          <Link
            to="/"
            className="w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
          >
            <Share2 className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Hero text */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {band.logo_url && (
            <img src={band.logo_url} alt="" className="w-12 h-12 rounded-full border-2 border-background object-cover mb-2" />
          )}
          <h1 className="text-2xl md:text-4xl font-extrabold text-primary-foreground mb-1">
            {band.name}
          </h1>
          <p className="text-primary-foreground/80 text-sm">
            {totalCostumes} costume{totalCostumes !== 1 ? "s" : ""} · {sections.length} section{sections.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full">
        {/* Tabs */}
        <div className="flex border-b border-border">
          {(["about", "costumes"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold text-center transition-colors relative ${
                activeTab === tab
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "about" ? "About" : "Costumes"}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 gradient-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* About Tab */}
        {activeTab === "about" && (
          <section className="px-4 py-5">
            {band.description ? (
              <p className="text-sm text-muted-foreground leading-relaxed">{band.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description available.</p>
            )}
          </section>
        )}

        {/* Costumes Tab - Sections Grid */}
        {activeTab === "costumes" && (
          <section className="px-4 py-5">
            {sections.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">No sections available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sections.map((section) => (
                  <SectionCard key={section.id} section={section} bandId={band.id} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

/* ─── Section Card with Launch Countdown ─── */
function SectionCard({ section, bandId }: { section: any; bandId: string }) {
  const costumeCount = section.costume_products?.length || 0;
  const minPrice = section.costume_products?.length
    ? Math.min(...section.costume_products.map((c: any) => Number(c.price)))
    : 0;
  const launchAt = section.launch_at ? new Date(section.launch_at) : null;
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

  return (
    <Link
      to={`/bands/${bandId}/sections/${section.id}`}
      className="group rounded-xl border border-border overflow-hidden bg-card hover:shadow-md transition-shadow"
    >
      <div className="aspect-[4/3] bg-muted relative">
        {section.section_image ? (
          <img
            src={section.section_image}
            alt={section.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl">👗</span>
          </div>
        )}
        {isBeforeLaunch && (
          <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <p className="text-xs font-semibold text-foreground">Launches in</p>
            <p className="text-sm font-mono font-bold text-primary">
              {days > 0 ? `${days}d ` : ""}{String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </p>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">{section.name}</h3>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">
            {costumeCount} variant{costumeCount !== 1 ? "s" : ""}
          </p>
          {minPrice > 0 && (
            <Badge variant="secondary" className="text-[10px] py-0">
              From ${minPrice.toFixed(0)}
            </Badge>
          )}
          {isBeforeLaunch && (
            <Badge variant="outline" className="text-[10px] py-0">Upcoming</Badge>
          )}
        </div>
        {section.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{section.description}</p>
        )}
      </div>
    </Link>
  );
}
