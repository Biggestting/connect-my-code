import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useMyOrganizerRequests } from "@/hooks/use-organizer-requests";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const EVENT_TYPE_OPTIONS = [
  { id: "parties", label: "Parties (Fetes)" },
  { id: "concerts", label: "Concerts" },
  { id: "mas_band", label: "Mas Band" },
  { id: "jouvert", label: "Jouvert" },
] as const;

export default function RequestOrganizer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: requests, refetch } = useMyOrganizerRequests(user?.id);
  const [loading, setLoading] = useState(false);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [form, setForm] = useState({
    username: "",
    brandName: "",
    instagram: "",
    website: "",
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-lg font-semibold text-foreground mb-2">Sign in first</p>
        <Button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground rounded-full">
          Sign In
        </Button>
      </div>
    );
  }

  const pendingRequest = requests?.find((r) => r.status === "pending");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.brandName.trim()) {
      toast.error("Username and brand name are required");
      return;
    }
    if (selectedEventTypes.length === 0) {
      toast.error("Please select at least one event type");
      return;
    }

    const username = form.username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    setLoading(true);
    try {
      // Check if username is taken
      const { data: existing } = await supabase
        .from("organizers")
        .select("id")
        .eq("slug", username)
        .maybeSingle();

      if (existing) {
        toast.error("This username is already taken");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("organizer_requests").insert({
        user_id: user.id,
        username_requested: username,
        brand_name: form.brandName.trim(),
        instagram: form.instagram.trim() || null,
        website: form.website.trim() || null,
        event_types: selectedEventTypes.join(", "),
      });

      if (error) throw error;
      toast.success("Request submitted! We'll review it shortly.");
      refetch();
      setForm({ username: "", brandName: "", instagram: "", website: "" });
      setSelectedEventTypes([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4 text-yellow-500" />;
      case "approved": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected": return <XCircle className="w-4 h-4 text-destructive" />;
      default: return null;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary" className="text-yellow-700 bg-yellow-100">Pending</Badge>;
      case "approved": return <Badge variant="secondary" className="text-green-700 bg-green-100">Approved</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="pb-20 md:pb-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <Link to="/profile" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-lg font-bold text-foreground">Request Organizer Profile</h1>
      </div>

      {/* Previous Requests */}
      {requests && requests.length > 0 && (
        <div className="px-4 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground mb-3">Your Requests</p>
          <div className="space-y-2">
            {requests.map((req) => (
              <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                {statusIcon(req.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">@{req.username_requested}</p>
                  <p className="text-xs text-muted-foreground">{req.brand_name}</p>
                </div>
                {statusBadge(req.status)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form - hide if pending request exists */}
      {pendingRequest ? (
        <div className="px-4 py-8 text-center">
          <Clock className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">Request Pending</p>
          <p className="text-xs text-muted-foreground">
            Your request for @{pendingRequest.username_requested} is being reviewed. We'll notify you once it's approved.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="px-4 py-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Request an organizer profile to start hosting events on Ti'Fete. All requests are reviewed by our team.
          </p>
          <div className="space-y-2">
            <Label>Username *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
              <Input
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") }))}
                placeholder="socafete"
                className="pl-8"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">Lowercase, no spaces. This is your public URL.</p>
          </div>
          <div className="space-y-2">
            <Label>Brand Name *</Label>
            <Input
              value={form.brandName}
              onChange={(e) => setForm((p) => ({ ...p, brandName: e.target.value }))}
              placeholder="Soca Fete"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Instagram</Label>
            <Input
              value={form.instagram}
              onChange={(e) => setForm((p) => ({ ...p, instagram: e.target.value }))}
              placeholder="@socafete"
            />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              value={form.website}
              onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
              placeholder="https://socafete.com"
            />
          </div>
          <div className="space-y-2">
            <Label>What types of events do you host? *</Label>
            <div className="grid grid-cols-2 gap-3 pt-1">
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-border hover:border-primary/40 transition-colors cursor-pointer"
                >
                  <Checkbox
                    checked={selectedEventTypes.includes(opt.id)}
                    onCheckedChange={(checked) => {
                      setSelectedEventTypes((prev) =>
                        checked
                          ? [...prev, opt.id]
                          : prev.filter((t) => t !== opt.id)
                      );
                    }}
                  />
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Select at least one. You can change this later.</p>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground font-semibold rounded-full h-12"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      )}
    </div>
  );
}
