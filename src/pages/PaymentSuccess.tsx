import { Button } from "@/components/ui/button";
import { CheckCircle, Ticket, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-primary-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Payment Successful!</h1>
          <p className="text-muted-foreground text-sm">
            Your tickets are confirmed. Check your email for the confirmation details.
          </p>
        </div>
        <div className="space-y-3">
          <Button onClick={() => navigate("/tickets")} className="w-full gradient-primary text-primary-foreground rounded-full">
            <Ticket className="h-4 w-4 mr-2" />
            View My Tickets
          </Button>
          <Button onClick={() => navigate("/")} variant="outline" className="w-full rounded-full">
            <Home className="h-4 w-4 mr-2" />
            Back to Discover
          </Button>
        </div>
      </div>
    </div>
  );
}
