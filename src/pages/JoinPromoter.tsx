import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, UserPlus } from "lucide-react";

export default function JoinPromoter() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "claiming" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [organizerSlug, setOrganizerSlug] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Store the current path so we can return after auth
      sessionStorage.setItem("promoter_invite_return", `/join/promoter/${token}`);
      navigate("/auth", { replace: true });
      return;
    }

    claimInvite();
  }, [user, authLoading, token]);

  const claimInvite = async () => {
    if (!token || !user) return;
    setStatus("claiming");

    try {
      const res = await supabase.functions.invoke("claim-promoter-link", {
        body: { token },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      setStatus("success");
      setMessage(res.data.message);
      setOrganizerSlug(res.data.organizer_slug);
      toast.success(res.data.message);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Failed to claim invite");
    }
  };

  if (authLoading || status === "loading" || status === "claiming") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {authLoading ? "Checking authentication..." : "Setting you up as a promoter..."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">You're In!</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
            <div className="flex gap-2 mt-2">
              {organizerSlug && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/organizers/${organizerSlug}`)}
                >
                  View Organizer
                </Button>
              )}
              <Button
                className="gradient-primary text-primary-foreground"
                onClick={() => navigate("/account")}
              >
                My Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Invite Error</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Go Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
