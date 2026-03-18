import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, Calendar, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import type { MarketplaceListingWithRelations } from "@/types";

export default function Marketplace() {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["marketplace-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_listings")
        .select("*, events(*, organizers(*)), ticket_tiers(*), profiles:seller_id(display_name, avatar_url)")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as MarketplaceListingWithRelations[];
    },
  });

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold text-foreground mb-4">Marketplace</h1>
      <p className="text-sm text-muted-foreground mb-6">Buy and sell tickets from other fans</p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : !listings || listings.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Store className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No listings available</p>
          <p className="text-xs text-muted-foreground">Check back later for resale tickets</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              to={`/events/${listing.event_id}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:shadow-sm transition-shadow"
            >
              {listing.events?.image_url && (
                <img src={listing.events.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-semibold text-foreground text-sm line-clamp-1">{listing.events?.title}</p>
                {listing.events?.date && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(listing.events.date), "MMM d, yyyy")}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{listing.ticket_tiers?.name}</Badge>
                  <span className="text-sm font-bold text-foreground">${Number(listing.asking_price).toFixed(0)}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
