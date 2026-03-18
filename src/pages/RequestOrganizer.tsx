import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function RequestOrganizer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [brandName, setBrandName] = useState("");
  const [username, setUsername] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [eventTypes, setEventTypes] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Megaphone className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Sign in to request organizer access</h1>
          <Button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground rounded-full">Sign In</Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!brandName.trim() || !username.trim()) {
      toast.error("Brand name and username are required");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("organizer_requests").insert({
      user_id: user.id,
      brand_name: brandName,
      username_requested: username.toLowerCase().replace(/\s+/g, "-"),
      instagram: instagram || null,
      website: website || null,
      event_types: eventTypes || null,
      notes: notes || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit request");
    } else {
      toast.success("Request submitted! We'll review it shortly.");
      navigate("/account");
    }
  };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Become an Organizer</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Apply to list your events. We'll review your application and get back to you.
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Brand / Company Name *</label>
          <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Your brand name" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Requested Username *</label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. my-brand" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Instagram</label>
          <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@handle" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Website</label>
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Event Types</label>
          <Input value={eventTypes} onChange={(e) => setEventTypes(e.target.value)} placeholder="Fetes, Concerts, Festivals..." />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Additional Notes</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tell us about your events..." rows={3} />
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full gradient-primary text-primary-foreground rounded-full"
      >
        {submitting ? "Submitting..." : "Submit Application"}
      </Button>
    </div>
  );
}
