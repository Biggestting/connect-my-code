import type { Tables } from "@/integrations/supabase/types";

export type Event = Tables<"events">;
export type Organizer = Tables<"organizers">;
export type Carnival = Tables<"carnivals">;
export type CarnivalSeason = Tables<"carnival_seasons">;
export type TicketTier = Tables<"ticket_tiers">;
export type EventLineup = Tables<"event_lineup">;
export type EventAgenda = Tables<"event_agenda">;
export type Review = Tables<"reviews">;
export type ReviewResponse = Tables<"review_responses">;
export type SavedEvent = Tables<"saved_events">;
export type OrganizerFollow = Tables<"organizer_follows">;
export type Profile = Tables<"profiles">;
export type Purchase = Tables<"purchases">;
export type MarketplaceListing = Tables<"marketplace_listings">;

// ─── Band → Section → Costume hierarchy ───

export interface Band {
  id: string;
  organizer_id: string;
  event_id: string | null;
  listing_mode: "standalone" | "event_attached";
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_image: string | null;
  created_at: string;
}

export interface BandSection {
  id: string;
  band_id: string;
  name: string;
  description: string | null;
  section_image: string | null;
  section_gender: "women" | "men" | "unisex";
  inventory_limit: number | null;
  launch_at: string | null;
  created_at: string;
}

export interface SectionVersion {
  id: string;
  section_id: string;
  version_name: string;
  costume_structure: "1-piece" | "2-piece" | "board-shorts";
  price: number;
  inventory_quantity: number;
  inventory_sold: number;
  description: string | null;
  image_gallery: string[];
  created_at: string;
}

export interface CostumeProduct {
  id: string;
  section_id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  gender: string | null;
  inventory_quantity: number;
  inventory_sold: number;
  size_options: string[];
  image_gallery: string[];
  status: string;
  deposit_amount: number | null;
  balance_due_date: string | null;
  created_at: string;
}

export interface CostumePickup {
  id: string;
  product_id: string;
  pickup_location: string | null;
  pickup_date: string | null;
  pickup_instructions: string | null;
}

export interface JouvertPackage {
  id: string;
  event_id: string | null;
  listing_mode: "standalone" | "event_attached";
  name: string;
  price: number;
  quantity: number;
  sold_count: number;
  bundle_items: string[];
  image_url: string | null;
  created_at: string;
}

export interface CustomizationField {
  id: string;
  product_id: string | null;
  jouvert_package_id: string | null;
  section_version_id: string | null;
  field_label: string;
  field_type: "text" | "dropdown" | "checkbox" | "number" | "selection";
  options: string[];
  required: boolean;
  sort_order: number;
  created_at: string;
}

export interface ProductAddon {
  id: string;
  jouvert_package_id: string | null;
  costume_product_id: string | null;
  name: string;
  description: string | null;
  price: number;
  max_quantity: number;
  sold_count: number;
  sort_order: number;
  has_size_options: boolean;
  created_at: string;
  addon_size_options?: AddonSizeOption[];
}

export interface AddonSizeOption {
  id: string;
  addon_id: string;
  label: string;
  value: string;
  sort_order: number;
  inventory_quantity: number | null;
  created_at: string;
}

export type ProductType = "ticket" | "costume" | "jouvert";

// Nested band structure for display
export type SectionVersionWithFields = SectionVersion & {
  customization_fields?: CustomizationField[];
};

export type BandWithSections = Band & {
  band_sections: (BandSection & {
    section_versions?: SectionVersionWithFields[];
    costume_products: (CostumeProduct & {
      costume_pickup?: CostumePickup[];
    })[];
  })[];
};

export type EventWithRelations = Event & {
  organizers?: Organizer;
  carnivals?: Carnival;
  ticket_tiers?: TicketTier[];
  event_lineup?: EventLineup[];
  event_agenda?: EventAgenda[];
  reviews?: (Review & { review_responses?: ReviewResponse[] })[];
  bands?: BandWithSections[];
  jouvert_packages?: JouvertPackage[];
};

export type PurchaseWithRelations = Purchase & {
  events?: Event & { organizers?: Organizer };
  ticket_tiers?: TicketTier;
};

export type MarketplaceListingWithRelations = MarketplaceListing & {
  events?: Event & { organizers?: Organizer };
  ticket_tiers?: TicketTier;
  profiles?: Profile;
};

export const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "fete", label: "Fete" },
  { value: "carnival", label: "Carnival" },
  { value: "festival", label: "Festival" },
  { value: "party", label: "Party" },
  { value: "experience", label: "Experience" },
  { value: "concert", label: "Concert" },
] as const;

export const COSTUME_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
