import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface PurchaseAddon {
  id: string;
  addon_id: string | null;
  addon_name: string;
  unit_price: number;
  quantity: number;
  size_label: string | null;
  size_value: string | null;
}

export interface PurchaseItem {
  id: string;
  event_id: string;
  product_type: string;
  quantity: number;
  total_amount: number;
  amount_paid: number | null;
  balance_remaining: number | null;
  status: string;
  customization_responses: Record<string, string> | null;
  selected_size: string | null;
  created_at: string;
  ticket_tier_id: string | null;
  costume_product_id: string | null;
  jouvert_package_id: string | null;
  events?: {
    id: string;
    title: string;
    date: string;
    venue: string | null;
    image_url: string | null;
  };
  ticket_tiers?: { name: string; price: number } | null;
  costume_products?: {
    title: string;
    price: number;
    deposit_amount: number | null;
    balance_due_date: string | null;
    band_sections?: {
      name: string;
      bands?: { name: string };
    };
    costume_pickup?: {
      pickup_location: string | null;
      pickup_date: string | null;
      pickup_instructions: string | null;
    }[];
  } | null;
  jouvert_packages?: { name: string; price: number } | null;
  purchase_addons?: PurchaseAddon[];
}

export function usePurchaseItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["purchase-items", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select(`
          *,
          events(id, title, date, venue, image_url),
          ticket_tiers(name, price),
          costume_products(title, price, deposit_amount, balance_due_date,
            band_sections(name, bands(name)),
            costume_pickup(pickup_location, pickup_date, pickup_instructions)
          ),
          jouvert_packages(name, price),
          purchase_addons(id, addon_id, addon_name, unit_price, quantity, size_label, size_value)
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PurchaseItem[];
    },
    enabled: !!user,
  });
}
