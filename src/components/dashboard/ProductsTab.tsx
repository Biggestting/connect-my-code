import { useState, useCallback, useEffect, useRef } from "react";
import { Shirt, PartyPopper, Plus, Trash2, ChevronDown, ChevronRight, MapPin, Users, Clock, Rocket, XCircle, Layers, Wand2, Pencil } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CustomizationFieldsDialog } from "./CustomizationFieldsDialog";
import { AddonsDialog } from "./AddonsDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  useEventBands, useStandaloneBands, useCreateBand, useDeleteBand,
  useCreateBandSection, useDeleteBandSection,
  useCreateSectionVersion, useDeleteSectionVersion,
  useCreateCostumeProduct, useDeleteCostumeProduct,
  useUpsertCostumePickup,
  useEventJouvertPackages, useStandaloneJouvertPackages, useCreateJouvertPackage, useDeleteJouvertPackage,
  useCreateCustomizationField,
} from "@/hooks/use-products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { COSTUME_SIZES } from "@/types";
import type { Event, TicketTier, BandWithSections, SectionVersion } from "@/types";
import { useAutosave } from "@/hooks/use-autosave";
import { AutosaveIndicator } from "@/components/AutosaveIndicator";
import { EditBandDialog, EditSectionDialog, EditVersionDialog, EditCostumeDialog, EditJouvertDialog } from "./EditProductDialogs";

interface ProductsTabProps {
  events: (Event & { ticket_tiers?: TicketTier[] })[];
  organizerId: string;
}

export function ProductsTab({ events, organizerId }: ProductsTabProps) {
  const [listingMode, setListingMode] = useState<"event_attached" | "standalone">("event_attached");
  const [selectedEventId, setSelectedEventId] = useState("");

  const { data: eventBands, isLoading: eventBandsLoading } = useEventBands(listingMode === "event_attached" && selectedEventId ? selectedEventId : undefined);
  const { data: standaloneBands, isLoading: standaloneBandsLoading } = useStandaloneBands(listingMode === "standalone" ? organizerId : undefined);
  const { data: eventJouvert, isLoading: eventJouvLoading } = useEventJouvertPackages(listingMode === "event_attached" && selectedEventId ? selectedEventId : undefined);
  const { data: standaloneJouvert, isLoading: standaloneJouvLoading } = useStandaloneJouvertPackages(listingMode === "standalone" ? organizerId : undefined);

  const bands = listingMode === "event_attached" ? eventBands : standaloneBands;
  const bandsLoading = listingMode === "event_attached" ? eventBandsLoading : standaloneBandsLoading;
  const jouvertPackages = listingMode === "event_attached" ? eventJouvert : standaloneJouvert;
  const jouvLoading = listingMode === "event_attached" ? eventJouvLoading : standaloneJouvLoading;

  const showProducts = listingMode === "standalone" || (listingMode === "event_attached" && selectedEventId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Products</h2>
        <p className="text-sm text-muted-foreground">Manage carnival bands, costumes, and J'ouvert packages</p>
      </div>

      {/* Listing Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => { setListingMode("event_attached"); setSelectedEventId(""); }}
          className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
            listingMode === "event_attached" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Event-Attached
        </button>
        <button
          onClick={() => setListingMode("standalone")}
          className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
            listingMode === "standalone" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Standalone
        </button>
      </div>

      {listingMode === "event_attached" && (
        <div className="space-y-2">
          <Label>Select Event</Label>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an event..." />
            </SelectTrigger>
            <SelectContent>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {listingMode === "standalone" && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          Standalone products appear in search and marketplace without being tied to a specific event.
        </p>
      )}

      {showProducts && (
        <>
          {/* ═══ Bands & Costumes ═══ */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Shirt className="w-4 h-4" /> Bands & Costumes
              </h3>
              <CreateBandDialog eventId={listingMode === "event_attached" ? selectedEventId : null} organizerId={organizerId} listingMode={listingMode} />
            </div>

            {bandsLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
              </div>
            ) : bands && bands.length > 0 ? (
              <div className="space-y-3">
                {bands.map((band) => (
                  <BandCard key={band.id} band={band} eventId={band.event_id || "standalone"} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No bands created yet. Add a band to start selling costumes.</p>
            )}
          </section>

          {/* ═══ J'ouvert Packages ═══ */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <PartyPopper className="w-4 h-4" /> J'ouvert Packages
              </h3>
              <CreateJouvertDialog eventId={listingMode === "event_attached" ? selectedEventId : null} listingMode={listingMode} />
            </div>

            {jouvLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
              </div>
            ) : jouvertPackages && jouvertPackages.length > 0 ? (
              <div className="space-y-2">
                {jouvertPackages.map((jp) => (
                  <JouvertCard key={jp.id} pkg={jp} eventId={jp.event_id || "standalone"} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No J'ouvert packages yet.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   BAND CARD (collapsible with sections)
   ═══════════════════════════════════════ */

function BandCard({ band, eventId }: { band: BandWithSections; eventId: string }) {
  const [open, setOpen] = useState(true);
  const deleteMutation = useDeleteBand();
  const sections = band.band_sections || [];
  const totalCostumes = sections.reduce((s, sec) => s + (sec.costume_products?.length || 0), 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-border overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left">
            {open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{band.name}</p>
              <p className="text-xs text-muted-foreground">{sections.length} section{sections.length !== 1 ? "s" : ""} · {totalCostumes} costume{totalCostumes !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <EditBandDialog band={band} />
              <CreateSectionDialog bandId={band.id} />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate({ id: band.id, eventId })}>
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border">
            {sections.length > 0 ? sections.map((section) => (
              <SectionRow key={section.id} section={section} />
            )) : (
              <p className="text-xs text-muted-foreground text-center py-4">No sections yet. Add a section to this band.</p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function SectionLaunchBadge({ launchAt }: { launchAt?: string | null }) {
  if (!launchAt) {
    return <Badge variant="default" className="text-[9px]">Live</Badge>;
  }
  const launchDate = new Date(launchAt);
  const now = new Date();
  if (launchDate > now) {
    return <Badge variant="secondary" className="text-[9px] bg-accent text-accent-foreground">Upcoming</Badge>;
  }
  return <Badge variant="default" className="text-[9px]">Live</Badge>;
}

function SectionRow({ section }: { section: BandWithSections["band_sections"][0] }) {
  const [expanded, setExpanded] = useState(false);
  const deleteMutation = useDeleteBandSection();
  const costumes = section.costume_products || [];
  const versions = section.section_versions || [];
  const totalInventory = costumes.reduce((s, c) => s + c.inventory_quantity, 0);
  const totalSold = costumes.reduce((s, c) => s + c.inventory_sold, 0);
  const launchAt = (section as any).launch_at as string | null;
  const gender = (section as any).section_gender as string | undefined;

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">{section.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {versions.length} version{versions.length !== 1 ? "s" : ""} · {costumes.length} costume{costumes.length !== 1 ? "s" : ""}
            {launchAt && new Date(launchAt) > new Date() && (
              <span className="ml-1">· Launches {new Date(launchAt).toLocaleDateString()}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {gender && gender !== "unisex" && (
            <Badge variant="outline" className="text-[9px] capitalize">{gender}</Badge>
          )}
          <SectionLaunchBadge launchAt={launchAt} />
          <EditSectionDialog section={section as any} />
          <CreateVersionDialog sectionId={section.id} sectionGender={gender || "unisex"} />
          <CreateCostumeDialog sectionId={section.id} />
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMutation.mutate(section.id)}>
            <Trash2 className="w-3 h-3 text-destructive" />
          </Button>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {/* Versions */}
          {versions.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Versions</p>
              {versions.map((version) => (
                <VersionRow key={version.id} version={version} />
              ))}
            </div>
          )}
          {/* Costumes */}
          {costumes.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Costumes</p>
              {costumes.map((costume) => (
                <CostumeRow key={costume.id} costume={costume} />
              ))}
            </div>
          )}
          {versions.length === 0 && costumes.length === 0 && (
            <p className="text-[10px] text-muted-foreground text-center py-2">No versions or costumes yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

function VersionRow({ version }: { version: SectionVersion }) {
  const deleteMutation = useDeleteSectionVersion();
  const avail = version.inventory_quantity - version.inventory_sold;

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
      <Layers className="w-3 h-3 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground">{version.version_name}</p>
        <p className="text-[10px] text-muted-foreground">
          {version.costume_structure} · ${Number(version.price).toFixed(0)} · {version.inventory_sold}/{version.inventory_quantity} sold
        </p>
      </div>
      <Badge variant={avail <= 0 ? "destructive" : "secondary"} className="text-[9px]">
        {avail <= 0 ? "Sold Out" : `${avail} left`}
      </Badge>
      <EditVersionDialog version={version} />
      <CustomizationFieldsDialog sectionVersionId={version.id} productTitle={version.version_name} />
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMutation.mutate(version.id)}>
        <Trash2 className="w-3 h-3 text-destructive" />
      </Button>
    </div>
  );
}

function CostumeRow({ costume }: { costume: any }) {
  const deleteMutation = useDeleteCostumeProduct();
  const avail = costume.inventory_quantity - costume.inventory_sold;
  const pickup = costume.costume_pickup?.[0];

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground">
          {costume.title}
          {costume.gender && <span className="text-muted-foreground ml-1">({costume.gender})</span>}
        </p>
        <p className="text-[10px] text-muted-foreground">
          ${Number(costume.price).toFixed(0)}
          {costume.deposit_amount && ` · Deposit: $${Number(costume.deposit_amount).toFixed(0)}`}
          {costume.balance_due_date && ` due ${costume.balance_due_date}`}
          {" · "}{costume.inventory_sold}/{costume.inventory_quantity} sold
          {costume.size_options?.length > 0 && ` · Sizes: ${costume.size_options.join(", ")}`}
        </p>
        {pickup?.pickup_location && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
            <MapPin className="w-2.5 h-2.5" /> {pickup.pickup_location}
          </p>
        )}
      </div>
      <Badge variant={costume.status === "sold_out" ? "destructive" : "secondary"} className="text-[9px]">
        {costume.status === "sold_out" ? "Sold Out" : `${avail} left`}
      </Badge>
      <EditCostumeDialog costume={costume} />
      <CustomizationFieldsDialog productId={costume.id} productTitle={costume.title} />
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMutation.mutate(costume.id)}>
        <Trash2 className="w-3 h-3 text-destructive" />
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════
   J'OUVERT CARD
   ═══════════════════════════════════════ */

function JouvertCard({ pkg, eventId }: { pkg: any; eventId: string }) {
  const deleteMutation = useDeleteJouvertPackage();
  return (
    <div className="p-3 rounded-xl border border-border flex items-start justify-between">
      <div>
        <p className="text-sm font-semibold text-foreground">{pkg.name}</p>
        <p className="text-xs text-muted-foreground">${Number(pkg.price).toFixed(0)} · {pkg.sold_count}/{pkg.quantity} sold</p>
        {pkg.bundle_items?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {pkg.bundle_items.map((item: string, i: number) => (
              <Badge key={i} variant="outline" className="text-[10px]">{item}</Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <EditJouvertDialog pkg={pkg} />
        <AddonsDialog jouvertPackageId={pkg.id} productTitle={pkg.name} />
        <CustomizationFieldsDialog jouvertPackageId={pkg.id} productTitle={pkg.name} />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate({ id: pkg.id, eventId })}>
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   AUTOSAVE STORAGE KEY HELPER
   ═══════════════════════════════════════ */

function useLocalDraft<T>(key: string, initialValues: T) {
  const storageKey = `quara_draft_${key}`;
  const [draftId, setDraftId] = useState<string | null>(null);

  // Load saved draft from localStorage on mount
  const loadSaved = useCallback((): Partial<T> | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  }, [storageKey]);

  const saveDraft = useCallback((data: T, id?: string) => {
    localStorage.setItem(storageKey, JSON.stringify({ ...data, _draftId: id }));
    if (id) setDraftId(id);
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setDraftId(null);
  }, [storageKey]);

  return { draftId, setDraftId, loadSaved, saveDraft, clearDraft };
}

/* ═══════════════════════════════════════
   DIALOGS WITH AUTOSAVE
   ═══════════════════════════════════════ */

function CreateBandDialog({ eventId, organizerId, listingMode }: { eventId: string | null; organizerId: string; listingMode: "standalone" | "event_attached" }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const createMutation = useCreateBand();

  const formData = { name, description };

  const handleAutosave = useCallback(async (changed: Record<string, any>) => {
    if (!name.trim()) return null; // Need at least a name

    if (draftId) {
      await supabase.from("bands" as any).update(changed as any).eq("id", draftId);
      return draftId;
    } else {
      const { data, error } = await supabase.from("bands" as any).insert({
        organizer_id: organizerId,
        event_id: listingMode === "event_attached" ? eventId : null,
        listing_mode: listingMode,
        name: name || "Untitled Band",
        description: description || null,
      } as any).select().single() as any;
      if (error) throw error;
      setDraftId(data.id);
      return data.id;
    }
  }, [name, description, draftId, organizerId, eventId, listingMode]);

  const { status, lastSavedAt, error: saveError, setSnapshot } = useAutosave({
    onSave: handleAutosave,
    data: formData,
    enabled: open && !!name.trim(),
    debounceMs: 4000,
  });

  const handleCreate = async () => {
    if (!name) { toast.error("Band name is required"); return; }
    try {
      if (draftId) {
        // Draft already exists, just finalize
        toast.success(`Band "${name}" created!`);
      } else {
        await createMutation.mutateAsync({
          organizer_id: organizerId,
          event_id: listingMode === "event_attached" ? eventId : null,
          listing_mode: listingMode,
          name,
          description: description || undefined,
        });
        toast.success(`Band "${name}" created!`);
      }
      setOpen(false); setName(""); setDescription(""); setDraftId(null);
    } catch (err: any) { toast.error(err.message || "Failed to create band"); }
  };

  const handleClose = async (isOpen: boolean) => {
    if (!isOpen && draftId && !name.trim()) {
      // Discard empty draft
      await supabase.from("bands" as any).delete().eq("id", draftId);
      setDraftId(null);
    }
    if (!isOpen) { setName(""); setDescription(""); setDraftId(null); setSnapshot({}); }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1"><Plus className="w-3.5 h-3.5" /> Add Band</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Create Band</DialogTitle>
            <AutosaveIndicator status={status} lastSavedAt={lastSavedAt} error={saveError} />
          </div>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label>Band Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tribe, Yuma, Bliss" />
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="About this band..." rows={2} />
          </div>
          <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full gradient-primary text-primary-foreground rounded-full">
            {createMutation.isPending ? "Creating..." : "Create Band"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateSectionDialog({ bandId }: { bandId: string }) {
  const [open, setOpen] = useState(false);
  const [sectionGender, setSectionGender] = useState<"women" | "men" | "unisex" | "">("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inventoryLimit, setInventoryLimit] = useState("");
  const [launchOption, setLaunchOption] = useState<"immediate" | "schedule">("immediate");
  const [launchAt, setLaunchAt] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const createMutation = useCreateBandSection();

  const formData = { sectionGender, name, description, inventoryLimit, launchOption, launchAt };

  const handleAutosave = useCallback(async (changed: Record<string, any>) => {
    if (!name.trim() || !sectionGender) return null;

    const payload: Record<string, any> = {};
    if ("name" in changed) payload.name = changed.name;
    if ("sectionGender" in changed) payload.section_gender = changed.sectionGender;
    if ("description" in changed) payload.description = changed.description || null;
    if ("inventoryLimit" in changed) payload.inventory_limit = changed.inventoryLimit ? parseInt(changed.inventoryLimit) : null;
    if ("launchAt" in changed || "launchOption" in changed) {
      payload.launch_at = launchOption === "schedule" && launchAt ? new Date(launchAt).toISOString() : null;
    }

    if (draftId) {
      await supabase.from("band_sections" as any).update(payload as any).eq("id", draftId);
      return draftId;
    } else {
      const { data, error } = await supabase.from("band_sections" as any).insert({
        band_id: bandId,
        name: name || "Untitled Section",
        section_gender: sectionGender,
        description: description || null,
        inventory_limit: inventoryLimit ? parseInt(inventoryLimit) : null,
        launch_at: launchOption === "schedule" && launchAt ? new Date(launchAt).toISOString() : null,
      } as any).select().single() as any;
      if (error) throw error;
      setDraftId(data.id);
      return data.id;
    }
  }, [sectionGender, name, description, inventoryLimit, launchOption, launchAt, draftId, bandId]);

  const { status, lastSavedAt, error: saveError, setSnapshot } = useAutosave({
    onSave: handleAutosave,
    data: formData,
    enabled: open && !!name.trim() && !!sectionGender,
    debounceMs: 4000,
  });

  const handleCreate = async () => {
    if (!sectionGender) { toast.error("Section gender is required"); return; }
    if (!name) { toast.error("Section name is required"); return; }
    if (launchOption === "schedule" && !launchAt) { toast.error("Please select a launch date and time"); return; }
    try {
      if (draftId) {
        toast.success(`Section "${name}" created!`);
      } else {
        await createMutation.mutateAsync({
          band_id: bandId, name,
          section_gender: sectionGender,
          description: description || undefined,
          inventory_limit: inventoryLimit ? parseInt(inventoryLimit) : undefined,
          launch_at: launchOption === "schedule" ? new Date(launchAt).toISOString() : null,
        });
        toast.success(`Section "${name}" created!`);
      }
      setOpen(false); setSectionGender(""); setName(""); setDescription(""); setInventoryLimit(""); setLaunchOption("immediate"); setLaunchAt(""); setDraftId(null);
    } catch (err: any) { toast.error(err.message || "Failed to create section"); }
  };

  const handleClose = async (isOpen: boolean) => {
    if (!isOpen && draftId && !name.trim()) {
      await supabase.from("band_sections" as any).delete().eq("id", draftId);
      setDraftId(null);
    }
    if (!isOpen) { setSectionGender(""); setName(""); setDescription(""); setInventoryLimit(""); setLaunchOption("immediate"); setLaunchAt(""); setDraftId(null); setSnapshot({}); }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs gap-1 h-7"><Plus className="w-3 h-3" /> Section</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Add Section</DialogTitle>
            <AutosaveIndicator status={status} lastSavedAt={lastSavedAt} error={saveError} />
          </div>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {/* Section Gender — required first field */}
          <div className="space-y-2 p-3 rounded-xl border border-border bg-muted/30">
            <Label className="text-foreground font-semibold">Section Gender *</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "women", label: "Women" },
                { value: "men", label: "Men" },
                { value: "unisex", label: "Unisex" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSectionGender(opt.value)}
                  className={`px-3 py-2 rounded-xl border text-center text-xs font-medium transition-all ${
                    sectionGender === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/30"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Section Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Phoenix, Atlantis" />
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Section theme..." />
          </div>
          <div className="space-y-1.5">
            <Label>Inventory Limit (optional)</Label>
            <Input type="number" value={inventoryLimit} onChange={(e) => setInventoryLimit(e.target.value)} placeholder="e.g. 200" />
          </div>

          {/* Launch Options */}
          <div className="space-y-2 p-3 rounded-xl border border-border bg-muted/30">
            <Label className="text-foreground font-semibold flex items-center gap-1.5">
              <Rocket className="w-3.5 h-3.5" /> Launch Options
            </Label>
            <RadioGroup value={launchOption} onValueChange={(v) => setLaunchOption(v as "immediate" | "schedule")} className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="immediate" id="launch-immediate" />
                <Label htmlFor="launch-immediate" className="font-normal cursor-pointer text-xs">Launch Immediately</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="schedule" id="launch-schedule" />
                <Label htmlFor="launch-schedule" className="font-normal cursor-pointer text-xs">Schedule Launch</Label>
              </div>
            </RadioGroup>
            {launchOption === "schedule" && (
              <div className="space-y-1.5 mt-1 pl-6">
                <Label className="text-xs">Launch Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={launchAt}
                  onChange={(e) => setLaunchAt(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <Button onClick={handleCreate} disabled={createMutation.isPending || !sectionGender} className="w-full gradient-primary text-primary-foreground rounded-full">
            {createMutation.isPending ? "Creating..." : "Add Section"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const STRUCTURE_OPTIONS_BY_GENDER: Record<string, { value: "1-piece" | "2-piece" | "board-shorts"; label: string }[]> = {
  women: [
    { value: "1-piece", label: "One Piece" },
    { value: "2-piece", label: "Two Piece" },
  ],
  men: [
    { value: "board-shorts", label: "Board Shorts" },
  ],
  unisex: [
    { value: "1-piece", label: "One Piece" },
    { value: "2-piece", label: "Two Piece" },
    { value: "board-shorts", label: "Board Shorts" },
  ],
};

// ─── Version Template Definitions ───
interface TemplateField {
  field_label: string;
  field_type: string;
  options: string[];
  required: boolean;
}

interface VersionTemplate {
  label: string;
  structure: "1-piece" | "2-piece" | "board-shorts";
  defaultName: string;
  fields: TemplateField[];
}

const VERSION_TEMPLATES: Record<string, VersionTemplate[]> = {
  women: [
    {
      label: "One Piece Template",
      structure: "1-piece",
      defaultName: "One Piece",
      fields: [
        { field_label: "Costume Size", field_type: "dropdown", options: ["XS", "S", "M", "L", "XL", "XXL"], required: true },
        { field_label: "Cup Size", field_type: "dropdown", options: ["A", "B", "C", "D", "DD", "E"], required: true },
        { field_label: "Pant Style", field_type: "dropdown", options: ["Bikini", "High Waist", "Thong"], required: true },
      ],
    },
    {
      label: "Two Piece Template",
      structure: "2-piece",
      defaultName: "Two Piece",
      fields: [
        { field_label: "Top Size", field_type: "dropdown", options: ["XS", "S", "M", "L", "XL", "XXL"], required: true },
        { field_label: "Bottom Size", field_type: "dropdown", options: ["XS", "S", "M", "L", "XL", "XXL"], required: true },
        { field_label: "Cup Size", field_type: "dropdown", options: ["A", "B", "C", "D", "DD", "E"], required: true },
        { field_label: "Pant Style", field_type: "dropdown", options: ["Bikini", "High Waist", "Thong"], required: true },
      ],
    },
  ],
  men: [
    {
      label: "Board Shorts Template",
      structure: "board-shorts",
      defaultName: "Board Shorts",
      fields: [
        { field_label: "Waist Size", field_type: "dropdown", options: ["28", "30", "32", "34", "36", "38", "40"], required: true },
        { field_label: "Shirt Size", field_type: "dropdown", options: ["S", "M", "L", "XL", "XXL"], required: true },
      ],
    },
  ],
  unisex: [],
};

function CreateVersionDialog({ sectionId, sectionGender }: { sectionId: string; sectionGender: string }) {
  const [open, setOpen] = useState(false);
  const [versionName, setVersionName] = useState("");
  const structureOptions = STRUCTURE_OPTIONS_BY_GENDER[sectionGender] || STRUCTURE_OPTIONS_BY_GENDER.unisex;
  const [costumeStructure, setCostumeStructure] = useState<"1-piece" | "2-piece" | "board-shorts">(structureOptions[0].value);
  const [price, setPrice] = useState("");
  const [inventory, setInventory] = useState("100");
  const [description, setDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<VersionTemplate | null>(null);
  const createMutation = useCreateSectionVersion();
  const createField = useCreateCustomizationField();

  const templates = VERSION_TEMPLATES[sectionGender] || [];

  const handleSelectTemplate = (template: VersionTemplate) => {
    setSelectedTemplate(template);
    setVersionName(template.defaultName);
    setCostumeStructure(template.structure);
  };

  // Reset structure when dialog opens (in case gender changed)
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      const opts = STRUCTURE_OPTIONS_BY_GENDER[sectionGender] || STRUCTURE_OPTIONS_BY_GENDER.unisex;
      setCostumeStructure(opts[0].value);
    }
    if (!isOpen) { setVersionName(""); setPrice(""); setInventory("100"); setDescription(""); setSelectedTemplate(null); }
    setOpen(isOpen);
  };

  const handleCreate = async () => {
    if (!versionName) { toast.error("Version name is required"); return; }
    if (!price) { toast.error("Price is required"); return; }
    try {
      const version = await createMutation.mutateAsync({
        section_id: sectionId,
        version_name: versionName,
        costume_structure: costumeStructure,
        price: parseFloat(price),
        inventory_quantity: parseInt(inventory) || 100,
        description: description || undefined,
      });

      // Auto-create customization fields from template
      if (selectedTemplate && version?.id) {
        for (let i = 0; i < selectedTemplate.fields.length; i++) {
          const f = selectedTemplate.fields[i];
          await createField.mutateAsync({
            section_version_id: version.id,
            field_label: f.field_label,
            field_type: f.field_type,
            options: f.options,
            required: f.required,
            sort_order: i + 1,
          });
        }
      }

      toast.success(`Version "${versionName}" added!${selectedTemplate ? " Template fields created." : ""}`);
      handleOpenChange(false);
    } catch (err: any) { toast.error(err.message || "Failed to create version"); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6" title="Add Version">
          <Layers className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Version</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {/* Template Suggestions */}
          {templates.length > 0 && (
            <div className="space-y-2 p-3 rounded-xl border border-border bg-accent/10">
              <div className="flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-primary" />
                <Label className="text-foreground font-semibold text-xs">Quick Start Templates</Label>
              </div>
              <p className="text-[10px] text-muted-foreground">Select a template to auto-configure customization fields.</p>
              <div className={`grid gap-2 ${templates.length <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {templates.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`px-3 py-2 rounded-xl border text-center text-xs font-medium transition-all ${
                      selectedTemplate?.label === tpl.label
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground/30"
                    }`}
                  >
                    {tpl.label.replace(" Template", "")}
                  </button>
                ))}
              </div>
              {selectedTemplate && (
                <div className="space-y-1 mt-1">
                  <p className="text-[10px] font-medium text-foreground">Fields that will be created:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedTemplate.fields.map((f) => (
                      <Badge key={f.field_label} variant="outline" className="text-[9px]">{f.field_label}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Version Name *</Label>
            <Input value={versionName} onChange={(e) => setVersionName(e.target.value)} placeholder="e.g. One Piece, Two Piece, Step Out" />
          </div>

          <div className="space-y-2 p-3 rounded-xl border border-border bg-muted/30">
            <Label className="text-foreground font-semibold">Costume Structure *</Label>
            <div className={`grid gap-2 ${structureOptions.length <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
              {structureOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCostumeStructure(opt.value)}
                  className={`px-3 py-2 rounded-xl border text-center text-xs font-medium transition-all ${
                    costumeStructure === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/30"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Options based on section gender: <span className="capitalize font-medium">{sectionGender}</span>
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Price *</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 350" />
          </div>
          <div className="space-y-1.5">
            <Label>Inventory Limit</Label>
            <Input type="number" value={inventory} onChange={(e) => setInventory(e.target.value)} placeholder="e.g. 100" />
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Version details..." rows={2} />
          </div>
          <Button onClick={handleCreate} disabled={createMutation.isPending || createField.isPending} className="w-full gradient-primary text-primary-foreground rounded-full">
            {createMutation.isPending || createField.isPending ? "Creating..." : selectedTemplate ? "Create with Template" : "Add Version"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateCostumeDialog({ sectionId }: { sectionId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [gender, setGender] = useState("");
  const [inventory, setInventory] = useState("100");
  const [sizes, setSizes] = useState<string[]>([]);
  const [depositAmount, setDepositAmount] = useState("");
  const [balanceDueDate, setBalanceDueDate] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupInstructions, setPickupInstructions] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const createCostume = useCreateCostumeProduct();
  const upsertPickup = useUpsertCostumePickup();

  const formData = { title, price, gender, inventory, sizes, depositAmount, balanceDueDate, pickupLocation, pickupDate, pickupInstructions };

  const handleAutosave = useCallback(async (changed: Record<string, any>) => {
    if (!title.trim() || !price) return null;

    const payload: Record<string, any> = {};
    if ("title" in changed) payload.title = changed.title;
    if ("price" in changed) payload.price = parseFloat(changed.price) || 0;
    if ("gender" in changed) payload.gender = changed.gender || null;
    if ("inventory" in changed) payload.inventory_quantity = parseInt(changed.inventory) || 100;
    if ("sizes" in changed) payload.size_options = changed.sizes;
    if ("depositAmount" in changed) payload.deposit_amount = changed.depositAmount ? parseFloat(changed.depositAmount) : null;
    if ("balanceDueDate" in changed) payload.balance_due_date = changed.balanceDueDate || null;

    if (draftId) {
      await supabase.from("costume_products" as any).update({ ...payload, status: "draft" } as any).eq("id", draftId);
      return draftId;
    } else {
      const { data, error } = await supabase.from("costume_products" as any).insert({
        section_id: sectionId,
        title: title || "Untitled Costume",
        price: parseFloat(price) || 0,
        gender: gender || null,
        inventory_quantity: parseInt(inventory) || 100,
        size_options: sizes,
        deposit_amount: depositAmount ? parseFloat(depositAmount) : null,
        balance_due_date: balanceDueDate || null,
        status: "draft",
      } as any).select().single() as any;
      if (error) throw error;
      setDraftId(data.id);
      return data.id;
    }
  }, [title, price, gender, inventory, sizes, depositAmount, balanceDueDate, draftId, sectionId]);

  const { status, lastSavedAt, error: saveError, setSnapshot } = useAutosave({
    onSave: handleAutosave,
    data: formData,
    enabled: open && !!title.trim() && !!price,
    debounceMs: 4000,
  });

  const toggleSize = (s: string) => {
    setSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const handleCreate = async () => {
    if (!title || !price) { toast.error("Title and price required"); return; }
    try {
      if (draftId) {
        // Update the draft to active
        await supabase.from("costume_products" as any).update({ status: "active" } as any).eq("id", draftId);
        // Handle pickup
        if (pickupLocation || pickupDate) {
          await upsertPickup.mutateAsync({
            product_id: draftId,
            pickup_location: pickupLocation || undefined,
            pickup_date: pickupDate || undefined,
            pickup_instructions: pickupInstructions || undefined,
          });
        }
        toast.success(`Costume "${title}" created!`);
      } else {
        const costume = await createCostume.mutateAsync({
          section_id: sectionId,
          title,
          price: parseFloat(price),
          gender: gender || undefined,
          inventory_quantity: parseInt(inventory) || 100,
          size_options: sizes,
          deposit_amount: depositAmount ? parseFloat(depositAmount) : undefined,
          balance_due_date: balanceDueDate || undefined,
        });
        if (pickupLocation || pickupDate) {
          await upsertPickup.mutateAsync({
            product_id: costume.id,
            pickup_location: pickupLocation || undefined,
            pickup_date: pickupDate || undefined,
            pickup_instructions: pickupInstructions || undefined,
          });
        }
        toast.success(`Costume "${title}" created!`);
      }
      resetAndClose();
    } catch (err: any) { toast.error(err.message || "Failed"); }
  };

  const resetAndClose = () => {
    setOpen(false); setTitle(""); setPrice(""); setGender(""); setInventory("100");
    setSizes([]); setDepositAmount(""); setBalanceDueDate(""); setPickupLocation(""); setPickupDate(""); setPickupInstructions(""); setDraftId(null); setSnapshot({});
  };

  const handleClose = async (isOpen: boolean) => {
    if (!isOpen && draftId) {
      // Delete draft costume on cancel
      await supabase.from("costume_products" as any).delete().eq("id", draftId);
    }
    if (!isOpen) resetAndClose();
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-[11px] gap-0.5 h-6 px-2"><Plus className="w-3 h-3" /> Costume</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Add Costume Product</DialogTitle>
            <AutosaveIndicator status={status} lastSavedAt={lastSavedAt} error={saveError} />
          </div>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Female Frontline" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Price ($)</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="unisex">Unisex</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Inventory</Label>
            <Input type="number" value={inventory} onChange={(e) => setInventory(e.target.value)} min={1} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Deposit Amount ($)</Label>
              <Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label>Balance Due Date</Label>
              <Input type="date" value={balanceDueDate} onChange={(e) => setBalanceDueDate(e.target.value)} />
            </div>
          </div>
          {depositAmount && (
            <p className="text-[11px] text-muted-foreground">
              Buyers can pay ${depositAmount} deposit now, remaining ${price ? `$${(parseFloat(price) - parseFloat(depositAmount)).toFixed(0)}` : "balance"} due by {balanceDueDate || "TBD"}
            </p>
          )}
          <div className="space-y-1.5">
            <Label>Sizes</Label>
            <div className="flex flex-wrap gap-1.5">
              {COSTUME_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSize(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    sizes.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Pickup Location</Label>
            <Input value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} placeholder="e.g. Port of Spain Mas Camp" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Pickup Date</Label>
              <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Pickup Instructions</Label>
            <Textarea value={pickupInstructions} onChange={(e) => setPickupInstructions(e.target.value)} placeholder="Bring ID and order confirmation..." rows={2} />
          </div>
          <Button onClick={handleCreate} disabled={createCostume.isPending} className="w-full gradient-primary text-primary-foreground rounded-full">
            {createCostume.isPending ? "Creating..." : "Add Costume"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateJouvertDialog({ eventId, listingMode }: { eventId: string | null; listingMode: "standalone" | "event_attached" }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [bundleItemsText, setBundleItemsText] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const createMutation = useCreateJouvertPackage();

  const formData = { name, price, quantity, bundleItemsText };

  const handleAutosave = useCallback(async (changed: Record<string, any>) => {
    if (!name.trim() || !price) return null;

    const bundleItems = bundleItemsText.split(",").map((s) => s.trim()).filter(Boolean);

    if (draftId) {
      const payload: Record<string, any> = {};
      if ("name" in changed) payload.name = changed.name;
      if ("price" in changed) payload.price = parseFloat(changed.price) || 0;
      if ("quantity" in changed) payload.quantity = changed.quantity;
      if ("bundleItemsText" in changed) payload.bundle_items = bundleItems;
      await supabase.from("jouvert_packages" as any).update(payload as any).eq("id", draftId);
      return draftId;
    } else {
      const { data, error } = await supabase.from("jouvert_packages" as any).insert({
        event_id: listingMode === "event_attached" ? eventId : null,
        listing_mode: listingMode,
        name: name || "Untitled Package",
        price: parseFloat(price) || 0,
        quantity,
        bundle_items: bundleItems,
      } as any).select().single() as any;
      if (error) throw error;
      setDraftId(data.id);
      return data.id;
    }
  }, [name, price, quantity, bundleItemsText, draftId, eventId, listingMode]);

  const { status, lastSavedAt, error: saveError, setSnapshot } = useAutosave({
    onSave: handleAutosave,
    data: formData,
    enabled: open && !!name.trim() && !!price,
    debounceMs: 4000,
  });

  const handleCreate = async () => {
    if (!name || !price) { toast.error("Name and price required"); return; }
    const bundleItems = bundleItemsText.split(",").map((s) => s.trim()).filter(Boolean);
    try {
      if (draftId) {
        // Draft already saved, just confirm
        toast.success("J'ouvert package created!");
      } else {
        await createMutation.mutateAsync({
          event_id: listingMode === "event_attached" ? eventId : null,
          listing_mode: listingMode,
          name,
          price: parseFloat(price),
          quantity,
          bundle_items: bundleItems,
        });
        toast.success("J'ouvert package created!");
      }
      resetAndClose();
    } catch (err: any) { toast.error(err.message || "Failed"); }
  };

  const resetAndClose = () => {
    setOpen(false); setName(""); setPrice(""); setQuantity(100); setBundleItemsText(""); setDraftId(null); setSnapshot({});
  };

  const handleClose = async (isOpen: boolean) => {
    if (!isOpen && draftId) {
      await supabase.from("jouvert_packages" as any).delete().eq("id", draftId);
    }
    if (!isOpen) resetAndClose();
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1"><Plus className="w-3.5 h-3.5" /> Add Package</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Create J'ouvert Package</DialogTitle>
            <AutosaveIndicator status={status} lastSavedAt={lastSavedAt} error={saveError} />
          </div>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label>Package Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Premium J'ouvert Pack" />
          </div>
          <div className="space-y-1.5">
            <Label>Price ($)</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label>Quantity</Label>
            <Input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} min={1} />
          </div>
          <div className="space-y-1.5">
            <Label>Bundle Items (comma-separated)</Label>
            <Textarea value={bundleItemsText} onChange={(e) => setBundleItemsText(e.target.value)} placeholder="T-shirt, Paint, Whistle, Wristband" rows={2} />
          </div>
          <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full gradient-primary text-primary-foreground rounded-full">
            {createMutation.isPending ? "Creating..." : "Create Package"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
