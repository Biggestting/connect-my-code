import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function EventDetail() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Event Detail</h1>
        <p className="text-muted-foreground">This page is under construction.</p>
        <Button onClick={() => navigate("/")} className="gradient-primary text-primary-foreground rounded-full">
          Back to Discover
        </Button>
      </div>
    </div>
  );
}
