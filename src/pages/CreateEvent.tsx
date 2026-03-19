import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useOrganizerByUserId } from "@/hooks/use-organizer";
import { useCarnivals } from "@/hooks/use-carnivals";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Lock, MapPin, Plus, Trash2, AlertTriangle, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { CATEGORIES } from "@/types";
import { usePlatformKillSwitches, KillSwitchBanner } from "@/hooks/use-kill-switches";
import { useAutosave } from "@/hooks/use-autosave";
import { useDraftLock } from "@/hooks/use-draft-lock";
import { AutosaveIndicator } from "@/components/AutosaveIndicator";
import { DraftRecoveryDialog } from "@/components/event-form/DraftRecoveryDialog";
import { ImageUploadField } from "@/components/ImageUploadField";

type PublishOption = "draft" | "publish" | "schedule";

interface LineupItem {
  id?: string;
  artist_name: string;
  image_url: string;
}

interface AgendaItem {
  id?: string;
  title: string;
  time: string;
  description: string;
}

interface EventFormState {
  title: string;
  description: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  country: string;
  category: string;
  date: string;
  endDate: string;
  price: string;
  imageUrl: string;
  hasLineup: boolean;
  hasAgenda: boolean;
  carnivalId: string;
  carnivalYear: string;
}

const INITIAL_FORM: EventFormState = {
  title: "",
  description: "",
  venue: "",
  address: "",
  city: "",
  state: "",
  country: "",
  category: "fete",
  date: "",
  endDate: "",
  price: "",
  imageUrl: "",
  hasLineup: false,
  hasAgenda: false,
  carnivalId: "",
  carnivalYear: "",
};

const FORM_TO_DB: Record<string, string> = {
  title: "title",
  description: "description",
  venue: "venue",
  address: "address",
  city: "city",
  state: "state",
  country: "country",
  category: "category",
  imageUrl: "image_url",
  hasLineup: "has_lineup",
  hasAgenda: "has_agenda",
  carnivalId: "carnival_id",
  carnivalYear: "carnival_year",
};

export default function CreateEvent() {
  const { id: editEventId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: organizer } = useOrganizerByUserId(user?.id);
  const { data: carnivals } = useCarnivals();
  const { eventCreationDisabled } = usePlatformKillSwitches();

  const [loading, setLoading] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(editEventId || null);
  const [isEditMode, setIsEditMode] = useState(!!editEventId);
  const [publishOption, setPublishOption] = useState<PublishOption>("draft");
  const [publishAt, setPublishAt] = useState("");
  const [ticketSalesOption, setTicketSalesOption] = useState<"immediate" | "schedule">("immediate");
  const [ticketSalesStartAt, setTicketSalesStartAt] = useState("");
  const [form, setForm] = useState<EventFormState>(INITIAL_FORM);

  // Ticket tiers state (for edit mode)
  const [ticketTiers, setTicketTiers] = useState<{ id?: string; name: string; price: string; quantity: string }[]>([]);
  const [tiersLoaded, setTiersLoaded] = useState(false);

  // Draft recovery state
  const [showRecovery, setShowRecovery] = useState(false);
  const [existingDrafts, setExistingDrafts] = useState<any[]>([]);
  const [recoveryChecked, setRecoveryChecked] = useState(!!editEventId);

  // Lineup & Agenda state
  const [lineupItems, setLineupItems] = useState<LineupItem[]>([]);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);

  // Track original carnival and whether event has purchases (for warning)
  const [originalCarnivalId, setOriginalCarnivalId] = useState<string>("");
  const [hasPurchases, setHasPurchases] = useState(false);

  // Load existing event for edit mode
  useEffect(() => {
    if (!editEventId) return;
    const loadEvent = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("id", editEventId)
        .single() as any;

      if (data) {
        const loaded: EventFormState = {
          title: data.title || "",
          description: data.description || "",
          venue: data.venue || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          country: data.country || "",
          category: data.category || "fete",
          date: data.date ? new Date(data.date).toISOString().slice(0, 16) : "",
          endDate: data.end_date ? new Date(data.end_date).toISOString().slice(0, 16) : "",
          price: data.price ? String(data.price) : "",
          imageUrl: data.image_url || "",
          hasLineup: data.has_lineup || false,
          hasAgenda: data.has_agenda || false,
          carnivalId: data.carnival_id || "",
          carnivalYear: data.carnival_year ? String(data.carnival_year) : "",
        };
        setForm(loaded);
        setOriginalCarnivalId(data.carnival_id || "");

        // Set publish option based on current status
        if (data.publishing_status === "scheduled") {
          setPublishOption("schedule");
          if (data.publish_at) setPublishAt(new Date(data.publish_at).toISOString().slice(0, 16));
        } else if (data.publishing_status === "published") {
          setPublishOption("publish");
        } else {
          setPublishOption("draft");
        }

        if (data.ticket_sales_start_at) {
          setTicketSalesOption("schedule");
          setTicketSalesStartAt(new Date(data.ticket_sales_start_at).toISOString().slice(0, 16));
        }

        setTimeout(() => setSnapshot(loaded), 0);

        // Check if event has purchases
        const { count } = await supabase
          .from("purchases")
          .select("id", { count: "exact", head: true })
          .eq("event_id", editEventId)
          .eq("status", "confirmed");
        setHasPurchases((count || 0) > 0);
      }

      // Load ticket tiers
      const { data: tiers } = await supabase
        .from("ticket_tiers")
        .select("*")
        .eq("event_id", editEventId)
        .order("created_at", { ascending: true });

      if (tiers) {
        setTicketTiers(tiers.map((t: any) => ({
          id: t.id,
          name: t.name,
          price: String(t.price),
          quantity: String(t.quantity),
        })));
      }

      // Load lineup items
      const { data: lineupData } = await supabase
        .from("event_lineup")
        .select("*")
        .eq("event_id", editEventId)
        .order("sort_order", { ascending: true });
      if (lineupData) {
        setLineupItems(lineupData.map((l: any) => ({
          id: l.id,
          artist_name: l.artist_name,
          image_url: l.image_url || "",
        })));
      }

      // Load agenda items
      const { data: agendaData } = await supabase
        .from("event_agenda")
        .select("*")
        .eq("event_id", editEventId)
        .order("sort_order", { ascending: true });
      if (agendaData) {
        setAgendaItems(agendaData.map((a: any) => ({
          id: a.id,
          title: a.title,
          time: a.time,
          description: a.description || "",
        })));
      }

      setTiersLoaded(true);
    };
    loadEvent();
  }, [editEventId]);


  useEffect(() => {
    if (!organizer?.id || recoveryChecked) return;
    const checkDrafts = async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, updated_at, venue, city")
        .eq("organizer_id", organizer.id)
        .eq("publishing_status", "draft")
        .order("updated_at", { ascending: false })
        .limit(5) as any;

      if (data && data.length > 0) {
        setExistingDrafts(data);
        setShowRecovery(true);
      }
      setRecoveryChecked(true);
    };
    checkDrafts();
  }, [organizer?.id, recoveryChecked]);

  // Load a draft into the form
  const loadDraft = async (id: string) => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single() as any;

    if (data) {
      setDraftId(id);
      const loaded: EventFormState = {
        title: data.title || "",
        description: data.description || "",
        venue: data.venue || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        country: data.country || "",
        category: data.category || "fete",
        date: data.date ? new Date(data.date).toISOString().slice(0, 16) : "",
        endDate: data.end_date ? new Date(data.end_date).toISOString().slice(0, 16) : "",
        price: data.price ? String(data.price) : "",
        imageUrl: data.image_url || "",
        hasLineup: data.has_lineup || false,
        hasAgenda: data.has_agenda || false,
        carnivalId: data.carnival_id || "",
        carnivalYear: data.carnival_year ? String(data.carnival_year) : "",
      };
      setForm(loaded);

      if (data.ticket_sales_start_at) {
        setTicketSalesOption("schedule");
        setTicketSalesStartAt(new Date(data.ticket_sales_start_at).toISOString().slice(0, 16));
      }
      if (data.publish_at) {
        setPublishOption("schedule");
        setPublishAt(new Date(data.publish_at).toISOString().slice(0, 16));
      }

      // Snapshot current state so autosave doesn't immediately fire
      setTimeout(() => setSnapshot(loaded), 0);
    }
    setShowRecovery(false);
  };

  const discardDraft = async (id: string) => {
    await supabase.from("events").delete().eq("id", id).eq("publishing_status", "draft") as any;
    setExistingDrafts((prev) => prev.filter((d) => d.id !== id));
    if (existingDrafts.length <= 1) setShowRecovery(false);
    toast.success("Draft discarded");
  };

  // Autosave handler — maps form fields to DB columns and upserts
  const handleAutosave = useCallback(
    async (changedFields: Record<string, any>) => {
      if (!organizer?.id) return null;

      const dbPayload: Record<string, any> = {};

      for (const [formKey, val] of Object.entries(changedFields)) {
        const dbKey = FORM_TO_DB[formKey];
        if (!dbKey) continue;

        if (formKey === "carnivalId") {
          dbPayload[dbKey] = val || null;
        } else if (formKey === "carnivalYear") {
          dbPayload[dbKey] = val ? parseInt(val) : null;
        } else if (formKey === "state") {
          dbPayload[dbKey] = val || null;
        } else {
          dbPayload[dbKey] = val;
        }
      }

      if ("date" in changedFields && changedFields.date) {
        dbPayload.date = new Date(changedFields.date).toISOString();
      }
      if ("endDate" in changedFields) {
        dbPayload.end_date = changedFields.endDate ? new Date(changedFields.endDate).toISOString() : null;
      }
      if ("price" in changedFields) {
        dbPayload.price = changedFields.price ? parseFloat(changedFields.price) : null;
        dbPayload.min_ticket_price = dbPayload.price;
      }

      if (draftId) {
        const { error } = await supabase.from("events").update(dbPayload as any).eq("id", draftId);
        if (error) throw error;
        return draftId;
      } else {
        // Create a new draft event
        const { data, error } = await supabase
          .from("events")
          .insert({
            ...dbPayload,
            organizer_id: organizer.id,
            publishing_status: "draft",
            sales_status: "on_sale",
            date: dbPayload.date || new Date().toISOString(),
            title: dbPayload.title || "Untitled Event",
          } as any)
          .select()
          .single();

        if (error) throw error;
        setDraftId(data.id);
        return data.id;
      }
    },
    [organizer?.id, draftId]
  );

  const {
    status: autosaveStatus,
    lastSavedAt,
    error: autosaveError,
    setSnapshot,
    flush,
  } = useAutosave({
    onSave: handleAutosave as any,
    data: form,
    enabled: !!organizer?.id && !loading,
    debounceMs: 4000,
  });

  // Draft lock
  const { isLockedByOther } = useDraftLock({
    recordId: draftId,
    userId: user?.id,
    enabled: !!draftId,
  });

  if (eventCreationDisabled) {
    return <KillSwitchBanner message="Event creation is temporarily paused. Please check back shortly." />;
  }

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectedCarnival = carnivals?.find((c) => c.id === form.carnivalId);
  const availableYears = selectedCarnival?.carnival_seasons?.map((s) => s.year) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizer) {
      toast.error("No organizer account found");
      return;
    }
    if (publishOption === "schedule" && !publishAt) {
      toast.error("Please select a publish date and time");
      return;
    }
    if (ticketSalesOption === "schedule" && !ticketSalesStartAt) {
      toast.error("Please select a ticket sales start date and time");
      return;
    }
    setLoading(true);

    // Flush any pending autosave first
    await flush();

    const publishingStatus =
      publishOption === "draft" ? "draft" : publishOption === "schedule" ? "scheduled" : "published";

    const payload = {
      title: form.title,
      description: form.description,
      venue: form.venue,
      address: form.address,
      city: form.city,
      state: form.state || null,
      country: form.country,
      category: form.category,
      date: new Date(form.date).toISOString(),
      end_date: form.endDate ? new Date(form.endDate).toISOString() : null,
      price: form.price ? parseFloat(form.price) : null,
      min_ticket_price: form.price ? parseFloat(form.price) : null,
      image_url: form.imageUrl || null,
      has_lineup: form.hasLineup,
      has_agenda: form.hasAgenda,
      organizer_id: organizer.id,
      sales_status: "on_sale",
      carnival_id: form.carnivalId || null,
      carnival_year: form.carnivalYear ? parseInt(form.carnivalYear) : null,
      publishing_status: publishingStatus,
      publish_at: publishOption === "schedule" ? new Date(publishAt).toISOString() : null,
      ticket_sales_start_at: ticketSalesOption === "schedule" ? new Date(ticketSalesStartAt).toISOString() : null,
      editing_by: null,
      editing_at: null,
    } as any;

    try {
      let data: any;
      if (draftId) {
        const res = await supabase.from("events").update(payload).eq("id", draftId).select().single();
        if (res.error) throw res.error;
        data = res.data;
      } else {
        const res = await supabase.from("events").insert(payload).select().single();
        if (res.error) throw res.error;
        data = res.data;
      }

      const eventId = data.id;

      // Save ticket tiers
      if (ticketTiers.length > 0) {
        for (const tier of ticketTiers) {
          if (tier.id) {
            // Update existing tier
            await supabase.from("ticket_tiers").update({
              name: tier.name,
              price: parseFloat(tier.price) || 0,
              quantity: parseInt(tier.quantity) || 0,
            } as any).eq("id", tier.id);
          } else {
            // Insert new tier
            await supabase.from("ticket_tiers").insert({
              event_id: eventId,
              name: tier.name,
              price: parseFloat(tier.price) || 0,
              quantity: parseInt(tier.quantity) || 0,
            } as any);
          }
        }
      }

      const statusMsg = isEditMode
        ? "Event updated!"
        : publishingStatus === "draft"
        ? "Event saved as draft!"
        : publishingStatus === "scheduled"
        ? "Event scheduled for publishing!"
        : "Event published!";
      toast.success(statusMsg);
      navigate(`/events/${eventId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-lg font-semibold text-foreground mb-2">Sign in to create events</p>
        <Button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground rounded-full">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8 max-w-lg mx-auto">
      {/* Draft Recovery Dialog */}
      <DraftRecoveryDialog
        open={showRecovery}
        onOpenChange={setShowRecovery}
        drafts={existingDrafts}
        onResume={loadDraft}
        onDiscard={discardDraft}
        onStartFresh={() => setShowRecovery(false)}
      />

      {/* Lock Warning */}
      {isLockedByOther && (
        <div className="mx-4 mt-4 p-3 rounded-xl border border-destructive/30 bg-destructive/5 flex items-center gap-2">
          <Lock className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive font-medium">
            This event is currently being edited by another team member. Changes may conflict.
          </p>
        </div>
      )}

      {/* Header with autosave indicator */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <Link to="/dashboard" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground">
            {isEditMode ? "Edit Event" : draftId ? "Edit Draft" : "Create Event"}
          </h1>
        </div>
        <AutosaveIndicator status={autosaveStatus} lastSavedAt={lastSavedAt} error={autosaveError} />
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 space-y-4">
        <div className="space-y-2">
          <Label>Event Title *</Label>
          <Input value={form.title} onChange={(e) => handleChange("title", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)} rows={4} />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => handleChange("category", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Carnival Association */}
        <div className="space-y-2 p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5">
          <Label className="text-primary font-semibold">Carnival Association</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Link this event to a carnival to show it on the carnival hub page.
          </p>
          <Select
            value={form.carnivalId}
            onValueChange={(v) => {
              handleChange("carnivalId", v === "none" ? "" : v);
              handleChange("carnivalYear", "");
            }}
          >
            <SelectTrigger><SelectValue placeholder="Select a carnival (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No carnival</SelectItem>
              {carnivals?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name} — {c.city}, {c.country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.carnivalId && availableYears.length > 0 && (
            <div className="space-y-2 mt-2">
              <Label>Season Year</Label>
              <Select value={form.carnivalYear} onValueChange={(v) => handleChange("carnivalYear", v)}>
                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>
                  {availableYears.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
           )}
          {isEditMode && hasPurchases && form.carnivalId !== originalCarnivalId && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 mt-2">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">
                Changing the carnival will update where this event appears. Existing purchases will remain valid.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Start Date *</Label>
            <Input type="datetime-local" value={form.date} onChange={(e) => handleChange("date", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input type="datetime-local" value={form.endDate} onChange={(e) => handleChange("endDate", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>City *</Label>
            <Input value={form.city} onChange={(e) => handleChange("city", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Country *</Label>
            <Input value={form.country} onChange={(e) => handleChange("country", e.target.value)} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Specific Location</Label>
          <Input
            value={form.venue}
            onChange={(e) => handleChange("venue", e.target.value)}
            placeholder="e.g. Queen's Park Savannah, Brooklyn Museum"
          />
          <p className="text-xs text-muted-foreground">
            The venue or landmark where the event takes place.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Address</Label>
          <Input
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="e.g. 123 Main Street"
          />
        </div>
        {form.city && !form.venue && !form.address && (
          <div className="p-3 rounded-xl border border-primary/30 bg-primary/5">
            <p className="text-xs text-primary font-medium flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              Add a specific event location (venue or address) to display a map on your event page. If no location is provided, the map will not appear.
            </p>
          </div>
        )}
        <div className="space-y-2">
          <Label>Price ($)</Label>
          <Input type="number" step="0.01" value={form.price} onChange={(e) => handleChange("price", e.target.value)} />
        </div>
        <ImageUploadField
          value={form.imageUrl}
          onChange={(url) => handleChange("imageUrl", url)}
          userId={user?.id}
          folder="events"
          label="Event Image"
          fallbackTitle={form.title}
          fallbackDate={form.date}
          fallbackLocation={[form.venue, form.city].filter(Boolean).join(", ")}
          fallbackCategory={form.category}
        />
        <div className="flex items-center justify-between py-2">
          <Label>Has Lineup</Label>
          <Switch checked={form.hasLineup} onCheckedChange={(v) => handleChange("hasLineup", v)} />
        </div>
        <div className="flex items-center justify-between py-2">
          <Label>Has Agenda</Label>
          <Switch checked={form.hasAgenda} onCheckedChange={(v) => handleChange("hasAgenda", v)} />
        </div>

        {/* Publish Options */}
        <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/30">
          <Label className="text-foreground font-semibold">Publish Options</Label>
          <RadioGroup value={publishOption} onValueChange={(v) => setPublishOption(v as PublishOption)} className="space-y-2">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="draft" id="draft" />
              <Label htmlFor="draft" className="font-normal cursor-pointer">Save as Draft</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="publish" id="publish" />
              <Label htmlFor="publish" className="font-normal cursor-pointer">Publish Now</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="schedule" id="schedule" />
              <Label htmlFor="schedule" className="font-normal cursor-pointer">Schedule Publish</Label>
            </div>
          </RadioGroup>
          {publishOption === "schedule" && (
            <div className="space-y-2 mt-2 pl-7">
              <Label>Publish Date & Time *</Label>
              <Input type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} required />
            </div>
          )}
        </div>

        {/* Ticket Sales Options */}
        <div className="space-y-3 p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5">
          <Label className="text-primary font-semibold">Ticket Sales Launch</Label>
          <p className="text-xs text-muted-foreground">
            Control when ticket purchases become available. The event page will be visible, but purchase buttons will be disabled until the launch time.
          </p>
          <RadioGroup value={ticketSalesOption} onValueChange={(v) => setTicketSalesOption(v as "immediate" | "schedule")} className="space-y-2">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="immediate" id="sales-immediate" />
              <Label htmlFor="sales-immediate" className="font-normal cursor-pointer">Start Immediately</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="schedule" id="sales-schedule" />
              <Label htmlFor="sales-schedule" className="font-normal cursor-pointer">Schedule Ticket Sales</Label>
            </div>
          </RadioGroup>
          {ticketSalesOption === "schedule" && (
            <div className="space-y-2 mt-2 pl-7">
              <Label>Ticket Sales Start Date & Time *</Label>
              <Input type="datetime-local" value={ticketSalesStartAt} onChange={(e) => setTicketSalesStartAt(e.target.value)} required />
            </div>
          )}
        </div>

        {/* Ticket Tiers */}
        <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <Label className="text-foreground font-semibold">Ticket Tiers</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full gap-1 h-7 text-xs"
              onClick={() => setTicketTiers((prev) => [...prev, { name: "", price: "0", quantity: "100" }])}
            >
              <Plus className="w-3 h-3" /> Add Tier
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Define ticket types and pricing. You can add tiers now or after creating the event.
          </p>
          {ticketTiers.length > 0 && (
            <div className="space-y-3">
              {ticketTiers.map((tier, i) => (
                <div key={tier.id || `new-${i}`} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={tier.name}
                      onChange={(e) => {
                        const updated = [...ticketTiers];
                        updated[i] = { ...updated[i], name: e.target.value };
                        setTicketTiers(updated);
                      }}
                      placeholder="e.g. General, VIP"
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <Label className="text-xs">Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={tier.price}
                      onChange={(e) => {
                        const updated = [...ticketTiers];
                        updated[i] = { ...updated[i], price: e.target.value };
                        setTicketTiers(updated);
                      }}
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      value={tier.quantity}
                      onChange={(e) => {
                        const updated = [...ticketTiers];
                        updated[i] = { ...updated[i], quantity: e.target.value };
                        setTicketTiers(updated);
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                    onClick={async () => {
                      if (tier.id) {
                        await supabase.from("ticket_tiers").delete().eq("id", tier.id);
                        toast.success("Tier deleted");
                      }
                      setTicketTiers((prev) => prev.filter((_, j) => j !== i));
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading || isLockedByOther}
          className="w-full gradient-primary text-primary-foreground font-semibold rounded-full h-12"
        >
          {loading
            ? "Saving..."
            : isEditMode
            ? "Save Changes"
            : publishOption === "draft"
            ? "Save Draft"
            : publishOption === "schedule"
            ? "Schedule Event"
            : "Publish Event"}
        </Button>
      </form>
    </div>
  );
}
