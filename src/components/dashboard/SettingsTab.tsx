import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useOrganizerMembers, type OrganizerMembership } from "@/hooks/use-organizer-members";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2, Globe, Instagram, FileText, Users, Percent, Save,
  Trash2, Plus, UserPlus, Tag, Camera, X, CreditCard, CheckCircle2, ExternalLink, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { Organizer } from "@/types";

const EVENT_TYPE_OPTIONS = [
  { value: "fete", label: "Fete" },
  { value: "carnival", label: "Carnival" },
  { value: "festival", label: "Festival" },
  { value: "party", label: "Party" },
  { value: "experience", label: "Experience" },
  { value: "concert", label: "Concert" },
  { value: "brunch", label: "Brunch" },
  { value: "boat_ride", label: "Boat Ride" },
  { value: "jouvert", label: "J'ouvert" },
  { value: "cooler_fete", label: "Cooler Fete" },
  { value: "all_inclusive", label: "All Inclusive" },
];

interface SettingsTabProps {
  organizer: Organizer;
}

export function SettingsTab({ organizer }: SettingsTabProps) {
  return (
    <div className="px-4 py-5 space-y-8 max-w-2xl">
      <BrandInfoSection organizer={organizer} />
      <Separator />
      <EventTypesSection organizer={organizer} />
      <Separator />
      <PayoutsSection organizer={organizer} />
      <Separator />
      <CommissionSection organizer={organizer} />
      <Separator />
      <TeamSection organizerId={organizer.id} />
    </div>
  );
}

/* ─── Brand Info ─── */

function BrandInfoSection({ organizer }: { organizer: Organizer }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: organizer.name || "",
    bio: organizer.bio || "",
    instagram: organizer.instagram || "",
    website: organizer.website || "",
  });

  useEffect(() => {
    setForm({
      name: organizer.name || "",
      bio: organizer.bio || "",
      instagram: organizer.instagram || "",
      website: organizer.website || "",
    });
  }, [organizer]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${organizer.id}/logo.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("organizer-logos")
        .upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("organizer-logos")
        .getPublicUrl(filePath);

      const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateErr } = await supabase
        .from("organizers")
        .update({ logo_url: logoUrl })
        .eq("id", organizer.id);
      if (updateErr) throw updateErr;

      toast.success("Logo updated!");
      queryClient.invalidateQueries({ queryKey: ["organizer-by-user"] });
      queryClient.invalidateQueries({ queryKey: ["organizer", organizer.slug] });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    setUploading(true);
    try {
      // List and remove files in the organizer's folder
      const { data: files } = await supabase.storage
        .from("organizer-logos")
        .list(organizer.id);

      if (files && files.length > 0) {
        await supabase.storage
          .from("organizer-logos")
          .remove(files.map((f) => `${organizer.id}/${f.name}`));
      }

      const { error } = await supabase
        .from("organizers")
        .update({ logo_url: null })
        .eq("id", organizer.id);
      if (error) throw error;

      toast.success("Logo removed");
      queryClient.invalidateQueries({ queryKey: ["organizer-by-user"] });
      queryClient.invalidateQueries({ queryKey: ["organizer", organizer.slug] });
    } catch (err: any) {
      toast.error(err.message || "Failed to remove logo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Brand name is required");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("organizers")
        .update({
          name: form.name.trim(),
          bio: form.bio.trim() || null,
          instagram: form.instagram.trim() || null,
          website: form.website.trim() || null,
        })
        .eq("id", organizer.id);
      if (error) throw error;
      toast.success("Brand info updated");
      queryClient.invalidateQueries({ queryKey: ["organizer-by-user"] });
      queryClient.invalidateQueries({ queryKey: ["organizer", organizer.slug] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-primary" />
        <h2 className="text-base font-bold text-foreground">Brand Info</h2>
      </div>

      {/* Logo Upload */}
      <div className="space-y-1.5">
        <Label>Logo</Label>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden">
              {organizer.logo_url ? (
                <img
                  src={organizer.logo_url}
                  alt={organizer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            {uploading && (
              <div className="absolute inset-0 rounded-xl bg-background/80 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Camera className="w-3 h-3" />
                  {organizer.logo_url ? "Change" : "Upload"}
                </span>
              </label>
              {organizer.logo_url && (
                <button
                  onClick={handleRemoveLogo}
                  disabled={uploading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">JPG, PNG, or WebP. Max 5MB.</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Brand Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Soca Fete"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Bio</Label>
          <Textarea
            value={form.bio}
            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            placeholder="Tell people about your brand..."
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Instagram className="w-3.5 h-3.5" /> Instagram
          </Label>
          <Input
            value={form.instagram}
            onChange={(e) => setForm((p) => ({ ...p, instagram: e.target.value }))}
            placeholder="@socafete"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" /> Website
          </Label>
          <Input
            value={form.website}
            onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
            placeholder="https://socafete.com"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="w-3.5 h-3.5" />
          <span>Username: <span className="font-medium text-foreground">@{organizer.slug}</span> (cannot be changed)</span>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="rounded-full gap-1.5"
        size="sm"
      >
        <Save className="w-3.5 h-3.5" />
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </section>
  );
}

/* ─── Event Types ─── */

function EventTypesSection({ organizer }: { organizer: Organizer }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const currentTypes: string[] = (organizer as any).event_types || [];
  const [selected, setSelected] = useState<string[]>(currentTypes);

  useEffect(() => {
    setSelected((organizer as any).event_types || []);
  }, [organizer]);

  const toggle = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("organizers")
        .update({ event_types: selected } as any)
        .eq("id", organizer.id);
      if (error) throw error;
      toast.success("Event types updated");
      queryClient.invalidateQueries({ queryKey: ["organizer-by-user"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Tag className="w-5 h-5 text-primary" />
        <h2 className="text-base font-bold text-foreground">Event Types</h2>
      </div>
      <p className="text-xs text-muted-foreground">Toggle the types of events your brand organizes.</p>

      <div className="flex flex-wrap gap-2">
        {EVENT_TYPE_OPTIONS.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="rounded-full gap-1.5"
        size="sm"
      >
        <Save className="w-3.5 h-3.5" />
        {saving ? "Saving..." : "Save Event Types"}
      </Button>
    </section>
  );
}

/* ─── Default Commission ─── */

function CommissionSection({ organizer }: { organizer: Organizer }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [commission, setCommission] = useState(String((organizer as any).default_commission ?? 10));

  useEffect(() => {
    setCommission(String((organizer as any).default_commission ?? 10));
  }, [organizer]);

  const handleSave = async () => {
    const val = Number(commission);
    if (isNaN(val) || val < 0 || val > 100) {
      toast.error("Commission must be between 0 and 100");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("organizers")
        .update({ default_commission: val } as any)
        .eq("id", organizer.id);
      if (error) throw error;
      toast.success("Default commission updated");
      queryClient.invalidateQueries({ queryKey: ["organizer-by-user"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Percent className="w-5 h-5 text-primary" />
        <h2 className="text-base font-bold text-foreground">Default Promoter Commission</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Set the default commission rate for new promoters. Individual rates can be overridden per promoter.
      </p>

      <div className="flex items-center gap-3 max-w-xs">
        <Input
          type="number"
          min="0"
          max="100"
          value={commission}
          onChange={(e) => setCommission(e.target.value)}
          className="w-24"
        />
        <span className="text-sm text-muted-foreground">%</span>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full gap-1.5"
          size="sm"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "..." : "Save"}
        </Button>
      </div>
    </section>
  );
}

/* ─── Payouts (Stripe Connect) ─── */

function PayoutsSection({ organizer }: { organizer: Organizer }) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<{
    connected: boolean;
    onboardingComplete: boolean;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
  }>({ connected: false, onboardingComplete: false });

  useEffect(() => {
    checkStatus();
  }, [organizer.id]);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("connect-account-status", {
        body: { organizerId: organizer.id },
      });
      if (!error && data) {
        setStatus(data);
      }
    } catch {
      // Silent fail
    } finally {
      setChecking(false);
    }
  };

  const handleOnboard = async () => {
    setLoading(true);
    try {
      // Step 1: Create account if needed
      const { data: createData, error: createError } = await supabase.functions.invoke("connect-create-account", {
        body: { organizerId: organizer.id },
      });
      if (createError) throw new Error(createData?.error || "Failed to create account");

      // Step 2: Generate onboarding link
      const { data: linkData, error: linkError } = await supabase.functions.invoke("connect-account-link", {
        body: { organizerId: organizer.id },
      });
      if (linkError || !linkData?.url) {
        throw new Error(linkData?.error || "Failed to generate onboarding link");
      }

      window.open(linkData.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to set up payouts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-primary" />
        <h2 className="text-base font-bold text-foreground">Payouts</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Connect your bank account to receive payouts from ticket and costume sales. Platform fees (10% tickets, 7% costumes) are deducted automatically.
      </p>

      {checking ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Checking payout status...
        </div>
      ) : status.onboardingComplete ? (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Payouts enabled</p>
            <p className="text-xs text-muted-foreground">Your account is fully set up to receive payments.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-1 text-xs"
            onClick={handleOnboard}
            disabled={loading}
          >
            <ExternalLink className="w-3 h-3" />
            Manage
          </Button>
        </div>
      ) : status.connected ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-destructive/20 bg-destructive/5">
            <CreditCard className="w-5 h-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Onboarding incomplete</p>
              <p className="text-xs text-muted-foreground">Please complete your account setup to start receiving payouts.</p>
            </div>
          </div>
          <Button
            onClick={handleOnboard}
            disabled={loading}
            className="rounded-full gap-1.5"
            size="sm"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
            {loading ? "Loading..." : "Complete Setup"}
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleOnboard}
          disabled={loading}
          className="rounded-full gap-1.5"
          size="sm"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
          {loading ? "Setting up..." : "Set Up Payouts"}
        </Button>
      )}
    </section>
  );
}

/* ─── Team Members ─── */

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "scanner", label: "Scanner" },
];

function TeamSection({ organizerId }: { organizerId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: members, isLoading } = useOrganizerMembers(organizerId);

  const handleRemove = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("organizer_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
      toast.success("Member removed");
      queryClient.invalidateQueries({ queryKey: ["organizer-members", organizerId] });
    } catch (err: any) {
      toast.error(err.message || "Failed to remove");
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("organizer_members")
        .update({ role: newRole })
        .eq("id", memberId);
      if (error) throw error;
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["organizer-members", organizerId] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    }
  };

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner": return "default" as const;
      case "admin": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold text-foreground">Team Members</h2>
        </div>
        <InviteMemberDialog organizerId={organizerId} />
      </div>
      <p className="text-xs text-muted-foreground">
        Manage who has access to your organizer dashboard.
      </p>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {members && members.length > 0 && (
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {member.user_id === user?.id ? "You" : member.user_id.slice(0, 8) + "..."}
                </p>
                <Badge variant={roleBadgeVariant(member.role)} className="text-[10px] mt-0.5">
                  {member.role}
                </Badge>
              </div>

              {member.role !== "owner" && member.user_id !== user?.id && (
                <div className="flex items-center gap-2">
                  <Select
                    value={member.role}
                    onValueChange={(val) => handleRoleChange(member.id, val)}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                        <AlertDialogDescription>They will lose access to this organizer dashboard.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemove(member.id)}
                          className="rounded-full bg-destructive text-destructive-foreground"
                        >Remove</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {member.role === "owner" && (
                <span className="text-[10px] text-muted-foreground">Owner</span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Invite Member Dialog ─── */

function InviteMemberDialog({ organizerId }: { organizerId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);
    try {
      // Look up user by email via profiles
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", email.trim())
        .maybeSingle();

      // Try looking up by auth - we can't query auth.users directly,
      // so we'll inform the user to use user IDs for now
      toast.error("Please enter the user's ID (found on their profile). Email lookup coming soon.");
      setLoading(false);
      return;
    } catch (err: any) {
      toast.error(err.message || "Failed to invite");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteById = async () => {
    if (!email.trim()) {
      toast.error("User ID is required");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("organizer_members")
        .insert({
          organizer_id: organizerId,
          user_id: email.trim(),
          role,
        });
      if (error) throw error;
      toast.success("Team member added!");
      queryClient.invalidateQueries({ queryKey: ["organizer-members", organizerId] });
      setOpen(false);
      setEmail("");
      setRole("staff");
    } catch (err: any) {
      toast.error(err.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full gap-1">
          <UserPlus className="w-4 h-4" /> Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>User ID *</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Paste user ID"
            />
            <p className="text-xs text-muted-foreground">Enter the user's account ID to add them.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleInviteById}
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground font-semibold rounded-full h-11"
          >
            {loading ? "Adding..." : "Add Member"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
