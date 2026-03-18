import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Band, BandSection, BandWithSections, CostumeProduct, CostumePickup, JouvertPackage, CustomizationField, ProductAddon, AddonSizeOption, SectionVersion, SectionVersionWithFields } from "@/types";

// ═══════════════════════════════════
// BANDS
// ═══════════════════════════════════

export function useBand(bandId?: string) {
  return useQuery({
    queryKey: ["band", bandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bands" as any)
        .select("*, band_sections(*, section_versions(*, customization_fields:customization_fields(*)), costume_products(*, costume_pickup(*)))")
        .eq("id", bandId!)
        .single();
      if (error) throw error;
      return data as unknown as BandWithSections;
    },
    enabled: !!bandId,
  });
}

export function useAllBands() {
  return useQuery({
    queryKey: ["bands", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bands" as any)
        .select("*, band_sections(*, section_versions(*, customization_fields:customization_fields(*)), costume_products(*, costume_pickup(*))), organizers:organizer_id(name, slug, logo_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as (BandWithSections & { organizers?: { name: string; slug: string; logo_url: string | null } })[];
    },
  });
}

export function useEventBands(eventId?: string) {
  return useQuery({
    queryKey: ["bands", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bands" as any)
        .select("*, band_sections(*, section_versions(*, customization_fields:customization_fields(*)), costume_products(*, costume_pickup(*)))")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as BandWithSections[];
    },
    enabled: !!eventId,
  });
}

export function useStandaloneBands(organizerId?: string) {
  return useQuery({
    queryKey: ["bands", "standalone", organizerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bands" as any)
        .select("*, band_sections(*, section_versions(*, customization_fields:customization_fields(*)), costume_products(*, costume_pickup(*)))")
        .eq("organizer_id", organizerId!)
        .eq("listing_mode", "standalone")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as BandWithSections[];
    },
    enabled: !!organizerId,
  });
}

export function useCreateBand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (band: {
      organizer_id: string;
      event_id?: string | null;
      listing_mode: "standalone" | "event_attached";
      name: string;
      description?: string;
      logo_url?: string;
      cover_image?: string;
    }) => {
      const { data, error } = await supabase.from("bands" as any).insert(band as any).select().single();
      if (error) throw error;
      return data as unknown as Band;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bands"] });
    },
  });
}

export function useUpdateBand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string | null; logo_url?: string | null; cover_image?: string | null; carnival_id?: string | null; carnival_year?: number | null }) => {
      const { data, error } = await supabase.from("bands" as any).update(updates as any).eq("id", id).select().single();
      if (error) throw error;
      return data as unknown as Band;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bands"] });
    },
  });
}

export function useDeleteBand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; eventId: string }) => {
      const { error } = await supabase.from("bands" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bands"] });
    },
  });
}

// ═══════════════════════════════════
// BAND SECTIONS
// ═══════════════════════════════════

export function useCreateBandSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (section: { band_id: string; name: string; description?: string; section_image?: string; section_gender?: string; inventory_limit?: number; launch_at?: string | null }) => {
      const { data, error } = await supabase.from("band_sections" as any).insert(section as any).select().single();
      if (error) throw error;
      return data as unknown as BandSection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bands"] });
    },
  });
}

export function useUpdateBandSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string | null; section_image?: string | null; section_gender?: string; inventory_limit?: number | null; launch_at?: string | null }) => {
      const { data, error } = await supabase.from("band_sections" as any).update(updates as any).eq("id", id).select().single();
      if (error) throw error;
      return data as unknown as BandSection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bands"] });
    },
  });
}

export function useDeleteBandSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("band_sections" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bands"] });
    },
  });
}

// ═══════════════════════════════════
// SECTION VERSIONS
// ═══════════════════════════════════

export function useCreateSectionVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (version: {
      section_id: string;
      version_name: string;
      costume_structure: string;
      price: number;
      inventory_quantity: number;
      description?: string;
      image_gallery?: string[];
    }) => {
      const { data, error } = await supabase.from("section_versions" as any).insert(version as any).select().single();
      if (error) throw error;
      return data as unknown as SectionVersion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bands"] });
    },
  });
}

export function useUpdateSectionVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; version_name?: string; price?: number; inventory_quantity?: number; description?: string | null; image_gallery?: string[] }) => {
      const { data, error } = await supabase.from("section_versions" as any).update(updates as any).eq("id", id).select().single();
      if (error) throw error;
      return data as unknown as SectionVersion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bands"] });
    },
  });
}

export function useDeleteSectionVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("section_versions" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bands"] });
    },
  });
}

// ═══════════════════════════════════
// COSTUME PRODUCTS
// ═══════════════════════════════════

export function useCreateCostumeProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: {
      section_id: string;
      title: string;
      description?: string;
      price: number;
      gender?: string;
      inventory_quantity: number;
      size_options: string[];
      deposit_amount?: number;
      balance_due_date?: string;
    }) => {
      const { data, error } = await supabase.from("costume_products" as any).insert(product as any).select().single();
      if (error) throw error;
      return data as unknown as CostumeProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bands"] });
    },
  });
}

export function useUpdateCostumeProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; description?: string | null; price?: number; gender?: string | null; inventory_quantity?: number; size_options?: string[]; deposit_amount?: number | null; balance_due_date?: string | null; image_gallery?: string[] }) => {
      const { data, error } = await supabase.from("costume_products" as any).update(updates as any).eq("id", id).select().single();
      if (error) throw error;
      return data as unknown as CostumeProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bands"] });
    },
  });
}

export function useDeleteCostumeProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("costume_products" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bands"] });
    },
  });
}

// ═══════════════════════════════════
// COSTUME PICKUP
// ═══════════════════════════════════

export function useUpsertCostumePickup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pickup: { product_id: string; pickup_location?: string; pickup_date?: string; pickup_instructions?: string }) => {
      const { data, error } = await supabase.from("costume_pickup" as any).upsert(pickup as any, { onConflict: "product_id" }).select().single();
      if (error) throw error;
      return data as unknown as CostumePickup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bands"] });
    },
  });
}

// ═══════════════════════════════════
// J'OUVERT PACKAGES
// ═══════════════════════════════════

export function useEventJouvertPackages(eventId?: string) {
  return useQuery({
    queryKey: ["jouvert-packages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jouvert_packages" as any)
        .select("*")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as JouvertPackage[];
    },
    enabled: !!eventId,
  });
}

export function useCreateJouvertPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pkg: {
      event_id?: string | null;
      listing_mode: "standalone" | "event_attached";
      name: string;
      price: number;
      quantity: number;
      bundle_items: string[];
      image_url?: string;
    }) => {
      const { data, error } = await supabase.from("jouvert_packages" as any).insert(pkg as any).select().single();
      if (error) throw error;
      return data as unknown as JouvertPackage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jouvert-packages"] });
    },
  });
}

export function useUpdateJouvertPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; price?: number; quantity?: number; bundle_items?: string[]; image_url?: string | null; carnival_id?: string | null; carnival_year?: number | null }) => {
      const { data, error } = await supabase.from("jouvert_packages" as any).update(updates as any).eq("id", id).select().single();
      if (error) throw error;
      return data as unknown as JouvertPackage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jouvert-packages"] });
    },
  });
}

export function useDeleteJouvertPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; eventId: string }) => {
      const { error } = await supabase.from("jouvert_packages" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jouvert-packages"] });
    },
  });
}

// ═══════════════════════════════════
// CUSTOMIZATION FIELDS
// ═══════════════════════════════════

export function useCustomizationFields(productId?: string) {
  return useQuery({
    queryKey: ["customization-fields", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customization_fields" as any)
        .select("*")
        .eq("product_id", productId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as unknown as CustomizationField[];
    },
    enabled: !!productId,
  });
}

export function useJouvertCustomizationFields(jouvertPackageId?: string) {
  return useQuery({
    queryKey: ["customization-fields", "jouvert", jouvertPackageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customization_fields" as any)
        .select("*")
        .eq("jouvert_package_id", jouvertPackageId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as unknown as CustomizationField[];
    },
    enabled: !!jouvertPackageId,
  });
}

// ═══════════════════════════════════
// PRODUCT ADDONS
// ═══════════════════════════════════

export function useProductAddons(jouvertPackageId?: string, costumeProductId?: string) {
  const id = jouvertPackageId || costumeProductId;
  const column = jouvertPackageId ? "jouvert_package_id" : "costume_product_id";
  return useQuery({
    queryKey: ["product-addons", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_addons" as any)
        .select("*, addon_size_options(*)")
        .eq(column, id!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as unknown as (ProductAddon & { addon_size_options?: AddonSizeOption[] })[];
    },
    enabled: !!id,
  });
}

export function useCreateProductAddon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (addon: { jouvert_package_id?: string; costume_product_id?: string; name: string; description?: string; price: number; max_quantity: number; has_size_options?: boolean }) => {
      const { data, error } = await supabase.from("product_addons" as any).insert(addon as any).select().single();
      if (error) throw error;
      return data as unknown as ProductAddon;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-addons"] });
    },
  });
}

export function useUpdateProductAddon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string | null; price?: number; max_quantity?: number; has_size_options?: boolean }) => {
      const { data, error } = await supabase.from("product_addons" as any).update(updates as any).eq("id", id).select().single();
      if (error) throw error;
      return data as unknown as ProductAddon;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-addons"] });
    },
  });
}

export function useDeleteProductAddon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_addons" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-addons"] });
    },
  });
}

// ═══════════════════════════════════
// STANDALONE JOUVERT PACKAGES
// ═══════════════════════════════════

export function useStandaloneJouvertPackages(organizerId?: string) {
  return useQuery({
    queryKey: ["standalone-jouvert-packages", organizerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jouvert_packages")
        .select("*")
        .eq("listing_mode", "standalone")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!organizerId,
  });
}

// ═══════════════════════════════════
// CUSTOMIZATION FIELD MUTATIONS
// ═══════════════════════════════════

export function useVersionCustomizationFields(sectionVersionId?: string) {
  return useQuery({
    queryKey: ["customization-fields-version", sectionVersionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customization_fields")
        .select("*")
        .eq("section_version_id", sectionVersionId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!sectionVersionId,
  });
}

export function useCreateCustomizationField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      product_id?: string;
      jouvert_package_id?: string;
      section_version_id?: string;
      field_label: string;
      field_type?: string;
      options?: string[];
      required?: boolean;
      sort_order?: number;
    }) => {
      const { data, error } = await supabase
        .from("customization_fields")
        .insert(params as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customization-fields"] });
      queryClient.invalidateQueries({ queryKey: ["customization-fields-jouvert"] });
      queryClient.invalidateQueries({ queryKey: ["customization-fields-version"] });
    },
  });
}

export function useDeleteCustomizationField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customization_fields").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customization-fields"] });
      queryClient.invalidateQueries({ queryKey: ["customization-fields-jouvert"] });
      queryClient.invalidateQueries({ queryKey: ["customization-fields-version"] });
    },
  });
}

// ═══════════════════════════════════
// ADDON SIZE OPTIONS
// ═══════════════════════════════════

export function useCreateAddonSizeOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { addon_id: string; label: string; value: string; sort_order?: number; inventory_quantity?: number | null }) => {
      const { data, error } = await supabase.from("addon_size_options").insert(params).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-addons"] });
    },
  });
}

export function useDeleteAddonSizeOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addon_size_options").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-addons"] });
    },
  });
}

// ═══════════════════════════════════
// UNIFIED PURCHASE
// ═══════════════════════════════════

export function usePurchaseProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      userId: string;
      eventId: string;
      productType: "ticket" | "costume" | "jouvert";
      ticketTierId?: string;
      costumeProductId?: string;
      selectedSize?: string;
      jouvertPackageId?: string;
      quantity: number;
      totalAmount: number;
      amountPaid?: number;
      balanceRemaining?: number;
      promoterId?: string;
      commissionRate?: number;
      customizationResponses?: Record<string, string>;
      termsAccepted?: boolean;
      termsVersion?: string;
      purchaseIp?: string;
    }) => {
      const { data, error } = await supabase
        .from("purchases")
        .insert({
          user_id: params.userId,
          event_id: params.eventId,
          product_type: params.productType,
          ticket_tier_id: params.ticketTierId || null,
          costume_product_id: params.costumeProductId || null,
          selected_size: params.selectedSize || null,
          jouvert_package_id: params.jouvertPackageId || null,
          quantity: params.quantity,
          total_amount: params.totalAmount,
          amount_paid: params.amountPaid ?? params.totalAmount,
          balance_remaining: params.balanceRemaining ?? 0,
          status: params.balanceRemaining && params.balanceRemaining > 0 ? "deposit_paid" : "completed",
          promoter_id: params.promoterId || null,
          commission_rate: params.commissionRate ?? null,
          customization_responses: params.customizationResponses || {},
          terms_accepted: params.termsAccepted ?? false,
          terms_version: params.termsVersion || null,
          terms_accepted_at: params.termsAccepted ? new Date().toISOString() : null,
          purchase_ip: params.purchaseIp || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["bands"] });
      queryClient.invalidateQueries({ queryKey: ["jouvert-packages"] });
    },
  });
}
