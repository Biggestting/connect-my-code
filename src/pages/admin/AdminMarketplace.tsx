import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";

export default function AdminMarketplace() {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["admin-marketplace"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_listings")
        .select("*, events(title), ticket_tiers(name, price)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-5xl">
        <h1 className="text-xl font-bold text-foreground mb-1">Marketplace Moderation</h1>
        <p className="text-sm text-muted-foreground mb-5">{listings?.length || 0} listings</p>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl border border-border animate-pulse bg-muted" />)}</div>
        ) : (
          <div className="space-y-2">
            {listings?.map((l: any) => (
              <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{l.events?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.ticket_tiers?.name} · Original: ${Number(l.ticket_tiers?.price || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-foreground">${Number(l.asking_price).toLocaleString()}</p>
                  <Badge variant={l.status === "active" ? "default" : "outline"} className="text-[10px]">
                    {l.status}
                  </Badge>
                </div>
              </div>
            ))}
            {(!listings || listings.length === 0) && <p className="text-sm text-muted-foreground text-center py-8">No listings.</p>}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
