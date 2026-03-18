import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ticket, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function ClaimTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [claiming, setClaiming] = useState(false);

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
    setClaiming(true);
    // Claim logic placeholder
    setTimeout(() => {
      setClaiming(false);
      toast.info("Claim feature coming soon!");
    }, 1000);
  };

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
        <p className="text-sm text-muted-foreground">Enter the claim code you received to add the ticket to your account.</p>
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
          disabled={claiming || !code.trim()}
          className="w-full gradient-primary text-primary-foreground rounded-full"
        >
          {claiming ? "Claiming..." : "Claim Ticket"}
        </Button>
      </div>
    </div>
  );
}
