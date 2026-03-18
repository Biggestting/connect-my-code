import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Ticket } from "lucide-react";
import { format } from "date-fns";

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*, events(title, organizers(name)), ticket_tiers(name, price), purchase_addons(id, addon_name, unit_price, quantity, size_label, size_value)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const filtered = orders?.filter((o: any) =>
    o.events?.title?.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.user_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-6xl">
        <h1 className="text-xl font-bold text-foreground mb-1">Order Management</h1>
        <p className="text-sm text-muted-foreground mb-5">Search by event, order ID, or user ID</p>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="pl-9" />
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-xl border border-border animate-pulse bg-muted" />)}</div>
        ) : (
          <div className="space-y-2">
            {filtered?.map((order: any) => (
              <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Ticket className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{order.events?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.ticket_tiers?.name} × {order.quantity} · Order: {order.id.slice(0, 8)}...
                    {order.selected_size && ` · Size: ${order.selected_size}`}
                  </p>
                  {order.purchase_addons?.length > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      Add-ons: {order.purchase_addons.map((a: any) => `${a.addon_name}${a.size_label ? ` (${a.size_label})` : ""} ×${a.quantity}`).join(", ")}
                    </p>
                  )}
                  {order.customization_responses && Object.keys(order.customization_responses).length > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      Selections: {Object.entries(order.customization_responses).map(([k, v]) => `${k}: ${v}`).join(", ")}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(order.created_at), "MMM d, yyyy h:mm a")} · By: {order.events?.organizers?.name || "—"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-foreground">${Number(order.total_amount).toLocaleString()}</p>
                  <Badge
                    variant={order.status === "completed" ? "default" : order.status === "refunded" ? "destructive" : "outline"}
                    className="text-[10px]"
                  >
                    {order.status}
                  </Badge>
                  {order.redeemed && <p className="text-[10px] text-green-600 mt-0.5">✓ Redeemed</p>}
                </div>
              </div>
            ))}
            {filtered?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No orders found.</p>}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
