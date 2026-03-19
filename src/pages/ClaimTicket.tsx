import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useClaimTicket } from "@/hooks/use-dynamic-tickets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ticket, ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function ClaimTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const claimMutation = useClaimTicket();
  const [claimedEventId, setClaimedEventId] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Ticket className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Sign in to claim a ticket</h1>
          <Button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground rounded-full">Sign In</Button>
        </div>
      </div>
    );
  }

  const handleClaim = async () => {
    if (!code.trim()) {
      toast.error("Enter a claim code");
      return;
    }
    try {
      const result = await claimMutation.mutateAsync({ claimCode: code.trim() });
      toast.success("Ticket claimed! It's now in your tickets.");
      setClaimedEventId(result.event_id || null);
    } catch (err: any) {
      toast.error(err.message || "Failed to claim ticket");
    }
  };

  if (claimedEventId) {
    return (
      <div className="p-4 pb-24 max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-4 py-12">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Ticket Claimed!</h1>
          <p className="text-sm text-muted-foreground">Your digital ticket is ready. You can view it in My Tickets.</p>
          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={() => navigate("/my-tickets")} className="gradient-primary text-primary-foreground rounded-full">
              View My Tickets
            </Button>
            <Button variant="outline" onClick={() => { setClaimedEventId(null); setCode(""); }} className="rounded-full">
              Claim Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Claim Ticket</h1>
      </div>

      <div className="text-center space-y-4 py-8">
        <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto">
          <Ticket className="h-8 w-8 text-primary-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Enter the claim code from your physical ticket to add it to your digital wallet.</p>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Enter claim code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="text-center text-lg tracking-widest font-mono"
          maxLength={12}
        />
        <Button
          onClick={handleClaim}
          disabled={claimMutation.isPending || !code.trim()}
          className="w-full gradient-primary text-primary-foreground rounded-full"
        >
          {claimMutation.isPending ? "Claiming..." : "Claim Ticket"}
        </Button>
      </div>
    </div>
  );
}
