import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ShieldCheck, ArrowLeftRight, Tag, Filter } from "lucide-react";
import { useMarketplaceListings } from "@/hooks/use-tickets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventCardSkeleton } from "@/components/EventSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Marketplace() {
  const { data: listings, isLoading } = useMarketplaceListings();
  const navigate = useNavigate();

  const sellListings = listings?.filter((l) => l.listing_type === "sell") || [];
  const swapListings = listings?.filter((l) => l.listing_type === "swap") || [];

  return (
    <div className="pb-20 md:pb-8 max-w-7xl mx-auto w-full">
      <div className="px-4 py-5">
        <h1 className="text-xl font-bold text-foreground mb-1">Marketplace</h1>
        <p className="text-sm text-muted-foreground mb-4">Verified resale and ticket swap</p>

        <Tabs defaultValue="resale">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="resale" className="flex-1">
              <ShieldCheck className="w-4 h-4 mr-1.5" /> Resale
            </TabsTrigger>
            <TabsTrigger value="swap" className="flex-1">
              <ArrowLeftRight className="w-4 h-4 mr-1.5" /> Swap
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resale">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : sellListings.length > 0 ? (
              <div className="space-y-3">
                {sellListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShieldCheck className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-medium text-foreground">No resale listings</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Check back later or list your own tickets for sale.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="swap">
            {swapListings.length > 0 ? (
              <div className="space-y-3">
                {swapListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} isSwap />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ArrowLeftRight className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-medium text-foreground">No swap listings</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Looking to swap tickets? List yours here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ListingCard({ listing, isSwap }: { listing: any; isSwap?: boolean }) {
  const navigate = useNavigate();
  const event = listing.events;
  if (!event) return null;

  return (
    <button
      onClick={() => navigate(`/events/${event.id}`)}
      className="w-full flex gap-3 p-3 rounded-xl bg-card border border-border hover:shadow-md transition-all text-left"
    >
      <img
        src={event.image_url || "/placeholder.svg"}
        alt={event.title}
        className="w-20 h-20 rounded-lg object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{event.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {format(new Date(event.date), "EEE, MMM d")} · {event.venue}
        </p>
        <p className="text-xs text-muted-foreground">
          {listing.ticket_tiers?.name || "Ticket"}
        </p>
        <div className="mt-1.5">
          {isSwap ? (
            <Badge variant="outline" className="text-accent border-accent text-[11px]">
              Open to Swap
            </Badge>
          ) : (
            <span className="text-sm font-bold text-foreground">
              ${Number(listing.asking_price).toFixed(0)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
